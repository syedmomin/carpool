import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { socketService } from '../services/socket.service';
import { useGlobalModal } from '../context/GlobalModalContext';
import ReviewModal from './ReviewModal';

/**
 * SocketListener — global real-time event handler.
 * Always mounted, handles cross-screen notifications and navigation triggers.
 */
export default function SocketListener({ navigationRef }: { navigationRef: any }) {
  const { currentUser, incrementUnreadCount } = useApp();
  const { showToast }   = useToast();
  const { showModal }   = useGlobalModal();
  const [completedRide, setCompletedRide] = useState<any>(null);

  useEffect(() => {
    if (!currentUser?.id) {
      socketService.disconnect();
      return;
    }

    socketService.connect();
    socketService.joinUser(currentUser.id);

    const isPassenger = currentUser.role === 'PASSENGER';
    const isDriver    = currentUser.role === 'DRIVER';

    // ── Booking Requested (driver gets notification) ──────────────────────
    const onBookingRequested = () => {
      incrementUnreadCount();
      showToast('New booking request received! 🚕', 'info');
    };

    // ── Booking Accepted (passenger gets notification) ────────────────────
    const onBookingAccepted = () => {
      incrementUnreadCount();
      showModal({
        type: 'success',
        title: 'Booking Confirmed! 🎉',
        message: 'Your seat has been confirmed by the driver. You can view details in My Bookings.',
        confirmText: 'View Bookings',
        onConfirm: () => navigationRef.current?.navigate('PassengerApp', { screen: 'BookingHistoryTab' }),
      });
    };

    // ── Booking Rejected (passenger gets notification) ────────────────────
    const onBookingRejected = () => {
      incrementUnreadCount();
      showToast('Your booking request was rejected ❌', 'error');
    };

    // ── Booking Cancelled (driver gets notification) ──────────────────────
    const onBookingCancelled = () => {
      incrementUnreadCount();
      showToast('A passenger cancelled their booking', 'info');
    };

    // ── Schedule Request: new bid received (passenger gets notification) ─────
    const onRideBid = (data: any) => {
      if (isPassenger) {
        incrementUnreadCount();
        showToast(`New bid received: Rs ${data.bid?.pricePerSeat}/seat — check your requests!`, 'info');
      }
    };

    // ── Bid Accepted: driver's bid was accepted (driver gets notification) ───
    const onBidAccepted = (data: any) => {
      if (isDriver) {
        incrementUnreadCount();
        showModal({
          type: 'success',
          title: 'Bid Accepted! 🎉',
          message: `Your bid was accepted! A ride has been created for ${data.fromCity} → ${data.toCity} on ${data.date}. Check My Rides.`,
          confirmText: 'View My Rides',
          onConfirm: () => navigationRef.current?.navigate('DriverApp', { screen: 'MyRidesTab' }),
        });
      }
    };

    // ── Bid Rejected: driver's bid was not selected ───────────────────────────
    const onBidRejected = (data: any) => {
      if (isDriver) {
        incrementUnreadCount();
        showToast('Your bid was not selected for this request', 'info');
      }
    };

    // ── Ride Cancelled by driver (passengers get notification) ───────────────
    const onRideCancelled = (data: any) => {
      if (isPassenger) {
        incrementUnreadCount();
        showModal({
          type: 'danger',
          title: 'Ride Cancelled ❌',
          message: `The ${data.fromCity} → ${data.toCity} ride on ${data.date} has been cancelled by the driver.`,
          confirmText: 'Find Another Ride',
          onConfirm: () => navigationRef.current?.navigate('PassengerApp', { screen: 'SearchTab' }),
        });
      }
    };

    // ── Ride Expired with no bookings (driver gets notification) ─────────────
    const onRideExpired = (data: any) => {
      if (isDriver) {
        incrementUnreadCount();
        showToast(`Ride ${data.fromCity} → ${data.toCity} expired with no bookings`, 'info');
      }
    };

    // ── Ride Started (passenger gets notification) ────────────────────────
    const onRideStarted = (data: any) => {
      if (isPassenger) {
        incrementUnreadCount();
        showToast('Your ride has started! 🚗', 'success');
        navigationRef.current?.navigate('RideTracking', { rideId: data.rideId });
      }
    };

    // ── Ride Completed (both get notification) ────────────────────────────
    const onRideCompleted = (data: any) => {
      incrementUnreadCount();
      if (isPassenger) {
        navigationRef.current?.navigate('PassengerApp', { screen: 'PassengerHomeTab' });
        setTimeout(() => setCompletedRide({ ...data, targetRole: 'DRIVER' }), 600);
      }
      if (isDriver) {
        showToast('Ride session completed! 🏁', 'success');
      }
    };

    socketService.on('BOOKING_REQUESTED', onBookingRequested);
    socketService.on('BOOKING_ACCEPTED',  onBookingAccepted);
    socketService.on('BOOKING_REJECTED',  onBookingRejected);
    socketService.on('BOOKING_CANCELLED', onBookingCancelled);
    socketService.on('RIDE_CANCELLED',    onRideCancelled);
    socketService.on('RIDE_EXPIRED',      onRideExpired);
    socketService.on('RIDE_STARTED',      onRideStarted);
    socketService.on('RIDE_COMPLETED',    onRideCompleted);
    socketService.on('RIDE_BID',          onRideBid);
    socketService.on('BID_ACCEPTED',      onBidAccepted);
    socketService.on('BID_REJECTED',      onBidRejected);

    return () => {
      socketService.off('BOOKING_REQUESTED', onBookingRequested);
      socketService.off('BOOKING_ACCEPTED',  onBookingAccepted);
      socketService.off('BOOKING_REJECTED',  onBookingRejected);
      socketService.off('BOOKING_CANCELLED', onBookingCancelled);
      socketService.off('RIDE_CANCELLED',    onRideCancelled);
      socketService.off('RIDE_EXPIRED',      onRideExpired);
      socketService.off('RIDE_STARTED',      onRideStarted);
      socketService.off('RIDE_COMPLETED',    onRideCompleted);
      socketService.off('RIDE_BID',          onRideBid);
      socketService.off('BID_ACCEPTED',      onBidAccepted);
      socketService.off('BID_REJECTED',      onBidRejected);
    };
  }, [currentUser?.id]);

  return (
    <ReviewModal
      visible={!!completedRide}
      onClose={() => setCompletedRide(null)}
      rideId={completedRide?.rideId}
      revieweeId={completedRide?.driverId}
      revieweeName={completedRide?.driverName || 'your Driver'}
      targetRole="DRIVER"
      routeLabel={completedRide?.routeLabel}
      routeDate={completedRide?.date}
    />
  );
}
