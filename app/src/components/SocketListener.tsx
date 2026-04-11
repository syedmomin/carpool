import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { socketService } from '../services/socket.service';
import { useGlobalModal } from '../context/GlobalModalContext';
import ReviewModal from './ReviewModal';
import { useState } from 'react';

/**
 * SocketListener: Handles global real-time notifications and navigation triggers.
 * Sits inside ToastProvider so it can show alerts.
 */
export default function SocketListener({ navigationRef }: { navigationRef: any }) {
  const { currentUser } = useApp();
  const { showToast } = useToast();
  const { showModal } = useGlobalModal();
  const [completedRide, setCompletedRide] = useState<any>(null);


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
        onConfirm: () => navigationRef.current?.navigate('PassengerApp', { 
          screen: 'BookingHistoryTab' 
        }),
      });
    });

    // 3. Listen for Booking Rejected
    socketService.on('BOOKING_REJECTED', (data: any) => {
      showToast('Booking request rejected ❌', 'error');
    });

    // 3b. Listen for Booking Cancelled (For Driver)
    socketService.on('BOOKING_CANCELLED', (data: any) => {
      showToast(`A booking for ${data.rideId.slice(-5)} was cancelled ❌`, 'error');
    });

    // 4. Listen for Ride Started (For Both Passenger and Driver)
    socketService.on('RIDE_STARTED', (data: any) => {
      showToast('Your ride has started! 🏁', 'success');
      
      // Automatic navigation for a professional 'Absolute Screen' experience
      if (currentUser?.role === 'PASSENGER') {
        navigationRef.current?.navigate('RideTracking', { rideId: data.rideId });
      }
    });


    // 5. Listen for Ride Completion
    socketService.on('RIDE_COMPLETED', (data: any) => {
      showToast('Ride completed! ⭐', 'success');
      
      // If user was a passenger in this ride, show rating modal
      if (currentUser?.role === 'PASSENGER') {
        setCompletedRide({
          ...data,
          targetRole: 'DRIVER'
        });
      }
    });


    return () => {
      socketService.off('BOOKING_REQUESTED');
      socketService.off('BOOKING_ACCEPTED');
      socketService.off('BOOKING_REJECTED');
      socketService.off('RIDE_STARTED');
      socketService.off('RIDE_COMPLETED');
    };
  }, [currentUser?.id]);

  return (
    <>
      <ReviewModal
        visible={!!completedRide}
        onClose={() => setCompletedRide(null)}
        rideId={completedRide?.rideId}
        revieweeId={completedRide?.driverId}
        revieweeName={completedRide?.driverName || 'the Driver'}
        targetRole="DRIVER"
        routeLabel={completedRide?.routeLabel}
      />
    </>
  );
}

