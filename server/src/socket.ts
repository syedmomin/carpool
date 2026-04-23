import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { locationService } from './services/location.service';
import { chatService } from './services/chat.service';
import prisma from './data-source';
import { verifyToken } from './utils/jwt';

// Extend Socket type to carry authenticated user info
declare module 'socket.io' {
  interface Socket {
    userId: string;
    userRole: string;
  }
}

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // ─── Auth Middleware ─────────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = verifyToken(token);
      socket.userId   = payload.id;
      socket.userRole = payload.role;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  // ─── Rate Limiting State ───────────────────────────────────────────────────
  const messageCounts = new Map<string, number>();
  const MESSAGE_LIMIT = 5; // 5 messages per second
  const LIMIT_WINDOW = 1000; // 1 second

  setInterval(() => messageCounts.clear(), LIMIT_WINDOW);

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] User connected: ${socket.id} (userId: ${socket.userId})`);

    // ── Rate Limit Middleware (per socket) ──
    socket.use(([event, ...args], next) => {
      // We only rate limit 'incoming' data events from client
      const count = messageCounts.get(socket.id) || 0;
      if (count >= MESSAGE_LIMIT) {
        console.warn(`[Socket] Throttling ${socket.id} - limit exceeded`);
        // Silently drop or warn the client
        socket.emit('warning', { message: 'Message rate limit exceeded. Please slow down.' });
        return; // drop message
      }
      messageCounts.set(socket.id, count + 1);
      next();
    });

    // ── Personal notifications room — only join YOUR OWN room ────────────────
    socket.on('join-user', (userId: string) => {
      if (userId !== socket.userId) return; // silently ignore impersonation attempts
      socket.join(`user_${userId}`);
    });

    // ── Ride room — verify user is driver or confirmed passenger ─────────────
    socket.on('join-ride', async ({ rideId, role }) => {
      if (!rideId) return;
      try {
        const isDriver = await prisma.ride.findFirst({
          where: { id: rideId, driverId: socket.userId },
          select: { id: true },
        });
        const isPassenger = isDriver ? null : await prisma.booking.findFirst({
          where: { rideId, passengerId: socket.userId, status: { in: ['CONFIRMED', 'PENDING'] } },
          select: { id: true },
        });

        if (!isDriver && !isPassenger) {
          socket.emit('error', { message: 'Not authorized for this ride' });
          return;
        }

        socket.join(`ride_${rideId}`);

        // If a rider joins, send the latest known driver location
        if (role === 'rider') {
          const latestLocation = await locationService.getLatestLocation(rideId);
          if (latestLocation) socket.emit('location-update', latestLocation);
        }
      } catch (err) {
        console.error('[Socket] join-ride error:', err);
      }
    });

    socket.on('leave-ride', ({ rideId }) => {
      socket.leave(`ride_${rideId}`);
    });

    // ── Location update — verify sender is the actual driver of the ride ─────
    socket.on('location-update', async (data) => {
      const { rideId, latitude, longitude, speed, heading } = data;
      if (!rideId) return;
      try {
        const ride = await prisma.ride.findFirst({
          where: { id: rideId, driverId: socket.userId, status: 'IN_PROGRESS' },
          select: { id: true },
        });
        if (!ride) return; // not this driver's active ride — silently ignore

        socket.to(`ride_${rideId}`).emit('location-update', {
          rideId, latitude, longitude, speed, heading, timestamp: new Date(),
        });
        await locationService.addLocation(data);
      } catch (err) {
        console.error('[Socket] location-update error:', err);
      }
    });

    socket.on('join-chat', async ({ bookingId }) => {
      if (!bookingId) return;
      try {
        // Verify user is party to this booking
        const booking = await prisma.booking.findFirst({
          where: { id: bookingId },
          include: { ride: { select: { driverId: true } } },
        });
        if (!booking) return;
        const isParty = booking.passengerId === socket.userId || booking.ride.driverId === socket.userId;
        if (!isParty) return;
        socket.join(`chat_${bookingId}`);
      } catch (err) {
        console.error('[Socket] join-chat error:', err);
      }
    });

    // ── Chat message — use verified socket.userId, not client-supplied senderId
    socket.on('send-message', async ({ bookingId, content }) => {
      if (!bookingId || !content) return;
      try {
        // Verify user is party to this booking before saving
        const booking = await prisma.booking.findFirst({
          where: { id: bookingId },
          include: { ride: { select: { driverId: true } } },
        });
        if (!booking) return;
        const isParty = booking.passengerId === socket.userId || booking.ride.driverId === socket.userId;
        if (!isParty) return;

        const message = await chatService.saveMessage(bookingId, socket.userId, content);
        io.to(`chat_${bookingId}`).emit('new-message', message);
      } catch (err) {
        console.error('[Socket] send-message error:', err);
      }
    });

    // ── Typing status ──────────────────────────────────────────────────────────
    socket.on('typing-start', ({ bookingId }) => {
      if (!bookingId) return;
      socket.to(`chat_${bookingId}`).emit('typing-start', { bookingId, userId: socket.userId });
    });

    socket.on('typing-stop', ({ bookingId }) => {
      if (!bookingId) return;
      socket.to(`chat_${bookingId}`).emit('typing-stop', { bookingId, userId: socket.userId });
    });

    // ── Read receipts ──────────────────────────────────────────────────────────
    socket.on('read-messages', async ({ bookingId }) => {
      if (!bookingId) return;
      try {
        await prisma.chatMessage.updateMany({
          where: { bookingId, senderId: { not: socket.userId }, readAt: null },
          data: { readAt: new Date() },
        });
        socket.to(`chat_${bookingId}`).emit('messages-read', { bookingId, userId: socket.userId });
      } catch (err) {
        console.error('[Socket] read-messages error:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });

    socket.on('heartbeat', (data) => {
      // Just log or update last active status if needed
      // console.log(`[Socket] Heartbeat from ${socket.userId}:`, data);
    });
  });

  return io;
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (!io) return;
  io.to(`user_${userId}`).emit(event, data);
};

export const emitToRideRoom = (rideId: string, event: string, data: any) => {
  if (!io) return;
  io.to(`ride_${rideId}`).emit(event, data);
};

export const broadcastEvent = (event: string, data: any) => {
  if (!io) return;
  io.emit(event, data);
};

export const emitToRoom = (room: string, event: string, data: any) => {
  if (!io) return;
  io.to(room).emit(event, data);
};

export const getIO = () => {
  if (!io) throw new Error('Socket.IO is not initialized');
  return io;
};
