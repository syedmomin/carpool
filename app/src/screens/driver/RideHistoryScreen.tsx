import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, EmptyState, GradientHeader, StatusBadge } from '../../components';
import { ridesApi } from '../../services/api';

export default function RideHistoryScreen({ navigation }) {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchRides = useCallback(async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);
      const { data, error } = await ridesApi.myRides(pageNum, 10);
      
      if (data) {
        const items = data.data || [];
        setRides(prev => pageNum === 1 ? items : [...prev, ...items]);
        setHasMore(data.meta?.hasNext || false);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Fetch rides history error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchRides(1);
  }, [fetchRides]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchRides(1);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchRides(page + 1);
    }
  };

  const renderRide = ({ item }) => (
    <TouchableOpacity 
      style={styles.rideCard}
      onPress={() => navigation.navigate('RideDetail', { rideId: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.routeCol}>
          <View style={styles.routeRow}>
            <View style={styles.cityDot} />
            <Text style={styles.cityText}>{item.fromCity}</Text>
          </View>
          <View style={styles.routeConnector} />
          <View style={styles.routeRow}>
            <View style={[styles.cityDot, { backgroundColor: COLORS.secondary }]} />
            <Text style={styles.cityText}>{item.toCity}</Text>
          </View>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.cardFooter}>
         <View style={styles.metaCol}>
            <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={14} color={COLORS.gray} />
                <Text style={styles.metaText}>{item.date}</Text>
            </View>
            <View style={styles.metaRow}>
                <Ionicons name="people-outline" size={14} color={COLORS.gray} />
                <Text style={styles.metaText}>{item.bookedSeats} Passengers</Text>
            </View>
         </View>
         <View style={styles.earningsCol}>
            <Text style={styles.earningsLabel}>Earnings</Text>
            <Text style={styles.earningsValue}>Rs {item.bookedSeats * item.pricePerSeat}</Text>
         </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <GradientHeader 
        colors={GRADIENTS.teal as any} 
        title="Ride History" 
        subtitle="Your past hosting activity"
        onBack={() => navigation.goBack()} 
      />
      <FlatList
        data={rides}
        keyExtractor={item => item.id}
        renderItem={renderRide}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.teal]} />}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading && page > 1 ? <ActivityIndicator color={COLORS.teal} style={{ margin: 20 }} /> : null}
        ListEmptyComponent={
          !loading ? (
            <EmptyState 
              icon="car-outline" 
              title="No Ride History" 
              subtitle="Rides you host will appear here once they are completed." 
            />
          ) : (
            <View style={styles.loadingCenter}>
                <ActivityIndicator size="large" color={COLORS.teal} />
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  listContent: { padding: 20, paddingBottom: 40 },
  loadingCenter: { marginTop: 100, alignItems: 'center' },
  rideCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#f0f0f0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  routeCol: { flex: 1 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  cityText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  routeConnector: { width: 2, height: 12, backgroundColor: COLORS.border, marginLeft: 3, marginVertical: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  metaCol: { gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: COLORS.gray, fontWeight: '600' },
  earningsCol: { alignItems: 'flex-end' },
  earningsLabel: { fontSize: 10, color: COLORS.gray, textTransform: 'uppercase', marginBottom: 2 },
  earningsValue: { fontSize: 18, fontWeight: '900', color: COLORS.teal },
});
