// Straight-line (haversine) distance in km — a free, offline fallback for
// when the road-route service (OpenRouteService) isn't configured or hasn't
// cached a route yet. Not turn-by-turn accurate, but a real number beats a
// blank "—" and costs nothing to compute.
export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371;
  const dLat = (b.latitude - a.latitude) * Math.PI / 180;
  const dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const lat1 = a.latitude * Math.PI / 180;
  const lat2 = b.latitude * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Best-effort distance for a ride: prefers the real road-route distance
// (ride.route.distance, from OpenRouteService) when cached, otherwise falls
// back to a straight-line estimate from the ride's from/to coordinates.
// Returns null only when neither is available.
export function estimateRideDistanceKm(ride: any): number | null {
  // ride.route.distance comes from the backend's OpenRouteService integration
  // in meters (see routing.service.ts) — convert to km.
  if (ride?.route?.distance) return Math.round(ride.route.distance / 1000);
  if (ride?.fromLat != null && ride?.fromLng != null && ride?.toLat != null && ride?.toLng != null) {
    return Math.round(haversineKm(
      { latitude: ride.fromLat, longitude: ride.fromLng },
      { latitude: ride.toLat, longitude: ride.toLng },
    ));
  }
  return null;
}
