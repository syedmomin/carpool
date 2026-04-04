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
      // Broadcast to room
      socket.to(`ride_${rideId}`).emit('location-update', {
        rideId, latitude, longitude, speed, heading, timestamp: new Date()
      });

      // Save to memory/redis & schedule DB persist
      await locationService.addLocation(data);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO is not initialized');
  }
  return io;
};
