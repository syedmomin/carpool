import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator,
    RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, GRADIENTS, EmptyState, GradientHeader, StatusBadge } from '../../components';
import { bookingsApi } from '../../services/api';

export default function PastBookingsScreen({ navigation }) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const isFetching = useRef(false);

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
            const items = bookingsArray.map(normalize);
            
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

    const renderBooking = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.routeCol}>
                    <Text style={styles.cityText}>{item.ride?.fromCity || 'Unknown'}</Text>
                    <Ionicons name="arrow-forward" size={14} color={COLORS.gray} />
                    <Text style={styles.cityText}>{item.ride?.toCity || 'Unknown'}</Text>
                </View>
                <StatusBadge status={item.status} />
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
        </View>
    );

    return (
        <View style={styles.container}>
            <GradientHeader 
                colors={GRADIENTS.primary as any} 
                title="Booking History" 
                subtitle="All your past trips"
                onBack={() => navigation.goBack()} 
            />
            <FlatList
                data={bookings}
                keyExtractor={item => item.id}
                renderItem={renderBooking}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    !loading && (
                        <EmptyState 
                            icon="receipt-outline" 
                            title="No History" 
                            subtitle="Your past bookings will appear here." 
                        />
                    )
                }
                ListFooterComponent={loading && page > 1 ? <ActivityIndicator color={COLORS.primary} style={{ margin: 20 }} /> : null}
            />
        </View>
    );
}

import { Ionicons } from '@expo/vector-icons';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    listContent: { padding: 20, paddingBottom: 40 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f0f0f0' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    routeCol: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    cityText: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
    dateText: { fontSize: 12, color: COLORS.gray, fontWeight: '600' },
    driverText: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
    priceCol: { alignItems: 'flex-end' },
    priceLabel: { fontSize: 9, color: COLORS.gray, textTransform: 'uppercase' },
    priceValue: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
});
