import { io, Socket } from 'socket.io-client';

export interface LocationPayload {
  rideId: string;
  latitude: number;
  longitude: number;
  speed?: number | null;
  heading?: number | null;
}

class SocketService {
  public socket: Socket | null = null;
  // Use local backend URL or replace with production/staging
  private readonly URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

  connect(): void {
    if (!this.socket) {
      this.socket = io(this.URL, {
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to Socket.IO server', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Disconnected from Socket.IO server');
      });
    }
  }

  joinRide(rideId: string, role: 'driver' | 'rider'): void {
    if (this.socket) {
      this.socket.emit('join-ride', { rideId, role });
    }
  }

  leaveRide(rideId: string): void {
    if (this.socket) {
      this.socket.emit('leave-ride', { rideId });
    }
  }

  emitLocation(payload: LocationPayload): void {
    if (this.socket) {
      this.socket.emit('location-update', payload);
    }
  }

  onLocationUpdate(callback: (data: LocationPayload) => void): void {
    if (this.socket) {
      this.socket.on('location-update', callback);
    }
  }

  offLocationUpdate(): void {
    if (this.socket) {
      this.socket.off('location-update');
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
