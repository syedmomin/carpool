import React, { createContext, useContext, useState } from 'react';
import { MOCK_RIDES, MOCK_BOOKINGS, MOCK_DRIVERS, MOCK_VEHICLES, MOCK_REVIEWS } from '../data/mockData';
import { ridesApi, bookingsApi, vehiclesApi, profileApi, authApi } from '../services/api';

// Fire-and-forget: updates local state instantly, syncs to backend silently
function syncToApi(apiFn) {
  apiFn().catch(() => {}); // swallow errors — offline or backend not configured
}

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [rides, setRides] = useState(MOCK_RIDES);
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);
  const [drivers, setDrivers] = useState(MOCK_DRIVERS);
  const [vehicles, setVehicles] = useState(MOCK_VEHICLES);
  const [reviews] = useState(MOCK_REVIEWS);
  const [scheduleAlerts, setScheduleAlerts] = useState([]);

  const addScheduleAlert = ({ date, from, to }) => {
    const newAlert = { id: `sa${Date.now()}`, date, from, to, passengerId: currentUser?.id };
    setScheduleAlerts(prev => [newAlert, ...prev]);
  };

  const removeScheduleAlert = (id) => {
    setScheduleAlerts(prev => prev.filter(a => a.id !== id));
  };

  const [notifications, setNotifications] = useState([
    { id: 'n1', title: 'Booking Confirmed!', message: 'Your Karachi → Hyderabad seat has been confirmed.', time: '2 mins ago', read: false, type: 'booking' },
    { id: 'n2', title: 'New Passenger Request', message: 'Sara Khan has booked 2 seats on your ride.', time: '1 hour ago', read: false, type: 'request' },
    { id: 'n3', title: 'Ride Reminder', message: 'Your ride from Karachi departs tomorrow at 8:00 AM.', time: '3 hours ago', read: true, type: 'reminder' },
    { id: 'n4', title: 'New Ride Available!', message: 'Karachi → Hyderabad on 2026-04-01 at 07:00 AM. Are you interested?', time: '5 mins ago', read: false, type: 'new_ride', rideId: 'r1' },
  ]);

  const login = (userData, role) => { setCurrentUser(userData); setUserRole(role); };
  const logout = () => {
    setCurrentUser(null);
    setUserRole(null);
    syncToApi(() => authApi.logout());
  };

  const updateProfile = (updates) => {
    setCurrentUser(prev => ({ ...prev, ...updates }));
    syncToApi(() => profileApi.update(updates));
  };

  const postRide = (rideData) => {
    const newRide = { ...rideData, id: `r${Date.now()}`, bookedSeats: 0, status: 'active' };
    setRides(prev => [newRide, ...prev]);
    addNotification({
      title: 'New Ride Posted!',
      message: `${rideData.from} → ${rideData.to} on ${rideData.date} at ${rideData.departureTime}. Are you interested?`,
      type: 'new_ride',
      rideId: newRide.id,
    });
    // Check matching schedule alerts → send priority notification
    const matchingAlerts = scheduleAlerts.filter(a =>
      a.from?.toLowerCase() === rideData.from?.toLowerCase() &&
      a.to?.toLowerCase()   === rideData.to?.toLowerCase()   &&
      a.date                === rideData.date
    );
    if (matchingAlerts.length > 0) {
      addNotification({
        title: 'Your Scheduled Ride is Available!',
        message: `A driver posted ${rideData.from} → ${rideData.to} on ${rideData.date} — exactly what you scheduled!`,
        type: 'new_ride',
        rideId: newRide.id,
      });
    }
    syncToApi(() => ridesApi.post({
      ...rideData,
      pricePerSeat: parseInt(rideData.pricePerSeat) || rideData.pricePerSeat,
      totalSeats:   parseInt(rideData.totalSeats)   || rideData.totalSeats,
    }));
    return newRide;
  };

  const bookRide = (rideId, seats) => {
    const ride = getRideById(rideId);
    const newBooking = {
      id: `b${Date.now()}`,
      rideId, passengerId: currentUser?.id, seats,
      totalAmount: ride?.pricePerSeat * seats,
      status: 'confirmed',
      bookedAt: new Date().toISOString(),
    };
    setBookings(prev => [newBooking, ...prev]);
    setRides(prev => prev.map(r => r.id === rideId ? { ...r, bookedSeats: r.bookedSeats + seats } : r));
    addNotification({ title: 'Booking Confirmed!', message: `Your ${ride?.from} → ${ride?.to} booking is confirmed.`, type: 'booking' });
    syncToApi(() => bookingsApi.book(rideId, seats));
    return newBooking;
  };

  const cancelBooking = (bookingId) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
    syncToApi(() => bookingsApi.cancel(bookingId));
  };

  const getRideById = (id) => rides.find(r => r.id === id);
  const getDriverById = (id) => drivers.find(d => d.id === id);
  const getVehicleById = (id) => vehicles.find(v => v.id === id);

  // Multi-vehicle: returns all vehicles for a driver
  const getVehiclesByDriver = (driverId) => vehicles.filter(v => v.driverId === driverId);

  // Single active vehicle (backwards compat)
  const getVehicleByDriver = (driverId) => {
    const driverVehicles = vehicles.filter(v => v.driverId === driverId);
    return driverVehicles.find(v => v.isActive) || driverVehicles[0] || null;
  };

  const setActiveVehicle = (vehicleId) => {
    setVehicles(prev => prev.map(v => ({
      ...v,
      isActive: v.id === vehicleId && v.driverId === currentUser?.id ? true : (v.driverId === currentUser?.id ? false : v.isActive),
    })));
    syncToApi(() => vehiclesApi.setActive(vehicleId));
  };

  const registerVehicle = (vehicleData) => {
    const driverVehicles = vehicles.filter(v => v.driverId === currentUser?.id);
    const newVehicle = {
      ...vehicleData,
      id: `v${Date.now()}`,
      driverId: currentUser?.id,
      isActive: driverVehicles.length === 0,
    };
    setVehicles(prev => [...prev, newVehicle]);
    syncToApi(() => vehiclesApi.register(vehicleData));
    return newVehicle;
  };

  const updateVehicle = (vehicleId, updates) => {
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, ...updates } : v));
    syncToApi(() => vehiclesApi.update(vehicleId, updates));
  };

  const deleteVehicle = (vehicleId) => {
    setVehicles(prev => prev.filter(v => v.id !== vehicleId));
    syncToApi(() => vehiclesApi.delete(vehicleId));
  };

  const getReviewsForDriver = (driverId) => reviews.filter(r => r.driverId === driverId);
  const getMyBookings = () => bookings.filter(b => b.passengerId === currentUser?.id);
  const getMyRides = () => rides.filter(r => r.driverId === currentUser?.id);

  const getMyEarnings = () => {
    const myRides = rides.filter(r => r.driverId === currentUser?.id);
    const total = myRides.reduce((sum, r) => sum + (r.bookedSeats * r.pricePerSeat), 0);
    const totalPassengers = myRides.reduce((sum, r) => sum + r.bookedSeats, 0);
    const completedRides = myRides.filter(r => r.status === 'completed').length;
    return { total, totalPassengers, completedRides, rides: myRides };
  };

  const searchRides = (from, to, date) => {
    return rides.filter(r =>
      r.from.toLowerCase() === from.toLowerCase() &&
      r.to.toLowerCase() === to.toLowerCase() &&
      r.status === 'active' &&
      (date ? r.date === date : true) &&
      r.bookedSeats < r.totalSeats
    );
  };

  const addNotification = ({ title, message, type, rideId = null }) => {
    setNotifications(prev => [{
      id: `n${Date.now()}`, title, message, time: 'Just now', read: false, type, rideId,
    }, ...prev]);
  };

  const markNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <AppContext.Provider value={{
      currentUser, userRole, rides, bookings, drivers, vehicles, reviews, notifications,
      login, logout, updateProfile,
      scheduleAlerts, addScheduleAlert, removeScheduleAlert,
      postRide, bookRide, cancelBooking, searchRides,
      getRideById, getDriverById, getVehicleById, getVehicleByDriver,
      getVehiclesByDriver, setActiveVehicle, registerVehicle, updateVehicle, deleteVehicle,
      getReviewsForDriver, getMyBookings, getMyRides, getMyEarnings,
      addNotification, markNotificationRead, registerVehicle,
      unreadCount: notifications.filter(n => !n.read).length,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
