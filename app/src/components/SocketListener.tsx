import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useSocketData } from '../context/SocketDataContext';
import { useToast } from '../context/ToastContext';
import { socketService } from '../services/socket.service';
import { useGlobalModal } from '../context/GlobalModalContext';
import ReviewModal from './ReviewModal';

/**
 * SocketListener — single global real-time hub. Always mounted.
 * Responsibilities:
 *  1. Connect / disconnect socket on auth change
 *  2. Update SocketDataContext shared state for all screens
 *  3. Show toasts / modals / navigate for user-visible events
 *
 * IMPORTANT: socketService.connect() is async (awaits token fetch before
 * creating the Socket.IO instance). All socketService.on() calls MUST run
 * after connect() resolves — otherwise this.socket is null and every
 * listener is silently dropped by the guard in socket.service.tsx.
 */
export default function SocketListener({ navigationRef }: { navigationRef: any }) {
  const { currentUser, incrementUnreadCount } = useApp() as any;
  const socketData = useSocketData();
  const { showToast } = useToast();
  const { showModal } = useGlobalModal();
  const [completedRide, setCompletedRide] = useState<any>(null);

  // Passenger: whenever bookings load/update, join ride rooms for any
  // confirmed booking whose ride is ACTIVE or IN_PROGRESS so the passenger
  // receives RIDE_STARTED / RIDE_COMPLETED even after a fresh app launch.
  useEffect(() => {
    if (currentUser?.role !== 'PASSENGER') return;
    if (!socketData.myBookingsState.loaded) return;
    socketData.myBookings.forEach((b: any) => {
      if (
        b.status === 'CONFIRMED' &&
        (b.ride?.status === 'ACTIVE' || b.ride?.status === 'IN_PROGRESS')
      ) {
        socketService.joinRide(b.rideId ?? b.ride?.id, 'rider');
      }
    });
  }, [socketData.myBookings, socketData.myBookingsState.loaded, currentUser?.role]);

  useEffect(() => {
    if (!currentUser?.id) {
      socketService.disconnect();
      socketData.resetAll();
      return;
    }

    const isPassenger = currentUser.role === 'PASSENGER';
    const isDriver    = currentUser.role === 'DRIVER';

    // ── Define all handlers first (stable refs needed for off() cleanup) ──────

    // ─────────────────────────────────────────────────────────────────────────
    // BOOKING EVENTS
    // ─────────────────────────────────────────────────────────────────────────

    const onBookingRequested = (data: any) => {
      incrementUnreadCount();
      if (isDriver) {
        if (data.rideId) {
          socketData.patchRide(data.rideId, { bookedSeats: data.bookedSeats });
          if (data.booking) {
            socketData.patchBookingInRide(data.rideId, data.booking.id, data.booking);
          }
        }
        showToast('New booking request received! 🚕', 'info');
      }
    };

    const onBookingAccepted = (data: any) => {
      incrementUnreadCount();
      if (isPassenger) {
        socketData.patchBooking(data.bookingId, { status: 'CONFIRMED' });
        if (data.rideId) socketService.joinRide(data.rideId, 'rider');
        showModal({
          type: 'success',
          title: 'Booking Confirmed! 🎉',
          message: 'Your seat has been confirmed by the driver. You can view details in My Bookings.',
          confirmText: 'View Bookings',
          onConfirm: () => navigationRef.current?.navigate('PassengerApp', { screen: 'BookingHistoryTab' }),
        });
      }
      if (isDriver && data.rideId) {
        socketData.patchBookingInRide(data.rideId, data.bookingId, { status: 'CONFIRMED' });
      }
    };

    const onBookingRejected = (data: any) => {
      incrementUnreadCount();
      if (isPassenger) {
        socketData.removeBooking(data.bookingId);
        showToast('Your booking request was not accepted ❌', 'error');
      }
      if (isDriver && data.rideId) {
        socketData.patchBookingInRide(data.rideId, data.bookingId, { status: 'REJECTED' });
      }
    };

    const onBookingCancelled = (data: any) => {
      incrementUnreadCount();
      if (isDriver && data.rideId) {
        socketData.patchBookingInRide(data.rideId, data.bookingId, { status: 'CANCELLED' });
        if (data.bookedSeats !== undefined) {
          socketData.patchRide(data.rideId, { bookedSeats: data.bookedSeats });
        }
        showToast('A passenger cancelled their booking', 'info');
      }
      if (isPassenger) {
        socketData.removeBooking(data.bookingId);
      }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RIDE EVENTS
    // ─────────────────────────────────────────────────────────────────────────

    const onRideStarted = (data: any) => {
      incrementUnreadCount();
      if (isPassenger) {
        socketData.patchRideInBookings(data.rideId, { status: 'IN_PROGRESS' });
        showToast('Your ride has started! 🚗', 'success');
        navigationRef.current?.navigate('RideTracking', { rideId: data.rideId });
      }
      if (isDriver) {
        socketData.patchRide(data.rideId, { status: 'IN_PROGRESS' });
      }
    };

    const onRideCompleted = (data: any) => {
      incrementUnreadCount();
      if (isPassenger) {
        socketData.patchRideInBookings(data.rideId, { status: 'COMPLETED' });
        socketData.loadMyBookings(true); // server updated booking status — reload for clean state
        navigationRef.current?.navigate('PassengerApp', { screen: 'PassengerHomeTab' });
        setTimeout(() => setCompletedRide({ ...data, targetRole: 'DRIVER' }), 600);
      }
      if (isDriver) {
        socketData.patchRide(data.rideId, { status: 'COMPLETED' });
        showToast('Ride completed! 🏁 Check your earnings.', 'success');
      }
    };

    const onRideCancelled = (data: any) => {
      incrementUnreadCount();
      if (isPassenger) {
        socketData.patchRideInBookings(data.rideId, { status: 'CANCELLED' });
        showModal({
          type: 'danger',
          title: 'Ride Cancelled ❌',
          message: `The ${data.fromCity} → ${data.toCity} ride on ${data.date} has been cancelled by the driver.`,
          confirmText: 'Find Another Ride',
          onConfirm: () => navigationRef.current?.navigate('PassengerApp', { screen: 'SearchTab' }),
        });
      }
      if (isDriver) {
        socketData.patchRide(data.rideId, { status: 'CANCELLED' });
      }
    };

    const onRideExpired = (data: any) => {
      incrementUnreadCount();
      if (isDriver) {
        socketData.patchRide(data.rideId, { status: 'EXPIRED' });
        showToast(`Ride ${data.fromCity} → ${data.toCity} expired with no bookings`, 'info');
      }
    };

    const onRideUpdated = (data: any) => {
      if (isDriver) socketData.patchRide(data.rideId, data);
      if (isPassenger) socketData.patchRideInBookings(data.rideId, data);
    };

    const onNewRide = (data: any) => {
      if (isDriver && data.driver?.id === currentUser.id) {
        socketData.addRide(data);
      }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // SCHEDULE REQUEST / BID EVENTS
    // ─────────────────────────────────────────────────────────────────────────

    const onScheduleRequest = (data: any) => {
      if (isDriver) {
        socketData.addOpenRequest({ ...data, bids: [] });
        showToast(`New request: ${data.fromCity} → ${data.toCity} 📋`, 'info');
      }
    };

    const onRideBid = (data: any) => {
      if (isPassenger) {
        incrementUnreadCount();
        socketData.upsertBidInRequest(data.scheduleRequestId, data.bid);
        showToast(`New bid: Rs ${data.bid?.pricePerSeat}/seat — check your requests! 💰`, 'info');
      }
    };

    const onBidPlaced = (data: any) => {
      if (isDriver) {
        socketData.upsertOwnBid(data.scheduleRequestId, data.bid);
      }
    };

    const onBidAccepted = (data: any) => {
      if (isDriver) {
        incrementUnreadCount();
        // Remove from open-requests — request is closed, ride is now created
        socketData.removeOpenRequest(data.scheduleRequestId);
        socketData.loadMyRides(true);
        showModal({
          type: 'success',
          title: 'Bid Accepted! 🎉',
          message: `Your bid for ${data.fromCity} → ${data.toCity} on ${data.date} was accepted. A ride has been created for you.`,
          confirmText: 'View My Rides',
          onConfirm: () => navigationRef.current?.navigate('DriverApp', { screen: 'MyRidesTab' }),
        });
      }
    };

    const onBidRejected = (data: any) => {
      if (isDriver) {
        incrementUnreadCount();
        socketData.patchBidInOpenRequest(data.scheduleRequestId, { id: data.bidId, status: 'REJECTED' });
        showToast('Your bid was not selected for this request', 'info');
      }
    };

    const onBidWithdrawn = (data: any) => {
      if (isPassenger) {
        socketData.removeBidFromRequest(data.scheduleRequestId, data.bidId);
      }
    };

    const onRequestAccepted = (data: any) => {
      if (isPassenger) {
        // Remove request from MyRequests, load updated bookings, join ride room
        socketData.removeRequest(data.scheduleRequestId);
        socketData.loadMyBookings(true);
        if (data.rideId) socketService.joinRide(data.rideId, 'rider');
        showModal({
          type: 'success',
          title: 'Ride Booked! 🚗',
          message: 'The driver accepted your request and your seat is confirmed. You can chat, track, and manage your ride from My Bookings.',
          confirmText: 'View Booking',
          onConfirm: () => navigationRef.current?.navigate('PassengerApp', { screen: 'BookingHistoryTab' }),
        });
      }
    };

    const onRequestCancelled = (data: any) => {
      if (isDriver) socketData.removeOpenRequest(data.scheduleRequestId);
      if (isPassenger) socketData.removeRequest(data.scheduleRequestId);
    };

    const onReviewReceived = () => incrementUnreadCount();

    // ── Connect first, THEN register listeners ────────────────────────────────
    // socketService.connect() awaits tokenStorage.get() before creating the
    // Socket.IO instance. Calling on() before that resolves means this.socket
    // is null and every listener is silently dropped. Use a cancelled flag so
    // cleanup works correctly if the effect re-runs before connect resolves.
    let cancelled = false;

    socketService.connect().then(() => {
      if (cancelled) return;

      socketService.joinUser(currentUser.id);

      socketService.on('NEW_RIDE',           onNewRide);
      socketService.on('RIDE_UPDATED',       onRideUpdated);
      socketService.on('REVIEW_RECEIVED',    onReviewReceived);
      socketService.on('BOOKING_REQUESTED',  onBookingRequested);
      socketService.on('BOOKING_ACCEPTED',   onBookingAccepted);
      socketService.on('BOOKING_REJECTED',   onBookingRejected);
      socketService.on('BOOKING_CANCELLED',  onBookingCancelled);
      socketService.on('RIDE_STARTED',       onRideStarted);
      socketService.on('RIDE_COMPLETED',     onRideCompleted);
      socketService.on('RIDE_CANCELLED',     onRideCancelled);
      socketService.on('RIDE_EXPIRED',       onRideExpired);
      socketService.on('SCHEDULE_REQUEST',   onScheduleRequest);
      socketService.on('RIDE_BID',           onRideBid);
      socketService.on('BID_PLACED',         onBidPlaced);
      socketService.on('BID_ACCEPTED',       onBidAccepted);
      socketService.on('BID_REJECTED',       onBidRejected);
      socketService.on('BID_WITHDRAWN',      onBidWithdrawn);
      socketService.on('REQUEST_ACCEPTED',   onRequestAccepted);
      socketService.on('REQUEST_CANCELLED',  onRequestCancelled);
    });

    return () => {
      cancelled = true;

      socketService.off('NEW_RIDE',           onNewRide);
      socketService.off('RIDE_UPDATED',       onRideUpdated);
      socketService.off('REVIEW_RECEIVED',    onReviewReceived);
      socketService.off('BOOKING_REQUESTED',  onBookingRequested);
      socketService.off('BOOKING_ACCEPTED',   onBookingAccepted);
      socketService.off('BOOKING_REJECTED',   onBookingRejected);
      socketService.off('BOOKING_CANCELLED',  onBookingCancelled);
      socketService.off('RIDE_STARTED',       onRideStarted);
      socketService.off('RIDE_COMPLETED',     onRideCompleted);
      socketService.off('RIDE_CANCELLED',     onRideCancelled);
      socketService.off('RIDE_EXPIRED',       onRideExpired);
      socketService.off('SCHEDULE_REQUEST',   onScheduleRequest);
      socketService.off('RIDE_BID',           onRideBid);
      socketService.off('BID_PLACED',         onBidPlaced);
      socketService.off('BID_ACCEPTED',       onBidAccepted);
      socketService.off('BID_REJECTED',       onBidRejected);
      socketService.off('BID_WITHDRAWN',      onBidWithdrawn);
      socketService.off('REQUEST_ACCEPTED',   onRequestAccepted);
      socketService.off('REQUEST_CANCELLED',  onRequestCancelled);
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
