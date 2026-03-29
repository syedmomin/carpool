import React, { createContext, useContext, useState, useEffect } from 'react';
import { secureStorage } from '../utils/secureStorage';
import { tokenStorage, authApi, ridesApi, bookingsApi, vehiclesApi, profileApi, notificationsApi, scheduleAlertsApi } from '../services/api';

const USER_STORAGE_KEY = '@chalparo_user';
const ROLE_STORAGE_KEY = '@chalparo_role';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // ─── Restore session on app start ────────────────────────────────────────
  useEffect(() => {
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
      } catch (_) {
        // Network error — keep session alive
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ─── Auth ─────────────────────────────────────────────────────────────────
  const login = async (phone, password) => {
    const { data, error } = await authApi.login(phone, password);
    if (error) return { error };
    const { accessToken, user } = data.data;
    const role = user.role === 'DRIVER' ? 'driver' : 'passenger';
    await Promise.all([
      tokenStorage.set(accessToken),
      secureStorage.setObject(USER_STORAGE_KEY, user),
      secureStorage.setItem(ROLE_STORAGE_KEY, role),
    ]);
    setCurrentUser(user);
    setUserRole(role);
    return { user, role };
  };

  const logout = async () => {
    await Promise.all([
      tokenStorage.remove(),
      secureStorage.removeItem(USER_STORAGE_KEY),
      secureStorage.removeItem(ROLE_STORAGE_KEY),
    ]);
    setCurrentUser(null);
    setUserRole(null);
    setUnreadCount(0);
  };

  const register = async (userData) => {
    const { data, error } = await authApi.register(userData);
    if (error) return { error };
    const { accessToken, user } = data.data;
    const role = user.role === 'DRIVER' ? 'driver' : 'passenger';
    await Promise.all([
      tokenStorage.set(accessToken),
      secureStorage.setObject(USER_STORAGE_KEY, user),
      secureStorage.setItem(ROLE_STORAGE_KEY, role),
    ]);
    setCurrentUser(user);
    setUserRole(role);
    return { user, role };
  };

  const updateProfile = async (updates) => {
    setCurrentUser(prev => {
      const updated = { ...prev, ...updates };
      secureStorage.setObject(USER_STORAGE_KEY, updated).catch(() => { });
      return updated;
    });
    const { data, error } = await profileApi.update(updates);
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

  const cancelBooking = async (bookingId) => {
    const { error } = await bookingsApi.cancel(bookingId);
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
    await notificationsApi.markRead(id);
    setUnreadCount(prev => Math.max(0, prev - 1));
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

  // ─── Schedule Alerts ─────────────────────────────────────────────────────
  const addScheduleAlert = async ({ date, from, to }) => {
    const { data, error } = await scheduleAlertsApi.create({ date, fromCity: from, toCity: to });
    if (error) return { error };
    return { data: data.data };
  };

  const removeScheduleAlert = async (id) => {
    await scheduleAlertsApi.delete(id);
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
      markNotificationRead, markAllNotificationsRead, refreshUnreadCount,

      // Schedule Alerts
      addScheduleAlert, removeScheduleAlert,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
