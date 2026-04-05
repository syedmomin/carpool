// ─── ChalParo API Service ─────────────────────────────────────────────────────
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptValue, decryptValue } from '../utils/secureStorage';

export const BASE_URL = 'https://app-server-liard-one.vercel.app/api/v1';
// export const BASE_URL = 'http://localhost:5000/api/v1';

const TOKEN_KEY = '@chalparo_token';
const REFRESH_TOKEN_KEY = '@chalparo_refresh_token';
const DEFAULT_TIMEOUT = 12000;

// ─── Token helpers (encrypted) ────────────────────────────────────────────────
export const tokenStorage = {
  get: async () => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    // JWT must have 3 parts. If it doesn't, it was corrupted by legacy encryption
    if (token.split('.').length !== 3) {
      await tokenStorage.remove();
      return null;
    }
    return token;
  },
  set: async (token) => AsyncStorage.setItem(TOKEN_KEY, token),
  remove: async () => AsyncStorage.removeItem(TOKEN_KEY),

  getRefresh: async () => AsyncStorage.getItem(REFRESH_TOKEN_KEY),
  setRefresh: async (token) => AsyncStorage.setItem(REFRESH_TOKEN_KEY, token),
  removeRefresh: async () => AsyncStorage.removeItem(REFRESH_TOKEN_KEY),

  clearAll: async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    // These keys are matched with AppContext storage
    await AsyncStorage.removeItem('@chalparo_user');
    await AsyncStorage.removeItem('@chalparo_role');
  }
};

// ─── Event listener for forced logout (e.g. session expiry) ──────────────────
let onLogout = null;
export const setLogoutHandler = (handler) => { onLogout = handler; };

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
async function request(method, path, body = null, isRetry = false) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

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
      const refreshToken = await tokenStorage.getRefresh();
      if (refreshToken) {
        // Attempt to refresh
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        const refreshJson = await refreshRes.json().catch(() => ({}));

        if (refreshRes.ok && refreshJson.data) {
          const { accessToken, refreshToken: newRefresh } = refreshJson.data;
          await tokenStorage.set(accessToken);
          await tokenStorage.setRefresh(newRefresh);

          // Retry the original request
          return request(method, path, body, true);
        }
      }

      // If no refresh token or refresh failed: logout
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

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (phone, password) => request('POST', '/auth/login', { phone, password }),
  register: (userData) => request('POST', '/auth/register', userData),
  changePassword: (currentPassword, newPassword) => request('POST', '/auth/change-password', { currentPassword, newPassword }),
  me: () => request('GET', '/auth/me'),
};

// ─── Rides ───────────────────────────────────────────────────────────────────
export const ridesApi = {
  search: (from, to, date) => request('GET', `/rides/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date || ''}`),
  getById: (rideId) => request('GET', `/rides/${rideId}`),
  getAll: (page = 1, limit = 10) => request('GET', `/rides?page=${page}&limit=${limit}`),
  post: (rideData) => request('POST', '/rides', rideData),
  update: (rideId, updates) => request('PUT', `/rides/${rideId}`, updates),
  cancel: (rideId) => request('DELETE', `/rides/${rideId}`),
  myRides: (page = 1, limit = 10) => request('GET', `/rides/mine?page=${page}&limit=${limit}`),
  updateStatus: (rideId, status) => request('PATCH', `/rides/${rideId}/status`, { status }),
  activeSession: () => request('GET', '/rides/active-session'),
};

// ─── Bookings ────────────────────────────────────────────────────────────────
export const bookingsApi = {
  book: (rideId, seats, boardingCity, exitCity) =>
    request('POST', '/bookings', {
      rideId, seats,
      ...(boardingCity ? { boardingCity } : {}),
      ...(exitCity ? { exitCity } : {}),
    }),
  cancel: (bookingId, reason) => request('DELETE', `/bookings/${bookingId}`, { reason }),
  accept: (bookingId) => request('POST', `/bookings/accept/${bookingId}`),
  reject: (bookingId) => request('POST', `/bookings/reject/${bookingId}`),
  myBookings: (page = 1, limit = 10) => request('GET', `/bookings/mine?page=${page}&limit=${limit}`),
  getById: (bookingId) => request('GET', `/bookings/${bookingId}`),
};

// ─── Profile ─────────────────────────────────────────────────────────────────
export const profileApi = {
  get: () => request('GET', '/users/me'),
  update: (updates) => request('PUT', '/users/me', updates),
  updateFcmToken: (fcmToken) => request('PUT', '/users/me/fcm-token', { fcmToken }),
};

// ─── Vehicles ────────────────────────────────────────────────────────────────
export const vehiclesApi = {
  register: (vehicleData) => request('POST', '/vehicles', vehicleData),
  getById: (vehicleId) => request('GET', `/vehicles/${vehicleId}`),
  update: (vehicleId, updates) => request('PUT', `/vehicles/${vehicleId}`, updates),
  delete: (vehicleId) => request('DELETE', `/vehicles/${vehicleId}`),
  setActive: (vehicleId) => request('POST', `/vehicles/${vehicleId}/activate`),
  myVehicles: () => request('GET', '/vehicles/mine'),
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: (page = 1, limit = 20) => request('GET', `/notifications?page=${page}&limit=${limit}`),
  markRead: (id) => request('PUT', `/notifications/${id}/read`),
  markAllRead: () => request('PUT', '/notifications/read-all'),
};

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const reviewsApi = {
  forDriver: (driverId) => request('GET', `/reviews?driverId=${driverId}`),
  submit: (reviewData) => request('POST', '/reviews', reviewData),
};

// ─── Verification ────────────────────────────────────────────────────────────
export const verificationApi = {
  submitCnic: (cnicNumber, frontImage, backImage) => request('POST', '/verification/cnic', { cnicNumber, frontImage, backImage }),
  submitLicence: (licenceImage) => request('POST', '/verification/licence', { licenceImage }),
  status: () => request('GET', '/verification/status'),
};

// ─── Schedule Alerts ─────────────────────────────────────────────────────────
export const scheduleAlertsApi = {
  getAll: () => request('GET', '/schedule-alerts'),
  create: (alertData) => request('POST', '/schedule-alerts', alertData),
  delete: (alertId) => request('DELETE', `/schedule-alerts/${alertId}`),
};

// ─── Earnings ────────────────────────────────────────────────────────────────
export const earningsApi = {
  summary: (period) => request('GET', `/earnings?period=${period || 'all'}`),
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
      formData.append('image', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: filename || `upload-${Date.now()}.${ext}`,
        type: mimeType,
      } as any);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      console.log(`📤 Uploading image: ${uri} (${mimeType}) to ${BASE_URL}/upload/image?type=${type}`);

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
        console.error('❌ Upload Response Error:', json);
        return { data: null, error: parseError(json, res.status), errors: null };
      }

      console.log('✅ Upload Success:', json);
      return { data: json, error: null, errors: null };
    } catch (err) {
      console.error('❌ Upload Catch Error:', err);
      return { data: null, error: err.message || 'Upload failed', errors: null };
    }
  },
};
