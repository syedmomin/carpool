// ─── ChalParo API Service ─────────────────────────────────────────────────────
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptValue, decryptValue } from '../utils/secureStorage';

export const BASE_URL = 'https://app-server-liard-one.vercel.app/api/v1';

const TOKEN_KEY = '@chalparo_token';
const DEFAULT_TIMEOUT = 12000;

// ─── Token helpers (encrypted) ────────────────────────────────────────────────
export const tokenStorage = {
  get: async () => AsyncStorage.getItem(TOKEN_KEY).then((raw) => raw && decryptValue(raw)),
  set: async (token) => AsyncStorage.setItem(TOKEN_KEY, encryptValue(token)),
  remove: async () => AsyncStorage.removeItem(TOKEN_KEY),
};

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
async function request(method, path, body = null) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const token = await tokenStorage.get();
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const options = { method, headers, signal: controller.signal };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${path}`, options);
    clearTimeout(timeoutId);

    const json = await res.json().catch(() => ({}));

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
};

// ─── Bookings ────────────────────────────────────────────────────────────────
export const bookingsApi = {
  book: (rideId, seats, boardingCity, exitCity) =>
    request('POST', '/bookings', {
      rideId, seats,
      ...(boardingCity ? { boardingCity } : {}),
      ...(exitCity ? { exitCity } : {}),
    }),
  cancel: (bookingId) => request('DELETE', `/bookings/${bookingId}`),
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
    const token = await tokenStorage.get();
    const filename = uri.split('/').pop();
    const mimeType = filename?.endsWith('.png') ? 'image/png' : 'image/jpeg';

    const form = new FormData();
    form.append('image', { uri, name: filename, type: mimeType });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(`${BASE_URL}/upload/image?type=${type}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return { data: null, error: parseError(json, res.status), errors: null };
      return { data: json, error: null, errors: null };
    } catch (err) {
      clearTimeout(timeoutId);
      return { data: null, error: err.message || 'Upload failed', errors: null };
    }
  },
};
