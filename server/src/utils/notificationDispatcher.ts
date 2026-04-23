/**
 * NotificationDispatcher
 * ──────────────────────
 * Single source of truth for ALL notifications in the system.
 * Every event that needs to notify a user must go through this.
 *
 * Each dispatch call does three things atomically (best-effort):
 *  1. Creates a DB notification record (in-app inbox)
 *  2. Sends FCM push notification to the user's device
 *  3. Emits a real-time Socket.IO event to the user's private room
 */

import prisma from '../data-source';
import { sendPushNotification, sendToMultiple } from './firebase';

export type NotificationType = 'BOOKING' | 'RIDE' | 'REMINDER' | 'NEW_RIDE' | 'RIDE_CANCELLED' | 'RIDE_EXPIRED' | 'SCHEDULE_REQUEST' | 'RIDE_BID' | 'BID_ACCEPTED' | 'BID_REJECTED' | 'SYSTEM';

export interface NotifyPayload {
  userId:   string;
  title:    string;
  message:  string;
  type:     NotificationType;
  rideId?:  string;
  fcmToken?: string | null;  // pass if already known — avoids extra DB query
  socketEvent?: string;      // socket event name to emit to user room
  socketData?:  any;         // payload for the socket event
  categoryId?:  string;      // For interactive notifications
}

export interface NotifyManyPayload {
  userIds:  string[];
  title:    string;
  message:  string;
  type:     NotificationType;
  rideId?:  string;
  socketEvent?: string;
  socketData?:  any;
}

// ─── Notify a single user ─────────────────────────────────────────────────────
export async function notify(payload: NotifyPayload): Promise<void> {
  const { userId, title, message, type, rideId, fcmToken, socketEvent, socketData } = payload;

  // 1. DB in-app notification (inside try so it doesn't break the caller)
  try {
    await prisma.notification.create({
      data: { userId, title, message, type, rideId },
    });
  } catch (e) { console.error('[Notify] DB create failed:', e); }

  // Auto-assign category for specific types if not provided
  let finalCategoryId = payload.categoryId;
  if (!finalCategoryId && type === 'BOOKING') {
    finalCategoryId = 'BOOKING_REQUEST';
  }

  // 2. FCM push — resolve token if not already provided
  try {
    let token = fcmToken;
    if (token === undefined) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { fcmToken: true } });
      token = user?.fcmToken ?? null;
    }
    if (token) {
      sendPushNotification(token, title, message, {
        ...(rideId ? { rideId } : {}),
        type,
      }, finalCategoryId).catch(e => console.error('[Notify] FCM failed:', e));
    }
  } catch (e) { console.error('[Notify] FCM lookup failed:', e); }

  // 3. Socket real-time event
  if (socketEvent) {
    try {
      const { emitToUser } = await import('../socket');
      emitToUser(userId, socketEvent, { ...socketData, rideId });
    } catch (e) { console.error('[Notify] Socket emit failed:', e); }
  }
}

// ─── Notify multiple users at once ───────────────────────────────────────────
export async function notifyMany(payload: NotifyManyPayload): Promise<void> {
  const { userIds, title, message, type, rideId, socketEvent, socketData } = payload;
  if (!userIds.length) return;

  // 1. DB — bulk insert
  try {
    await prisma.notification.createMany({
      data: userIds.map(userId => ({ userId, title, message, type, rideId })),
    });
  } catch (e) { console.error('[NotifyMany] DB createMany failed:', e); }

  // 2. FCM — fetch all tokens in one query, send multicast
  try {
    const users = await prisma.user.findMany({
      where:  { id: { in: userIds }, fcmToken: { not: null } },
      select: { fcmToken: true },
    });
    const tokens = users.map(u => u.fcmToken!).filter(Boolean);
    if (tokens.length) {
      sendToMultiple(tokens, title, message, {
        ...(rideId ? { rideId } : {}),
        type,
      }).catch(e => console.error('[NotifyMany] FCM multicast failed:', e));
    }
  } catch (e) { console.error('[NotifyMany] FCM lookup failed:', e); }

  // 3. Socket — emit to each user's private room
  if (socketEvent) {
    try {
      const { emitToUser } = await import('../socket');
      userIds.forEach(uid => emitToUser(uid, socketEvent, { ...socketData, rideId }));
    } catch (e) { console.error('[NotifyMany] Socket emit failed:', e); }
  }
}
