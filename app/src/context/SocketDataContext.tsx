import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bookingsApi, ridesApi, scheduleRequestsApi } from '../services/api';

const DRIVER_CITY_KEY = 'driver_selected_city';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoadState {
  loading: boolean;
  loaded: boolean;
}

interface SocketDataState {
  // ── Passenger ──────────────────────────────────────────────────────────────
  myBookings:       any[];
  myBookingsState:  LoadState;
  myRequests:       any[];
  myRequestsState:  LoadState;

  // ── All Available Rides (Passenger search feed) ────────────────────────────
  availableRides:      any[];
  availableRidesState: LoadState;

  // ── Driver ─────────────────────────────────────────────────────────────────
  myRides:           any[];
  myRidesState:      LoadState;
  openRequests:      any[];
  openRequestsState: LoadState;
  driverCity:        string;
  setDriverCity:     (city: string) => void;

  // ── Loaders (called by screens on first mount) ────────────────────────────
  loadMyBookings:    (force?: boolean) => Promise<void>;
  loadMyRequests:    (force?: boolean) => Promise<void>;
  loadMyRides:       (force?: boolean) => Promise<void>;
  loadOpenRequests:  (force?: boolean, city?: string) => Promise<void>;
  loadAvailableRides:(page?: number, limit?: number) => Promise<void>;

  // ── Patch functions (called by SocketListener on events) ──────────────────
  patchBooking:         (bookingId: string, patch: any) => void;
  removeBooking:        (bookingId: string) => void;
  addBooking:           (booking: any) => void;
  patchRideInBookings:  (rideId: string, patch: any) => void;

  patchRide:            (rideId: string, patch: any) => void;
  removeRide:           (rideId: string) => void;
  addRide:              (ride: any) => void;
  patchBookingInRide:   (rideId: string, bookingId: string, patch: any) => void;

  patchRequest:         (requestId: string, patch: any) => void;
  removeRequest:        (requestId: string) => void;
  upsertBidInRequest:   (requestId: string, bid: any) => void;
  removeBidFromRequest: (requestId: string, bidId: string) => void;

  patchOpenRequest:     (requestId: string, patch: any) => void;
  removeOpenRequest:    (requestId: string) => void;
  addOpenRequest:       (request: any) => void;
  patchBidInOpenRequest:(requestId: string, bidPatch: Partial<any> & { id: string }) => void;
  upsertOwnBid:         (requestId: string, bid: any) => void;

  addAvailableRide:     (ride: any) => void;
  patchAvailableRide:   (rideId: string, patch: any) => void;
  removeAvailableRide:  (rideId: string) => void;

  // ── Reset (on logout) ─────────────────────────────────────────────────────
  resetAll: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const INIT_LOAD: LoadState = { loading: false, loaded: false };

function normalizeBooking(b: any) {
  if (!b?.ride) return b;
  return {
    ...b,
    ride: { ...b.ride, from: b.ride.fromCity || b.ride.from, to: b.ride.toCity || b.ride.to },
  };
}

function normalizeRide(r: any) {
  return { ...r, from: r.fromCity || r.from, to: r.toCity || r.to };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SocketDataContext = createContext<SocketDataState | null>(null);

export const SocketDataProvider = ({ children }: { children: React.ReactNode }) => {

  // ── State ──────────────────────────────────────────────────────────────────
  const [myBookings,        setMyBookings]        = useState<any[]>([]);
  const [myBookingsState,   setMyBookingsState]   = useState<LoadState>(INIT_LOAD);
  const [myRequests,        setMyRequests]        = useState<any[]>([]);
  const [myRequestsState,   setMyRequestsState]   = useState<LoadState>(INIT_LOAD);
  const [myRides,           setMyRides]           = useState<any[]>([]);
  const [myRidesState,      setMyRidesState]      = useState<LoadState>(INIT_LOAD);
  const [openRequests,      setOpenRequests]      = useState<any[]>([]);
  const [openRequestsState, setOpenRequestsState] = useState<LoadState>(INIT_LOAD);
  const [availableRides,    setAvailableRides]    = useState<any[]>([]);
  const [availableRidesState, setAvailableRidesState] = useState<LoadState>(INIT_LOAD);
  const [driverCity,        setDriverCityState]   = useState<string>('');

  // Prevent concurrent loads
  const loadingRef   = useRef({ bookings: false, requests: false, rides: false, openRequests: false });
  const driverCityRef = useRef('');

  // Load persisted city on mount
  useEffect(() => {
    AsyncStorage.getItem(DRIVER_CITY_KEY).then(city => {
      if (city) { setDriverCityState(city); driverCityRef.current = city; }
    });
  }, []);

  const setDriverCity = useCallback((city: string) => {
    setDriverCityState(city);
    driverCityRef.current = city;
    AsyncStorage.setItem(DRIVER_CITY_KEY, city);
  }, []);

  // ── Loaders ───────────────────────────────────────────────────────────────

  const loadMyBookings = useCallback(async (force = false) => {
    if (loadingRef.current.bookings) return;
    loadingRef.current.bookings = true;
    setMyBookingsState(s => ({ ...s, loading: true }));
    try {
      const { data } = await bookingsApi.myBookings(1, 50);
      const all: any[] = (data?.data?.data ?? data?.data ?? []).map(normalizeBooking);
      const active = all.filter(b =>
        b.status === 'PENDING' ||
        b.status === 'CONFIRMED' ||
        (b.status === 'CONFIRMED' && b.ride?.status === 'IN_PROGRESS')
      );
      setMyBookings(active);
      setMyBookingsState({ loading: false, loaded: true });
    } catch {
      setMyBookingsState(s => ({ ...s, loading: false }));
    } finally {
      loadingRef.current.bookings = false;
    }
  }, []);

  const loadMyRequests = useCallback(async (force = false) => {
    if (force) loadingRef.current.requests = false; // clear stuck guard on forced reload
    if (loadingRef.current.requests) return;
    loadingRef.current.requests = true;
    setMyRequestsState(s => ({ ...s, loading: true }));
    try {
      const { data } = await scheduleRequestsApi.getMine();
      setMyRequests(data?.data ?? []);
      setMyRequestsState({ loading: false, loaded: true });
    } catch (e) {
      console.warn('[SocketData] loadMyRequests failed:', e);
      setMyRequestsState({ loading: false, loaded: true }); // mark loaded so empty state shows
    } finally {
      loadingRef.current.requests = false;
    }
  }, []);

  const loadMyRides = useCallback(async (force = false) => {
    if (loadingRef.current.rides) return;
    loadingRef.current.rides = true;
    setMyRidesState(s => ({ ...s, loading: true }));
    try {
      const { data } = await ridesApi.myRides(1, 50);
      setMyRides((data?.data ?? []).map(normalizeRide));
      setMyRidesState({ loading: false, loaded: true });
    } catch {
      setMyRidesState(s => ({ ...s, loading: false }));
    } finally {
      loadingRef.current.rides = false;
    }
  }, []);

  const loadOpenRequests = useCallback(async (force = false, city?: string) => {
    if (loadingRef.current.openRequests) return;
    loadingRef.current.openRequests = true;
    setOpenRequestsState(s => ({ ...s, loading: true }));
    try {
      const selectedCity = city ?? driverCityRef.current;
      const { data } = await scheduleRequestsApi.getOpen(selectedCity || undefined);
      setOpenRequests(data?.data ?? []);
      setOpenRequestsState({ loading: false, loaded: true });
    } catch {
      setOpenRequestsState(s => ({ ...s, loading: false }));
    } finally {
      loadingRef.current.openRequests = false;
    }
  }, []);

  const loadAvailableRides = useCallback(async (page = 1, limit = 50) => {
    if (loadingRef.current.openRequests) return; // shared loading ref for simplicity or add specific one
    setAvailableRidesState(s => ({ ...s, loading: true }));
    try {
      const { data } = await ridesApi.getAll(page, limit);
      const normalized = (data?.data?.data ?? data?.data ?? []).map(normalizeRide);
      setAvailableRides(normalized);
      setAvailableRidesState({ loading: false, loaded: true });
    } catch (e) {
      console.warn('[SocketData] loadAvailableRides failed:', e);
      setAvailableRidesState(s => ({ ...s, loading: false }));
    }
  }, []);

  // ── Booking patch functions ───────────────────────────────────────────────

  const patchBooking = useCallback((bookingId: string, patch: any) => {
    setMyBookings(prev => prev.map(b => b.id === bookingId ? { ...b, ...patch } : b));
  }, []);

  const removeBooking = useCallback((bookingId: string) => {
    setMyBookings(prev => prev.filter(b => b.id !== bookingId));
  }, []);

  const addBooking = useCallback((booking: any) => {
    setMyBookings(prev => {
      if (prev.find(b => b.id === booking.id)) return prev;
      return [normalizeBooking(booking), ...prev];
    });
  }, []);

  // When a ride's status changes (started/cancelled) update all bookings on that ride
  const patchRideInBookings = useCallback((rideId: string, patch: any) => {
    setMyBookings(prev => prev.map(b =>
      b.rideId === rideId || b.ride?.id === rideId
        ? { ...b, ride: { ...b.ride, ...patch } }
        : b
    ));
  }, []);

  // ── Ride patch functions ──────────────────────────────────────────────────

  const patchRide = useCallback((rideId: string, patch: any) => {
    setMyRides(prev => prev.map(r => r.id === rideId ? { ...r, ...patch } : r));
  }, []);

  const removeRide = useCallback((rideId: string) => {
    setMyRides(prev => prev.filter(r => r.id !== rideId));
  }, []);

  const addRide = useCallback((ride: any) => {
    setMyRides(prev => {
      if (prev.find(r => r.id === ride.id)) return prev;
      return [normalizeRide(ride), ...prev];
    });
  }, []);

  // When a booking changes within a ride (accept/reject/cancel/new) update the ride's bookings[]
  const patchBookingInRide = useCallback((rideId: string, bookingId: string, patch: any) => {
    setMyRides(prev => prev.map(r => {
      if (r.id !== rideId) return r;
      
      const existingBookings = r.bookings || [];
      const index = existingBookings.findIndex((b: any) => b.id === bookingId);
      let updatedBookings = [...existingBookings];

      if (index > -1) {
        updatedBookings[index] = { ...updatedBookings[index], ...patch };
      } else {
        // New booking requested! Add it to the top.
        updatedBookings = [normalizeBooking({ ...patch, id: bookingId }), ...updatedBookings];
      }

      // Re-calculate bookedSeats from confirmed bookings
      const bookedSeats = updatedBookings
        .filter((b: any) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
        .reduce((sum: number, b: any) => sum + (b.seats || 1), 0);

      return {
        ...r,
        bookings: updatedBookings,
        bookedSeats,
      };
    }));
  }, []);

  // ── Schedule request patch functions ─────────────────────────────────────

  const patchRequest = useCallback((requestId: string, patch: any) => {
    setMyRequests(prev => prev.map(r => r.id === requestId ? { ...r, ...patch } : r));
  }, []);

  const removeRequest = useCallback((requestId: string) => {
    setMyRequests(prev => prev.filter(r => r.id !== requestId));
  }, []);

  const upsertBidInRequest = useCallback((requestId: string, bid: any) => {
    setMyRequests(prev => prev.map(req => {
      if (req.id !== requestId) return req;
      const filtered = (req.bids || []).filter((b: any) => b.id !== bid.id);
      return { ...req, bids: [...filtered, bid] };
    }));
  }, []);

  const removeBidFromRequest = useCallback((requestId: string, bidId: string) => {
    setMyRequests(prev => prev.map(req => {
      if (req.id !== requestId) return req;
      return { ...req, bids: (req.bids || []).filter((b: any) => b.id !== bidId) };
    }));
  }, []);

  // ── Open requests patch functions (driver feed) ───────────────────────────

  const patchOpenRequest = useCallback((requestId: string, patch: any) => {
    setOpenRequests(prev => prev.map(r => r.id === requestId ? { ...r, ...patch } : r));
  }, []);

  const removeOpenRequest = useCallback((requestId: string) => {
    setOpenRequests(prev => prev.filter(r => r.id !== requestId));
  }, []);

  const addOpenRequest = useCallback((request: any) => {
    setOpenRequests(prev => {
      if (prev.find(r => r.id === request.id)) return prev;
      // Only add if no city selected OR request fromCity matches driver's selected city
      const city = driverCityRef.current;
      if (city && request.fromCity !== city) return prev;
      return [{ ...request, bids: request.bids || [] }, ...prev];
    });
  }, []);

  const patchBidInOpenRequest = useCallback((requestId: string, bidPatch: Partial<any> & { id: string }) => {
    setOpenRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        bids: (r.bids || []).map((b: any) => b.id === bidPatch.id ? { ...b, ...bidPatch } : b),
      };
    }));
  }, []);

  // Upsert driver's own bid in the open-requests list (after BID_PLACED)
  const upsertOwnBid = useCallback((requestId: string, bid: any) => {
    setOpenRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      const otherBids = (r.bids || []).filter((b: any) => b.id !== bid.id && b.status !== 'PENDING');
      return { ...r, bids: [...otherBids, bid] };
    }));
  }, []);

  // ── Available Rides (Public Feed) ──────────────────────────────────────────

  const addAvailableRide = useCallback((ride: any) => {
    setAvailableRides(prev => {
      if (prev.find(r => r.id === ride.id)) return prev;
      return [normalizeRide(ride), ...prev];
    });
  }, []);

  const patchAvailableRide = useCallback((rideId: string, patch: any) => {
    setAvailableRides(prev => prev.map(r => r.id === rideId ? { ...r, ...patch } : r));
  }, []);

  const removeAvailableRide = useCallback((rideId: string) => {
    setAvailableRides(prev => prev.filter(r => r.id !== rideId));
  }, []);

  // ── Reset ─────────────────────────────────────────────────────────────────

  const resetAll = useCallback(() => {
    setMyBookings([]);
    setMyBookingsState(INIT_LOAD);
    setMyRequests([]);
    setMyRequestsState(INIT_LOAD);
    setMyRides([]);
    setMyRidesState(INIT_LOAD);
    setOpenRequests([]);
    setOpenRequestsState(INIT_LOAD);
    loadingRef.current = { bookings: false, requests: false, rides: false, openRequests: false };
    // Keep driverCity on logout — driver's city preference should persist
  }, []);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <SocketDataContext.Provider value={{
      myBookings, myBookingsState,
      myRequests, myRequestsState,
      myRides,    myRidesState,
      openRequests, openRequestsState,
      availableRides, availableRidesState,
      driverCity, setDriverCity,

      loadMyBookings, loadMyRequests, loadMyRides, loadOpenRequests, loadAvailableRides,

      patchBooking, removeBooking, addBooking, patchRideInBookings,
      patchRide, removeRide, addRide, patchBookingInRide,
      patchRequest, removeRequest, upsertBidInRequest, removeBidFromRequest,
      patchOpenRequest, removeOpenRequest, addOpenRequest, patchBidInOpenRequest, upsertOwnBid,
      addAvailableRide, patchAvailableRide, removeAvailableRide,

      resetAll,
    }}>
      {children}
    </SocketDataContext.Provider>
  );
};

export const useSocketData = () => {
  const ctx = useContext(SocketDataContext);
  if (!ctx) throw new Error('useSocketData must be used inside SocketDataProvider');
  return ctx;
};
