import { COLORS, GRADIENTS } from '../components/theme';

/**
 * Single source of truth for notification visuals (icon + colors) keyed by the
 * server NotificationType enum (notificationDispatcher.ts) plus a few banner-only
 * semantic kinds. Used by both the in-app NotificationBanner and the
 * NotificationsScreen inbox so the two always look consistent.
 */
export type NotificationKind =
  | 'BOOKING' | 'RIDE' | 'NEW_RIDE' | 'RIDE_STARTED' | 'RIDE_COMPLETED'
  | 'RIDE_CANCELLED' | 'RIDE_EXPIRED' | 'SCHEDULE_REQUEST' | 'RIDE_BID'
  | 'BID_ACCEPTED' | 'BID_REJECTED' | 'REMINDER' | 'SYSTEM' | 'default';

export interface NotificationStyle {
  icon:     string;            // Ionicons name
  color:    string;            // accent / icon color
  bg:       string;            // soft icon background
  gradient: readonly string[]; // accent bar / action button gradient
}

const STYLES: Record<NotificationKind, NotificationStyle> = {
  BOOKING:          { icon: 'checkmark-circle',      color: COLORS.secondary, bg: '#e8f5e9',          gradient: GRADIENTS.secondary },
  NEW_RIDE:         { icon: 'car-sport',             color: COLORS.teal,      bg: COLORS.tealLight,   gradient: GRADIENTS.teal },
  RIDE:             { icon: 'car',                   color: COLORS.teal,      bg: COLORS.tealLight,   gradient: GRADIENTS.teal },
  RIDE_STARTED:     { icon: 'navigate-circle',       color: COLORS.primary,   bg: COLORS.primaryLight, gradient: GRADIENTS.primary },
  RIDE_COMPLETED:   { icon: 'flag',                  color: COLORS.secondary, bg: '#e8f5e9',          gradient: GRADIENTS.secondary },
  RIDE_CANCELLED:   { icon: 'close-circle',          color: COLORS.danger,    bg: COLORS.dangerLight, gradient: ['#e53935', '#c62828'] },
  RIDE_EXPIRED:     { icon: 'time',                  color: COLORS.gray,      bg: COLORS.lightGray,   gradient: ['#9ca3af', '#6b7280'] },
  SCHEDULE_REQUEST: { icon: 'person-add',            color: COLORS.primary,   bg: COLORS.primaryLight, gradient: GRADIENTS.primary },
  RIDE_BID:         { icon: 'cash',                  color: COLORS.accent,    bg: COLORS.warningLight, gradient: GRADIENTS.accent },
  BID_ACCEPTED:     { icon: 'checkmark-done-circle', color: COLORS.secondary, bg: '#e8f5e9',          gradient: GRADIENTS.secondary },
  BID_REJECTED:     { icon: 'close-circle',          color: COLORS.danger,    bg: COLORS.dangerLight, gradient: ['#e53935', '#c62828'] },
  REMINDER:         { icon: 'alarm',                 color: COLORS.accent,    bg: COLORS.warningLight, gradient: GRADIENTS.accent },
  SYSTEM:           { icon: 'notifications',         color: COLORS.gray,      bg: COLORS.lightGray,   gradient: GRADIENTS.primary },
  default:          { icon: 'notifications',         color: COLORS.gray,      bg: COLORS.lightGray,   gradient: GRADIENTS.primary },
};

export function getNotificationStyle(kind?: string): NotificationStyle {
  return STYLES[(kind as NotificationKind)] || STYLES.default;
}

/**
 * Maps a socket event name (used by SocketListener) to a NotificationKind so the
 * banner picks the right visual even though socket events ≠ notification types.
 */
export function kindFromSocketEvent(event: string): NotificationKind {
  switch (event) {
    case 'RIDE_STARTED':      return 'RIDE_STARTED';
    case 'RIDE_COMPLETED':    return 'RIDE_COMPLETED';
    case 'RIDE_CANCELLED':    return 'RIDE_CANCELLED';
    case 'RIDE_EXPIRED':      return 'RIDE_EXPIRED';
    case 'NEW_RIDE':          return 'NEW_RIDE';
    case 'BOOKING_REQUESTED':
    case 'BOOKING_ACCEPTED':
    case 'BOOKING_REJECTED':
    case 'BOOKING_CANCELLED': return 'BOOKING';
    case 'SCHEDULE_REQUEST':  return 'SCHEDULE_REQUEST';
    case 'RIDE_BID':          return 'RIDE_BID';
    case 'BID_ACCEPTED':      return 'BID_ACCEPTED';
    case 'BID_REJECTED':      return 'BID_REJECTED';
    case 'REQUEST_ACCEPTED':  return 'BOOKING';
    case 'REQUEST_EXPIRED':   return 'RIDE_EXPIRED';
    default:                  return 'default';
  }
}

/** Maps a notification kind/type to an in-app navigation target for tap deep-linking. */
export function targetForKind(kind: string, role?: string): { screen: string; tab?: string } | null {
  switch (kind) {
    case 'BOOKING':
      return role === 'DRIVER' ? { screen: 'RideBookings' } : { screen: 'BookingHistory' };
    case 'RIDE':
    case 'RIDE_STARTED':
    case 'RIDE_COMPLETED':
    case 'RIDE_CANCELLED':
    case 'RIDE_EXPIRED':
      return role === 'DRIVER' ? { screen: 'MyRides' } : { screen: 'RideDetail' };
    case 'NEW_RIDE':
      return { screen: 'RideDetail' };
    case 'SCHEDULE_REQUEST':
    case 'RIDE_BID':
    case 'BID_ACCEPTED':
    case 'BID_REJECTED':
      return { screen: 'Notifications' };
    default:
      return { screen: 'Notifications' };
  }
}
