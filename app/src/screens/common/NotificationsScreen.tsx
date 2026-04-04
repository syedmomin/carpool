import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, GradientHeader, EmptyState } from '../../components';
import { useApp } from '../../context/AppContext';
import { notificationsApi } from '../../services/api';

const PAGE_SIZE = 20;
const TYPE_CONFIG = {
  BOOKING:  { icon: 'checkmark-circle', color: COLORS.secondary, bg: '#e8f5e9' },
  booking:  { icon: 'checkmark-circle', color: COLORS.secondary, bg: '#e8f5e9' },
  request:  { icon: 'person-add',       color: COLORS.primary,   bg: '#eff6ff' },
  reminder: { icon: 'alarm',            color: COLORS.accent,    bg: '#fff8e1' },
  new_ride: { icon: 'car-sport',        color: COLORS.teal,      bg: '#e0f2f1' },
  default:  { icon: 'notifications',    color: COLORS.gray,      bg: COLORS.lightGray },
};

export default function NotificationsScreen({ navigation }) {
  const { markNotificationRead, markAllNotificationsRead } = useApp();
  const [notifications, setNotifications] = useState([]);
  const [page,          setPage]          = useState(1);
  const [hasMore,       setHasMore]       = useState(true);
  const [loading,       setLoading]       = useState(false);
  const [refreshing,    setRefreshing]    = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifs = useCallback(async (pageNum, replace = false) => {
    pageNum === 1 ? setRefreshing(true) : setLoading(true);
    const { data } = await notificationsApi.getAll(pageNum, PAGE_SIZE);
    pageNum === 1 ? setRefreshing(false) : setLoading(false);
    if (!data?.data) return;
    setNotifications(prev => replace ? data.data : [...prev, ...data.data]);
    setHasMore(data.meta?.hasNext ?? false);
    setPage(pageNum);
  }, []);

  useFocusEffect(useCallback(() => {
    fetchNotifs(1, true);
  }, []));

  const handleNotifPress = async (item) => {
    if (!item.read) {
      await markNotificationRead(item.id);
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
    }
  };

  const handleViewRide = async (item) => {
    await handleNotifPress(item);
    const rideId = item.rideId || item.ride?.id;
    if (rideId) navigation.navigate('RideDetail', { rideId });
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        colors={GRADIENTS.primary as any}
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
        onBack={() => navigation.goBack()}
        rightAction={
          unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAll} style={styles.markAllBtn}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )
        }
      />

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        onEndReached={() => { if (hasMore && !loading) fetchNotifs(page + 1); }}
        onEndReachedThreshold={0.3}
        refreshing={refreshing}
        onRefresh={() => fetchNotifs(1, true)}
        ListFooterComponent={loading ? <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} /> : null}
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
                <Ionicons name={(config.icon) as any} size={22} color={config.color} />
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
                    <LinearGradient colors={GRADIENTS.teal as any} style={styles.interestedGrad}>
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
          !refreshing ? (
            <EmptyState icon="notifications-off-outline" title="No Notifications" subtitle="You're all caught up!" />
          ) : null
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
  markAllBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  markAllText: { fontSize: 11, fontWeight: '700', color: '#fff' },
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
