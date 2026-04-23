import prisma from '../data-source';

class RoutingService {
  private readonly apiUrl = 'https://api.openrouteservice.org/v2/directions/driving-car';

  async getRoute(rideId: string, startLng: number, startLat: number, endLng: number, endLat: number) {
    // 1. Check if route already exists in DB
    const existingRoute = await prisma.rideRoute.findUnique({
      where: { rideId }
    });

    if (existingRoute) {
      return {
        polyline: JSON.parse(existingRoute.polyline),
        distance: existingRoute.distance,
        duration: existingRoute.duration
      };
    }

    // 2. Fetch from OpenRouteService
    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ OPENROUTESERVICE_API_KEY is not defined. Returning direct line stub.');
      return {
        polyline: [[startLng, startLat], [endLng, endLat]],
        distance: 0,
        duration: 0
      };
    }

    try {
      const url = `${this.apiUrl}?api_key=${apiKey}&start=${startLng},${startLat}&end=${endLng},${endLat}`;
      const response = await fetch(url);
      const data: any = await response.json();

      if (!response.ok) {
        throw new Error(`OpenRouteService error: ${response.statusText}`);
      }

      const feature = data.features?.[0];
      if (!feature) {
        throw new Error('No route found from OpenRouteService');
      }

      const coordinates = feature.geometry.coordinates; // Array of [lng, lat]
      const distance = feature.properties.summary.distance; // in meters
      const duration = feature.properties.summary.duration; // in seconds

      // 3. Save to DB for caching
      await prisma.rideRoute.create({
        data: {
          rideId,
          polyline: JSON.stringify(coordinates),
          distance,
          duration
        }
      });

      return {
        polyline: coordinates,
        distance,
        duration
      };
    } catch (err) {
      console.error('❌ Error fetching route from OpenRouteService:', err);
      throw err;
    }
  }
}

export const routingService = new RoutingService();
