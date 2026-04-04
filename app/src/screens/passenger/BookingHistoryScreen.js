import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Modal, TextInput, Linking, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, EmptyState, GradientHeader, StatusBadge } from '../../components';
import { useApp } from '../../context/AppContext';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/errorMessages';
import { bookingsApi, reviewsApi } from '../../services/api';

const PAGE_SIZE = 10;

// ─── Star picker component ────────────────────────────────────────────────────
function StarPicker({ rating, onChange }) {
    return (
        <View style={rStyles.stars}>
            {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => onChange(n)}>
                    <Ionicons
                        name={n <= rating ? 'star' : 'star-outline'}
                        size={36}
                        color={n <= rating ? '#f59e0b' : COLORS.border}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
}

// ─── Review Modal ─────────────────────────────────────────────────────────────
function ReviewModal({ booking, onClose, onSubmit }) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { showToast } = useToast();

    const submit = async () => {
        if (!rating) { showToast('Please select a star rating', 'error'); return; }
        setSubmitting(true);
        const driverId = booking?.ride?.driver?.id;
        const { error } = await reviewsApi.submit({ driverId, rating, comment });
        setSubmitting(false);
        if (error) showToast(parseApiError(error), 'error');
        else {
            showToast('Thank you for your review!', 'success');
            onSubmit(booking.id);
        }
    };

    const driverName = booking?.ride?.driver?.name || 'the driver';

    return (
        <Modal visible transparent animationType="fade" onRequestClose={onClose}>
            <View style={rStyles.overlay}>
                <View style={rStyles.sheet}>
                    {/* Header */}
                    <LinearGradient colors={GRADIENTS.primary} style={rStyles.sheetHeader}>
                        <View style={rStyles.starIcon}>
                            <Ionicons name="star" size={32} color="#f59e0b" />
                        </View>
                        <Text style={rStyles.sheetTitle}>Rate Your Driver</Text>
                        <Text style={rStyles.sheetSub}>How was your ride with {driverName}?</Text>
                    </LinearGradient>

                    <View style={rStyles.sheetBody}>
                        {/* Route recap */}
                        <View style={rStyles.routeRecap}>
                            <Text style={rStyles.routeText}>
                                {booking?.ride?.fromCity || booking?.ride?.from}
                                {' → '}
                                {booking?.ride?.toCity || booking?.ride?.to}
                            </Text>
                            <Text style={rStyles.routeDate}>{booking?.ride?.date}</Text>
                        </View>

                        <StarPicker rating={rating} onChange={setRating} />

                        <View style={rStyles.ratingLabel}>
                            <Text style={rStyles.ratingLabelText}>
                                {rating === 5 ? '⭐ Excellent!' : rating === 4 ? '😊 Good' : rating === 3 ? '😐 Average' : rating === 2 ? '😕 Below Average' : '😞 Poor'}
                            </Text>
                        </View>

                        <TextInput
                            style={rStyles.commentInput}
                            placeholder="Write a comment (optional)..."
                            placeholderTextColor={COLORS.gray}
                            value={comment}
                            onChangeText={setComment}
                            multiline
                            numberOfLines={3}
                            maxLength={300}
                        />

                        <View style={rStyles.btnRow}>
                            <TouchableOpacity style={rStyles.skipBtn} onPress={onClose} disabled={submitting}>
                                <Text style={rStyles.skipBtnText}>Skip</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={rStyles.submitBtn} onPress={submit} disabled={submitting}>
                                {submitting
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <Text style={rStyles.submitBtnText}>Submit Review</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// ─── SOS Modal ────────────────────────────────────────────────────────────────
function SOSModal({ visible, onClose }) {
    const emergencyNumbers = [
        { label: 'Rescue 1122', number: '1122', icon: 'medkit-outline', color: '#ef4444' },
        { label: 'Police 15', number: '15', icon: 'shield-outline', color: '#3b82f6' },
        { label: 'Edhi 115', number: '115', icon: 'heart-outline', color: '#f59e0b' },
        { label: 'Motorway 130', number: '130', icon: 'car-outline', color: '#8b5cf6' },
    ];

    const call = (number) => {
        Linking.openURL(`tel:${number}`).catch(() =>
            Alert.alert('Error', 'Could not open phone dialer.')
        );
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={sosStyles.overlay}>
                <View style={sosStyles.sheet}>
                    <View style={sosStyles.header}>
                        <View style={sosStyles.sosIconWrap}>
                            <Ionicons name="warning" size={28} color="#fff" />
                        </View>
                        <Text style={sosStyles.title}>Emergency SOS</Text>
                        <Text style={sosStyles.sub}>Tap to call emergency services</Text>
                    </View>

                    {emergencyNumbers.map(item => (
                        <TouchableOpacity
                            key={item.number}
                            style={[sosStyles.numberRow, { borderLeftColor: item.color }]}
                            onPress={() => call(item.number)}
                        >
                            <View style={[sosStyles.numIcon, { backgroundColor: item.color + '20' }]}>
                                <Ionicons name={item.icon} size={20} color={item.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={sosStyles.numLabel}>{item.label}</Text>
                                <Text style={sosStyles.numNumber}>{item.number}</Text>
                            </View>
                            <View style={[sosStyles.callBadge, { backgroundColor: item.color }]}>
                                <Ionicons name="call" size={14} color="#fff" />
                                <Text style={sosStyles.callBadgeText}>Call</Text>
                            </View>
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity style={sosStyles.closeBtn} onPress={onClose}>
                        <Text style={sosStyles.closeBtnText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function BookingHistoryScreen({ navigation }) {
    const { cancelBooking } = useApp();
    const { showModal } = useGlobalModal();
    const { showToast } = useToast();

    const [bookings, setBookings] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [reviewBooking, setReviewBooking] = useState(null);
    const [reviewedIds, setReviewedIds] = useState(new Set());
    const [sosVisible, setSosVisible] = useState(false);
    const isFetching = useRef(false); // prevents stale-closure double-fetch

    const fetchBookings = useCallback(async (pageNum, replace = false) => {
        if (isFetching.current && !replace) return;
        isFetching.current = true;
        try {
            pageNum === 1 ? setRefreshing(true) : setLoading(true);
            const { data } = await bookingsApi.myBookings(pageNum, PAGE_SIZE);

            if (!data?.data) {
                if (replace) setBookings([]);
                setHasMore(false);
                return;
            }

            const normalize = b => ({
                ...b,
                ride: b.ride ? { ...b.ride, from: b.ride.fromCity || b.ride.from, to: b.ride.toCity || b.ride.to } : null,
            });
            const items = (data.data || []).map(normalize);
            setBookings(prev => replace ? items : [...prev, ...items]);
            setHasMore(data.meta?.hasNext ?? false);
            setPage(pageNum);
        } catch (err) {
            console.error('Fetch bookings error:', err);
        } finally {
            pageNum === 1 ? setRefreshing(false) : setLoading(false);
            setInitialLoading(false);
            isFetching.current = false;
        }
    }, []);

    useFocusEffect(useCallback(() => {
        let active = true;
        if (active) fetchBookings(1, true);
        return () => { active = false; };
    }, [fetchBookings]));

    const loadMore = () => {
        if (hasMore && !isFetching.current && !refreshing && !initialLoading) {
            fetchBookings(page + 1);
        }
    };

    const confirmCancel = (bookingId) => {
        showModal({
            type: 'danger',
            title: 'Cancel Booking?',
            message: 'Are you sure you want to cancel this booking? This action cannot be undone.',
            confirmText: 'Yes, Cancel',
            cancelText: 'Keep Booking',
            icon: 'close-circle-outline',
            onConfirm: async () => {
                const { error } = await cancelBooking(bookingId);
                if (error) showToast(parseApiError(error), 'error');
                else {
                    showToast('Booking cancelled.', 'info');
                    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b));
                }
            },
        });
    };

    const handleReviewSubmitted = (bookingId) => {
        setReviewedIds(prev => new Set([...prev, bookingId]));
        setReviewBooking(null);
    };

    const renderBooking = ({ item }) => {
        const ride = item.ride;
        if (!ride) return null;
        const fromCity = ride.boardingCity || item.boardingCity || ride.from || '';
        const toCity = ride.exitCity || item.exitCity || ride.to || '';
        const driverName = ride.driver?.name || 'N/A';
        const driverPhone = ride.driver?.phone || '';
        const vehicle = ride.vehicle;
        const vehicleLabel = vehicle ? `${vehicle.brand} · ${vehicle.plateNumber}` : 'N/A';
        const isActive = item.status === 'CONFIRMED';
        const isInProgress = ride.status === 'IN_PROGRESS';
        const isCompleted = item.status === 'COMPLETED';
        const canReview = isCompleted && ride?.driver?.id && !reviewedIds.has(item.id);

        return (
            <View style={styles.card}>
                {/* In-progress banner */}
                {isInProgress && isActive && (
                    <LinearGradient colors={GRADIENTS.teal} style={styles.activeBanner}>
                        <Ionicons name="navigate-outline" size={13} color="#fff" />
                        <Text style={styles.activeBannerText}>Ride is in progress</Text>
                        <TouchableOpacity style={styles.sosBannerBtn} onPress={() => setSosVisible(true)}>
                            <Ionicons name="warning-outline" size={13} color="#fff" />
                            <Text style={styles.sosBannerText}>SOS</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                )}

                <View style={styles.cardHeader}>
                    <View style={styles.routeCol}>
                        <View style={styles.routeRow}>
                            <View style={styles.cityDot} />
                            <Text style={styles.city}>{fromCity}</Text>
                        </View>
                        <View style={styles.routeLine2} />
                        <View style={styles.routeRow}>
                            <View style={[styles.cityDot, { backgroundColor: COLORS.secondary }]} />
                            <Text style={styles.city}>{toCity}</Text>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <StatusBadge status={item.status} />
                        <Text style={styles.dateText}>{ride.date}</Text>
                    </View>
                </View>

                <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                        <View style={styles.detailIcon}>
                            <Ionicons name="person" size={14} color={COLORS.primary} />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>Driver</Text>
                            <Text style={styles.detailValue}>{driverName}</Text>
                            {!!driverPhone && <Text style={styles.detailSub}>{driverPhone}</Text>}
                        </View>
                    </View>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailItem}>
                        <View style={[styles.detailIcon, { backgroundColor: '#e0f7fa' }]}>
                            <Ionicons name="car" size={14} color={COLORS.teal} />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>Vehicle</Text>
                            <Text style={styles.detailValue}>{vehicleLabel}</Text>
                            {vehicle?.type && <Text style={styles.detailSub}>{vehicle.type}{vehicle.ac ? ' · AC' : ''}</Text>}
                        </View>
                    </View>
                </View>

                <View style={styles.chipsRow}>
                    <View style={styles.chip}>
                        <Ionicons name="time-outline" size={12} color={COLORS.gray} />
                        <Text style={styles.chipText}>{ride.departureTime}</Text>
                    </View>
                    <View style={styles.chip}>
                        <Ionicons name="people-outline" size={12} color={COLORS.gray} />
                        <Text style={styles.chipText}>{item.seats} seat{item.seats !== 1 ? 's' : ''}</Text>
                    </View>
                    {item.boardingCity && item.boardingCity !== ride.from && (
                        <View style={[styles.chip, { backgroundColor: '#eff6ff' }]}>
                            <Ionicons name="git-branch-outline" size={12} color={COLORS.primary} />
                            <Text style={[styles.chipText, { color: COLORS.primary }]}>Segment</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardFooter}>
                    <View>
                        <Text style={styles.amountLabel}>Total Paid</Text>
                        <Text style={styles.amountValue}>Rs {item.totalAmount?.toLocaleString()}</Text>
                    </View>
                    <View style={styles.footerActions}>
                        {/* SOS button for active bookings */}
                        {isActive && (
                            <TouchableOpacity style={styles.sosBtn} onPress={() => setSosVisible(true)}>
                                <Ionicons name="warning-outline" size={15} color="#ef4444" />
                                <Text style={styles.sosBtnText}>SOS</Text>
                            </TouchableOpacity>
                        )}
                        {/* Cancel button */}
                        {isActive && (
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => confirmCancel(item.id)}>
                                <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                        )}
                        {/* Rate driver button */}
                        {canReview && (
                            <TouchableOpacity
                                style={styles.rateBtn}
                                onPress={() => setReviewBooking(item)}
                            >
                                <Ionicons name="star-outline" size={15} color="#f59e0b" />
                                <Text style={styles.rateBtnText}>Rate Driver</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    if (initialLoading) {
        return (
            <View style={styles.container}>
                <GradientHeader
                    colors={GRADIENTS.primary}
                    title="My Bookings"
                    subtitle="Loading..."
                    onBack={() => navigation.goBack()}
                />
                <View style={styles.loadingCenter}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Fetching your bookings...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <GradientHeader
                colors={GRADIENTS.primary}
                title="My Bookings"
                subtitle={`${bookings.length} booking${bookings.length !== 1 ? 's' : ''}`}
                onBack={() => navigation.goBack()}
            />
            <FlatList
                data={bookings}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={renderBooking}
                onEndReached={loadMore}
                onEndReachedThreshold={0.3}
                refreshing={refreshing}
                onRefresh={() => fetchBookings(1, true)}
                ListFooterComponent={loading ? <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} /> : null}
                ListEmptyComponent={
                    !refreshing ? (
                        <EmptyState
                            icon="receipt-outline"
                            title="No Bookings"
                            subtitle="You haven't booked any rides yet."
                        />
                    ) : null
                }
            />

            {/* Review Modal */}
            {reviewBooking && (
                <ReviewModal
                    booking={reviewBooking}
                    onClose={() => setReviewBooking(null)}
                    onSubmit={handleReviewSubmitted}
                />
            )}

            {/* SOS Modal */}
            <SOSModal visible={sosVisible} onClose={() => setSosVisible(false)} />
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { fontSize: 14, color: COLORS.gray },
    listContent: { padding: 16, paddingBottom: 80 },
    card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
    activeBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7 },
    activeBannerText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#fff' },
    sosBannerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    sosBannerText: { fontSize: 11, fontWeight: '800', color: '#fff' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, paddingBottom: 0, marginBottom: 14 },
    routeCol: { flex: 1 },
    routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    routeLine2: { width: 2, height: 12, backgroundColor: COLORS.border, marginLeft: 3, marginVertical: 2 },
    cityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
    city: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
    headerRight: { alignItems: 'flex-end', gap: 6 },
    dateText: { fontSize: 11, color: COLORS.gray, fontWeight: '600' },
    detailRow: { flexDirection: 'row', backgroundColor: COLORS.lightGray, marginHorizontal: 16, borderRadius: 14, padding: 12, marginBottom: 12 },
    detailItem: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    detailDivider: { width: 1, backgroundColor: COLORS.border, marginHorizontal: 8 },
    detailIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    detailLabel: { fontSize: 10, color: COLORS.gray, marginBottom: 2 },
    detailValue: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
    detailSub: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14, paddingHorizontal: 16 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.lightGray, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    chipText: { fontSize: 12, fontWeight: '600', color: COLORS.gray },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12, paddingHorizontal: 16, paddingBottom: 14 },
    amountLabel: { fontSize: 11, color: COLORS.gray },
    amountValue: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
    footerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    sosBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff0f0', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: '#ef444430' },
    sosBtnText: { fontSize: 12, fontWeight: '800', color: '#ef4444' },
    cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff0f0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.danger + '30' },
    cancelBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.danger },
    rateBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fffbeb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#f59e0b40' },
    rateBtnText: { fontSize: 13, fontWeight: '700', color: '#d97706' },
});

// ─── Review modal styles ──────────────────────────────────────────────────────
const rStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
    sheetHeader: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, paddingHorizontal: 20 },
    starIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    sheetTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
    sheetSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
    sheetBody: { padding: 24 },
    routeRecap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 12, marginBottom: 20 },
    routeText: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
    routeDate: { fontSize: 12, color: COLORS.gray },
    stars: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 },
    ratingLabel: { alignItems: 'center', marginBottom: 16 },
    ratingLabelText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
    commentInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14, padding: 14, fontSize: 14, color: COLORS.textPrimary, minHeight: 80, textAlignVertical: 'top', marginBottom: 20 },
    btnRow: { flexDirection: 'row', gap: 12 },
    skipBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border },
    skipBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.gray },
    submitBtn: { flex: 2, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.primary },
    submitBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});

// ─── SOS modal styles ─────────────────────────────────────────────────────────
const sosStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 32 },
    header: { alignItems: 'center', paddingTop: 28, paddingBottom: 20 },
    sosIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
    sub: { fontSize: 14, color: COLORS.gray },
    numberRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 20, marginBottom: 10, backgroundColor: COLORS.lightGray, borderRadius: 14, padding: 14, borderLeftWidth: 4 },
    numIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    numLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
    numNumber: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
    callBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    callBadgeText: { fontSize: 12, fontWeight: '800', color: '#fff' },
    closeBtn: { marginHorizontal: 20, marginTop: 12, alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border },
    closeBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.gray },
});
