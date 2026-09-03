import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, CURVE, AppBar, SectionHeader } from '../../components';
import { Skeleton } from '../../components/Skeleton';
import { ridesApi, notificationsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useGlobalModal } from '../../context/GlobalModalContext';

export default function NotificationDetailScreen({ navigation, route }) {
  const { notification } = route.params;
  const { showToast } = useToast();
  const { showModal } = useGlobalModal();
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
        <View style={styles.headerCard}>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.date}>{dateLabel}</Text>
          <Text style={styles.message}>{notification.message}</Text>
        </View>

        {loadingRide && (
          <View style={{ width: '100%', marginTop: 28 }}>
            <Skeleton width="45%" height={13} style={{ marginBottom: 10 }} />
            <View style={styles.summaryCard}>
              {[1, 2, 3, 4].map(i => (
                <View key={i} style={[styles.summaryRow, i === 4 && { borderBottomWidth: 0 }]}>
                  <Skeleton width={60} height={12} />
                  <Skeleton width={110} height={12} />
                </View>
              ))}
            </View>
          </View>
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
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  body: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  headerCard: {
    width: '100%', backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
    ...CURVE,
  },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  date: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  message: { fontSize: 13.5, color: COLORS.textSecondary, lineHeight: 20, marginTop: 12 },
  sectionHeader: { width: '100%', marginTop: 28, marginBottom: 10 },
  summaryCard: {
    width: '100%', backgroundColor: COLORS.cardBg, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14,
    ...CURVE,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  summaryValue: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, maxWidth: '60%', textAlign: 'right' },
});
