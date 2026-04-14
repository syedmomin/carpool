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
    socketService.on('RIDE_STARTED',      onRideStarted);
    socketService.on('RIDE_COMPLETED',    onRideCompleted);

    return () => {
      socketService.off('BOOKING_REQUESTED', onBookingRequested);
      socketService.off('BOOKING_ACCEPTED',  onBookingAccepted);
      socketService.off('BOOKING_REJECTED',  onBookingRejected);
      socketService.off('BOOKING_CANCELLED', onBookingCancelled);
      socketService.off('RIDE_STARTED',      onRideStarted);
      socketService.off('RIDE_COMPLETED',    onRideCompleted);
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
