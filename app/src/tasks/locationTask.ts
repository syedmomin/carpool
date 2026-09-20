import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenStorage } from '../services/api';
import { API_BASE_URL } from '../config/network';

const LOCATION_TASK_NAME = 'background-location-task';
const TRACKING_RIDE_ID_KEY = '@tracking_ride_id';
const TRACKING_QUEUE_KEY = '@tracking_pending_points';
// Bounds the local buffer for a long dead zone (a 30-50h intercity route can
// genuinely go hours without signal on a remote stretch). At the 5s capture
// interval this holds ~28 hours of points before thinning kicks in — and
// even then, old points are downsampled rather than dropped outright (see
// thinQueue), so the whole dead-zone stretch still shows up on the map at
// lower resolution instead of vanishing.
const MAX_QUEUED_POINTS = 20000;

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[BackgroundLocationTask] Error:', error);
    return;
  }
  if (data) {
    const { locations }: any = data;
    const location = locations[0];
    if (location) {
      try {
        // 1. Get Ride ID from Storage
        const rideId = await AsyncStorage.getItem(TRACKING_RIDE_ID_KEY);
        if (!rideId) return;

        // 2. Get token from secure storage
        const token = await tokenStorage.get();
        if (!token) return;

        // 3. Store-and-forward: append this point to the local queue first,
        // so a point already captured on-device is never lost even if the
        // network is down (offline, airplane mode, dead zone) — it just
        // waits for the next task tick to be retried.
        const { latitude, longitude, speed, heading } = location.coords;
        const point = {
          latitude, longitude, speed, heading,
          timestamp: new Date(location.timestamp || Date.now()).toISOString(),
        };

        let queue = await readQueue();
        queue.push(point);
        queue = thinQueue(queue, MAX_QUEUED_POINTS);

        const flushed = await flushQueue(rideId, token, queue);
        if (flushed) {
          await AsyncStorage.removeItem(TRACKING_QUEUE_KEY);
        } else {
          await AsyncStorage.setItem(TRACKING_QUEUE_KEY, JSON.stringify(queue));
        }
      } catch (err) {
        console.warn('[BackgroundLocationTask] Failed to update location:', err);
      }
    }
  }
});

// Keeps the buffer within maxLen without ever wholesale-dropping a chunk of
// history: the newest half is kept at full resolution, and the older half is
// evenly downsampled to fit its budget instead of being discarded — so a
// multi-hour dead zone still leaves a (coarser) trace instead of a gap.
function thinQueue(queue: any[], maxLen: number): any[] {
  if (queue.length <= maxLen) return queue;
  const keepRecentCount = Math.floor(maxLen / 2);
  const recent = queue.slice(-keepRecentCount);
  const older = queue.slice(0, queue.length - keepRecentCount);
  const olderBudget = maxLen - keepRecentCount;
  const step = older.length / olderBudget;
  const thinnedOlder: any[] = [];
  for (let i = 0; i < olderBudget; i++) {
    thinnedOlder.push(older[Math.floor(i * step)]);
  }
  return [...thinnedOlder, ...recent];
}

async function readQueue(): Promise<any[]> {
  try {
    const raw = await AsyncStorage.getItem(TRACKING_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Sends every buffered point via the batch-sync endpoint. Returns true only
// if the server actually accepted them — the caller must not clear the
// queue on a network failure, or those points are gone for good.
async function flushQueue(rideId: string, token: string, points: any[]): Promise<boolean> {
  if (points.length === 0) return true;
  try {
    const res = await fetch(`${API_BASE_URL}/tracking/update-location-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ rideId, points }),
    });
    return res.ok;
  } catch {
    return false; // offline / network error — leave points queued for next tick
  }
}

// Best-effort final flush when a ride ends, so points captured in the last
// few seconds before "Complete Ride" aren't stranded in local storage.
export async function flushPendingTrackingPoints(): Promise<void> {
  try {
    const rideId = await AsyncStorage.getItem(TRACKING_RIDE_ID_KEY);
    const token = await tokenStorage.get();
    const queue = await readQueue();
    if (!rideId || !token || queue.length === 0) {
      await AsyncStorage.removeItem(TRACKING_QUEUE_KEY);
      return;
    }
    const flushed = await flushQueue(rideId, token, queue);
    if (flushed) await AsyncStorage.removeItem(TRACKING_QUEUE_KEY);
  } catch (err) {
    console.warn('[BackgroundLocationTask] Final flush failed:', err);
  }
}

export { LOCATION_TASK_NAME, TRACKING_RIDE_ID_KEY };
