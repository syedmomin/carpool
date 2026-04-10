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
  // Use the deployed URL for the socket connection
  // private readonly URL = process.env.EXPO_PUBLIC_API_URL || 'https://app-server-liard-one.vercel.app';
  private readonly URL = 'https://carpool.bonto.run';


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

  /**
   * Subscribe to a private room for personal notifications (Accepted, Requested, etc.)
   */
  joinUser(userId: string): void {
    if (this.socket) {
      this.socket.emit('join-user', userId);
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

  // Generic listeners for lifecycle events
  on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string): void {
    if (this.socket) {
      this.socket.off(event);
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
