// ─── SafariShare API Service ──────────────────────────────────────────────────
import AsyncStorage from '@react-native-async-storage/async-storage';

// For Android emulator use: 'http://10.0.2.2:5000/api/v1'
// For iOS simulator use:    'http://localhost:5000/api/v1'
// For physical device use:  'http://192.168.100.60:5000/api/v1'
export const BASE_URL = 'http://192.168.100.60:5000/api/v1';

const TOKEN_KEY   = '@safarishare_token';
const DEFAULT_TIMEOUT = 12000;

// ─── Token helpers ────────────────────────────────────────────────────────────
export const tokenStorage = {
  get:    ()      => AsyncStorage.getItem(TOKEN_KEY),
  set:    (token) => AsyncStorage.setItem(TOKEN_KEY, token),
  remove: ()      => AsyncStorage.removeItem(TOKEN_KEY),
};

// ─── Core request ─────────────────────────────────────────────────────────────
async function request(method, path, body = null) {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

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
    if (!res.ok) return { data: null, error: json.message || `Error ${res.status}` };
    return { data: json, error: null };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') return { data: null, error: 'Request timed out. Check your connection.' };
    return { data: null, error: err.message || 'Network error. Please try again.' };
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login:          (phone, password)        => request('POST', '/auth/login',           { phone, password }),
  register:       (userData)               => request('POST', '/auth/register',         userData),
  changePassword: (currentPassword, newPassword) =>
                                              request('POST', '/auth/change-password', { currentPassword, newPassword }),
  me:             ()                       => request('GET',  '/auth/me'),
};

// ─── Rides ───────────────────────────────────────────────────────────────────
export const ridesApi = {
  search:  (from, to, date) => request('GET', `/rides/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date || ''}`),
  getById: (rideId)         => request('GET', `/rides/${rideId}`),
  getAll:  ()               => request('GET', '/rides'),
  post:    (rideData)       => request('POST', '/rides', rideData),
  update:  (rideId, updates)=> request('PUT',  `/rides/${rideId}`, updates),
  cancel:  (rideId)         => request('DELETE', `/rides/${rideId}`),
  myRides: ()               => request('GET', '/rides/mine'),
};

// ─── Bookings ────────────────────────────────────────────────────────────────
export const bookingsApi = {
  book:       (rideId, seats) => request('POST',   '/bookings',            { rideId, seats }),
  cancel:     (bookingId)     => request('DELETE', `/bookings/${bookingId}`),
  myBookings: ()              => request('GET',    '/bookings/mine'),
  getById:    (bookingId)     => request('GET',    `/bookings/${bookingId}`),
};

// ─── Profile ─────────────────────────────────────────────────────────────────
export const profileApi = {
  get:            ()              => request('GET',  '/users/me'),
  update:         (updates)       => request('PUT',  '/users/me',              updates),
  updateFcmToken: (fcmToken)      => request('PUT',  '/users/me/fcm-token',    { fcmToken }),
};

// ─── Vehicles ────────────────────────────────────────────────────────────────
export const vehiclesApi = {
  register:   (vehicleData)        => request('POST',   '/vehicles',              vehicleData),
  update:     (vehicleId, updates) => request('PUT',    `/vehicles/${vehicleId}`,  updates),
  delete:     (vehicleId)          => request('DELETE', `/vehicles/${vehicleId}`),
  setActive:  (vehicleId)          => request('POST',   `/vehicles/${vehicleId}/activate`),
  myVehicles: ()                   => request('GET',    '/vehicles/mine'),
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll:     ()   => request('GET', '/notifications'),
  markRead:   (id) => request('PUT', `/notifications/${id}/read`),
  markAllRead: ()  => request('PUT', '/notifications/read-all'),
};

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const reviewsApi = {
  forDriver: (driverId)   => request('GET',  `/reviews?driverId=${driverId}`),
  submit:    (reviewData) => request('POST', '/reviews', reviewData),
};

// ─── CNIC Verification ───────────────────────────────────────────────────────
export const verificationApi = {
  submit: (cnicNumber, frontImage, backImage) =>
    request('POST', '/cnic', { cnicNumber, frontImage, backImage }),
  status: () => request('GET', '/cnic/status'),
};

// ─── Schedule Alerts ─────────────────────────────────────────────────────────
export const scheduleAlertsApi = {
  getAll: ()           => request('GET',    '/schedule-alerts'),
  create: (alertData)  => request('POST',   '/schedule-alerts', alertData),
  delete: (alertId)    => request('DELETE', `/schedule-alerts/${alertId}`),
};

// ─── Earnings ────────────────────────────────────────────────────────────────
export const earningsApi = {
  summary: (period) => request('GET', `/earnings?period=${period || 'all'}`),
};
