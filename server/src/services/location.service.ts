import Redis from 'ioredis';
import prisma from '../data-source';

class LocationService {
  private redis: Redis | null = null;
  private localMap: Map<string, any> = new Map();
  // Batch queue for Postgres persistence
  private persistenceQueue: any[] = [];
  private persistenceInterval: NodeJS.Timeout;

  constructor() {
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) return true;
          return false;
        },
      });

      this.redis.on('connect', () => {
        console.log('✅ Redis connected for Location Service');
      });

      this.redis.on('error', (err) => {
        console.error('❌ Redis Error:', err.message);
      });
    } else {
      console.log('⚠️ No REDIS_URL provided, using in-memory map for locations.');
    }


    // Every 15 seconds, save accumulated locations to DB to prevent flooding
    this.persistenceInterval = setInterval(() => this.persistLocations(), 15000);
  }

  async addLocation(data: { rideId: string; latitude: number; longitude: number; speed?: number; heading?: number }) {
    const timestamp = new Date();
    const payload = { ...data, timestamp };

    // 1. Save to Redis / Memory
    if (this.redis) {
      // setex = set + expire in a single Redis command (one round trip)
      await this.redis.setex(`ride_loc_${data.rideId}`, 86400, JSON.stringify(payload));
    } else {
      this.localMap.set(`ride_loc_${data.rideId}`, payload);
    }

    // 2. Push to queue for DB bulk insert
    this.persistenceQueue.push(payload);
  }

  async getLatestLocation(rideId: string) {
    if (this.redis) {
      const data = await this.redis.get(`ride_loc_${rideId}`);
      return data ? JSON.parse(data) : null;
    } else {
      return this.localMap.get(`ride_loc_${rideId}`) || null;
    }
  }

  private async persistLocations() {
    if (this.persistenceQueue.length === 0) return;

    const items = [...this.persistenceQueue];
    this.persistenceQueue = [];

    try {
      await prisma.rideLocation.createMany({
        data: items.map(item => ({
          rideId: item.rideId,
          latitude: item.latitude,
          longitude: item.longitude,
          speed: item.speed,
          heading: item.heading,
          timestamp: item.timestamp
        }))
      });
    } catch (err) {
      console.error('❌ Failed to persist locations:', err);
      // Re-queue
      this.persistenceQueue = [...items, ...this.persistenceQueue];
    }
  }
}

export const locationService = new LocationService();
