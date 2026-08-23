import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
    View, Text, StyleSheet, SectionList, ActivityIndicator, Pressable,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, CURVE, EmptyState, AppBar, StatusPill, TabPills } from '../../components';
import ReviewModal from '../../components/ReviewModal';
import { bookingsApi } from '../../services/api';
import { groupByMonth, isUpcomingByDate } from '../../utils/bookingGrouping';

export default function PastBookingsScreen({ navigation }) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [reviewBooking, setReviewBooking] = useState<any>(null);
    const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
    const isFetching = useRef(false);

    // "Upcoming" here still only contains terminal (completed/cancelled/etc.)
    // bookings — e.g. a booking cancelled ahead of a ride that hasn't happened
    // yet. "Past" (rides that already happened) is the more relevant default
    // for this screen per its purpose.
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('past');

    const fetchBookings = useCallback(async (pageNum = 1, replace = false) => {
        if (isFetching.current) return;
        isFetching.current = true;
        try {
            pageNum === 1 ? setRefreshing(true) : setLoading(true);
            const { data: responseBody } = await bookingsApi.myBookings(pageNum, 10);

            const apiData = responseBody?.data;
            const bookingsArray = Array.isArray(apiData) ? apiData : (Array.isArray(apiData?.data) ? apiData.data : []);

            const normalize = b => ({
                ...b,
                ride: b.ride ? { ...b.ride, from: b.ride.fromCity || b.ride.from, to: b.ride.toCity || b.ride.to } : null,
            });
            // Only past/terminal bookings belong in history (active ones live in
            // the Bookings tab) — otherwise this list duplicates active bookings.
            const TERMINAL = ['COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED'];
            const items = bookingsArray.map(normalize).filter((b: any) => TERMINAL.includes(b.status));

            setBookings(prev => replace ? items : [...prev, ...items]);
            setHasMore(apiData?.meta?.hasNext ?? (responseBody?.meta?.hasNext ?? false));
            setPage(pageNum);
        } catch (err) {
            console.error('Fetch past bookings error:', err);
        } finally {
            setRefreshing(false);
            setLoading(false);
            isFetching.current = false;
        }
    }, []);

    useFocusEffect(useCallback(() => {
        fetchBookings(1, true);
    }, [fetchBookings]));

    const onRefresh = () => {
        fetchBookings(1, true);
    };

    const loadMore = () => {
        if (hasMore && !isFetching.current) {
            fetchBookings(page + 1);
        }
    };

    const tabFiltered = useMemo(
        () => bookings.filter((b: any) => isUpcomingByDate(b) === (activeTab === 'upcoming')),
        [bookings, activeTab]
    );
    const sections = useMemo(() => groupByMonth(tabFiltered), [tabFiltered]);
    const upcomingCount = useMemo(() => bookings.filter((b: any) => isUpcomingByDate(b)).length, [bookings]);
    const pastCount = bookings.length - upcomingCount;

    const renderBooking = ({ item }: any) => (
        <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('PastBookingDetail', { booking: item })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.routeCol}>
                    <Text style={styles.cityText}>{item.ride?.fromCity || 'Unknown'}</Text>
                    <Ionicons name="arrow-forward" size={14} color={COLORS.gray} />
                    <Text style={styles.cityText}>{item.ride?.toCity || 'Unknown'}</Text>
                </View>
                <StatusPill status={item.status} />
            </View>
            <View style={styles.cardFooter}>
                <View>
                    <Text style={styles.dateText}>{item.ride?.date || 'N/A'}</Text>
                    <Text style={styles.driverText}>Driver: {item.ride?.driver?.name || 'N/A'}</Text>
                </View>
                <View style={styles.priceCol}>
                    <Text style={styles.priceLabel}>Paid</Text>
                    <Text style={styles.priceValue}>Rs {item.totalAmount?.toLocaleString()}</Text>
                </View>
            </View>
            {item.status === 'COMPLETED' && item.ride?.driver?.id && !reviewedIds.has(item.id) && (
                <Pressable style={styles.rateBtn} onPress={() => setReviewBooking(item)}>
                    <Ionicons name="star-outline" size={16} color={COLORS.warning} />
                    <Text style={styles.rateBtnText}>Rate Driver</Text>
                </Pressable>
            )}
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <AppBar title="Past Bookings" onBack={() => navigation.goBack()} />

            <TabPills
                style={styles.tabPills}
                tabs={[
                    { label: `Upcoming${upcomingCount ? ` (${upcomingCount})` : ''}`, value: 'upcoming' },
                    { label: `Past${pastCount ? ` (${pastCount})` : ''}`, value: 'past' },
                ]}
                activeTab={activeTab}
                onSelect={(v) => setActiveTab(v)}
            />

            <SectionList
                sections={sections}
                keyExtractor={item => item.id}
                renderItem={renderBooking}
                renderSectionHeader={({ section }) => (
                    <Text style={styles.sectionHeader}>{section.title}</Text>
                )}
                stickySectionHeadersEnabled={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    !loading && (
                        <EmptyState
                            icon="receipt-outline"
                            title={activeTab === 'upcoming' ? 'Nothing Upcoming' : 'No Past Bookings'}
                            subtitle={activeTab === 'upcoming'
                                ? 'Cancelled bookings for rides that haven\'t happened yet will appear here.'
                                : 'Your completed and cancelled bookings will appear here.'}
                        />
                    )
                }
                ListFooterComponent={loading && page > 1 ? <ActivityIndicator color={COLORS.primary} style={{ margin: 20 }} /> : null}
            />
            {reviewBooking && (
                <ReviewModal
                    visible={!!reviewBooking}
                    rideId={reviewBooking.rideId || reviewBooking.ride?.id}
                    revieweeId={reviewBooking.ride?.driver?.id || ''}
                    revieweeName={reviewBooking.ride?.driver?.name || 'your Driver'}
                    targetRole="DRIVER"
                    routeLabel={`${reviewBooking.ride?.fromCity || ''} > ${reviewBooking.ride?.toCity || ''}`}
                    routeDate={reviewBooking.ride?.date}
                    onClose={() => setReviewBooking(null)}
                    onSubmit={() => { setReviewedIds(prev => new Set([...prev, reviewBooking.id])); setReviewBooking(null); }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    tabPills: { marginHorizontal: 20, marginBottom: 4 },
    listContent: { padding: 20, paddingBottom: 32 },
    sectionHeader: { fontSize: 13, fontWeight: '800', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 12, marginBottom: 10 },
    card: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, ...CURVE },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    routeCol: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    cityText: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
    dateText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
    driverText: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
    priceCol: { alignItems: 'flex-end' },
    priceLabel: { fontSize: 9, color: COLORS.textSecondary, textTransform: 'uppercase' },
    priceValue: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
    rateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border },
    rateBtnText: { color: COLORS.warning, fontWeight: '700', fontSize: 13 },
});
