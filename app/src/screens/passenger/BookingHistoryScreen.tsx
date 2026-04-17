import React, { useCallback, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Modal, TextInput, Linking, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, EmptyState, GradientHeader, StatusBadge } from '../../components';
import { useApp } from '../../context/AppContext';
import { useSocketData } from '../../context/SocketDataContext';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/errorMessages';
import { reviewsApi } from '../../services/api';

// ─── Star picker ─────────────────────────────────────────────────────────────
function StarPicker({ rating, onChange }) {
    return (
        <View style={rStyles.stars}>
            {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => onChange(n)}>
                    <Ionicons name={(n <= rating ? 'star' : 'star-outline') as any} size={36}
                        color={n <= rating ? '#f59e0b' : COLORS.border} />
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
        const { error } = await reviewsApi.submit({
            revieweeId: booking?.ride?.driver?.id,
            rideId: booking?.rideId,
            targetRole: 'DRIVER',
            rating,
            comment,
        });
        setSubmitting(false);
        if (error) showToast(parseApiError(error), 'error');
        else { showToast('Thank you for your review!', 'success'); onSubmit(booking.id); }
    };

    return (
        <Modal visible transparent animationType="fade" onRequestClose={onClose}>
            <View style={rStyles.overlay}>
                <View style={rStyles.sheet}>
                    <LinearGradient colors={GRADIENTS.primary as any} style={rStyles.sheetHeader}>
                        <View style={rStyles.starIcon}><Ionicons name="star" size={32} color="#f59e0b" /></View>
                        <Text style={rStyles.sheetTitle}>Rate Your Driver</Text>
                        <Text style={rStyles.sheetSub}>How was your ride with {booking?.ride?.driver?.name || 'the driver'}?</Text>
                    </LinearGradient>
                    <View style={rStyles.sheetBody}>
                        <View style={rStyles.routeRecap}>
                            <Text style={rStyles.routeText}>
                                {booking?.ride?.fromCity || booking?.ride?.from}{' → '}
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
                        <TextInput style={rStyles.commentInput} placeholder="Write a comment (optional)..."
                            placeholderTextColor={COLORS.gray} value={comment} onChangeText={setComment}
                            multiline numberOfLines={3} maxLength={300} />
                        <View style={rStyles.btnRow}>
                            <TouchableOpacity style={rStyles.skipBtn} onPress={onClose} disabled={submitting}>
                                <Text style={rStyles.skipBtnText}>Skip</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={rStyles.submitBtn} onPress={submit} disabled={submitting}>
                                {submitting ? <ActivityIndicator size="small" color="#fff" />
                                    : <Text style={rStyles.submitBtnText}>Submit Review</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// ─── Cancel Reason Modal ──────────────────────────────────────────────────────
function CancelReasonModal({ visible, onClose, onSubmit }) {
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const submit = async () => {
        if (!reason.trim()) return;
        setSubmitting(true);
        await onSubmit(reason.trim());
        setSubmitting(false);
    };
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={rStyles.overlay}>
                <View style={rStyles.sheet}>
                    <LinearGradient colors={['#fee2e2', '#fecaca']} style={rStyles.sheetHeader}>
                        <View style={[rStyles.starIcon, { backgroundColor: 'rgba(239,68,68,0.2)' }]}>
                            <Ionicons name="alert-circle" size={32} color="#ef4444" />
                        </View>
                        <Text style={[rStyles.sheetTitle, { color: '#b91c1c' }]}>Cancel Booking</Text>
                        <Text style={[rStyles.sheetSub, { color: '#991b1b' }]}>Please tell the driver why you are cancelling.</Text>
                    </LinearGradient>
                    <View style={rStyles.sheetBody}>
                        <TextInput style={rStyles.commentInput} placeholder="Reason for cancellation..."
                            placeholderTextColor={COLORS.gray} value={reason} onChangeText={setReason}
                            multiline numberOfLines={3} maxLength={200} />
                        <View style={rStyles.btnRow}>
                            <TouchableOpacity style={rStyles.skipBtn} onPress={onClose} disabled={submitting}>
                                <Text style={rStyles.skipBtnText}>Go Back</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[rStyles.submitBtn, { backgroundColor: COLORS.danger, opacity: reason.trim().length ? 1 : 0.5 }]}
                                onPress={submit} disabled={!reason.trim().length || submitting}>
                                {submitting ? <ActivityIndicator size="small" color="#fff" />
                                    : <Text style={rStyles.submitBtnText}>Cancel Booking</Text>}
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
        { label: 'Rescue 1122', number: '1122', icon: 'medkit-outline',  color: '#ef4444' },
        { label: 'Police 15',   number: '15',   icon: 'shield-outline',  color: '#3b82f6' },
        { label: 'Edhi 115',    number: '115',  icon: 'heart-outline',   color: '#f59e0b' },
        { label: 'Motorway 130',number: '130',  icon: 'car-outline',     color: '#8b5cf6' },
    ];
    const call = (number) => {
        Linking.openURL(`tel:${number}`).catch(() => Alert.alert('Error', 'Could not open phone dialer.'));
        onClose();
    };
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={sosStyles.overlay}>
                <View style={sosStyles.sheet}>
                    <View style={sosStyles.header}>
                        <View style={sosStyles.sosIconWrap}><Ionicons name="warning" size={28} color="#fff" /></View>
                        <Text style={sosStyles.title}>Emergency SOS</Text>
                        <Text style={sosStyles.sub}>Tap to call emergency services</Text>
                    </View>
                    {emergencyNumbers.map(item => (
                        <TouchableOpacity key={item.number} style={[sosStyles.numberRow, { borderLeftColor: item.color }]}
                            onPress={() => call(item.number)}>
                            <View style={[sosStyles.numIcon, { backgroundColor: item.color + '20' }]}>
                                <Ionicons name={item.icon as any} size={20} color={item.color} />
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
    const { myBookings, myBookingsState, loadMyBookings, removeBooking } = useSocketData();
    const { showModal } = useGlobalModal();
    const { showToast } = useToast();

    const [reviewBooking, setReviewBooking]     = useState(null);
    const [reviewedIds, setReviewedIds]         = useState(new Set());
    const [sosVisible, setSosVisible]           = useState(false);
    const [cancelTarget, setCancelTarget]       = useState(null);
    const [cancellingId, setCancellingId]       = useState<string | null>(null);
    const [refreshing, setRefreshing]           = useState(false);

    // Load once on first focus; subsequent updates come via socket
    useFocusEffect(useCallback(() => {
        if (!myBookingsState.loaded) loadMyBookings();
    }, [myBookingsState.loaded]));

    const onRefresh = async () => {
        setRefreshing(true);
        await loadMyBookings(true);
        setRefreshing(false);
    };

    const executeCancel = async (reason: string | null, bookingId?: string) => {
        const targetId = bookingId ?? cancelTarget;
        if (!targetId) return;
        setCancellingId(targetId);
        const { error } = await cancelBooking(targetId, reason);
        setCancellingId(null);
        if (error) showToast(parseApiError(error), 'error');
        else {
            showToast('Booking cancelled.', 'info');
            removeBooking(targetId);
        }
        setCancelTarget(null);
    };

    const confirmCancel = (booking) => {
        if (booking.status === 'CONFIRMED') {
            setCancelTarget(booking.id);
        } else {
            showModal({
                type: 'danger', title: 'Cancel Booking?',
                message: 'Are you sure you want to cancel this booking? This action cannot be undone.',
                confirmText: 'Yes, Cancel', cancelText: 'Keep Booking', icon: 'close-circle-outline',
                onConfirm: async () => { await executeCancel(null, booking.id); },
            });
        }
    };

    const handleReviewSubmitted = (bookingId) => {
        setReviewedIds(prev => new Set([...prev, bookingId]));
        setReviewBooking(null);
    };

    const renderBooking = ({ item }) => {
        const ride       = item.ride;
        if (!ride) return null;
        const fromCity      = ride.boardingCity || item.boardingCity || ride.from || '';
        const toCity        = ride.exitCity || item.exitCity || ride.to || '';
        const driverName    = ride.driver?.name || 'N/A';
        const driverPhone   = ride.driver?.phone || '';
        const vehicle       = ride.vehicle;
        const vehicleLabel  = vehicle ? `${vehicle.brand} · ${vehicle.plateNumber}` : 'N/A';
        const isActive      = item.status === 'CONFIRMED';
        const isInProgress  = ride.status === 'IN_PROGRESS';
        const isCompleted   = item.status === 'COMPLETED';
        const canReview     = isCompleted && ride?.driver?.id && !reviewedIds.has(item.id);
        const isCancelling  = cancellingId === item.id;

        return (
            <View style={styles.card}>
                {isInProgress && isActive && (
                    <LinearGradient colors={GRADIENTS.teal as any} style={styles.activeBanner}>
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
                        <View>
                            <Text style={styles.detailLabel}>Driver</Text>
                            <Text style={styles.detailValue}>{driverName}</Text>
                            {!!driverPhone && <Text style={styles.detailSub}>{driverPhone}</Text>}
                        </View>
                    </View>
                    <View style={styles.detailDivider} />
                    <View style={[styles.detailItem, { flexDirection: 'column', alignItems: 'flex-end', gap: 6 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.detailValue}>{vehicleLabel}</Text>
                            <Ionicons name="car-outline" size={14} color={COLORS.teal} />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.detailSub}>{ride.departureTime}</Text>
                            <Ionicons name="time-outline" size={14} color={COLORS.gray} />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.detailSub}>{item.seats} seat{item.seats !== 1 ? 's' : ''}</Text>
                            <Ionicons name="people-outline" size={14} color={COLORS.gray} />
                        </View>
                    </View>
                </View>
                {item.boardingCity && item.boardingCity !== ride.from && (
                    <View style={styles.chipsRow}>
                        <View style={[styles.chip, { backgroundColor: '#eff6ff' }]}>
                            <Ionicons name="git-branch-outline" size={12} color={COLORS.primary} />
                            <Text style={[styles.chipText, { color: COLORS.primary }]}>Partial Route Segment</Text>
                        </View>
                    </View>
                )}
                <View style={styles.cardFooter}>
                    <View>
                        <Text style={styles.amountLabel}>Total Paid</Text>
                        <Text style={styles.amountValue}>Rs {item.totalAmount?.toLocaleString()}</Text>
                    </View>
                    <View style={styles.footerActions}>
                        {isInProgress && isActive && (
                            <TouchableOpacity style={styles.joinMapBtn}
                                onPress={() => navigation.navigate('RideTracking', { rideId: ride.id })}>
                                <LinearGradient colors={GRADIENTS.primary as any} style={styles.joinMapGrad}>
                                    <Ionicons name="map" size={16} color="#fff" />
                                    <Text style={styles.joinMapText}>JOIN LIVE MAP</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                        {isInProgress && (
                            <TouchableOpacity style={styles.sosBtn} onPress={() => setSosVisible(true)}>
                                <Ionicons name="warning-outline" size={15} color="#ef4444" />
                                <Text style={styles.sosBtnText}>SOS</Text>
                            </TouchableOpacity>
                        )}
                        {isActive && !isInProgress && (
                            <TouchableOpacity style={[styles.cancelBtn, isCancelling && { opacity: 0.5 }]}
                                onPress={() => confirmCancel(item)} disabled={isCancelling}>
                                {isCancelling
                                    ? <ActivityIndicator size="small" color={COLORS.danger} />
                                    : <><Ionicons name="close-circle-outline" size={16} color={COLORS.danger} /><Text style={styles.cancelBtnText}>Cancel</Text></>
                                }
                            </TouchableOpacity>
                        )}
                        {isActive && (
                            <TouchableOpacity style={styles.chatBtn}
                                onPress={() => navigation.navigate('Chat', {
                                    bookingId: item.id,
                                    otherUser: ride.driver,
                                    rideInfo: { label: `${ride.fromCity} → ${ride.toCity}` },
                                })}>
                                <Ionicons name="chatbubble-ellipses-outline" size={15} color={COLORS.primary} />
                                <Text style={styles.chatBtnText}>Chat</Text>
                            </TouchableOpacity>
                        )}
                        {canReview && (
                            <TouchableOpacity style={styles.rateBtn} onPress={() => setReviewBooking(item)}>
                                <Ionicons name="star-outline" size={15} color="#f59e0b" />
                                <Text style={styles.rateBtnText}>Rate Driver</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    const isInitialLoad = !myBookingsState.loaded && myBookingsState.loading;

    if (isInitialLoad) {
        return (
            <View style={styles.container}>
                <GradientHeader colors={GRADIENTS.primary as any} title="My Bookings" subtitle="Loading..."
                    onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />
                <View style={styles.loadingCenter}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Fetching your bookings...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <GradientHeader colors={GRADIENTS.primary as any} title="My Bookings"
                subtitle={`${myBookings.length} active booking${myBookings.length !== 1 ? 's' : ''}`}
                onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />
            <FlatList
                data={myBookings}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={renderBooking}
                refreshing={refreshing}
                onRefresh={onRefresh}
                ListEmptyComponent={
                    !refreshing ? (
                        <EmptyState icon="receipt-outline" title="No Active Bookings"
                            subtitle="You have no pending or confirmed bookings." />
                    ) : null
                }
            />
            {reviewBooking && (
                <ReviewModal booking={reviewBooking} onClose={() => setReviewBooking(null)} onSubmit={handleReviewSubmitted} />
            )}
            <CancelReasonModal visible={!!cancelTarget} onClose={() => setCancelTarget(null)} onSubmit={executeCancel} />
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
    chatBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#eff6ff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary + '30' },
    chatBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
    joinMapBtn: { borderRadius: 10, overflow: 'hidden', marginLeft: 5 },
    joinMapGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
    joinMapText: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
});

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
