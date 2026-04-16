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
 */
export default function SocketListener({ navigationRef }: { navigationRef: any }) {
  const { currentUser, incrementUnreadCount, resetAll: resetAppData } = useApp() as any;
  const socketData = useSocketData();
  const { showToast } = useToast();
  const { showModal } = useGlobalModal();
  const [completedRide, setCompletedRide] = useState<any>(null);

  useEffect(() => {
    if (!currentUser?.id) {
      socketService.disconnect();
      socketData.resetAll();
      return;
    }

    socketService.connect();
    socketService.joinUser(currentUser.id);

    const isPassenger = currentUser.role === 'PASSENGER';
    const isDriver    = currentUser.role === 'DRIVER';

    // ─────────────────────────────────────────────────────────────────────────
    // BOOKING EVENTS
    // ─────────────────────────────────────────────────────────────────────────

    // Driver receives: passenger requested a seat
    const onBookingRequested = (data: any) => {
      incrementUnreadCount();
      if (isDriver) {
        // Update that ride's booked seats count + add booking to ride
        if (data.rideId) {
          socketData.patchRide(data.rideId, { bookedSeats: data.bookedSeats });
          if (data.booking) {
            socketData.patchBookingInRide(data.rideId, data.booking.id, data.booking);
          }
        }
        showToast('New booking request received! 🚕', 'info');
      }
    };

    // Passenger receives: driver accepted their booking
    const onBookingAccepted = (data: any) => {
      incrementUnreadCount();
      if (isPassenger) {
        socketData.patchBooking(data.bookingId, { status: 'CONFIRMED' });
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

    // Passenger receives: driver rejected their booking
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

    // Driver receives: passenger cancelled their booking
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

    // Passengers on that ride receive: driver started the trip
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

    // Everyone on that ride receives: trip completed
    const onRideCompleted = (data: any) => {
      incrementUnreadCount();
      if (isPassenger) {
        socketData.patchRideInBookings(data.rideId, { status: 'COMPLETED' });
        socketData.removeBooking(data.rideId); // remove from active list
        navigationRef.current?.navigate('PassengerApp', { screen: 'PassengerHomeTab' });
        setTimeout(() => setCompletedRide({ ...data, targetRole: 'DRIVER' }), 600);
      }
      if (isDriver) {
        socketData.patchRide(data.rideId, { status: 'COMPLETED' });
        showToast('Ride completed! 🏁 Check your earnings.', 'success');
      }
    };

    // Passengers receive: driver cancelled the ride
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

    // Driver receives: their ride expired with no bookings
    const onRideExpired = (data: any) => {
      incrementUnreadCount();
      if (isDriver) {
        socketData.patchRide(data.rideId, { status: 'EXPIRED' });
        showToast(`Ride ${data.fromCity} → ${data.toCity} expired with no bookings`, 'info');
      }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // SCHEDULE REQUEST / BID EVENTS
    // ─────────────────────────────────────────────────────────────────────────

    // All drivers receive: passenger posted a new schedule request
    const onScheduleRequest = (data: any) => {
      if (isDriver) {
        socketData.addOpenRequest({ ...data, bids: [] });
        showToast(`New request: ${data.fromCity} → ${data.toCity} 📋`, 'info');
      }
    };

    // Passenger receives: a driver placed a bid on their request
    const onRideBid = (data: any) => {
      if (isPassenger) {
        incrementUnreadCount();
        socketData.upsertBidInRequest(data.scheduleRequestId, data.bid);
        showToast(`New bid: Rs ${data.bid?.pricePerSeat}/seat — check your requests! 💰`, 'info');
      }
    };

    // Driver receives: their own bid was placed/updated (confirmation back from server)
    const onBidPlaced = (data: any) => {
      if (isDriver) {
        socketData.upsertOwnBid(data.scheduleRequestId, data.bid);
      }
    };

    // Driver receives: passenger accepted their bid
    const onBidAccepted = (data: any) => {
      if (isDriver) {
        incrementUnreadCount();
        // Mark request as accepted in open-requests feed
        socketData.patchOpenRequest(data.scheduleRequestId, { status: 'ACCEPTED' });
        socketData.patchBidInOpenRequest(data.scheduleRequestId, { id: data.bidId, status: 'ACCEPTED' });
        showModal({
          type: 'success',
          title: 'Bid Accepted! 🎉',
          message: `Your bid was accepted! A ride has been created for ${data.fromCity} → ${data.toCity} on ${data.date}. Check My Rides.`,
          confirmText: 'View My Rides',
          onConfirm: () => navigationRef.current?.navigate('DriverApp', { screen: 'MyRidesTab' }),
        });
      }
    };

    // Driver receives: passenger rejected their bid
    const onBidRejected = (data: any) => {
      if (isDriver) {
        incrementUnreadCount();
        socketData.patchBidInOpenRequest(data.scheduleRequestId, { id: data.bidId, status: 'REJECTED' });
        showToast('Your bid was not selected for this request', 'info');
      }
    };

    // Driver receives: passenger withdrew their bid (usually not used, but handle it)
    const onBidWithdrawn = (data: any) => {
      // passenger side: bid removed from request
      if (isPassenger) {
        socketData.removeBidFromRequest(data.scheduleRequestId, data.bidId);
      }
    };

    // Passenger receives: their request was accepted (bid accepted → ride created)
    const onRequestAccepted = (data: any) => {
      if (isPassenger) {
        socketData.patchRequest(data.scheduleRequestId, {
          status: 'ACCEPTED',
          bids: undefined, // will be updated by onRideBid or reload
        });
        // Also trigger bookings reload since a new confirmed booking was created
        socketData.loadMyBookings(true);
      }
    };

    // All drivers receive: passenger cancelled their request
    const onRequestCancelled = (data: any) => {
      if (isDriver) {
        socketData.removeOpenRequest(data.scheduleRequestId);
      }
      if (isPassenger) {
        socketData.removeRequest(data.scheduleRequestId);
      }
    };

    // ─────────────────────────────────────────────────────────────────────────

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

    return () => {
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
