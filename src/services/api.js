// ─── SafariShare API Service ──────────────────────────────────────────────────
// Replace BASE_URL with your actual backend URL.
// All methods return { data, error } so callers don't need try/catch.

const BASE_URL = 'https://api.safarishare.pk/v1'; // change to your backend

const DEFAULT_TIMEOUT = 10000;

async function request(method, path, body = null) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      signal: controller.signal,
    };
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
  login:    (phone, password, role) => request('POST', '/auth/login',    { phone, password, role }),
  register: (userData)              => request('POST', '/auth/register', userData),
  logout:   ()                      => request('POST', '/auth/logout'),
};

// ─── Rides ───────────────────────────────────────────────────────────────────
export const ridesApi = {
  search:  (from, to, date)    => request('GET',  `/rides?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date || ''}`),
  getById: (rideId)            => request('GET',  `/rides/${rideId}`),
  post:    (rideData)          => request('POST', '/rides',          rideData),
  update:  (rideId, updates)   => request('PUT',  `/rides/${rideId}`, updates),
  cancel:  (rideId)            => request('DELETE', `/rides/${rideId}`),
  myRides: ()                  => request('GET',  '/rides/mine'),
};

// ─── Bookings ────────────────────────────────────────────────────────────────
export const bookingsApi = {
  book:       (rideId, seats)    => request('POST',   '/bookings',          { rideId, seats }),
  cancel:     (bookingId)        => request('DELETE', `/bookings/${bookingId}`),
  myBookings: ()                 => request('GET',    '/bookings/mine'),
  getById:    (bookingId)        => request('GET',    `/bookings/${bookingId}`),
};

// ─── Profile ─────────────────────────────────────────────────────────────────
export const profileApi = {
  get:            ()          => request('GET',  '/profile'),
  update:         (updates)   => request('PUT',  '/profile',          updates),
  changePassword: (current, next) => request('POST', '/profile/password', { currentPassword: current, newPassword: next }),
  uploadAvatar:   (formData)  => {
    // multipart/form-data upload — handled separately
    return request('POST', '/profile/avatar', formData);
  },
};

// ─── Vehicles ────────────────────────────────────────────────────────────────
export const vehiclesApi = {
  register:    (vehicleData)         => request('POST',   '/vehicles',             vehicleData),
  update:      (vehicleId, updates)  => request('PUT',    `/vehicles/${vehicleId}`, updates),
  delete:      (vehicleId)           => request('DELETE', `/vehicles/${vehicleId}`),
  setActive:   (vehicleId)           => request('POST',   `/vehicles/${vehicleId}/activate`),
  myVehicles:  ()                    => request('GET',    '/vehicles/mine'),
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll:   ()   => request('GET',  '/notifications'),
  markRead: (id) => request('PUT',  `/notifications/${id}/read`),
  markAllRead: () => request('PUT', '/notifications/read-all'),
};

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const reviewsApi = {
  forDriver: (driverId)    => request('GET',  `/reviews?driverId=${driverId}`),
  submit:    (reviewData)  => request('POST', '/reviews', reviewData),
};

// ─── CNIC Verification ───────────────────────────────────────────────────────
export const verificationApi = {
  submit: (cnicNumber, frontImage, backImage) =>
    request('POST', '/verification/cnic', { cnicNumber, frontImage, backImage }),
  status: () => request('GET', '/verification/status'),
};

// ─── Earnings ────────────────────────────────────────────────────────────────
export const earningsApi = {
  summary: (period) => request('GET', `/earnings?period=${period || 'all'}`),
};
