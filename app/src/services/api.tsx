// ─── ChalParo API Service ─────────────────────────────────────────────────────
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { decryptValue } from '../utils/secureStorage';
import { API_BASE_URL } from '../config/network';

export const BASE_URL = API_BASE_URL;

// Legacy AsyncStorage keys (XOR-obfuscated) — migrated to SecureStore on first read.
const TOKEN_KEY = '@chalparo_token';
const REFRESH_TOKEN_KEY = '@chalparo_refresh_token';
// SecureStore keys (alphanumeric/._- only — no '@').
const SEC_TOKEN = 'chalparo_token';
const SEC_REFRESH = 'chalparo_refresh_token';
const DEFAULT_TIMEOUT = 12000;

// SecureStore isn't available on web; fall back to AsyncStorage there (dev only).
const isWeb = Platform.OS === 'web';
const secureGet = (k: string) => isWeb ? AsyncStorage.getItem(k) : SecureStore.getItemAsync(k);
const secureSet = (k: string, v: string) => isWeb ? AsyncStorage.setItem(k, v) : SecureStore.setItemAsync(k, v);
const secureDel = (k: string) => isWeb ? AsyncStorage.removeItem(k) : SecureStore.deleteItemAsync(k);
const isJwt = (t: string | null) => !!t && t.split('.').length === 3;

// ─── Token helpers (stored in the OS keychain/keystore via SecureStore) ───────
export const tokenStorage = {
  get: async () => {
    let token = await secureGet(SEC_TOKEN);
    if (!token) {
      // One-time migration from the old XOR AsyncStorage store.
      const raw = await AsyncStorage.getItem(TOKEN_KEY);
      if (raw) {
        token = decryptValue(raw);
        if (isJwt(token)) await secureSet(SEC_TOKEN, token as string);
        await AsyncStorage.removeItem(TOKEN_KEY);
      }
    }
    if (!isJwt(token)) { await tokenStorage.remove(); return null; }
    return token;
  },
  set: async (token) => secureSet(SEC_TOKEN, token),
  remove: async () => { await secureDel(SEC_TOKEN); await AsyncStorage.removeItem(TOKEN_KEY); },

  getRefresh: async () => {
    let token = await secureGet(SEC_REFRESH);
    if (!token) {
      const raw = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (raw) {
        token = decryptValue(raw);
        if (isJwt(token)) await secureSet(SEC_REFRESH, token as string);
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    }
    // Reject garbage so we never POST junk to /auth/refresh.
    return isJwt(token) ? token : null;
  },
  setRefresh: async (token) => secureSet(SEC_REFRESH, token),
  removeRefresh: async () => { await secureDel(SEC_REFRESH); await AsyncStorage.removeItem(REFRESH_TOKEN_KEY); },

  clearAll: async () => {
    await secureDel(SEC_TOKEN);
    await secureDel(SEC_REFRESH);
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, '@chalparo_user', '@chalparo_role']);
  }
};

// ─── Event listener for forced logout (e.g. session expiry) ──────────────────
let onLogout = null;
export const setLogoutHandler = (handler) => { onLogout = handler; };

// ─── Token refresh mutex ──────────────────────────────────────────────────────
// Prevents concurrent 401 responses from all trying to refresh the token at once.
// First caller refreshes; all others wait and reuse the result.
let _refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const refreshToken = await tokenStorage.getRefresh();
      if (!refreshToken) return false;

      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const json = await res.json().catch(() => ({}));

      if (res.ok && json.data) {
        await tokenStorage.set(json.data.accessToken);
        await tokenStorage.setRefresh(json.data.refreshToken);
        // Notify socket service to reconnect with the new token
        try {
          const { socketService } = require('./socket.service');
          socketService.reconnectWithNewToken();
        } catch (_) {}
        return true;
      }
      return false;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

// ─── Parse error from response body ──────────────────────────────────────────
// Returns a human-readable string.
// If errors[] is present (validation), joins field messages.
// Otherwise falls back to message string.
function parseError(json, status) {
  if (!json || typeof json !== 'object') return `Error ${status}`;

  // Validation errors: [{field, message}]
  if (Array.isArray(json.errors) && json.errors.length > 0) {
    return json.errors.map((e) => `${e.field}: ${e.message}`).join('\n');
  }

  return json.message || `Error ${status}`;
}

// ─── Core request ─────────────────────────────────────────────────────────────
async function request(method, path, body = null, isRetry = false, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const token = await tokenStorage.get();
    const isFormData = body && typeof body === 'object' && typeof body.append === 'function';
    const headers = {
      Accept: 'application/json',
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const options = {
      method,
      headers,
      signal: controller.signal,
      ...(body ? { body: isFormData ? body : JSON.stringify(body) } : {}),
    };

    const res = await fetch(`${BASE_URL}${path}`, options);
    clearTimeout(timeoutId);

    const json = await res.json().catch(() => ({}));

    // ─── Handle token expiry (401) ───
    if (res.status === 401 && !isRetry && !path.includes('/auth/login') && !path.includes('/auth/refresh')) {
      const refreshed = await refreshAccessToken();
      if (refreshed) return request(method, path, body, true, timeout);

      // Refresh failed — force logout
      await tokenStorage.clearAll();
      if (onLogout) onLogout();
      return { data: null, error: 'SESSION_EXPIRED', errors: null };
    }

    if (!res.ok) {
      return { data: null, error: parseError(json, res.status), errors: json.errors ?? null };
    }

    return { data: json, error: null, errors: null };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError')
      return { data: null, error: 'Request timed out. Check your connection.', errors: null };
    return { data: null, error: err.message || 'Network error. Please try again.', errors: null };
  }
}

// ─── System / health ──────────────────────────────────────────────────────────
export const systemApi = {
  // Resolves with error: null when the backend is reachable (also confirms internet).
  health: () => request('GET', '/health'),
};

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (phone, password) => request('POST', '/auth/login', { phone, password }),
  register: (userData) => request('POST', '/auth/register', userData),
  changePassword: (currentPassword, newPassword) => request('POST', '/auth/change-password', { currentPassword, newPassword }),
  forgotPassword: (email) => request('POST', '/auth/forgot-password', { email }),
  resetPassword: (email, code, newPassword) => request('POST', '/auth/reset-password', { email, code, newPassword }),
  me: () => request('GET', '/auth/me'),
  logout: () => request('POST', '/auth/logout'),
  refresh: (refreshToken) => request('POST', '/auth/refresh', { refreshToken }),
};

// ─── Rides ───────────────────────────────────────────────────────────────────
export const ridesApi = {
  search: (from, to, date) => request('GET', `/rides/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date || ''}`),
  getById: (rideId) => request('GET', `/rides/${rideId}`),
  getMineById: (rideId) => request('GET', `/rides/mine/${rideId}`),
  getAll: (page = 1, limit = 10) => request('GET', `/rides?page=${page}&limit=${limit}`),
  post: (rideData) => request('POST', '/rides', rideData),
  update: (rideId, updates) => request('PUT', `/rides/${rideId}`, updates),
  cancel: (rideId) => request('PATCH', `/rides/${rideId}/cancel`),
  myRides: (page = 1, limit = 10) => request('GET', `/rides/mine?page=${page}&limit=${limit}`),
  updateStatus: (rideId, status) => request('PATCH', `/rides/${rideId}/status`, { status }),
  activeSession: () => request('GET', '/rides/active-session'),
};

// ─── Bookings ────────────────────────────────────────────────────────────────
export const bookingsApi = {
  book: (rideId, seats, boardingCity, exitCity, note, pickupLat?: number, pickupLng?: number, pickupAddress?: string, dropLat?: number, dropLng?: number, dropAddress?: string) =>
    request('POST', '/bookings', {
      rideId, seats,
      ...(boardingCity ? { boardingCity } : {}),
      ...(exitCity ? { exitCity } : {}),
      ...(note ? { note } : {}),
      ...(pickupLat != null && pickupLng != null ? { pickupLat, pickupLng } : {}),
      ...(pickupAddress ? { pickupAddress } : {}),
      ...(dropLat != null && dropLng != null ? { dropLat, dropLng } : {}),
      ...(dropAddress ? { dropAddress } : {}),
    }),
  cancel: (bookingId, reason) => request('DELETE', `/bookings/${bookingId}`, { reason }),
  accept: (bookingId) => request('POST', `/bookings/accept/${bookingId}`),
  addSeats: (bookingId, seats) => request('PATCH', `/bookings/${bookingId}/add-seats`, { seats }),
  reject: (bookingId) => request('POST', `/bookings/reject/${bookingId}`),
  myBookings: (page = 1, limit = 10) => request('GET', `/bookings/mine?page=${page}&limit=${limit}`),
  getById: (bookingId) => request('GET', `/bookings/${bookingId}`),
};

// ─── Profile ─────────────────────────────────────────────────────────────────
export const profileApi = {
  get: () => request('GET', '/users/me'),
  update: (updates) => request('PUT', '/users/me', updates),
  updateFcmToken: (fcmToken) => request('PUT', '/users/me/fcm-token', { fcmToken }),
  deleteAccount: () => request('DELETE', '/users/me'),
};

// ─── Reports (Report Suspicious Activity) ────────────────────────────────────
export const reportsApi = {
  create: (reportedUserId: string, reason: string, description?: string, rideId?: string) =>
    request('POST', '/reports', {
      reportedUserId, reason,
      ...(description ? { description } : {}),
      ...(rideId ? { rideId } : {}),
    }),
};

// ─── Vehicles ────────────────────────────────────────────────────────────────
export const vehiclesApi = {
  register: (vehicleData) => request('POST', '/vehicles', vehicleData, false, 30000),
  getById: (vehicleId) => request('GET', `/vehicles/${vehicleId}`),
  update: (vehicleId, updates) => request('PUT', `/vehicles/${vehicleId}`, updates, false, 30000),
  delete: (vehicleId) => request('DELETE', `/vehicles/${vehicleId}`),
  setActive: (vehicleId) => request('POST', `/vehicles/${vehicleId}/activate`),
  myVehicles: () => request('GET', '/vehicles/mine'),
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: (page = 1, limit = 20) => request('GET', `/notifications?page=${page}&limit=${limit}&sortOrder=desc`),
  markRead: (id) => request('PUT', `/notifications/${id}/read`),
  markAllRead: () => request('PUT', '/notifications/read-all'),
  delete: (id) => request('DELETE', `/notifications/${id}`),
};

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const reviewsApi = {
  forUser: (userId) => request('GET', `/reviews/user/${userId}`),
  myGiven: () => request('GET', '/reviews/mine/given'),
  submit: (reviewData) => request('POST', '/reviews', reviewData),
};


// ─── Verification ────────────────────────────────────────────────────────────
export const verificationApi = {
  submitCnic: (cnicNumber, frontImage, backImage, selfieImage, cnicName?: string) => request('POST', '/verification/cnic', { cnicNumber, frontImage, backImage, selfieImage, cnicName }),
  checkCnic: (cnicNumber: string, cnicName: string, frontImage: string) => request('POST', '/verification/cnic/check', { cnicNumber, cnicName, frontImage }),
  submitLicence: (licenceNumber: string, licenceImage: string) => request('POST', '/verification/licence', { licenceNumber, licenceImage }),
  status: () => request('GET', '/verification/status'),
};

// ─── Schedule Requests (Passenger ↔ Driver Bidding) ──────────────────────────
export const scheduleRequestsApi = {
  // Passenger
  create:        (data: { fromCity: string; toCity: string; date: string; departureTime: string; seats: number; note?: string; roundTripGroupId?: string; fromLat?: number; fromLng?: number; fromAddress?: string }) =>
                   request('POST', '/schedule-requests', data),
  getMine:       (page = 1, limit = 20) => request('GET', `/schedule-requests/mine?page=${page}&limit=${limit}`),
  cancel:        (requestId: string)    => request('DELETE', `/schedule-requests/${requestId}`),
  acceptBid:     (requestId: string, bidId: string) => request('PATCH', `/schedule-requests/${requestId}/bids/${bidId}/accept`),
  rejectBid:     (requestId: string, bidId: string) => request('PATCH', `/schedule-requests/${requestId}/bids/${bidId}/reject`),
  // Driver
  getOpen: (city?: string, page = 1, limit = 20) => {
    const p = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (city) p.set('city', city);
    return request('GET', `/schedule-requests?${p.toString()}`);
  },
  getMatchCount: (from: string, to: string, date?: string) =>
    request('GET', `/schedule-requests/match-count?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date || ''}`),
  placeBid:      (requestId: string, data: { pricePerSeat: number; vehicleId: string; departureTime: string; note?: string }) =>
    request('POST', `/schedule-requests/${requestId}/bids`, data),
  withdrawBid:   (requestId: string, bidId: string) => request('DELETE', `/schedule-requests/${requestId}/bids/${bidId}`),
};

// ─── Schedule Alerts ("notify me when a matching ride is posted") ───────────
export const scheduleAlertsApi = {
  getMine: () => request('GET', '/schedule-alerts'),
  create:  (data: { fromCity: string; toCity: string; date: string }) =>
             request('POST', '/schedule-alerts', data),
  remove:  (alertId: string) => request('DELETE', `/schedule-alerts/${alertId}`),
};

// ─── Earnings ────────────────────────────────────────────────────────────────
export const earningsApi = {
  summary: (period) => request('GET', `/earnings?period=${period || 'all'}`),
};

// ─── Chat ────────────────────────────────────────────────────────────────────
export const chatApi = {
  getHistory: (bookingId) => request('GET', `/chat/${bookingId}`),
  getConversations: () => request('GET', '/chat/conversations/mine'),
};


// ─── Tracking ────────────────────────────────────────────────────────────────
export const trackingApi = {
  getRoute: (rideId: string) => request('GET', `/tracking/route/${rideId}`),
  getLatestLocation: (rideId: string) => request('GET', `/tracking/location/${rideId}`),
};

// ─── Image Upload ─────────────────────────────────────────────────────────────
export const uploadApi = {
  image: async (uri, type = 'profile') => {
    try {
      const token = await tokenStorage.get();
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const ext = match ? match[1] : 'jpg';
      const mimeType = `image/${ext === 'png' ? 'png' : 'jpeg'}`;

      const formData = new FormData();
      const finalName = filename || `upload-${Date.now()}.${ext}`;

      if (Platform.OS === 'web') {
        // Web's FormData only accepts a string or a real Blob/File — the
        // native {uri, name, type} shape below throws "Unsupported
        // FormDataPart implementation" here, so fetch the picked uri
        // (blob:/data: on web) into an actual Blob first.
        const blob = await (await fetch(uri)).blob();
        formData.append('image', blob, finalName);
      } else {
        formData.append('image', {
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          name: finalName,
          type: mimeType,
        } as any);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      if (__DEV__) console.log(`📤 Uploading image: type=${type}`);

      const res = await fetch(`${BASE_URL}/upload/image?type=${type}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (__DEV__) console.error('❌ Upload Response Error:', json);
        return { data: null, error: parseError(json, res.status), errors: null };
      }

      if (__DEV__) console.log('✅ Upload Success');
      return { data: json, error: null, errors: null };
    } catch (err) {
      if (__DEV__) console.error('❌ Upload Catch Error:', err);
      return { data: null, error: err.message || 'Upload failed', errors: null };
    }
  },
};
