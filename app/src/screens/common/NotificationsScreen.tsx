import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, CURVE, GradientHeader, EmptyState } from '../../components';
import { useApp } from '../../context/AppContext';
import { notificationsApi } from '../../services/api';
import { socketService } from '../../services/socket.service';
import { getNotificationStyle } from '../../utils/notificationStyle';
import { CardSkeleton } from '../../components/Skeleton';

const PAGE_SIZE = 20;

export default function NotificationsScreen({ navigation }) {
  const { markAllNotificationsRead } = useApp();
  const [notifications, setNotifications] = useState([]);
  const [page,          setPage]          = useState(1);
  const [hasMore,       setHasMore]       = useState(true);
  const [loading,       setLoading]       = useState(false);
  const [refreshing,    setRefreshing]    = useState(false);
  // IDs that were unread when the screen was opened — kept highlighted for this
  // session even after we mark everything read (so "new" stays visible).
  const highlightIds = useRef<Set<string>>(new Set());
  const [highlightCount, setHighlightCount] = useState(0);

  const fetchNotifs = useCallback(async (pageNum, replace = false, autoMark = false) => {
    pageNum === 1 ? setRefreshing(true) : setLoading(true);
    const { data } = await notificationsApi.getAll(pageNum, PAGE_SIZE);
    pageNum === 1 ? setRefreshing(false) : setLoading(false);
    if (!data?.data) return;
    if (autoMark) {
      // Snapshot newly-unread for highlighting, then mark all read so the
      // home bell badge clears as soon as the user opens this window.
      const freshUnread = data.data.filter(n => !n.read).map(n => n.id);
      freshUnread.forEach(id => highlightIds.current.add(id));
      setHighlightCount(highlightIds.current.size);
      if (freshUnread.length) markAllNotificationsRead();
    }
    setNotifications(prev => replace ? data.data : [...prev, ...data.data]);
    setHasMore(data.meta?.hasNext ?? false);
    setPage(pageNum);
  }, [markAllNotificationsRead]);

  useFocusEffect(useCallback(() => {
    // Reset highlight snapshot each time the screen is opened.
    highlightIds.current = new Set();
    setHighlightCount(0);
    fetchNotifs(1, true, true);

    // Refresh + auto-mark whenever any notification-creating event fires while open
    const onAnyNotif = () => fetchNotifs(1, true, true);
    socketService.on('NOTIFICATION_NEW',   onAnyNotif);
    socketService.on('BOOKING_REQUESTED',  onAnyNotif);
    socketService.on('BOOKING_ACCEPTED',   onAnyNotif);
    socketService.on('BOOKING_REJECTED',   onAnyNotif);
    socketService.on('BOOKING_CANCELLED',  onAnyNotif);
    socketService.on('RIDE_STARTED',       onAnyNotif);
    socketService.on('RIDE_COMPLETED',     onAnyNotif);

    return () => {
      socketService.off('NOTIFICATION_NEW',   onAnyNotif);
      socketService.off('BOOKING_REQUESTED',  onAnyNotif);
      socketService.off('BOOKING_ACCEPTED',   onAnyNotif);
      socketService.off('BOOKING_REJECTED',   onAnyNotif);
      socketService.off('BOOKING_CANCELLED',  onAnyNotif);
      socketService.off('RIDE_STARTED',       onAnyNotif);
      socketService.off('RIDE_COMPLETED',     onAnyNotif);
    };
  }, [fetchNotifs]));

  // Opening the screen already marks read; tapping just clears the highlight.
  const handleNotifPress = (item) => {
    if (highlightIds.current.has(item.id)) {
      highlightIds.current.delete(item.id);
      setHighlightCount(highlightIds.current.size);
    }
  };

  const handleViewRide = (item) => {
    handleNotifPress(item);
    const rideId = item.rideId || item.ride?.id;
    if (rideId) navigation.navigate('RideDetail', { rideId });
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        colors={GRADIENTS.primary as any}
        title="Notifications"
        subtitle={highlightCount > 0 ? `${highlightCount} new` : 'All caught up'}
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        onEndReached={() => { if (hasMore && !loading) fetchNotifs(page + 1); }}
        onEndReachedThreshold={0.3}
        refreshing={refreshing}
        onRefresh={() => fetchNotifs(1, true, true)}
        ListFooterComponent={loading ? <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} /> : null}
        renderItem={({ item }) => {
          const config = getNotificationStyle(item.type);
          const isNewRide = item.type === 'NEW_RIDE' || item.type === 'BOOKING';
          // Highlight = was unread when the window opened (kept until tapped).
          const isRead    = !highlightIds.current.has(item.id);
          const timeLabel = item.time ?? (item.createdAt ? new Date(item.createdAt).toLocaleString('en-PK', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : '');

          return (
            <Pressable
              style={[styles.card, !isRead && styles.cardUnread, isNewRide && styles.cardNewRide]}
              onPress={() => handleNotifPress(item)}
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
                  <Pressable
                    style={styles.interestedBtn}
                    onPress={() => handleViewRide(item)}
                  >
                    <LinearGradient colors={GRADIENTS.teal as any} style={styles.interestedGrad}>
                      <Ionicons name="eye-outline" size={15} color="#fff" />
                      <Text style={styles.interestedText}>View Ride</Text>
                    </LinearGradient>
                  </Pressable>
                )}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          refreshing ? (
            <View style={{ paddingTop: 8 }}>
              {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
            </View>
          ) : (
            <EmptyState icon="notifications-off-outline" title="No Notifications" subtitle="You're all caught up" />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  listContent: { padding: 16, paddingBottom: 32, flexGrow: 1 },
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
