import React, { createContext, useContext, useState } from 'react';
import { MOCK_RIDES, MOCK_BOOKINGS, MOCK_DRIVERS, MOCK_VEHICLES, MOCK_REVIEWS } from '../data/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'passenger' | 'driver'
  const [rides, setRides] = useState(MOCK_RIDES);
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);
  const [drivers, setDrivers] = useState(MOCK_DRIVERS);
  const [vehicles, setVehicles] = useState(MOCK_VEHICLES);
  const [reviews] = useState(MOCK_REVIEWS);
  const [notifications, setNotifications] = useState([
    { id: 'n1', title: 'Booking Confirmed!', message: 'Aapki Karachi → Hyderabad seat confirm ho gayi.', time: '2 mins ago', read: false, type: 'booking' },
    { id: 'n2', title: 'New Passenger Request', message: 'Sara Khan ne 2 seats book ki hain.', time: '1 hour ago', read: false, type: 'request' },
    { id: 'n3', title: 'Ride Reminder', message: 'Kal subah 8 baje Karachi se nikalna hai.', time: '3 hours ago', read: true, type: 'reminder' },
  ]);

  const login = (userData, role) => {
    setCurrentUser(userData);
    setUserRole(role);
  };

  const logout = () => {
    setCurrentUser(null);
    setUserRole(null);
  };

  const postRide = (rideData) => {
    const newRide = {
      ...rideData,
      id: `r${Date.now()}`,
      bookedSeats: 0,
      status: 'active',
    };
    setRides(prev => [newRide, ...prev]);
    return newRide;
  };

  const bookRide = (rideId, seats) => {
    const newBooking = {
      id: `b${Date.now()}`,
      rideId,
      passengerId: currentUser?.id,
      seats,
      totalAmount: getRideById(rideId)?.pricePerSeat * seats,
      status: 'confirmed',
      bookedAt: new Date().toISOString(),
    };
    setBookings(prev => [newBooking, ...prev]);
    setRides(prev =>
      prev.map(r => r.id === rideId ? { ...r, bookedSeats: r.bookedSeats + seats } : r)
    );
    addNotification({
      title: 'Booking Confirmed!',
      message: `Aapki ${getRideById(rideId)?.from} → ${getRideById(rideId)?.to} booking confirm ho gayi.`,
      type: 'booking',
    });
    return newBooking;
  };

  const cancelBooking = (bookingId) => {
    setBookings(prev =>
      prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b)
    );
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

  const getRideById = (id) => rides.find(r => r.id === id);
  const getDriverById = (id) => drivers.find(d => d.id === id);
  const getVehicleById = (id) => vehicles.find(v => v.id === id);
  const getVehicleByDriver = (driverId) => vehicles.find(v => v.driverId === driverId);
  const getReviewsForDriver = (driverId) => reviews.filter(r => r.driverId === driverId);
  const getMyBookings = () => bookings.filter(b => b.passengerId === currentUser?.id);
  const getMyRides = () => rides.filter(r => r.driverId === currentUser?.id);

  const addNotification = ({ title, message, type }) => {
    setNotifications(prev => [{
      id: `n${Date.now()}`,
      title,
      message,
      time: 'Just now',
      read: false,
      type,
    }, ...prev]);
  };

  const markNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const registerVehicle = (vehicleData) => {
    const newVehicle = { ...vehicleData, id: `v${Date.now()}`, driverId: currentUser?.id };
    setVehicles(prev => [...prev, newVehicle]);
    return newVehicle;
  };

  return (
    <AppContext.Provider value={{
      currentUser, userRole, rides, bookings, drivers, vehicles, reviews, notifications,
      login, logout, postRide, bookRide, cancelBooking, searchRides,
      getRideById, getDriverById, getVehicleById, getVehicleByDriver,
      getReviewsForDriver, getMyBookings, getMyRides,
      addNotification, markNotificationRead, registerVehicle,
      unreadCount: notifications.filter(n => !n.read).length,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
