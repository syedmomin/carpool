import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, EmptyState, GradientHeader, TabPills, StatusBadge, ProgressBar, FAB } from '../../components';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { useToast } from '../../context/ToastContext';
import { ridesApi } from '../../services/api';
import { socketService } from '../../services/socket.service';

const PAGE_SIZE = 10;
const TABS = [
  { value: 0, label: 'Current' },
  { value: 1, label: 'History' },
];

export default function MyRidesScreen({ navigation }) {
  const { showModal } = useGlobalModal();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const [allRides, setAllRides] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // rideId being actioned

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const normalize = r => ({ ...r, from: r.fromCity || r.from, to: r.toCity || r.to });

  const fetchRides = useCallback(async (pageNum, replace = false) => {
    if (loading && !replace) return;
    pageNum === 1 ? setRefreshing(true) : setLoading(true);
    const { data } = await ridesApi.myRides(pageNum, PAGE_SIZE);
    pageNum === 1 ? setRefreshing(false) : setLoading(false);
    setInitialLoading(false);
    if (!data?.data) return;
    const items = (data.data || []).map(normalize);
    setAllRides(prev => replace ? items : [...prev, ...items]);
    setHasMore(data.meta?.hasNext ?? false);
    setPage(pageNum);
  }, []);

  useFocusEffect(useCallback(() => {
    fetchRides(1, true);

    // Listen for new booking requests to update UI in real-time
    socketService.on('BOOKING_REQUESTED', (data) => {
      console.log('Real-time booking request received:', data);
      fetchRides(1, true); // Refresh list
    });

    socketService.on('BOOKING_CANCELLED', (data) => {
      console.log('Real-time booking cancellation received:', data);
      fetchRides(1, true); // Refresh list
    });

    return () => {
      socketService.off('BOOKING_REQUESTED');
      socketService.off('BOOKING_CANCELLED');
    };
  }, [fetchRides]));

  const loadMore = () => {
    if (hasMore && !loading && !refreshing) fetchRides(page + 1);
  };

  const handleStatusChange = (ride, newStatus) => {
    const isStart = newStatus === 'IN_PROGRESS';
    const isComplete = newStatus === 'COMPLETED';
    showModal({
      type: isComplete ? 'info' : 'primary',
      title: isStart ? 'Start Ride?' : 'Complete Ride?',
      message: isStart
        ? 'This will notify all passengers that the ride has started.'
        : 'This will mark the ride as completed and notify passengers to rate their experience.',
      confirmText: isStart ? 'Start Ride' : 'Complete Ride',
      cancelText: 'Cancel',
      icon: isStart ? 'play-circle-outline' : 'checkmark-circle-outline',
      onConfirm: async () => {
        setActionLoading(ride.id);
        const { data, error } = await ridesApi.updateStatus(ride.id, newStatus);
        setActionLoading(null);
        if (error) {
          showToast(error, 'error');
        } else {
          showToast(isStart ? 'Ride started!' : 'Ride completed!', 'success');
          // Update local state
          setAllRides(prev => prev.map(r => r.id === ride.id ? { 
            ...normalize(data?.data || data), 
            status: newStatus 
          } : r));
          
          if (isStart) {
            // Auto navigate to map on start
            navigation.navigate('RideTracking', { rideId: ride.id });
          } else {
            fetchRides(1, true);
          }
        }
      },
    });
  };

  const rides = activeTab === 0
    ? allRides.filter(r => r.status === 'ACTIVE' || r.status === 'IN_PROGRESS')
    : allRides.filter(r => r.status === 'COMPLETED' || r.status === 'CANCELLED');

  const renderRide = ({ item }) => {
    const vehicle = item.vehicle;
    const available = item.totalSeats - item.bookedSeats;
    const fillPercent = item.bookedSeats / item.totalSeats;
    const earned = item.bookedSeats * item.pricePerSeat;
    const isActioning = actionLoading === item.id;
    const isActive = item.status === 'ACTIVE';
    const isInProgress = item.status === 'IN_PROGRESS';
    const isToday = item.date === todayStr;

    // Simplified card for History tab
    if (activeTab === 1) {
      return (
        <TouchableOpacity 
          style={styles.historyCard}
          onPress={() => navigation.navigate('RideBookings', { rideId: item.id })}
        >
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.routeRow}>
                <View style={styles.cityDot} />
                <Text style={styles.cityText}>{item.from}</Text>
              </View>
              <View style={styles.routeConnector} />
              <View style={styles.routeRow}>
                <View style={[styles.cityDot, { backgroundColor: COLORS.secondary }]} />
                <Text style={styles.cityText}>{item.to}</Text>
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
              <Text style={styles.earningsValue}>Rs {earned.toLocaleString()}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.rideCard}>
        {/* Status banner for IN_PROGRESS */}
        {isInProgress && (
          <LinearGradient colors={GRADIENTS.teal as any} style={styles.inProgressBanner}>
            <Ionicons name="navigate-outline" size={14} color="#fff" />
            <Text style={styles.inProgressText}>Ride In Progress</Text>
          </LinearGradient>
        )}

        <View style={styles.rideHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rideRoute}>{item.from} → {item.to}</Text>
            <Text style={styles.rideDate}>{item.date} • {item.departureTime}</Text>
          </View>
          <StatusBadge
            status={isInProgress ? 'in_progress' : available > 0 ? (isToday ? 'active' : 'pending') : 'pending'}
            label={isInProgress ? 'In Progress' : available > 0 ? (isToday ? 'Scheduled Today' : 'Scheduled') : 'Full'}
          />
        </View>

        <ProgressBar
          value={fillPercent}
          label={`Seats Booked: ${item.bookedSeats}/${item.totalSeats}`}
          caption={`${Math.round(fillPercent * 100)}%`}
          style={styles.progress}
        />

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="people-outline" size={16} color={COLORS.primary} />
            <Text style={styles.statText}>{item.bookedSeats} passengers</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="cash-outline" size={16} color={COLORS.secondary} />
            <Text style={styles.statText}>Rs {earned.toLocaleString()} earned</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="car-outline" size={16} color={COLORS.gray} />
            <Text style={styles.statText}>{vehicle?.type || 'Vehicle'}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          {/* Passengers button */}
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => navigation.navigate('RideBookings', { rideId: item.id })}
          >
            <Ionicons name="people-outline" size={16} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>Passengers ({item.bookedSeats})</Text>
          </TouchableOpacity>

          {/* Start Ride button — prominently shown for today's active rides IF at least one booking is accepted */}
          {isActive && item.bookedSeats > 0 && isToday && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.startBtn]}
              onPress={() => handleStatusChange(item, 'IN_PROGRESS')}
              disabled={isActioning}
              activeOpacity={0.7}
            >
              {isActioning
                ? <ActivityIndicator size="small" color="#fff" />
                : <>
                    <LinearGradient 
                      colors={['#2e7d32', '#1b5e20']} 
                      start={{ x: 0, y: 0 }} 
                      end={{ x: 1, y: 0 }}
                      style={styles.startBtnGradient}
                    >
                      <Ionicons name="play" size={16} color="#fff" />
                      <Text style={styles.startBtnText}>START TRIP NOW</Text>
                    </LinearGradient>
                  </>
              }
            </TouchableOpacity>
          )}


          {/* Go to Map — only when IN_PROGRESS */}
          {isInProgress && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.secondary }]}
              onPress={() => navigation.navigate('RideTracking', { rideId: item.id })}
            >
              <Ionicons name="map-outline" size={16} color="#fff" />
              <Text style={styles.startBtnText}>View Map</Text>
            </TouchableOpacity>
          )}

          {/* Complete Ride button — only when IN_PROGRESS */}
          {isInProgress && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.completeBtn]}
              onPress={() => handleStatusChange(item, 'COMPLETED')}
              disabled={isActioning}
            >
              {isActioning
                ? <ActivityIndicator size="small" color="#fff" />
                : <>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                  <Text style={styles.startBtnText}>Complete</Text>
                </>
              }
            </TouchableOpacity>
          )}

          {/* Cancel — only when ACTIVE */}
          {isActive && (
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: COLORS.danger + '50' }]}
              onPress={() => showModal({
                type: 'danger',
                title: 'Cancel Ride?',
                message: 'Are you sure you want to cancel this ride? Passengers will be notified.',
                confirmText: 'Yes, Cancel',
                cancelText: 'No',
              })}
            >
              <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
              <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (initialLoading) {
    return (
      <View style={styles.container}>
        <GradientHeader colors={GRADIENTS.teal as any} title="My Rides" onBack={() => navigation.goBack()} />
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={COLORS.teal} />
          <Text style={styles.loadingText}>Loading your rides...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GradientHeader
        colors={GRADIENTS.teal as any}
        title="My Rides"
        subtitle="Manage your active and completed rides"
        onBack={() => navigation.goBack()}
        rightIcon="add"
        onRightPress={() => navigation.navigate('PostRide')}
      />

      <TabPills
        tabs={TABS}
        activeTab={activeTab}
        onSelect={setActiveTab}
        color={COLORS.teal}
        style={styles.tabs}
      />

      <FlatList
        data={rides}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderRide}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshing={refreshing}
        onRefresh={() => fetchRides(1, true)}
        ListFooterComponent={loading ? <ActivityIndicator color={COLORS.teal} style={{ marginVertical: 16 }} /> : null}
        ListEmptyComponent={
          !refreshing ? (
            <EmptyState
              icon="car-sport-outline"
              title="No Rides Found"
              subtitle="You haven't posted any rides yet. Post your first ride!"
            />
          ) : null
        }
      />

      <View style={{ height: 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: COLORS.gray },
  headerStats: { flexDirection: 'row', gap: 20, marginTop: 12 },
  headerStat: { alignItems: 'center' },
  headerStatVal: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  tabs: { margin: 16 },
  listContent: { padding: 16, paddingBottom: 100 },
  rideCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  inProgressBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7 },
  inProgressText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  rideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, paddingBottom: 0, marginBottom: 14 },
  rideRoute: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  rideDate: { fontSize: 12, color: COLORS.gray, marginTop: 3 },
  progress: { marginHorizontal: 16, marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.lightGray, marginHorizontal: 16, borderRadius: 12, padding: 12, marginBottom: 12 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16, paddingTop: 0 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORS.primary + '40', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, gap: 6, minWidth: 100 },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  startBtn: { 
    paddingVertical: 0, 
    paddingHorizontal: 0, 
    borderWidth: 0,
    minWidth: 150,
  },
  completeBtn: { backgroundColor: COLORS.secondary, borderColor: 'transparent' },
  startBtnGradient: {

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
    width: '100%',
  },
  startBtnText: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  fab: { position: 'absolute', bottom: 24, right: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },

  // History Card Styles
  historyCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#f0f0f0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
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
