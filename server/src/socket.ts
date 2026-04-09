import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { locationService } from './services/location.service';
import prisma from './data-source';

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    // Join a private room for personal notifications (BOOKING_ACCEPTED, etc.)
    socket.on('join-user', (userId: string) => {
      if (!userId) return;
      console.log(`[Socket] User joined personal room: user_${userId}`);
      socket.join(`user_${userId}`);
    });

    socket.on('join-ride', async ({ rideId, role }) => {
      if (!rideId) return;
      console.log(`[Socket] ${role} joined ride room: ride_${rideId}`);
      socket.join(`ride_${rideId}`);
      
      // If a rider joins, send the latest known location of the driver
      if (role === 'rider') {
        const latestLocation = await locationService.getLatestLocation(rideId);
        if (latestLocation) {
          socket.emit('location-update', latestLocation);
        }
      }
    });

    socket.on('leave-ride', ({ rideId }) => {
      console.log(`[Socket] User left ride room: ride_${rideId}`);
      socket.leave(`ride_${rideId}`);
    });

    socket.on('location-update', async (data) => {
      const { rideId, latitude, longitude, speed, heading } = data;
      // Broadcast to all in the ride room EXCEPT the sender (driver)
      socket.to(`ride_${rideId}`).emit('location-update', {
        rideId, latitude, longitude, speed, heading, timestamp: new Date()
      });

      // Save to memory/redis & schedule DB persist
      await locationService.addLocation(data);
    });

    socket.on('join-chat', ({ bookingId }) => {
      if (!bookingId) return;
      console.log(`[Socket] Joined chat room: chat_${bookingId}`);
      socket.join(`chat_${bookingId}`);
    });

    socket.on('send-message', async ({ bookingId, senderId, content }) => {
      if (!bookingId || !senderId || !content) return;
      
      const { chatService } = require('./services/chat.service');
      const message = await chatService.saveMessage(bookingId, senderId, content);

      // Broadcast message to everyone in the chat room (including sender for sync)
      io.to(`chat_${bookingId}`).emit('new-message', message);
    });

    socket.on('disconnect', () => {

      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Emit to a specific user's private notification room
 */
export const emitToUser = (userId: string, event: string, data: any) => {
  if (!io) return;
  console.log(`[Socket] Emitting ${event} to user_${userId}`);
  io.to(`user_${userId}`).emit(event, data);
};

/**
 * Emit to an entire ride room (e.g., RIDE_STARTED)
 */
export const emitToRideRoom = (rideId: string, event: string, data: any) => {
  if (!io) return;
  console.log(`[Socket] Emitting ${event} to ride_${rideId}`);
  io.to(`ride_${rideId}`).emit(event, data);
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO is not initialized');
  }
  return io;
};

