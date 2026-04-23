import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useSocketData } from '../context/SocketDataContext';
import { useToast } from '../context/ToastContext';
import { socketService } from '../services/socket.service';
import { useGlobalModal } from '../context/GlobalModalContext';
import { bookingsApi } from '../services/api';
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

    // ── Define all handlers first (stable refs needed for off() cleanup) ──────
    const handlers = {
      onBookingRequested: (data: any) => {
        incrementUnreadCount();
        if (currentUser.role === 'DRIVER') {
          if (data.rideId) {
            socketData.patchRide(data.rideId, { bookedSeats: data.bookedSeats });
            if (data.booking) {
              socketData.patchBookingInRide(data.rideId, data.booking.id, data.booking);
            }
          }
          
          showModal({
            type: 'confirm',
            title: 'New Ride Request! 🚗',
            message: `${data.booking?.passenger?.name || 'A passenger'} wants to join your ride to ${data.booking?.exitCity}.\nSeats: ${data.seats}`,
            confirmText: 'Accept',
            cancelText: 'Decline',
            onConfirm: async () => {
              const { error } = await bookingsApi.accept(data.booking.id);
              if (error) showToast(error, 'error');
              else showToast('Booking Accepted!', 'success');
            },
            onCancel: async () => {
              const { error } = await bookingsApi.reject(data.booking.id);
              if (error) showToast(error, 'error');
              else showToast('Booking Declined', 'info');
            }
          });
        }
      },

      onBookingAccepted: (data: any) => {
        incrementUnreadCount();
        if (currentUser.role === 'PASSENGER') {
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
        if (currentUser.role === 'DRIVER' && data.rideId) {
          socketData.patchBookingInRide(data.rideId, data.bookingId, { status: 'CONFIRMED' });
        }
      },

      onBookingRejected: (data: any) => {
        incrementUnreadCount();
        if (currentUser.role === 'PASSENGER') {
          socketData.removeBooking(data.bookingId);
          showToast('Your booking request was not accepted ❌', 'error');
        }
        if (currentUser.role === 'DRIVER' && data.rideId) {
          socketData.patchBookingInRide(data.rideId, data.bookingId, { status: 'REJECTED' });
        }
      },

      onBookingCancelled: (data: any) => {
        incrementUnreadCount();
        if (currentUser.role === 'DRIVER' && data.rideId) {
          socketData.patchBookingInRide(data.rideId, data.bookingId, { status: 'CANCELLED' });
          if (data.bookedSeats !== undefined) {
            socketData.patchRide(data.rideId, { bookedSeats: data.bookedSeats });
          }
          showToast('A passenger cancelled their booking', 'info');
        }
        if (currentUser.role === 'PASSENGER') {
          socketData.removeBooking(data.bookingId);
        }
      },

      onRideStarted: (data: any) => {
        incrementUnreadCount();
        if (currentUser.role === 'PASSENGER') {
          socketData.patchRideInBookings(data.rideId, { status: 'IN_PROGRESS' });
          showToast('Your ride has started! 🚗', 'success');
          navigationRef.current?.navigate('RideTracking', { rideId: data.rideId });
        }
        if (currentUser.role === 'DRIVER') {
          socketData.patchRide(data.rideId, { status: 'IN_PROGRESS' });
        }
      },

      onRideCompleted: (data: any) => {
        incrementUnreadCount();
        if (currentUser.role === 'PASSENGER') {
          socketData.patchRideInBookings(data.rideId, { status: 'COMPLETED' });
          socketData.loadMyBookings(true);
          navigationRef.current?.navigate('PassengerApp', { screen: 'PassengerHomeTab' });
          setTimeout(() => setCompletedRide({ ...data, targetRole: 'DRIVER' }), 600);
        }
        if (currentUser.role === 'DRIVER') {
          socketData.patchRide(data.rideId, { status: 'COMPLETED' });
          showToast('Ride completed! 🏁 Check your earnings.', 'success');
        }
      },

      onRideCancelled: (data: any) => {
        incrementUnreadCount();
        if (currentUser.role === 'PASSENGER') {
          socketData.patchRideInBookings(data.rideId, { status: 'CANCELLED' });
          showModal({
            type: 'danger',
            title: 'Ride Cancelled ❌',
            message: `The ${data.fromCity} → ${data.toCity} ride on ${data.date} has been cancelled by the driver.`,
            confirmText: 'Find Another Ride',
            onConfirm: () => navigationRef.current?.navigate('PassengerApp', { screen: 'SearchTab' }),
          });
        }
        if (currentUser.role === 'DRIVER') {
          socketData.patchRide(data.rideId, { status: 'CANCELLED' });
        }
      },

      onRideExpired: (data: any) => {
        incrementUnreadCount();
        if (currentUser.role === 'DRIVER') {
          socketData.patchRide(data.rideId, { status: 'EXPIRED' });
          showToast(`Ride ${data.fromCity} → ${data.toCity} expired with no bookings`, 'info');
        }
      },

      onRideUpdated: (data: any) => {
        if (currentUser.role === 'DRIVER') socketData.patchRide(data.rideId, data);
        if (currentUser.role === 'PASSENGER') socketData.patchRideInBookings(data.rideId, data);
      },

      onNewRide: (data: any) => {
        console.log('[Socket] NEW_RIDE Event:', data);
        socketData.addAvailableRide(data);
        if (currentUser.role === 'DRIVER' && data.driver?.id === currentUser.id) {
          socketData.addRide(data);
        }
      },

      onScheduleRequest: (data: any) => {
        if (currentUser.role === 'DRIVER') {
          socketData.addOpenRequest({ ...data, bids: [] });
          showToast(`New request: ${data.fromCity} → ${data.toCity} 📋`, 'info');
        }
      },

      onRideBid: (data: any) => {
        if (currentUser.role === 'PASSENGER') {
          incrementUnreadCount();
          socketData.upsertBidInRequest(data.scheduleRequestId, data.bid);
          
          // InDrive-style Bid Popup for Passenger
          showModal({
            type: 'success',
            title: 'New Bid Received! 💰',
            message: `Driver ${data.bid?.driver?.name} offered Rs ${data.bid?.pricePerSeat} for your ${data.fromCity} → ${data.toCity} trip.`,
            confirmText: 'View Bids',
            onConfirm: () => navigationRef.current?.navigate('PassengerApp', { screen: 'RequestDetail', params: { requestId: data.scheduleRequestId } }),
          });
        }
      },

      onBidPlaced: (data: any) => {
        if (currentUser.role === 'DRIVER') {
          socketData.upsertOwnBid(data.scheduleRequestId, data.bid);
        }
      },

      onBidAccepted: (data: any) => {
        if (currentUser.role === 'DRIVER') {
          incrementUnreadCount();
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
      },

      onBidRejected: (data: any) => {
        if (currentUser.role === 'DRIVER') {
          incrementUnreadCount();
          socketData.patchBidInOpenRequest(data.scheduleRequestId, { id: data.bidId, status: 'REJECTED' });
          showToast('Your bid was not selected for this request', 'info');
        }
      },

      onBidWithdrawn: (data: any) => {
        if (currentUser.role === 'PASSENGER') {
          socketData.removeBidFromRequest(data.scheduleRequestId, data.bidId);
        }
      },

      onRequestAccepted: (data: any) => {
        if (currentUser.role === 'PASSENGER') {
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
      },

      onRequestCancelled: (data: any) => {
        if (currentUser.role === 'DRIVER') socketData.removeOpenRequest(data.scheduleRequestId);
        if (currentUser.role === 'PASSENGER') socketData.removeRequest(data.scheduleRequestId);
      },

      onRequestExpired: (data: any) => {
        if (currentUser.role === 'PASSENGER') {
          socketData.patchRequest(data.scheduleRequestId, { status: 'EXPIRED' });
          showToast(`Your request from ${data.fromCity} to ${data.toCity} has expired 📋`, 'info');
        }
      },

      onReviewReceived: () => incrementUnreadCount(),
    };

    // ── Connect first, THEN register listeners ────────────────────────────────
    let cancelled = false;

    socketService.connect().then(() => {
      if (cancelled) return;
      console.log('[Socket] Initializing room and listeners for user:', currentUser.id);
      socketService.joinUser(currentUser.id);

      socketService.on('NEW_RIDE',           handlers.onNewRide);
      socketService.on('RIDE_UPDATED',       handlers.onRideUpdated);
      socketService.on('REVIEW_RECEIVED',    handlers.onReviewReceived);
      socketService.on('BOOKING_REQUESTED',  handlers.onBookingRequested);
      socketService.on('BOOKING_ACCEPTED',   handlers.onBookingAccepted);
      socketService.on('BOOKING_REJECTED',   handlers.onBookingRejected);
      socketService.on('BOOKING_CANCELLED',  handlers.onBookingCancelled);
      socketService.on('RIDE_STARTED',       handlers.onRideStarted);
      socketService.on('RIDE_COMPLETED',     handlers.onRideCompleted);
      socketService.on('RIDE_CANCELLED',     handlers.onRideCancelled);
      socketService.on('RIDE_EXPIRED',       handlers.onRideExpired);
      socketService.on('SCHEDULE_REQUEST',   handlers.onScheduleRequest);
      socketService.on('RIDE_BID',           handlers.onRideBid);
      socketService.on('BID_PLACED',         handlers.onBidPlaced);
      socketService.on('BID_ACCEPTED',       handlers.onBidAccepted);
      socketService.on('BID_REJECTED',       handlers.onBidRejected);
      socketService.on('BID_WITHDRAWN',      handlers.onBidWithdrawn);
      socketService.on('REQUEST_ACCEPTED',   handlers.onRequestAccepted);
      socketService.on('REQUEST_CANCELLED',  handlers.onRequestCancelled);
      socketService.on('REQUEST_EXPIRED',    handlers.onRequestExpired);
    });

    return () => {
      cancelled = true;
      console.log('[Socket] Cleaning up listeners for effect cycle');
      socketService.off('NEW_RIDE',           handlers.onNewRide);
      socketService.off('RIDE_UPDATED',       handlers.onRideUpdated);
      socketService.off('REVIEW_RECEIVED',    handlers.onReviewReceived);
      socketService.off('BOOKING_REQUESTED',  handlers.onBookingRequested);
      socketService.off('BOOKING_ACCEPTED',   handlers.onBookingAccepted);
      socketService.off('BOOKING_REJECTED',   handlers.onBookingRejected);
      socketService.off('BOOKING_CANCELLED',  handlers.onBookingCancelled);
      socketService.off('RIDE_STARTED',       handlers.onRideStarted);
      socketService.off('RIDE_COMPLETED',     handlers.onRideCompleted);
      socketService.off('RIDE_CANCELLED',     handlers.onRideCancelled);
      socketService.off('RIDE_EXPIRED',       handlers.onRideExpired);
      socketService.off('SCHEDULE_REQUEST',   handlers.onScheduleRequest);
      socketService.off('RIDE_BID',           handlers.onRideBid);
      socketService.off('BID_PLACED',         handlers.onBidPlaced);
      socketService.off('BID_ACCEPTED',       handlers.onBidAccepted);
      socketService.off('BID_REJECTED',       handlers.onBidRejected);
      socketService.off('BID_WITHDRAWN',      handlers.onBidWithdrawn);
      socketService.off('REQUEST_ACCEPTED',   handlers.onRequestAccepted);
      socketService.off('REQUEST_CANCELLED',  handlers.onRequestCancelled);
      socketService.off('REQUEST_EXPIRED',    handlers.onRequestExpired);
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
