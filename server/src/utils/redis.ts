import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

let isConnected = false;

export const connectRedis = async () => {
  if (isConnected) return;
  try {
    await redisClient.connect();
    isConnected = true;
    console.log('[Redis] Connected successfully');
  } catch (err) {
    console.warn('[Redis] Connection failed, caching will be disabled.', err);
  }
};

export const cacheSet = async (key: string, value: any, expirySeconds = 300) => {
  if (!isConnected) return;
  try {
    await redisClient.set(key, JSON.stringify(value), {
      EX: expirySeconds,
    });
  } catch (err) {
    console.error('[Redis] Cache Set Error:', err);
  }
};

export const cacheGet = async (key: string) => {
  if (!isConnected) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('[Redis] Cache Get Error:', err);
    return null;
  }
};

export const cacheDel = async (key: string) => {
  if (!isConnected) return;
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error('[Redis] Cache Del Error:', err);
  }
};

export default redisClient;
