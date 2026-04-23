import { io, Socket } from 'socket.io-client';
import { AppState, AppStateStatus } from 'react-native';
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
  // Track ride rooms so they auto-rejoin on every reconnect
  private _rideRooms: Map<string, 'driver' | 'rider'> = new Map();
  private _appState: AppStateStatus = AppState.currentState;
  private _queuedEvents: { event: string; data: any }[] = [];

  constructor() {
    AppState.addEventListener('change', this._handleAppStateChange);
  }

  private _handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (this._appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('[Socket] App has come to the foreground, checking connection...');
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    }
    this._appState = nextAppState;
  };

  async connect(): Promise<void> {
    if (this.socket?.connected) return;
    const token = await tokenStorage.get();
    this.socket = io(this.URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
      // Re-join user room
      if (this._userId) {
        this.socket?.emit('join-user', this._userId);
      }
      // Re-join all ride rooms
      this._rideRooms.forEach((role, rideId) => {
        this.socket?.emit('join-ride', { rideId, role });
      });
      // Start heartbeat
      this._startHeartbeat();

      // ── Flush Queued Events ──
      this._flushQueue();
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      this._stopHeartbeat();
    });

    this.socket.on('pong', () => {
      // Server-side ping/pong logic
    });
  }

  private _flushQueue() {
    if (!this.socket?.connected || this._queuedEvents.length === 0) return;
    console.log(`[Socket] Flushing ${this._queuedEvents.length} queued events...`);
    const events = [...this._queuedEvents];
    this._queuedEvents = [];
    events.forEach(({ event, data }) => this.socket?.emit(event, data));
  }

  private _heartbeatInterval: any = null;
  private _startHeartbeat() {
    this._stopHeartbeat();
    this._heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('heartbeat', { timestamp: Date.now() });
      }
    }, 30000); // every 30s
  }

  private _stopHeartbeat() {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
    }
  }

  // ── Emit with Queue (Auto-retry logic) ──
  emitWithQueue(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.log(`[Socket] Offline. Queuing '${event}' event.`);
      this._queuedEvents.push({ event, data });
    }
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
    this._rideRooms.set(rideId, role);
    this.socket?.emit('join-ride', { rideId, role });
  }

  leaveRide(rideId: string): void {
    this._rideRooms.delete(rideId);
    this.socket?.emit('leave-ride', { rideId });
  }

  emitLocation(payload: LocationPayload): void {
    this.socket?.emit('location-update', payload);
  }

  // ── Tracked listener API ──────────────────────────────────────────────────
  // Use on(event, cb) + off(event, cb) pair to avoid stacking duplicate listeners.

  on(event: string, callback: (data: any) => void): void {
    if (!this.socket) {
      console.warn(`[Socket] on('${event}') called before socket was created — listener dropped. Always await connect() first.`);
      return;
    }
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
    this._rideRooms.clear();
  }
}

export const socketService = new SocketService();
