import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURVE, EmptyState, AppBar, Avatar, RouteTag, TabPills, CardSkeleton } from '../../components';
import { reviewsApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function ReviewsScreen({ navigation, route }) {
  const { currentUser } = useApp();
  const viewedUserId = route?.params?.userId || currentUser?.id;
  const viewedUserName = route?.params?.userName;
  const isOwnProfile = viewedUserId === currentUser?.id;

  const [subTab, setSubTab] = useState<'received' | 'given'>('received');
  const [received, setReceived] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [given, setGiven] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReceived = useCallback(async () => {
    if (!viewedUserId) return;
    const { data } = await reviewsApi.forUser(viewedUserId);
    if (data) {
      setReceived(data.data?.reviews || []);
      setStats(data.data?.stats || null);
    }
  }, [viewedUserId]);

  const fetchGiven = useCallback(async () => {
    const { data } = await reviewsApi.myGiven();
    if (data) setGiven(data.data?.reviews || []);
  }, []);

  const fetchAll = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    await Promise.all([fetchReceived(), isOwnProfile ? fetchGiven() : Promise.resolve()]);
    setRefreshing(false);
    setLoading(false);
  }, [fetchReceived, fetchGiven, isOwnProfile]);

  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  const activeList = subTab === 'given' ? given : received;
  const otherPersonKey = subTab === 'given' ? 'reviewee' : 'reviewer';

  const renderReview = ({ item }: any) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Avatar name={item[otherPersonKey]?.name} uri={item[otherPersonKey]?.avatar} size={40} color={COLORS.primary} />
        <View style={styles.reviewerInfo}>
          <Text style={styles.reviewerName}>{item[otherPersonKey]?.name}</Text>
          {item.ride?.fromCity && (
            <RouteTag from={item.ride.fromCity} to={item.ride.toCity} textStyle={styles.rideRoute} arrowColor={COLORS.textSecondary} />
          )}
        </View>
        <Text style={styles.reviewDate}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
        </Text>
      </View>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(n => (
          <Ionicons key={n} name={n <= item.rating ? 'star' : 'star-outline'} size={15} color={COLORS.warning} />
        ))}
      </View>
      {item.comment ? (
        <Text style={styles.comment}>{item.comment}</Text>
      ) : (
        <Text style={[styles.comment, { fontStyle: 'italic', color: COLORS.textSecondary }]}>No comment left.</Text>
      )}
    </View>
  );

  const renderStats = () => {
    if (subTab !== 'received' || !stats) return null;
    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.mainStat}>
            <Text style={styles.avgRating}>{stats.averageRating}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <Ionicons key={n} name={n <= Math.round(stats.averageRating) ? 'star' : 'star-outline'} size={16} color={COLORS.warning} />
              ))}
            </View>
            <Text style={styles.totalReviews}>{stats.total} total reviews</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.breakdown}>
            {stats.breakdown.map((item: any) => (
              <View key={item.star} style={styles.breakdownRow}>
                <Text style={styles.starNum}>{item.star}</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: stats.total ? `${(item.count / stats.total) * 100}%` : '0%' }]} />
                </View>
                <Text style={styles.countNum}>{item.count}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const title = isOwnProfile ? 'My Reviews' : `${viewedUserName || 'Driver'}'s Reviews`;

  if (loading) {
    return (
      <View style={styles.container}>
        <AppBar title={title} onBack={() => navigation.goBack()} />
        <View style={styles.listContent}>
          {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar title={title} onBack={() => navigation.goBack()} />

      {isOwnProfile && (
        <TabPills
          tabs={[
            { label: `Received (${received.length})`, value: 'received' },
            { label: `Given (${given.length})`, value: 'given' },
          ]}
          activeTab={subTab}
          onSelect={setSubTab}
          style={{ marginHorizontal: 16, marginBottom: 12 }}
        />
      )}

      <FlatList
        data={activeList}
        keyExtractor={item => item.id}
        renderItem={renderReview}
        ListHeaderComponent={renderStats}
        refreshing={refreshing}
        onRefresh={() => fetchAll(true)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="star-outline"
            title="No Reviews Yet"
            subtitle={
              subTab === 'given'
                ? "Reviews you write for drivers or passengers will appear here."
                : isOwnProfile ? 'Complete more rides to see what others think of you.' : "They don't have any reviews yet."
            }
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },

  statsContainer: { backgroundColor: COLORS.cardBg, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 18, marginBottom: 14, ...CURVE },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  mainStat: { flex: 1, alignItems: 'center' },
  avgRating: { fontSize: 36, fontWeight: '700', color: COLORS.textPrimary },
  starsRow: { flexDirection: 'row', gap: 2, marginVertical: 6 },
  totalReviews: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  divider: { width: 1, height: '80%', backgroundColor: COLORS.border, marginHorizontal: 20 },
  breakdown: { flex: 1.2 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  starNum: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '700', width: 10 },
  progressTrack: { flex: 1, height: 5, backgroundColor: COLORS.lightGray, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.warning, borderRadius: 3 },
  countNum: { fontSize: 10, color: COLORS.textSecondary, width: 20, textAlign: 'right' },

  reviewCard: { backgroundColor: COLORS.cardBg, marginBottom: 12, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border, ...CURVE },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewerInfo: { flex: 1, marginLeft: 12 },
  reviewerName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  rideRoute: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  reviewDate: { fontSize: 11, color: COLORS.textSecondary },
  comment: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, marginTop: 6 },
});
