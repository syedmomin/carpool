import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenStorage } from '../services/api';
import { API_BASE_URL } from '../config/network';

const LOCATION_TASK_NAME = 'background-location-task';
const TRACKING_RIDE_ID_KEY = '@tracking_ride_id';
const TRACKING_QUEUE_KEY = '@tracking_pending_points';
// Bounds the local buffer if the device stays offline a long time — old
// points are dropped first since the newest position matters most once
// connectivity returns; a full log still exists server-side for points
// that did make it through.
const MAX_QUEUED_POINTS = 500;

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

        const queue = await readQueue();
        queue.push(point);
        if (queue.length > MAX_QUEUED_POINTS) queue.splice(0, queue.length - MAX_QUEUED_POINTS);

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
