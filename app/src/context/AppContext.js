import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tokenStorage, authApi, ridesApi, bookingsApi, vehiclesApi, profileApi, notificationsApi, scheduleAlertsApi } from '../services/api';

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
        if (token) {
          const { data } = await authApi.me();
          if (data?.data) {
            const user = data.data;
            setCurrentUser(user);
            setUserRole(user.role === 'DRIVER' ? 'driver' : 'passenger');
          } else {
            await tokenStorage.remove();
          }
        }
      } catch (_) {
        await tokenStorage.remove();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ─── Load data after login ────────────────────────────────────────────────
  const loadUserData = useCallback(async (role) => {
    const isDriver = role === 'driver' || role === 'DRIVER';
    const [ridesRes, notifRes, alertsRes] = await Promise.allSettled([
      isDriver ? ridesApi.myRides() : ridesApi.getAll(),
      notificationsApi.getAll(),
      scheduleAlertsApi.getAll(),
    ]);

    if (ridesRes.value?.data?.data)      setRides(ridesRes.value.data.data);
    if (notifRes.value?.data?.data)      setNotifications(notifRes.value.data.data);
    if (alertsRes.value?.data?.data)     setScheduleAlerts(alertsRes.value.data.data);

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
    await tokenStorage.set(accessToken);
    const role = user.role === 'DRIVER' ? 'driver' : 'passenger';
    setCurrentUser(user);
    setUserRole(role);
    await loadUserData(role);
    return { user, role };
  };

  const logout = async () => {
    await tokenStorage.remove();
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
    await tokenStorage.set(accessToken);
    const role = user.role === 'DRIVER' ? 'driver' : 'passenger';
    setCurrentUser(user);
    setUserRole(role);
    return { user, role };
  };

  const updateProfile = async (updates) => {
    setCurrentUser(prev => ({ ...prev, ...updates }));
    const { data, error } = await profileApi.update(updates);
    if (data?.data) setCurrentUser(data.data);
    return { error };
  };

  // ─── Rides ────────────────────────────────────────────────────────────────
  const postRide = async (rideData) => {
    const payload = {
      ...rideData,
      pricePerSeat: parseInt(rideData.pricePerSeat) || rideData.pricePerSeat,
      totalSeats:   parseInt(rideData.totalSeats)   || rideData.totalSeats,
    };
    const { data, error } = await ridesApi.post(payload);
    if (error) return { error };
    const newRide = data.data;
    setRides(prev => [newRide, ...prev]);
    return { data: newRide };
  };

  const searchRides = async (from, to, date) => {
    const { data, error } = await ridesApi.search(from, to, date);
    if (error) return { error, data: [] };
    return { data: data.data || [] };
  };

  const refreshRides = async () => {
    const res = userRole === 'driver' ? await ridesApi.myRides() : await ridesApi.getAll();
    if (res.data?.data) setRides(res.data.data);
  };

  // ─── Bookings ─────────────────────────────────────────────────────────────
  const bookRide = async (rideId, seats) => {
    const { data, error } = await bookingsApi.book(rideId, seats);
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
