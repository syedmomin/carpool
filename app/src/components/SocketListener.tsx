import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useSocketData } from '../context/SocketDataContext';
import { useToast } from '../context/ToastContext';
import { socketService } from '../services/socket.service';
import { useGlobalModal } from '../context/GlobalModalContext';
import { useBanner } from '../context/BannerContext';
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
  const { currentUser, incrementUnreadCount, refreshUnreadCount } = useApp() as any;
  const socketData = useSocketData();
  const { showToast } = useToast();
  const { showModal } = useGlobalModal();
  const { showBanner } = useBanner();
  const [completedRide, setCompletedRide] = useState<any>(null);

  // Convenience: route label from a socket payload for banner subtitles.
  const routeOf = (d: any) =>
    d?.fromCity && d?.toCity ? `${d.fromCity} > ${d.toCity}` : (d?.routeLabel || '');

  // Ride lifecycle events (RIDE_STARTED / RIDE_COMPLETED) are emitted by the
  // server to BOTH the user room (user_<id>) and the ride room (ride_<id>), and
  // a passenger belongs to both — so each event arrives twice. Keyed on
  // event+rideId, so a genuine ACTIVE > IN_PROGRESS > COMPLETED sequence is
  // unaffected (different events).
  const DEDUPE_MS = 5000;
  const handledRef = useRef<Map<string, number>>(new Map());

  const isDuplicate = (event: string, rideId: string) => {
    const key = `${event}:${rideId}`;
    const now = Date.now();
    const seenAt = handledRef.current.get(key);
    if (seenAt !== undefined && now - seenAt < DEDUPE_MS) return true;
    handledRef.current.set(key, now);
    // Drop stale keys so the map never grows unbounded.
    handledRef.current.forEach((at, k) => {
      if (now - at >= DEDUPE_MS) handledRef.current.delete(k);
    });
    return false;
  };

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
            // patchBookingInRide recomputes bookedSeats from CONFIRMED/COMPLETED
            // bookings only, so it must run BEFORE patchRide — otherwise it would
            // clobber the server-authoritative bookedSeats (which counts the new
            // PENDING reservation). Same ordering as the accept/reject/cancel handlers.
            if (data.booking) {
              socketData.patchBookingInRide(data.rideId, data.booking.id, data.booking);
            }
            socketData.patchRide(data.rideId, { bookedSeats: data.bookedSeats });
          }

          showModal({
            type: 'confirm',
            title: 'New ride request',
            message: `${data.booking?.passenger?.name || 'A passenger'} wants to join your ride to ${data.booking?.exitCity}.\nSeats: ${data.seats}`,
            confirmText: 'Accept',
            cancelText: 'Decline',
            onConfirm: async () => {
              const { error } = await bookingsApi.accept(data.booking.id);
              if (error) showToast(error, 'error');
              else showToast('Booking accepted', 'success');
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
            title: 'Booking confirmed',
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
          showBanner({
            title: 'Request not accepted',
            message: `Your request${routeOf(data) ? ` for ${routeOf(data)}` : ''} was not accepted. Try another ride.`,
            kind: 'BOOKING', rideId: data.rideId,
            onPress: () => navigationRef.current?.navigate('PassengerApp', { screen: 'SearchTab' }),
          });
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
          showBanner({
            title: 'Booking Cancelled',
            message: 'A passenger cancelled their booking on your ride.',
            kind: 'BOOKING', rideId: data.rideId,
            onPress: () => navigationRef.current?.navigate('RideBookings', { rideId: data.rideId }),
          });
        }
        if (currentUser.role === 'PASSENGER') {
          socketData.removeBooking(data.bookingId);
        }
      },

      onRideStarted: (data: any) => {
        if (isDuplicate('RIDE_STARTED', data.rideId)) return;
        incrementUnreadCount();
        if (currentUser.role === 'PASSENGER') {
          socketData.patchRideInBookings(data.rideId, { status: 'IN_PROGRESS' });
          // Navigate the passenger directly to the live tracking screen.
          // A short delay lets any pending navigation settle before pushing RideTracking.
          setTimeout(() => {
            navigationRef.current?.navigate('RideTracking', { rideId: data.rideId });
          }, 300);
        }
        if (currentUser.role === 'DRIVER') {
          socketData.patchRide(data.rideId, { status: 'IN_PROGRESS' });
        }
      },

      onRideCompleted: (data: any) => {
        if (isDuplicate('RIDE_COMPLETED', data.rideId)) return;
        incrementUnreadCount();
        if (currentUser.role === 'PASSENGER') {
          socketData.patchRideInBookings(data.rideId, { status: 'COMPLETED' });
          socketData.loadMyBookings(true);
          // Let RideTrackingScreen handle navigation on completion to avoid double-navigate
          setTimeout(() => setCompletedRide({ ...data, targetRole: 'DRIVER' }), 600);
        }
        if (currentUser.role === 'DRIVER') {
          socketData.patchRide(data.rideId, { status: 'COMPLETED' });
          showBanner({
            title: 'Ride completed',
            message: `${routeOf(data) || 'Your ride'} is done. Check your earnings.`,
            kind: 'RIDE_COMPLETED', rideId: data.rideId,
            onPress: () => navigationRef.current?.navigate('DriverApp', { screen: 'DriverHomeTab', params: { screen: 'Earnings' } }),
          });
        }
      },

      onRideCancelled: (data: any) => {
        incrementUnreadCount();
        if (currentUser.role === 'PASSENGER') {
          socketData.patchRideInBookings(data.rideId, { status: 'CANCELLED' });
          showModal({
            type: 'danger',
            title: 'Ride cancelled',
            message: `The ${data.fromCity} > ${data.toCity} ride on ${data.date} has been cancelled by the driver.`,
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
          showBanner({
            title: 'Ride expired',
            message: `${routeOf(data) || 'Your ride'} expired with no bookings.`,
            kind: 'RIDE_EXPIRED', rideId: data.rideId,
            onPress: () => navigationRef.current?.navigate('DriverApp', { screen: 'MyRidesTab' }),
          });
        }
      },

      // Departure reminder from the server's 15-min cron — sent to the driver and
      // to every confirmed passenger of the ride.
      onRideReminder: (data: any) => {
        incrementUnreadCount();
        showBanner({
          title: 'Upcoming ride',
          message: `${routeOf(data) || 'Your ride'}${data.departureTime ? ` departs at ${data.departureTime}` : ' is coming up'}.`,
          kind: 'REMINDER', rideId: data.rideId,
          onPress: () => currentUser.role === 'DRIVER'
            ? navigationRef.current?.navigate('DriverApp', { screen: 'MyRidesTab' })
            : navigationRef.current?.navigate('PassengerApp', { screen: 'BookingHistoryTab' }),
        });
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
          showBanner({
            title: 'New ride request',
            message: `${routeOf(data)}. Place your bid to win this trip.`,
            kind: 'SCHEDULE_REQUEST',
            onPress: () => navigationRef.current?.navigate('DriverApp', { screen: 'DriverRequestsTab' }),
          });
        }
      },

      onRideBid: (data: any) => {
        if (currentUser.role === 'PASSENGER') {
          incrementUnreadCount();
          socketData.upsertBidInRequest(data.scheduleRequestId, data.bid);
          showBanner({
            title: 'You have a new offer!',
            message: `${data.bid?.driver?.name} offered Rs ${data.bid?.pricePerSeat}/seat for ${data.fromCity} > ${data.toCity}.`,
            kind: 'BID_PLACED',
            onPress: () => navigationRef.current?.navigate('PassengerApp', { screen: 'RequestsTab' }),
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
          showBanner({
            title: 'Your offer was accepted!',
            message: `${data.fromCity} > ${data.toCity} on ${data.date}. A ride has been created.`,
            kind: 'BID_ACCEPTED',
            onPress: () => navigationRef.current?.navigate('DriverApp', { screen: 'MyRidesTab' }),
          });
        }
      },

      onBidRejected: (data: any) => {
        if (currentUser.role === 'DRIVER') {
          incrementUnreadCount();
          socketData.patchBidInOpenRequest(data.scheduleRequestId, { id: data.bidId, status: 'REJECTED' });
          showBanner({
            title: 'Bid Not Selected',
            message: `Your bid${routeOf(data) ? ` for ${routeOf(data)}` : ''} was not selected.`,
            kind: 'BID_REJECTED',
            onPress: () => navigationRef.current?.navigate('DriverApp', { screen: 'DriverRequestsTab' }),
          });
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
            title: 'Ride booked',
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
          showBanner({
            title: 'Request expired',
            message: `Your request${routeOf(data) ? ` from ${routeOf(data)}` : ''} expired with no accepted bids.`,
            kind: 'RIDE_EXPIRED',
            onPress: () => navigationRef.current?.navigate('PassengerApp', { screen: 'RequestsTab' }),
          });
        }
      },

      onBookingUpdated: (data: any) => {
        // Passenger added seats to a confirmed booking — keep driver views in sync.
        if (currentUser.role === 'DRIVER' && data.rideId) {
          if (data.booking) socketData.patchBookingInRide(data.rideId, data.booking.id, data.booking);
          if (data.bookedSeats !== undefined) socketData.patchRide(data.rideId, { bookedSeats: data.bookedSeats });
        }
      },

      onReviewReceived: () => incrementUnreadCount(),

      // Authoritative badge sync: fired by the server for EVERY notification it
      // creates, so the bell badge stays correct for all types (reminders, new
      // requests, etc.) even if no type-specific handler bumps it.
      onNotificationNew: () => refreshUnreadCount(),

      onNewChatMessage: (data: any) => {
        const currentRoute = navigationRef.current?.getCurrentRoute?.()?.name;
        if (currentRoute === 'Chat') return; // already visible in ChatScreen
        const senderName = data.sender?.name || 'Someone';
        const preview = data.content ? (data.content.length > 50 ? data.content.slice(0, 50) + '…' : data.content) : 'Sent you a message';
        showBanner({
          title: `💬 ${senderName}`,
          message: preview,
          kind: 'CHAT_MESSAGE',
          onPress: () => navigationRef.current?.navigate('Chat', { bookingId: data.bookingId }),
        });
      },
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
      socketService.on('NOTIFICATION_NEW',   handlers.onNotificationNew);
      socketService.on('BOOKING_UPDATED',    handlers.onBookingUpdated);
      socketService.on('BOOKING_REQUESTED',  handlers.onBookingRequested);
      socketService.on('BOOKING_ACCEPTED',   handlers.onBookingAccepted);
      socketService.on('BOOKING_REJECTED',   handlers.onBookingRejected);
      socketService.on('BOOKING_CANCELLED',  handlers.onBookingCancelled);
      socketService.on('RIDE_STARTED',       handlers.onRideStarted);
      socketService.on('RIDE_COMPLETED',     handlers.onRideCompleted);
      socketService.on('RIDE_CANCELLED',     handlers.onRideCancelled);
      socketService.on('RIDE_EXPIRED',       handlers.onRideExpired);
      socketService.on('RIDE_REMINDER',      handlers.onRideReminder);
      socketService.on('SCHEDULE_REQUEST',   handlers.onScheduleRequest);
      socketService.on('RIDE_BID',           handlers.onRideBid);
      socketService.on('BID_PLACED',         handlers.onBidPlaced);
      socketService.on('BID_ACCEPTED',       handlers.onBidAccepted);
      socketService.on('BID_REJECTED',       handlers.onBidRejected);
      socketService.on('BID_WITHDRAWN',      handlers.onBidWithdrawn);
      socketService.on('REQUEST_ACCEPTED',   handlers.onRequestAccepted);
      socketService.on('REQUEST_CANCELLED',  handlers.onRequestCancelled);
      socketService.on('REQUEST_EXPIRED',    handlers.onRequestExpired);
      socketService.on('CHAT_MESSAGE',        handlers.onNewChatMessage);
    });

    return () => {
      cancelled = true;
      console.log('[Socket] Cleaning up listeners for effect cycle');
      socketService.off('NEW_RIDE',           handlers.onNewRide);
      socketService.off('RIDE_UPDATED',       handlers.onRideUpdated);
      socketService.off('REVIEW_RECEIVED',    handlers.onReviewReceived);
      socketService.off('NOTIFICATION_NEW',   handlers.onNotificationNew);
      socketService.off('BOOKING_UPDATED',    handlers.onBookingUpdated);
      socketService.off('BOOKING_REQUESTED',  handlers.onBookingRequested);
      socketService.off('BOOKING_ACCEPTED',   handlers.onBookingAccepted);
      socketService.off('BOOKING_REJECTED',   handlers.onBookingRejected);
      socketService.off('BOOKING_CANCELLED',  handlers.onBookingCancelled);
      socketService.off('RIDE_STARTED',       handlers.onRideStarted);
      socketService.off('RIDE_COMPLETED',     handlers.onRideCompleted);
      socketService.off('RIDE_CANCELLED',     handlers.onRideCancelled);
      socketService.off('RIDE_EXPIRED',       handlers.onRideExpired);
      socketService.off('RIDE_REMINDER',      handlers.onRideReminder);
      socketService.off('SCHEDULE_REQUEST',   handlers.onScheduleRequest);
      socketService.off('RIDE_BID',           handlers.onRideBid);
      socketService.off('BID_PLACED',         handlers.onBidPlaced);
      socketService.off('BID_ACCEPTED',       handlers.onBidAccepted);
      socketService.off('BID_REJECTED',       handlers.onBidRejected);
      socketService.off('BID_WITHDRAWN',      handlers.onBidWithdrawn);
      socketService.off('REQUEST_ACCEPTED',   handlers.onRequestAccepted);
      socketService.off('REQUEST_CANCELLED',  handlers.onRequestCancelled);
      socketService.off('REQUEST_EXPIRED',    handlers.onRequestExpired);
      socketService.off('CHAT_MESSAGE',        handlers.onNewChatMessage);
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
