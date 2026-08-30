// Lightweight client-side id — good enough to tag two related records (e.g.
// a round-trip's outbound + return leg) so the UI can show them as a pair.
// Not a global uniqueness guarantee (no crypto), but collision odds are
// negligible for this use case (paired within one user's own records).
export function generateLocalId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
