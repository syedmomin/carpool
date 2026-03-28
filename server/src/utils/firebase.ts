import admin from 'firebase-admin';
import * as serviceAccount from '../../carpool-app-3a829-firebase-adminsdk-fbsvc-4d1c78c8b2.json';

// ─── Initialize Firebase Admin (singleton) ───────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export const messaging = admin.messaging();

// ─── Send to single device ────────────────────────────────────────────────────
export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data: Record<string, string> = {},
): Promise<boolean> {
  try {
    await messaging.send({
      token: fcmToken,
      notification: { title, body },
      data,
      android: {
        priority: 'high',
        notification: {
          sound:     'default',
          channelId: 'safarishare_default',
          priority:  'max',
          icon:      'notification_icon',
        },
      },
      apns: {
        payload: {
          aps: { sound: 'default', badge: 1 },
        },
      },
    });
    return true;
  } catch (err: any) {
    // Token invalid/expired — log but don't crash
    console.warn(`[FCM] Failed to send to token: ${err?.message}`);
    return false;
  }
}

// ─── Send to multiple devices ─────────────────────────────────────────────────
export async function sendToMultiple(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string> = {},
): Promise<void> {
  if (!tokens.length) return;

  try {
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data,
      android: {
        priority: 'high',
        notification: {
          sound:     'default',
          channelId: 'safarishare_default',
        },
      },
      apns: {
        payload: { aps: { sound: 'default' } },
      },
    });
    console.log(`[FCM] Sent: ${response.successCount} success, ${response.failureCount} failed`);
  } catch (err: any) {
    console.warn(`[FCM] Multicast failed: ${err?.message}`);
  }
}

// ─── Send topic notification (broadcast) ─────────────────────────────────────
export async function sendToTopic(
  topic: string,
  title: string,
  body: string,
  data: Record<string, string> = {},
): Promise<void> {
  try {
    await messaging.send({
      topic,
      notification: { title, body },
      data,
      android: { priority: 'high' },
    });
  } catch (err: any) {
    console.warn(`[FCM] Topic send failed: ${err?.message}`);
  }
}
