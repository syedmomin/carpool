import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, GradientHeader, EmptyState } from '../../components';
import { useApp } from '../../context/AppContext';

const TYPE_CONFIG = {
  booking:  { icon: 'checkmark-circle', color: COLORS.secondary, bg: '#e8f5e9' },
  request:  { icon: 'person-add',       color: COLORS.primary,   bg: '#eff6ff' },
  reminder: { icon: 'alarm',            color: COLORS.accent,    bg: '#fff8e1' },
  new_ride: { icon: 'car-sport',        color: COLORS.teal,      bg: '#e0f2f1' },
  default:  { icon: 'notifications',    color: COLORS.gray,      bg: COLORS.lightGray },
};

export default function NotificationsScreen({ navigation }) {
  const { notifications, markNotificationRead, unreadCount } = useApp();

  const handleNotifPress = (item) => {
    markNotificationRead(item.id);
  };

  const handleViewRide = (item) => {
    markNotificationRead(item.id);
    const rideId = item.rideId || item.ride?.id;
    if (rideId) navigation.navigate('RideDetail', { rideId });
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        colors={GRADIENTS.primary}
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} new notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.default;
          const isNewRide = item.type === 'new_ride' || item.type === 'BOOKING';
          const isRead    = item.read ?? false;
          const timeLabel = item.time ?? (item.createdAt ? new Date(item.createdAt).toLocaleString('en-PK', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : '');

          return (
            <TouchableOpacity
              style={[styles.card, !isRead && styles.cardUnread, isNewRide && styles.cardNewRide]}
              onPress={() => handleNotifPress(item)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
                <Ionicons name={config.icon} size={22} color={config.color} />
              </View>
              <View style={styles.content}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, !isRead && { fontWeight: '800' }]}>{item.title}</Text>
                  {!isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.time}>{timeLabel}</Text>

                {isNewRide && (item.rideId || item.ride?.id) && (
                  <TouchableOpacity
                    style={styles.interestedBtn}
                    onPress={() => handleViewRide(item)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={GRADIENTS.teal} style={styles.interestedGrad}>
                      <Ionicons name="eye-outline" size={15} color="#fff" />
                      <Text style={styles.interestedText}>View Ride</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <EmptyState icon="notifications-off-outline" title="No Notifications" subtitle="You're all caught up!" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  listContent: { padding: 16, paddingBottom: 32 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff',
    borderRadius: 16, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  cardNewRide: { borderLeftWidth: 3, borderLeftColor: COLORS.teal },
  iconBox: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 },
  content: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  title: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  message: { fontSize: 13, color: COLORS.gray, lineHeight: 18, marginBottom: 6 },
  time: { fontSize: 11, color: COLORS.gray },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, flexShrink: 0 },
  interestedBtn: { marginTop: 10, alignSelf: 'flex-start', borderRadius: 10, overflow: 'hidden' },
  interestedGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8 },
  interestedText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});
