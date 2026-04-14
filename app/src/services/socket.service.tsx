import { io, Socket } from 'socket.io-client';
import { SERVER_URL } from '../config/network';
import { tokenStorage } from './api';

export interface LocationPayload {
  rideId: string;
  latitude: number;
  longitude: number;
  speed?: number | null;
  heading?: number | null;
}

class SocketService {
  public socket: Socket | null = null;
  private readonly URL = SERVER_URL;
  private _userId: string | null = null;
  // Track listener references so off() only removes the specific callback,
  // not ALL listeners for the event (prevents double-fire on re-subscribe).
  private _listeners: Map<string, Set<(data: any) => void>> = new Map();

  async connect(): Promise<void> {
    if (this.socket?.connected) return;
    const token = await tokenStorage.get();
    this.socket = io(this.URL, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
      // Re-join user room on every (re)connect so server-side room membership is restored
      if (this._userId) {
        this.socket?.emit('join-user', this._userId);
        console.log('[Socket] Re-joined user room:', this._userId);
      }
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });
  }

  // Called by api.tsx after a successful token refresh
  async reconnectWithNewToken(): Promise<void> {
    if (!this.socket) return;
    const token = await tokenStorage.get();
    // Update auth and force reconnect so the server re-validates the new token
    this.socket.auth = { token };
    this.socket.disconnect();
    this.socket.connect();
  }

  joinUser(userId: string): void {
    this._userId = userId;
    this.socket?.emit('join-user', userId);
  }

  joinRide(rideId: string, role: 'driver' | 'rider'): void {
    this.socket?.emit('join-ride', { rideId, role });
  }

  leaveRide(rideId: string): void {
    this.socket?.emit('leave-ride', { rideId });
  }

  emitLocation(payload: LocationPayload): void {
    this.socket?.emit('location-update', payload);
  }

  // ── Tracked listener API ──────────────────────────────────────────────────
  // Use on(event, cb) + off(event, cb) pair to avoid stacking duplicate listeners.

  on(event: string, callback: (data: any) => void): void {
    if (!this.socket) return;
    // Avoid adding the same callback twice for the same event
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    const set = this._listeners.get(event)!;
    if (set.has(callback)) return;
    set.add(callback);
    this.socket.on(event, callback);
  }

  off(event: string, callback?: (data: any) => void): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off(event, callback);
      this._listeners.get(event)?.delete(callback);
    } else {
      // Remove ALL tracked callbacks for this event
      const set = this._listeners.get(event);
      if (set) {
        set.forEach(cb => this.socket!.off(event, cb));
        set.clear();
      }
    }
  }

  onLocationUpdate(callback: (data: LocationPayload) => void): void {
    this.on('location-update', callback);
  }

  offLocationUpdate(callback?: (data: LocationPayload) => void): void {
    this.off('location-update', callback);
  }

  disconnect(): void {
    if (this.socket) {
      this._listeners.forEach((set, event) => {
        set.forEach(cb => this.socket!.off(event, cb));
      });
      this._listeners.clear();
      this.socket.disconnect();
      this.socket = null;
    }
    this._userId = null;
  }
}

export const socketService = new SocketService();
