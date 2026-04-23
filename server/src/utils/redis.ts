import Redis from 'ioredis';

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
});

redisClient.on('error', (err: any) => console.log('Redis Client Error', err));

let isConnected = false;

redisClient.on('connect', () => {
  isConnected = true;
  console.log('[Redis] Connected successfully');
});

export const connectRedis = async () => {
  // ioredis connects automatically, we just wait for it if needed
  if (redisClient.status === 'ready') {
    isConnected = true;
  }
};

export const cacheSet = async (key: string, value: any, expirySeconds = 300) => {
  try {
    await redisClient.set(key, JSON.stringify(value), 'EX', expirySeconds);
  } catch (err) {
    console.error('[Redis] Cache Set Error:', err);
  }
};

export const cacheGet = async (key: string) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('[Redis] Cache Get Error:', err);
    return null;
  }
};

export const cacheDel = async (key: string) => {
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error('[Redis] Cache Del Error:', err);
  }
};

export default redisClient;
