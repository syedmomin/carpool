/**
 * Tiny module-level bridge so non-React code (e.g. the FCM foreground handler in
 * notifications.tsx) can trigger the in-app banner that lives inside React.
 * BannerProvider registers its showBanner here on mount.
 */
export interface BannerPayload {
  title:    string;
  message?: string;
  kind?:    string;            // NotificationKind / NotificationType
  rideId?:  string;
  bookingId?: string;
  onPress?: () => void;
}

type ShowFn = (payload: BannerPayload) => void;

let _show: ShowFn | null = null;

export function registerBanner(fn: ShowFn | null) {
  _show = fn;
}

export function showGlobalBanner(payload: BannerPayload) {
  _show?.(payload);
}
