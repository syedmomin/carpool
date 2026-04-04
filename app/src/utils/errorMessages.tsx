// ─── User-Friendly Error Message Translator ───────────────────────────────────
// Converts backend/network error strings into readable messages for toasts

const ERROR_MAP = [
  // Auth
  { match: /phone.*already|already.*phone/i,             msg: 'This phone number is already registered. Please login.' },
  { match: /email.*already|already.*email/i,             msg: 'This email is already registered. Please login.' },
  { match: /invalid.*password|incorrect.*password|wrong.*password|password.*incorrect|Invalid credentials/i,
                                                          msg: 'Incorrect phone number or password.' },
  { match: /user not found|no user found|account not found/i,
                                                          msg: 'No account found with this phone number.' },
  { match: /unauthorized|invalid token|token.*expired|jwt/i,
                                                          msg: 'Your session has expired. Please login again.' },
  { match: /current password.*incorrect|wrong.*current password/i,
                                                          msg: 'Current password is incorrect.' },

  // Ride
  { match: /departure.*past|past.*time|time.*already passed|already passed/i,
                                                          msg: 'Departure time has already passed. Please select a future time.' },
  { match: /vehicle not found|register.*vehicle/i,       msg: 'No vehicle found. Please register a vehicle first.' },
  { match: /not enough seats|insufficient seats/i,       msg: 'Not enough seats available on this ride.' },
  { match: /already booked|duplicate booking/i,          msg: 'You have already booked this ride.' },
  { match: /ride.*not found|no ride/i,                   msg: 'Ride not found. It may have been cancelled.' },

  // Vehicle
  { match: /plate number already|vehicle.*plate.*exists/i,
                                                          msg: 'A vehicle with this number plate is already registered.' },
  { match: /cannot delete.*active|active.*rides.*delete/i,
                                                          msg: 'This vehicle has active rides. Cancel or complete them first.' },
  { match: /not your vehicle/i,                          msg: 'You do not have permission to modify this vehicle.' },

  // Booking
  { match: /booking not found/i,                         msg: 'Booking not found or already cancelled.' },
  { match: /cannot cancel.*completed|already completed/i,
                                                          msg: 'This booking cannot be cancelled as it is already completed.' },

  // Network/Server
  { match: /timed out|timeout/i,                         msg: 'Request timed out. Please check your connection.' },
  { match: /network error|failed to fetch|no internet/i, msg: 'Network error. Please check your internet connection.' },
  { match: /internal server error|500/i,                 msg: 'Something went wrong on our end. Please try again.' },

  // Validation (Prisma/Zod leakage)
  { match: /unique constraint|already exists/i,          msg: 'This information is already in use. Please try different details.' },
  { match: /foreign key constraint/i,                    msg: 'This record is linked to other data and cannot be modified.' },
  { match: /prisma|p2002|p2025/i,                        msg: 'A database error occurred. Please try again.' },
];

/**
 * Converts a raw API/network error string into a user-friendly message.
 * Falls back to the original message if it's already readable.
 */
export function parseApiError(error) {
  if (!error) return 'Something went wrong. Please try again.';

  const str = String(error);

  for (const { match, msg } of ERROR_MAP) {
    if (match.test(str)) return msg;
  }

  // Return original if it looks already user-readable (short, no tech jargon)
  if (str.length < 160 && !/\bat\b|stack|prisma|Error:/i.test(str)) {
    return str;
  }

  return 'Something went wrong. Please try again.';
}
