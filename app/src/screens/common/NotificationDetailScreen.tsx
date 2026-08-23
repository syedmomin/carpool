import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURVE, AppBar, SectionHeader } from '../../components';
import { getNotificationStyle } from '../../utils/notificationStyle';
import { ridesApi, notificationsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useGlobalModal } from '../../context/GlobalModalContext';

export default function NotificationDetailScreen({ navigation, route }) {
  const { notification } = route.params;
  const { showToast } = useToast();
  const { showModal } = useGlobalModal();
  const config = getNotificationStyle(notification.type);
  const rideId = notification.rideId || notification.ride?.id;

  const [ride, setRide] = useState<any>(null);
  const [loadingRide, setLoadingRide] = useState(!!rideId);

  useEffect(() => {
    if (!rideId) return;
    ridesApi.getById(rideId).then(({ data }) => {
      if (data?.data) setRide(data.data);
    }).finally(() => setLoadingRide(false));
  }, [rideId]);

  const dateLabel = notification.createdAt
    ? new Date(notification.createdAt).toLocaleString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  const handleDelete = () => {
    showModal({
      type: 'danger', title: 'Delete Notification?',
      message: 'This notification will be permanently removed.',
      confirmText: 'Delete', cancelText: 'Cancel', icon: 'trash-outline',
      onConfirm: async () => {
        const { error } = await notificationsApi.delete(notification.id);
        if (error) { showToast('Could not delete notification', 'error'); return; }
        navigation.goBack();
      },
    });
  };

  return (
    <View style={styles.container}>
      <AppBar
        title="Notification"
        rightIcon="trash-outline"
        onRightPress={handleDelete}
      />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={[styles.iconCircle, { backgroundColor: config.color }]}>
          <Ionicons name={config.icon as any} size={32} color={COLORS.white} />
        </View>

        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.date}>{dateLabel}</Text>
        <Text style={styles.message}>{notification.message}</Text>

        {loadingRide && (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
        )}

        {ride && (
          <>
            <SectionHeader title="Ride Summary" style={styles.sectionHeader} />
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Driver</Text>
                <Text style={styles.summaryValue}>{ride.driver?.name || '—'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Vehicle</Text>
                <Text style={styles.summaryValue}>
                  {[ride.vehicle?.brand, ride.vehicle?.model].filter(Boolean).join(' ') || '—'}
                  {ride.vehicle?.plateNumber ? ` • ${ride.vehicle.plateNumber}` : ''}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fare</Text>
                <Text style={styles.summaryValue}>Rs. {ride.pricePerSeat?.toLocaleString()}</Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.summaryLabel}>Payment</Text>
                <Text style={styles.summaryValue}>Cash</Text>
              </View>
            </View>

            <Pressable
              style={styles.receiptBtn}
              onPress={() => showToast('Receipts are coming soon', 'info')}
            >
              <Text style={styles.receiptBtnText}>View Receipt</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  body: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32, alignItems: 'center' },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  date: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6 },
  message: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21, marginTop: 14 },
  sectionHeader: { width: '100%', marginTop: 28, marginBottom: 10 },
  summaryCard: {
    width: '100%', backgroundColor: COLORS.cardBg, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14,
    ...CURVE,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  summaryValue: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, maxWidth: '60%', textAlign: 'right' },
  receiptBtn: { width: '100%', borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20, ...CURVE },
  receiptBtnText: { color: COLORS.primaryDark, fontSize: 15, fontWeight: '700' },
});
