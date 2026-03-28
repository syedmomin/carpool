import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenStorage, authApi, ridesApi, bookingsApi, vehiclesApi, profileApi, notificationsApi, scheduleAlertsApi } from '../services/api';

const USER_STORAGE_KEY = '@safarishare_user';
const ROLE_STORAGE_KEY = '@safarishare_role';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser]   = useState(null);
  const [userRole, setUserRole]         = useState(null);
  const [isLoading, setIsLoading]       = useState(true); // session restore
  const [rides, setRides]               = useState([]);
  const [bookings, setBookings]         = useState([]);
  const [vehicles, setVehicles]         = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [scheduleAlerts, setScheduleAlerts] = useState([]);

  // ─── Restore session on app start ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const token = await tokenStorage.get();
        if (!token) { setIsLoading(false); return; }

        // 1. Restore user from local storage instantly (no network needed)
        const [cachedUserRaw, cachedRole] = await Promise.all([
          AsyncStorage.getItem(USER_STORAGE_KEY),
          AsyncStorage.getItem(ROLE_STORAGE_KEY),
        ]);

        if (cachedUserRaw && cachedRole) {
          const cachedUser = JSON.parse(cachedUserRaw);
          setCurrentUser(cachedUser);
          setUserRole(cachedRole);
          setIsLoading(false); // Show UI immediately from cache
          // Load app data in background
          loadUserData(cachedRole).catch(() => {});
        }

        // 2. Refresh from server in background (updates user data if changed)
        const { data, error } = await authApi.me();
        if (data?.data) {
          const user = data.data;
          const role = user.role === 'DRIVER' ? 'driver' : 'passenger';
          setCurrentUser(user);
          setUserRole(role);
          // Persist updated user
          await Promise.all([
            AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user)),
            AsyncStorage.setItem(ROLE_STORAGE_KEY, role),
          ]);
          // Only reload data if we didn't already (no cache was present)
          if (!cachedUserRaw) {
            await loadUserData(role);
          }
        } else if (error && !cachedUserRaw) {
          // No cache AND server failed — clear token only on explicit 401-style failure
          // Don't clear on network timeout — keep user logged in
          if (error.includes('401') || error.includes('Unauthorized') || error.includes('Invalid token')) {
            await Promise.all([
              tokenStorage.remove(),
              AsyncStorage.removeItem(USER_STORAGE_KEY),
              AsyncStorage.removeItem(ROLE_STORAGE_KEY),
            ]);
            setCurrentUser(null);
            setUserRole(null);
          }
        }
      } catch (_) {
        // Network error — do NOT remove token/user. Keep session alive.
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Normalize ride: backend uses fromCity/toCity, frontend uses from/to
  const normalizeRide = (r) => ({ ...r, from: r.fromCity || r.from, to: r.toCity || r.to });

  // ─── Load data after login ────────────────────────────────────────────────
  const loadUserData = useCallback(async (role) => {
    const isDriver = role === 'driver' || role === 'DRIVER';
    const requests = [
      isDriver ? ridesApi.myRides() : ridesApi.getAll(),
      notificationsApi.getAll(),
      ...(!isDriver ? [scheduleAlertsApi.getAll()] : []),
    ];
    const [ridesRes, notifRes, alertsRes] = await Promise.allSettled(requests);

    if (ridesRes.value?.data?.data)      setRides(ridesRes.value.data.data.map(normalizeRide));
    if (notifRes.value?.data?.data)      setNotifications(notifRes.value.data.data);
    if (!isDriver && alertsRes?.value?.data?.data) setScheduleAlerts(alertsRes.value.data.data);

    if (isDriver) {
      const vRes = await vehiclesApi.myVehicles();
      if (vRes.data?.data) setVehicles(vRes.data.data);
    } else {
      const bRes = await bookingsApi.myBookings();
      if (bRes.data?.data) setBookings(bRes.data.data);
    }
  }, []);

  // ─── Auth ─────────────────────────────────────────────────────────────────
  const login = async (phone, password) => {
    const { data, error } = await authApi.login(phone, password);
    if (error) return { error };
    const { accessToken, user } = data.data;
    const role = user.role === 'DRIVER' ? 'driver' : 'passenger';
    await Promise.all([
      tokenStorage.set(accessToken),
      AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user)),
      AsyncStorage.setItem(ROLE_STORAGE_KEY, role),
    ]);
    setCurrentUser(user);
    setUserRole(role);
    await loadUserData(role);
    return { user, role };
  };

  const logout = async () => {
    await Promise.all([
      tokenStorage.remove(),
      AsyncStorage.removeItem(USER_STORAGE_KEY),
      AsyncStorage.removeItem(ROLE_STORAGE_KEY),
    ]);
    setCurrentUser(null);
    setUserRole(null);
    setRides([]);
    setBookings([]);
    setVehicles([]);
    setNotifications([]);
    setScheduleAlerts([]);
  };

  const register = async (userData) => {
    const { data, error } = await authApi.register(userData);
    if (error) return { error };
    const { accessToken, user } = data.data;
    const role = user.role === 'DRIVER' ? 'driver' : 'passenger';
    await Promise.all([
      tokenStorage.set(accessToken),
      AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user)),
      AsyncStorage.setItem(ROLE_STORAGE_KEY, role),
    ]);
    setCurrentUser(user);
    setUserRole(role);
    await loadUserData(role);
    return { user, role };
  };

  const updateProfile = async (updates) => {
    setCurrentUser(prev => {
      const updated = { ...prev, ...updates };
      AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    const { data, error } = await profileApi.update(updates);
    if (data?.data) {
      setCurrentUser(data.data);
      AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.data)).catch(() => {});
    }
    return { error };
  };

  // ─── Rides ────────────────────────────────────────────────────────────────
  const postRide = async (rideData) => {
    const payload = {
      ...rideData,
      // Backend uses fromCity/toCity, frontend form uses from/to
      fromCity:     rideData.fromCity || rideData.from,
      toCity:       rideData.toCity   || rideData.to,
      pricePerSeat: parseInt(rideData.pricePerSeat) || rideData.pricePerSeat,
      totalSeats:   parseInt(rideData.totalSeats)   || rideData.totalSeats,
    };
    delete payload.from;
    delete payload.to;
    const { data, error } = await ridesApi.post(payload);
    if (error) return { error };
    const newRide = normalizeRide(data.data);
    setRides(prev => [newRide, ...prev]);
    return { data: newRide };
  };

  const searchRides = async (from, to, date) => {
    const { data, error } = await ridesApi.search(from, to, date);
    if (error) return { error, data: [] };
    return { data: (data.data || []).map(normalizeRide) };
  };

  const refreshRides = async () => {
    const res = userRole === 'driver' ? await ridesApi.myRides() : await ridesApi.getAll();
    if (res.data?.data) setRides(res.data.data.map(normalizeRide));
  };

  // ─── Bookings ─────────────────────────────────────────────────────────────
  const bookRide = async (rideId, seats, boardingCity, exitCity) => {
    const { data, error } = await bookingsApi.book(rideId, seats, boardingCity, exitCity);
    if (error) return { error };
    const newBooking = data.data;
    setBookings(prev => [newBooking, ...prev]);
    setRides(prev => prev.map(r => r.id === rideId ? { ...r, bookedSeats: r.bookedSeats + seats } : r));
    return { data: newBooking };
  };

  const cancelBooking = async (bookingId) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b));
    const { error } = await bookingsApi.cancel(bookingId);
    if (error) {
      // revert on failure
      const bRes = await bookingsApi.myBookings();
      if (bRes.data?.data) setBookings(bRes.data.data);
      return { error };
    }
    return {};
  };

  const refreshBookings = async () => {
    const res = await bookingsApi.myBookings();
    if (res.data?.data) setBookings(res.data.data);
  };

  // ─── Vehicles ─────────────────────────────────────────────────────────────
  const registerVehicle = async (vehicleData) => {
    const { data, error } = await vehiclesApi.register(vehicleData);
    if (error) return { error };
    const newVehicle = data.data;
    setVehicles(prev => [...prev, newVehicle]);
    // Refresh from server to ensure driverId and isActive fields are correct
    const vRes = await vehiclesApi.myVehicles();
    if (vRes.data?.data) setVehicles(vRes.data.data);
    return { data: newVehicle };
  };

  const updateVehicle = async (vehicleId, updates) => {
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, ...updates } : v));
    const { error } = await vehiclesApi.update(vehicleId, updates);
    return { error };
  };

  const deleteVehicle = async (vehicleId) => {
    setVehicles(prev => prev.filter(v => v.id !== vehicleId));
    const { error } = await vehiclesApi.delete(vehicleId);
    return { error };
  };

  const setActiveVehicle = async (vehicleId) => {
    setVehicles(prev => prev.map(v => ({
      ...v,
      isActive: v.id === vehicleId ? true : (v.driverId === currentUser?.id ? false : v.isActive),
    })));
    const { error } = await vehiclesApi.setActive(vehicleId);
    return { error };
  };

  const refreshVehicles = async () => {
    const res = await vehiclesApi.myVehicles();
    if (res.data?.data) setVehicles(res.data.data);
  };

  // ─── Notifications ────────────────────────────────────────────────────────
  const markNotificationRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await notificationsApi.markRead(id);
  };

  const markAllNotificationsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await notificationsApi.markAllRead();
  };

  const refreshNotifications = async () => {
    const res = await notificationsApi.getAll();
    if (res.data?.data) setNotifications(res.data.data);
  };

  // ─── Schedule Alerts ─────────────────────────────────────────────────────
  const addScheduleAlert = async ({ date, from, to }) => {
    const { data, error } = await scheduleAlertsApi.create({ date, fromCity: from, toCity: to });
    if (error) return { error };
    setScheduleAlerts(prev => [data.data, ...prev]);
    return {};
  };

  const removeScheduleAlert = async (id) => {
    setScheduleAlerts(prev => prev.filter(a => a.id !== id));
    await scheduleAlertsApi.delete(id);
  };

  // ─── Derived helpers ──────────────────────────────────────────────────────
  const getRideById         = (id) => rides.find(r => r.id === id);
  const getVehicleByDriver  = (driverId) => vehicles.find(v => v.isActive && v.driverId === driverId) || vehicles.find(v => v.driverId === driverId) || null;
  const getVehiclesByDriver = (driverId) => vehicles.filter(v => v.driverId === driverId);
  const getMyBookings       = () => bookings;
  const getMyRides          = () => rides;

  const getMyEarnings = () => {
    const total           = rides.reduce((s, r) => s + (r.bookedSeats * r.pricePerSeat || 0), 0);
    const totalPassengers = rides.reduce((s, r) => s + (r.bookedSeats || 0), 0);
    const completedRides  = rides.filter(r => r.status === 'COMPLETED').length;
    return { total, totalPassengers, completedRides, rides };
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider value={{
      currentUser, userRole, isLoading,
      rides, bookings, vehicles, notifications, scheduleAlerts,

      // Auth
      login, logout, register, updateProfile,

      // Rides
      postRide, searchRides, refreshRides,
      getRideById,

      // Bookings
      bookRide, cancelBooking, refreshBookings,
      getMyBookings,

      // Vehicles
      registerVehicle, updateVehicle, deleteVehicle, setActiveVehicle, refreshVehicles,
      getVehicleByDriver, getVehiclesByDriver,

      // Notifications
      markNotificationRead, markAllNotificationsRead, refreshNotifications,
      unreadCount,

      // Schedule Alerts
      addScheduleAlert, removeScheduleAlert,
      scheduleAlerts,

      // Earnings
      getMyEarnings,
      getMyRides,

      // kept for backward compat
      getDriverById: () => null,
      getVehicleById: (id) => vehicles.find(v => v.id === id),
      getReviewsForDriver: () => [],
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
