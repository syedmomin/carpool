import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { socketService } from '../services/socket.service';
import { useGlobalModal } from '../context/GlobalModalContext';

/**
 * SocketListener: Handles global real-time notifications and navigation triggers.
 * Sits inside ToastProvider so it can show alerts.
 */
export default function SocketListener({ navigationRef }: { navigationRef: any }) {
  const { currentUser } = useApp();
  const { showToast } = useToast();
  const { showModal } = useGlobalModal();

  useEffect(() => {
    if (!currentUser?.id) {
      socketService.disconnect();
      return;
    }

    // Connect and join personal room
    socketService.connect();
    socketService.joinUser(currentUser.id);

    // 1. Listen for Booking Requests (For Driver)
    socketService.on('BOOKING_REQUESTED', (data: any) => {
      showToast('New booking request received! 🚕', 'info');
      // Potential: showModal to accept/reject immediately? 
      // For now, toast is enough, and MyRides will refresh.
    });

    // 2. Listen for Booking Accepted (For Passenger)
    socketService.on('BOOKING_ACCEPTED', (data: any) => {
      showModal({
        type: 'success',
        title: 'Booking Confirmed! 🎉',
        message: 'Your seat has been confirmed by the driver. You can view the details in My Bookings.',
        confirmText: 'View Details',
        onConfirm: () => navigationRef.current?.navigate('BookingHistory'),
      });
    });

    // 3. Listen for Booking Rejected
    socketService.on('BOOKING_REJECTED', (data: any) => {
      showToast('Booking request rejected ❌', 'error');
    });

    // 4. Listen for Ride Started (For Both)
    socketService.on('RIDE_STARTED', (data: any) => {
      showModal({
        type: 'info',
        title: 'Ride Started! 🚗',
        message: 'The driver has started the ride. Live tracking is now active.',
        confirmText: 'Join Ride Map',
        onConfirm: () => navigationRef.current?.navigate('RideTracking', { rideId: data.rideId }),
      });
    });

    // 5. Listen for Ride Completion
    socketService.on('RIDE_COMPLETED', (data: any) => {
      showToast('Ride completed! ⭐', 'success');
    });

    return () => {
      socketService.off('BOOKING_REQUESTED');
      socketService.off('BOOKING_ACCEPTED');
      socketService.off('BOOKING_REJECTED');
      socketService.off('RIDE_STARTED');
      socketService.off('RIDE_COMPLETED');
    };
  }, [currentUser?.id]);

  return null;
}
