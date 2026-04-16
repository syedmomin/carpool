import React, { createContext, useContext, useState, useEffect } from 'react';
import { secureStorage } from '../utils/secureStorage';
import { tokenStorage, authApi, ridesApi, bookingsApi, vehiclesApi, profileApi, notificationsApi, scheduleAlertsApi, setLogoutHandler } from '../services/api';

const USER_STORAGE_KEY = '@chalparo_user';
const ROLE_STORAGE_KEY = '@chalparo_role';

export interface AppContextState {
  currentUser: any;
  userRole: string | null;
  isLoading: boolean;
  unreadCount: number;
  scheduleAlerts: any[]; // Data array used in screens

  login: (phone: string, val: string) => Promise<{ user?: any, role?: string, error?: any }>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<{ user?: any, role?: string, error?: any }>;
  updateProfile: (updates: any) => Promise<{ error?: any }>;
  
  postRide: (rideData: any) => Promise<{ data?: any, error?: any }>;
  searchRides: (from: string, to: string, date: string) => Promise<{ data: any[], error?: any }>;
  bookRide: (rideId: string, seats: number, boardingCity?: string, exitCity?: string) => Promise<{ data?: any, error?: any }>;
  cancelBooking: (bookingId: string, reason: string) => Promise<{ error?: any }>;
  
  registerVehicle: (vehicleData: any) => Promise<{ data?: any, error?: any }>;
  updateVehicle: (vehicleId: string, updates: any) => Promise<{ error?: any }>;
  deleteVehicle: (vehicleId: string) => Promise<{ error?: any }>;
  setActiveVehicle: (vehicleId: string) => Promise<{ error?: any }>;
  
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  incrementUnreadCount: () => void;
  resetAll?: () => void;
  
  addScheduleAlert: (alertData: any) => Promise<{ data?: any, error?: any }>;
  removeScheduleAlert: (id: string) => Promise<void>;
  loadScheduleAlerts: () => Promise<void>;
}

const AppContext = createContext<AppContextState | null>(null);

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scheduleAlertsList, setScheduleAlertsList] = useState<any[]>([]);

  // ─── Restore session on app start ────────────────────────────────────────
  useEffect(() => {
    setLogoutHandler(logout);
    (async () => {
      try {
        const token = await tokenStorage.get();
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Only use new secure storage keys
        const cachedUser = await secureStorage.getObject(USER_STORAGE_KEY);
        const cachedRole = await secureStorage.getItem(ROLE_STORAGE_KEY);

        if (cachedUser && cachedRole) {
          setCurrentUser(cachedUser);
          setUserRole(cachedRole);
          setIsLoading(false);
        }

        // Refresh user from server in background
        const { data } = await authApi.me();
        if (data?.data) {
          const user = data.data;
          const role = user.role === 'DRIVER' ? 'driver' : 'passenger';

          setCurrentUser(user);
          setUserRole(role);

          await Promise.all([
            secureStorage.setObject(USER_STORAGE_KEY, user),
            secureStorage.setItem(ROLE_STORAGE_KEY, role),
          ]);
        }
      } catch (err) {
        if (__DEV__) console.warn('[AppContext] Session restore error:', err);
      } finally {
        setIsLoading(false);
      }
    })();
    return () => setLogoutHandler(null);
  }, []);

  // ─── Auth ─────────────────────────────────────────────────────────────────
  const login = async (phone, password) => {
    const { data, error } = await authApi.login(phone, password);
    if (error) return { error };
    const { accessToken, refreshToken, user } = data.data;
    const role = user.role === 'DRIVER' ? 'driver' : 'passenger';
    await Promise.all([
      tokenStorage.set(accessToken),
      tokenStorage.setRefresh(refreshToken),
      secureStorage.setObject(USER_STORAGE_KEY, user),
      secureStorage.setItem(ROLE_STORAGE_KEY, role),
    ]);
    setCurrentUser(user);
    setUserRole(role);
    return { user, role };
  };

  const logout = async () => {
    try { await authApi.logout(); } catch (_) { /* best-effort server-side invalidation */ }
    await tokenStorage.clearAll();
    setCurrentUser(null);
    setUserRole(null);
    setUnreadCount(0);
  };

  const register = async (userData) => {
    const { data, error } = await authApi.register(userData);
    if (error) return { error };
    const { accessToken, refreshToken, user } = data.data;
    const role = user.role === 'DRIVER' ? 'driver' : 'passenger';
    await Promise.all([
      tokenStorage.set(accessToken),
      tokenStorage.setRefresh(refreshToken),
      secureStorage.setObject(USER_STORAGE_KEY, user),
      secureStorage.setItem(ROLE_STORAGE_KEY, role),
    ]);
    setCurrentUser(user);
    setUserRole(role);
    return { user, role };
  };

  const updateProfile = async (updates) => {
    // Save previous state so we can roll back on failure
    const previousUser = currentUser;
    setCurrentUser(prev => ({ ...prev, ...updates }));

    const { data, error } = await profileApi.update(updates);
    if (error) {
      // API failed — rollback to previous state
      setCurrentUser(previousUser);
      return { error };
    }
    if (data?.data) {
      setCurrentUser(data.data);
      secureStorage.setObject(USER_STORAGE_KEY, data.data).catch(() => { });
    }
    return { error };
  };

  // ─── Rides (pure API wrappers — no global state) ──────────────────────────
  const postRide = async (rideData) => {
    const payload = {
      ...rideData,
      fromCity: rideData.fromCity || rideData.from,
      toCity: rideData.toCity || rideData.to,
      pricePerSeat: parseInt(rideData.pricePerSeat) || rideData.pricePerSeat,
      totalSeats: parseInt(rideData.totalSeats) || rideData.totalSeats,
    };
    delete payload.from;
    delete payload.to;
    const { data, error } = await ridesApi.post(payload);
    if (error) return { error };
    const r = data.data;
    return { data: { ...r, from: r.fromCity || r.from, to: r.toCity || r.to } };
  };

  const searchRides = async (from, to, date) => {
    const { data, error } = await ridesApi.search(from, to, date);
    if (error) return { error, data: [] };
    const normalize = r => ({ ...r, from: r.fromCity || r.from, to: r.toCity || r.to });
    return { data: (data.data || []).map(normalize) };
  };

  // ─── Bookings (pure API wrappers) ─────────────────────────────────────────
  const bookRide = async (rideId, seats, boardingCity, exitCity) => {
    const { data, error } = await bookingsApi.book(rideId, seats, boardingCity, exitCity);
    if (error) return { error };
    return { data: data.data };
  };

  const cancelBooking = async (bookingId, reason) => {
    const { error } = await bookingsApi.cancel(bookingId, reason);
    return { error };
  };

  // ─── Vehicles (pure API wrappers) ─────────────────────────────────────────
  const registerVehicle = async (vehicleData) => {
    const { data, error } = await vehiclesApi.register(vehicleData);
    if (error) return { error };
    return { data: data.data };
  };

  const updateVehicle = async (vehicleId, updates) => {
    const { error } = await vehiclesApi.update(vehicleId, updates);
    return { error };
  };

  const deleteVehicle = async (vehicleId) => {
    const { error } = await vehiclesApi.delete(vehicleId);
    return { error };
  };

  const setActiveVehicle = async (vehicleId) => {
    const { error } = await vehiclesApi.setActive(vehicleId);
    return { error };
  };

  // ─── Notifications ────────────────────────────────────────────────────────
  const markNotificationRead = async (id) => {
    const { error } = await notificationsApi.markRead(id);
    if (!error) setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllNotificationsRead = async () => {
    await notificationsApi.markAllRead();
    setUnreadCount(0);
  };

  const refreshUnreadCount = async () => {
    const { data } = await notificationsApi.getAll(1, 100);
    if (data?.data) {
      const count = (data.data || []).filter(n => !n.read).length;
      setUnreadCount(count);
    }
  };

  const incrementUnreadCount = () => setUnreadCount(prev => prev + 1);

  // ─── Schedule Alerts ─────────────────────────────────────────────────────
  const addScheduleAlert = async ({ date, from, to }) => {
    const { data, error } = await scheduleAlertsApi.create({ date, fromCity: from, toCity: to });
    if (error) return { error };
    return { data: data.data };
  };

  const removeScheduleAlert = async (id) => {
    await scheduleAlertsApi.delete(id);
    setScheduleAlertsList(prev => prev.filter(x => x.id !== id));
  };
  
  const loadScheduleAlerts = async () => {
    const { data } = await scheduleAlertsApi.getAll();
    if (data?.data) {
      setScheduleAlertsList(data.data);
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser, userRole, isLoading, unreadCount,

      // Auth
      login, logout, register, updateProfile,

      // Rides
      postRide, searchRides,

      // Bookings
      bookRide, cancelBooking,

      // Vehicles
      registerVehicle, updateVehicle, deleteVehicle, setActiveVehicle,

      // Notifications
      markNotificationRead, markAllNotificationsRead, refreshUnreadCount, incrementUnreadCount,

      // Schedule Alerts
      addScheduleAlert, removeScheduleAlert, loadScheduleAlerts, scheduleAlerts: scheduleAlertsList,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
