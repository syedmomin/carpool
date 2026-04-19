import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, EmptyState, GradientHeader, Avatar } from '../../components';
import { reviewsApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function ReviewsScreen({ navigation }) {
  const { currentUser } = useApp();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!currentUser?.id) return;
    setRefreshing(true);
    try {
      const { data, error } = await reviewsApi.forUser(currentUser.id);
      if (data) {
        setReviews(data.data?.reviews || []);
        setStats(data.data?.stats || null);
      }
    } catch (err) {
      console.error('Fetch reviews error:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [currentUser?.id]);

  useFocusEffect(useCallback(() => {
    fetchReviews();
  }, [fetchReviews]));

  const renderReview = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Avatar name={item.reviewer?.name} size={40} />
        <View style={styles.reviewerInfo}>
          <Text style={styles.reviewerName}>{item.reviewer?.name}</Text>
          <Text style={styles.reviewDate}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
          </Text>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>{item.rating}</Text>
          <Ionicons name="star" size={12} color={COLORS.warning} />
        </View>
      </View>
      {item.comment ? (
        <Text style={styles.comment}>{item.comment}</Text>
      ) : (
        <Text style={[styles.comment, { fontStyle: 'italic', color: COLORS.gray }]}>No comment provided.</Text>
      )}
      {item.ride && (
        <View style={styles.rideTag}>
          <Ionicons name="navigate-outline" size={12} color={COLORS.primary} />
          <Text style={styles.rideTagText}>
            Ride: {(item.ride.fromCity || item.ride.from)} → {(item.ride.toCity || item.ride.to)}
          </Text>
        </View>
      )}
    </View>
  );

  const renderHeader = () => {
    if (!stats) return null;
    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.mainStat}>
            <Text style={styles.avgRating}>{stats.averageRating}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <Ionicons 
                  key={n} 
                  name={n <= Math.round(stats.averageRating) ? "star" : "star-outline"} 
                  size={16} 
                  color={COLORS.warning} 
                />
              ))}
            </View>
            <Text style={styles.totalReviews}>{stats.total} total reviews</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.breakdown}>
            {stats.breakdown.map(item => (
              <View key={item.star} style={styles.breakdownRow}>
                <Text style={styles.starNum}>{item.star}</Text>
                <View style={styles.progressTrack}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: stats.total ? `${(item.count / stats.total) * 100}%` : '0%' }
                    ]} 
                  />
                </View>
                <Text style={styles.countNum}>{item.count}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <GradientHeader colors={GRADIENTS.primary as any} title="My Reviews" onBack={() => navigation.goBack()} />
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GradientHeader 
        colors={currentUser?.role === 'DRIVER' ? GRADIENTS.teal as any : GRADIENTS.primary as any} 
        title="My Reviews" 
        subtitle="What others are saying"
        onBack={() => navigation.goBack()} 
      />
      <FlatList
        data={reviews}
        keyExtractor={item => item.id}
        renderItem={renderReview}
        ListHeaderComponent={renderHeader}
        refreshing={refreshing}
        onRefresh={fetchReviews}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState 
            icon="star-outline" 
            title="No Reviews Yet" 
            subtitle="Complete more rides to see what others think of you!" 
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: 40 },
  statsContainer: { backgroundColor: '#fff', margin: 20, borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  mainStat: { flex: 1, alignItems: 'center' },
  avgRating: { fontSize: 44, fontWeight: '900', color: COLORS.textPrimary },
  starsRow: { flexDirection: 'row', gap: 2, marginVertical: 6 },
  totalReviews: { fontSize: 12, color: COLORS.gray, fontWeight: '600' },
  divider: { width: 1, height: '80%', backgroundColor: COLORS.border, marginHorizontal: 20 },
  breakdown: { flex: 1.2 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  starNum: { fontSize: 11, color: COLORS.gray, fontWeight: '700', width: 10 },
  progressTrack: { flex: 1, height: 5, backgroundColor: COLORS.lightGray, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.warning, borderRadius: 3 },
  countNum: { fontSize: 10, color: COLORS.gray, width: 20, textAlign: 'right' },
  reviewCard: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 15, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#f0f0f0' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  reviewerInfo: { flex: 1, marginLeft: 12 },
  reviewerName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  reviewDate: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffbeb', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
  ratingText: { fontSize: 13, fontWeight: '800', color: '#d97706' },
  comment: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 12 },
  rideTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.lightGray, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start' },
  rideTagText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
});
