import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURVE, AppBar, EmptyState, Avatar, TabPills } from '../../components';
import { useApp } from '../../context/AppContext';
import { notificationsApi, chatApi } from '../../services/api';
import { socketService } from '../../services/socket.service';
import { getNotificationStyle } from '../../utils/notificationStyle';
import { CardSkeleton } from '../../components/Skeleton';

const PAGE_SIZE = 20;

function ChatsTab({ navigation, searchQuery }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    const { data } = await chatApi.getConversations();
    if (data?.data) setConversations(data.data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchConversations(); }, [fetchConversations]));

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    const days = Math.floor((+now - +d) / 86400000);
    return days < 7 ? `${days} days ago` : d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <View style={{ paddingTop: 8 }}>
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </View>
    );
  }

  const filtered = searchQuery
    ? conversations.filter(c => (c.otherUser?.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  return (
    <FlatList
      data={filtered}
      keyExtractor={item => item.bookingId}
      contentContainerStyle={styles.listContent}
      refreshing={refreshing}
      onRefresh={() => fetchConversations(true)}
      renderItem={({ item }) => (
        <Pressable
          style={styles.chatRow}
          onPress={() => navigation.navigate('Chat', {
            bookingId: item.bookingId,
            otherUser: item.otherUser,
            rideInfo: { label: `${item.rideInfo?.fromCity} > ${item.rideInfo?.toCity}` },
          })}
        >
          <Avatar name={item.otherUser?.name} uri={item.otherUser?.avatar} size={48} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.chatName} numberOfLines={1}>{item.otherUser?.name || 'User'}</Text>
            <Text style={styles.chatPreview} numberOfLines={1}>{item.lastMessage?.content || ''}</Text>
          </View>
          <View style={styles.chatRight}>
            <Text style={styles.chatTime}>{formatTime(item.lastMessage?.createdAt)}</Text>
            {item.unreadCount > 0 && (
              <View style={styles.chatUnreadBadge}>
                <Text style={styles.chatUnreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </Pressable>
      )}
      ListEmptyComponent={<EmptyState icon="chatbubbles-outline" title="No Messages" subtitle="Conversations with drivers and passengers will appear here." />}
    />
  );
}

export default function NotificationsScreen({ navigation }) {
  const { markAllNotificationsRead } = useApp();
  const [tab, setTab] = useState<'chats' | 'notifications'>('chats');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
    if (tab !== 'notifications') return;
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
  }, [fetchNotifs, tab]));

  // Opening the screen already marks read; tapping clears the highlight and
  // opens the full notification detail.
  const handleNotifPress = (item) => {
    if (highlightIds.current.has(item.id)) {
      highlightIds.current.delete(item.id);
      setHighlightCount(highlightIds.current.size);
    }
    navigation.navigate('NotificationDetail', { notification: item });
  };

  const handleViewRide = (item) => {
    handleNotifPress(item);
    const rideId = item.rideId || item.ride?.id;
    if (rideId) navigation.navigate('RideDetail', { rideId });
  };

  return (
    <View style={styles.container}>
      <AppBar
        title="Messages"
        onBack={() => navigation.goBack()}
        rightIcon={searchOpen ? 'close' : 'search-outline'}
        onRightPress={() => { setSearchOpen(o => !o); setSearchQuery(''); }}
      />

      {searchOpen && (
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={tab === 'chats' ? 'Search conversations...' : 'Search notifications...'}
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      )}

      <TabPills
        tabs={[
          { label: 'Chats', value: 'chats' },
          { label: `Notifications${highlightCount > 0 ? ` (${highlightCount})` : ''}`, value: 'notifications' },
        ]}
        activeTab={tab}
        onSelect={setTab}
        style={{ marginHorizontal: 16, marginBottom: 12 }}
      />

      {tab === 'chats' ? <ChatsTab navigation={navigation} searchQuery={searchQuery} /> : (
      <FlatList
        data={searchQuery ? notifications.filter(n => (n.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (n.message || '').toLowerCase().includes(searchQuery.toLowerCase())) : notifications}
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
              style={[styles.card, !isRead && styles.cardUnread]}
              onPress={() => handleNotifPress(item)}
            >
              <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
                <Ionicons name={(config.icon) as any} size={21} color={config.color} />
              </View>
              <View style={styles.content}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, !isRead && styles.titleUnread]} numberOfLines={1}>{item.title}</Text>
                  {!isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.time}>{timeLabel}</Text>

                  {isNewRide && (item.rideId || item.ride?.id) && (
                    <Pressable
                      style={styles.interestedBtn}
                      onPress={() => handleViewRide(item)}
                    >
                      <Ionicons name="eye-outline" size={13} color={COLORS.primary} />
                      <Text style={styles.interestedText}>View Ride</Text>
                    </Pressable>
                  )}
                </View>
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  listContent: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.cardBg, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 12, height: 40,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary, height: '100%' },

  chatRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.cardBg, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10, ...CURVE },
  chatName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  chatPreview: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 2 },
  chatRight: { alignItems: 'flex-end', gap: 6 },
  chatTime: { fontSize: 11, color: COLORS.textSecondary },
  chatUnreadBadge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  chatUnreadText: { fontSize: 11, fontWeight: '700', color: COLORS.white },

  card: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.cardBg,
    borderRadius: 16, padding: 14, marginBottom: 10, gap: 12,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: 'rgba(15, 23, 42, 0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16, elevation: 1,
    ...CURVE,
  },
  cardUnread: { backgroundColor: COLORS.primary + '06', borderColor: COLORS.primary + '20' },
  iconBox: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  content: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  title: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  titleUnread: { fontWeight: '800', letterSpacing: -0.1 },
  message: { fontSize: 12.5, color: COLORS.gray, lineHeight: 18, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time: { fontSize: 11, color: COLORS.gray },
  unreadDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.primary, flexShrink: 0 },
  interestedBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primaryLight, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary + '30',
    paddingHorizontal: 10, paddingVertical: 5,
  },
  interestedText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
});
