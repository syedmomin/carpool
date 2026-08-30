import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, SectionList, Pressable,
    ActivityIndicator, Modal, TextInput, Linking, Alert, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, GRADIENTS, OVERLAYS, CURVE, EmptyState, AppBar, StatusPill, TabPills, BookingCardSkeleton, Avatar, RouteTag } from '../../components';
import { useApp } from '../../context/AppContext';
import { useSocketData } from '../../context/SocketDataContext';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/errorMessages';
import { reviewsApi, bookingsApi } from '../../services/api';
import { groupByMonth } from '../../utils/bookingGrouping';

// ─── Star picker ─────────────────────────────────────────────────────────────
function StarPicker({ rating, onChange }) {
    return (
        <View style={rStyles.stars}>
            {[1, 2, 3, 4, 5].map(n => (
                <Pressable key={n} onPress={() => onChange(n)}>
                    <Ionicons name={(n <= rating ? 'star' : 'star-outline') as any} size={36}
                        color={n <= rating ? COLORS.warning : COLORS.border} />
                </Pressable>
            ))}
        </View>
    );
}

// ─── Review Modal ─────────────────────────────────────────────────────────────
function ReviewModal({ booking, onClose, onSubmit }) {
    const insets = useSafeAreaInsets();
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
        else { showToast('Thanks for your review', 'success'); onSubmit(booking.id, booking?.ride?.id); }
    };

    return (
        <Modal visible transparent animationType="fade" onRequestClose={onClose}>
            <View style={rStyles.overlay}>
                <View style={rStyles.sheet}>
                    <LinearGradient colors={GRADIENTS.primary as any} style={rStyles.sheetHeader}>
                        <View style={rStyles.starIcon}><Ionicons name="star" size={32} color={COLORS.warning} /></View>
                        <Text style={rStyles.sheetTitle}>Rate Your Driver</Text>
                        <Text style={rStyles.sheetSub}>How was your ride with {booking?.ride?.driver?.name || 'the driver'}?</Text>
                    </LinearGradient>
                    <View style={[rStyles.sheetBody, { paddingBottom: 24 + insets.bottom }]}>
                        <View style={rStyles.routeRecap}>
                            <Text style={rStyles.routeText}>
                                {booking?.ride?.fromCity || booking?.ride?.from}{' > '}
                                {booking?.ride?.toCity || booking?.ride?.to}
                            </Text>
                            <Text style={rStyles.routeDate}>{booking?.ride?.date}</Text>
                        </View>
                        <StarPicker rating={rating} onChange={setRating} />
                        <View style={rStyles.ratingLabel}>
                            <Text style={rStyles.ratingLabelText}>
                                {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Below average' : 'Poor'}
                            </Text>
                        </View>
                        <TextInput style={rStyles.commentInput} placeholder="Write a comment (optional)..."
                            placeholderTextColor={COLORS.gray} value={comment} onChangeText={setComment}
                            multiline numberOfLines={3} maxLength={300} />
                        <View style={rStyles.btnRow}>
                            <Pressable style={rStyles.skipBtn} onPress={onClose} disabled={submitting}>
                                <Text style={rStyles.skipBtnText}>Skip</Text>
                            </Pressable>
                            <Pressable style={rStyles.submitBtn} onPress={submit} disabled={submitting}>
                                <LinearGradient colors={GRADIENTS.primary as any} style={rStyles.submitInner}>
                                    {submitting ? <ActivityIndicator size="small" color="#fff" />
                                        : <Text style={rStyles.submitBtnText}>Submit Review</Text>}
                                </LinearGradient>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// ─── Cancel Reason Modal ──────────────────────────────────────────────────────
function CancelReasonModal({ visible, onClose, onSubmit }) {
    const insets = useSafeAreaInsets();
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
                    <View style={[rStyles.sheetBody, { paddingBottom: 24 + insets.bottom }]}>
                        <TextInput style={rStyles.commentInput} placeholder="Reason for cancellation..."
                            placeholderTextColor={COLORS.gray} value={reason} onChangeText={setReason}
                            multiline numberOfLines={3} maxLength={200} />
                        <View style={rStyles.btnRow}>
                            <Pressable style={rStyles.skipBtn} onPress={onClose} disabled={submitting}>
                                <Text style={rStyles.skipBtnText}>Go Back</Text>
                            </Pressable>
                            <Pressable
                                style={[rStyles.submitBtn, rStyles.submitInner, { backgroundColor: COLORS.danger, opacity: reason.trim().length ? 1 : 0.5 }]}
                                onPress={submit} disabled={!reason.trim().length || submitting}>
                                {submitting ? <ActivityIndicator size="small" color="#fff" />
                                    : <Text style={rStyles.submitBtnText}>Cancel Booking</Text>}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// ─── SOS Modal ────────────────────────────────────────────────────────────────
function SOSModal({ visible, onClose }) {
    const insets = useSafeAreaInsets();
    const emergencyNumbers = [
        { label: 'Rescue 1122', number: '1122', icon: 'medkit-outline',  color: '#ef4444' },
        { label: 'Police 15',   number: '15',   icon: 'shield-outline',  color: '#3b82f6' },
        { label: 'Edhi 115',    number: '115',  icon: 'heart-outline',   color: COLORS.warning },
        { label: 'Motorway 130',number: '130',  icon: 'car-outline',     color: '#8b5cf6' },
    ];
    const call = (number) => {
        Linking.openURL(`tel:${number}`).catch(() => Alert.alert('Error', 'Could not open phone dialer.'));
        onClose();
    };
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={sosStyles.overlay}>
                <View style={[sosStyles.sheet, { paddingBottom: 20 + insets.bottom }]}>
                    <View style={sosStyles.header}>
                        <View style={sosStyles.sosIconWrap}><Ionicons name="warning" size={28} color="#fff" /></View>
                        <Text style={sosStyles.title}>Emergency SOS</Text>
                        <Text style={sosStyles.sub}>Tap to call emergency services</Text>
                    </View>
                    {emergencyNumbers.map(item => (
                        <Pressable key={item.number} style={[sosStyles.numberRow, { borderLeftColor: item.color }]}
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
                        </Pressable>
                    ))}
                    <Pressable style={sosStyles.closeBtn} onPress={onClose}>
                        <Text style={sosStyles.closeBtnText}>Close</Text>
                    </Pressable>
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

    const REVIEWED_KEY = '@reviewed_booking_ids';
    const [reviewBooking, setReviewBooking]     = useState(null);
    const [reviewedIds, setReviewedIds]         = useState<Set<string>>(new Set());
    // Server-truth set of ride IDs the passenger has already reviewed — the
    // local AsyncStorage set above only hides the button instantly right
    // after submitting on THIS device; this one is what actually stops a
    // stale "Rate Driver" button from reappearing after a reinstall or on
    // another device, since it reflects real reviews in the database.
    const [reviewedRideIds, setReviewedRideIds] = useState<Set<string>>(new Set());

    // Persist reviewed booking IDs so the "Rate Driver" button doesn't reappear
    // after navigating away and returning to this screen.
    useEffect(() => {
        AsyncStorage.getItem(REVIEWED_KEY).then(raw => {
            if (raw) {
                try { setReviewedIds(new Set(JSON.parse(raw))); } catch (_) {}
            }
        });
    }, []);

    const fetchReviewedRides = useCallback(async () => {
        const { data } = await reviewsApi.myGiven();
        const reviews = data?.data?.reviews || [];
        setReviewedRideIds(new Set(reviews.map((r: any) => r.rideId).filter(Boolean)));
    }, []);
    useFocusEffect(useCallback(() => { fetchReviewedRides(); }, [fetchReviewedRides]));
    const [sosVisible, setSosVisible]           = useState(false);
    const [cancelTarget, setCancelTarget]       = useState(null);
    const [cancellingId, setCancellingId]       = useState<string | null>(null);
    const [refreshing, setRefreshing]           = useState(false);
    const [addTarget, setAddTarget]             = useState<any>(null);
    const [addCount, setAddCount]               = useState(1);
    const [addLoading, setAddLoading]           = useState(false);

    // "Cancelled" is an additional filtered view derived from the SAME
    // pastBookings list already fetched for "Past", narrowed to the
    // cancelled/rejected/expired statuses. No new API call needed for it.
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
    const [pastBookings, setPastBookings] = useState<any[]>([]);
    const [pastLoading, setPastLoading] = useState(true);
    const [pastLoaded, setPastLoaded] = useState(false);

    const fetchPastBookings = useCallback(async () => {
        setPastLoading(true);
        try {
            const { data: responseBody } = await bookingsApi.myBookings(1, 50);
            const apiData = responseBody?.data;
            const bookingsArray = Array.isArray(apiData) ? apiData : (Array.isArray(apiData?.data) ? apiData.data : []);
            const TERMINAL = ['COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED'];
            setPastBookings(bookingsArray.filter((b: any) => TERMINAL.includes(b.status)));
        } catch (err) {
            console.error('Fetch past bookings error:', err);
        } finally {
            setPastLoading(false);
            setPastLoaded(true);
        }
    }, []);

    // "Cancelled" needs the same past-bookings list loaded too.
    const needsPastData = activeTab === 'past' || activeTab === 'cancelled';
    useFocusEffect(useCallback(() => {
        if (needsPastData && !pastLoaded) fetchPastBookings();
    }, [needsPastData, pastLoaded, fetchPastBookings]));

    const cancelledBookings = React.useMemo(
        () => pastBookings.filter((b: any) => ['CANCELLED', 'REJECTED', 'EXPIRED'].includes(b.status)),
        [pastBookings]
    );
    const pastSections = React.useMemo(() => groupByMonth(pastBookings), [pastBookings]);
    const cancelledSections = React.useMemo(() => groupByMonth(cancelledBookings), [cancelledBookings]);

    const addAvailable = addTarget ? Math.max(0, (addTarget.ride?.totalSeats ?? 0) - (addTarget.ride?.bookedSeats ?? 0)) : 0;

    const confirmAddSeats = async () => {
        if (!addTarget) return;
        setAddLoading(true);
        const { error } = await bookingsApi.addSeats(addTarget.id, addCount);
        setAddLoading(false);
        if (error) { showToast(parseApiError(error), 'error'); return; }
        showToast(`${addCount} seat(s) added`, 'success');
        setAddTarget(null);
        loadMyBookings(true);
    };

    // Load once on first focus; subsequent updates come via socket
    useFocusEffect(useCallback(() => {
        loadMyBookings();
    }, [loadMyBookings]));

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

    const handleReviewSubmitted = (bookingId: string, rideId?: string) => {
        setReviewedIds(prev => {
            const next = new Set([...prev, bookingId]);
            AsyncStorage.setItem(REVIEWED_KEY, JSON.stringify([...next])).catch(() => {});
            return next;
        });
        if (rideId) setReviewedRideIds(prev => new Set([...prev, rideId]));
        setReviewBooking(null);
    };

    const handleReportDriver = (ride: any) => {
        if (!ride?.driver?.id) return;
        navigation.navigate('PassengerApp', {
            screen: 'PassengerProfileTab',
            params: {
                screen: 'ReportIssue',
                params: {
                    preset: {
                        id: ride.driver.id,
                        name: ride.driver.name,
                        avatar: ride.driver.avatar,
                        rideId: ride.id,
                        role: 'Driver',
                        routeLabel: `${ride.fromCity || ride.from || ''} → ${ride.toCity || ride.to || ''}`,
                        dateLabel: ride.date,
                    },
                },
            },
        });
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
        const canReview     = isCompleted && ride?.driver?.id && !reviewedIds.has(item.id) && !reviewedRideIds.has(ride.id);
        const isCancelling  = cancellingId === item.id;
        const canCancel     = isActive && !isInProgress;
        const seatsLeft     = (ride?.totalSeats ?? 0) - (ride?.bookedSeats ?? 0);

        // Swipe a cancellable booking left to reveal a quick Cancel action.
        const renderRightActions = () => canCancel ? (
            <Pressable style={styles.swipeCancel} onPress={() => confirmCancel(item)}>
                <Ionicons name="close-circle" size={26} color="#fff" />
                <Text style={styles.swipeCancelText}>Cancel</Text>
            </Pressable>
        ) : null;

        return (
          <Swipeable renderRightActions={renderRightActions} overshootRight={false} friction={2}>
            <View style={styles.card}>

                {/* Active ride banner */}
                {isInProgress && isActive && (
                    <View style={styles.activeBanner}>
                        <Ionicons name="navigate-outline" size={13} color={COLORS.white} />
                        <Text style={styles.activeBannerText}>Ride is in progress</Text>
                        <Pressable style={styles.sosBannerBtn} onPress={() => setSosVisible(true)}>
                            <Ionicons name="warning-outline" size={13} color={COLORS.white} />
                            <Text style={styles.sosBannerText}>SOS</Text>
                        </Pressable>
                    </View>
                )}

                {/* ── Status + Date ── */}
                <View style={styles.cardTopRow}>
                    <StatusPill status={item.status} />
                    <Text style={styles.cardDate}>{ride.date}</Text>
                </View>

                {/* ── Route ── */}
                <View style={styles.routeBlock}>
                    <View style={styles.routeTrack}>
                        <View style={[styles.trackDot, { backgroundColor: COLORS.primary }]} />
                        <View style={styles.trackLine} />
                        <View style={[styles.trackDot, { backgroundColor: COLORS.secondary }]} />
                    </View>
                    <View style={styles.routeCities}>
                        <Text style={styles.routeCity}>{fromCity}</Text>
                        <Text style={styles.routeCity}>{toCity}</Text>
                    </View>
                    <View style={styles.routeTimes}>
                        <View style={styles.routeTimeCell}>
                            <Text style={styles.routeLabel}>Pickup</Text>
                            <Text style={styles.routeTime}>{ride.departureTime}</Text>
                        </View>
                        <View style={styles.routeTimeCell}>
                            <Text style={styles.routeLabel}>Est. Arrival</Text>
                            <Text style={styles.routeTime}>{ride.arrivalTime || '-'}</Text>
                        </View>
                    </View>
                </View>

                {/* ── Meta chips ── */}
                <View style={styles.metaRow}>
                    <View style={styles.metaChip}>
                        <Ionicons name="people-outline" size={12} color={COLORS.gray} />
                        <Text style={styles.metaChipText}>{item.seats} seat{item.seats !== 1 ? 's' : ''}</Text>
                    </View>
                    <View style={styles.metaChip}>
                        <Ionicons name="time-outline" size={12} color={COLORS.gray} />
                        <Text style={styles.metaChipText}>{ride.departureTime}</Text>
                    </View>
                    {item.boardingCity && item.boardingCity !== ride.from && (
                        <View style={[styles.metaChip, { backgroundColor: '#eff6ff' }]}>
                            <Ionicons name="git-branch-outline" size={12} color={COLORS.primary} />
                            <Text style={[styles.metaChipText, { color: COLORS.primary }]}>Partial</Text>
                        </View>
                    )}
                </View>

                {/* ── Driver + Amount ── */}
                <View style={styles.driverAmountRow}>
                    <Avatar name={driverName} uri={ride.driver?.avatar} size={44} />
                    <View style={styles.driverMeta}>
                        <Text style={styles.driverName}>{driverName}</Text>
                        <Text style={styles.driverVehicle}>{vehicleLabel}</Text>
                        {!!driverPhone && (
                            <View style={styles.phoneRow}>
                                <Ionicons name="call-outline" size={11} color={COLORS.gray} />
                                <Text style={styles.driverPhone}>{driverPhone}</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.amountBox}>
                        <Text style={styles.amountLabel}>Total Paid</Text>
                        <Text style={styles.amountValue}>Rs {item.totalAmount?.toLocaleString()}</Text>
                    </View>
                </View>

                {/* ── Action buttons ── */}
                {(isActive || canReview) && (
                    <View style={styles.actionsRow}>
                        {isInProgress && isActive && (
                            <Pressable style={[styles.actionBtnPrimary, styles.actionBtnGrad]}
                                onPress={() => navigation.navigate('RideTracking', { rideId: ride.id })}>
                                <Ionicons name="map" size={14} color={COLORS.white} />
                                <Text style={styles.actionBtnPrimaryText}>Live Map</Text>
                            </Pressable>
                        )}
                        {isInProgress && (
                            <Pressable style={[styles.actionBtn, styles.actionBtnDanger]} onPress={() => setSosVisible(true)}>
                                <Ionicons name="warning-outline" size={14} color="#ef4444" />
                                <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>SOS</Text>
                            </Pressable>
                        )}
                        {isActive && (
                            <Pressable style={[styles.actionBtn, styles.actionBtnBlue]}
                                onPress={() => navigation.navigate('Chat', {
                                    bookingId: item.id,
                                    otherUser: ride.driver,
                                    rideInfo: { label: `${ride.fromCity} > ${ride.toCity}` },
                                })}>
                                <Ionicons name="chatbubble-ellipses-outline" size={14} color={COLORS.primary} />
                                <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Chat</Text>
                            </Pressable>
                        )}
                        {isActive && !isInProgress && seatsLeft > 0 && (
                            <Pressable style={[styles.actionBtn, styles.actionBtnBlue]}
                                onPress={() => { setAddCount(1); setAddTarget(item); }}>
                                <Ionicons name="add-circle-outline" size={14} color={COLORS.primary} />
                                <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Add Seats</Text>
                            </Pressable>
                        )}
                        {isActive && !isInProgress && (
                            <Pressable style={[styles.actionBtn, styles.actionBtnDanger, isCancelling && { opacity: 0.5 }]}
                                onPress={() => confirmCancel(item)} disabled={isCancelling}>
                                {isCancelling
                                    ? <ActivityIndicator size="small" color={COLORS.danger} />
                                    : <><Ionicons name="close-circle-outline" size={14} color={COLORS.danger} /><Text style={[styles.actionBtnText, { color: COLORS.danger }]}>Cancel</Text></>
                                }
                            </Pressable>
                        )}
                        {canReview && (
                            <Pressable style={[styles.actionBtn, styles.actionBtnGold]} onPress={() => setReviewBooking(item)}>
                                <Ionicons name="star-outline" size={14} color="#d97706" />
                                <Text style={[styles.actionBtnText, { color: '#d97706' }]}>Rate Driver</Text>
                            </Pressable>
                        )}
                    </View>
                )}

            </View>
          </Swipeable>
        );
    };

    const renderPastBooking = ({ item }: any) => {
        const ride = item.ride;
        if (!ride) return null;
        const canReview = item.status === 'COMPLETED' && ride?.driver?.id && !reviewedIds.has(item.id) && !reviewedRideIds.has(ride.id);
        const canReport = !!ride?.driver?.id;
        return (
            <Pressable
                style={styles.pastRow}
                onPress={() => navigation.navigate('PastBookingDetail', { booking: item })}
            >
                <View style={styles.pastTopRow}>
                    <RouteTag
                        from={ride?.fromCity || ride?.from}
                        to={ride?.toCity || ride?.to}
                        textStyle={styles.pastRoute}
                        style={{ flex: 1 }}
                    />
                    <StatusPill status={item.status} />
                </View>
                <View style={styles.pastMetaRow}>
                    <View style={styles.pastMetaChip}>
                        <Ionicons name="calendar-outline" size={12} color={COLORS.gray} />
                        <Text style={styles.pastMetaText}>{ride?.date || 'N/A'}</Text>
                    </View>
                    <View style={styles.pastMetaChip}>
                        <Ionicons name="time-outline" size={12} color={COLORS.gray} />
                        <Text style={styles.pastMetaText}>{ride?.departureTime || 'N/A'}</Text>
                    </View>
                    <View style={styles.pastMetaChip}>
                        <Ionicons name="people-outline" size={12} color={COLORS.gray} />
                        <Text style={styles.pastMetaText}>{item.seats} seat{item.seats !== 1 ? 's' : ''}</Text>
                    </View>
                </View>
                <View style={styles.pastBottomRow}>
                    <Text style={styles.pastAmount}>Rs {item.totalAmount?.toLocaleString()}</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        {canReview && (
                            <Pressable style={[styles.actionBtn, styles.actionBtnGold]} onPress={() => setReviewBooking(item)}>
                                <Ionicons name="star-outline" size={13} color="#d97706" />
                                <Text style={[styles.actionBtnText, { color: '#d97706' }]}>Rate Driver</Text>
                            </Pressable>
                        )}
                        {canReport && (
                            <Pressable style={[styles.actionBtn, styles.actionBtnDanger]} onPress={() => handleReportDriver(ride)}>
                                <Ionicons name="flag-outline" size={13} color={COLORS.danger} />
                                <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>Report</Text>
                            </Pressable>
                        )}
                    </View>
                </View>
            </Pressable>
        );
    };

    const isInitialLoad = !myBookingsState.loaded && myBookingsState.loading;

    if (isInitialLoad) {
        return (
            <View style={styles.container}>
                <AppBar title="Booking History" onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />
                <ScrollView contentContainerStyle={styles.listContent}>
                    {[1, 2, 3].map(i => <BookingCardSkeleton key={i} />)}
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <AppBar title="Booking History" onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />

            <TabPills
                style={styles.tabPills}
                tabs={[
                    { label: 'Upcoming', value: 'upcoming' },
                    { label: 'Past', value: 'past' },
                    { label: 'Cancelled', value: 'cancelled' },
                ]}
                activeTab={activeTab}
                onSelect={(v) => setActiveTab(v)}
            />

            {activeTab === 'upcoming' ? (
                <FlatList
                    data={myBookings}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={renderBooking}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    ListEmptyComponent={
                        !refreshing ? (
                            myBookingsState.error ? (
                                <EmptyState icon="receipt-outline" title="Couldn't load your bookings"
                                    subtitle="Please check your connection and try again."
                                    action={{ label: 'Try Again', onPress: () => loadMyBookings(true) }} />
                            ) : (
                                <EmptyState icon="receipt-outline" title="No Active Bookings"
                                    subtitle="You have no pending or confirmed bookings." />
                            )
                        ) : null
                    }
                />
            ) : activeTab === 'past' ? (
                <SectionList
                    sections={pastSections}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={renderPastBooking}
                    renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
                    stickySectionHeadersEnabled={false}
                    refreshing={pastLoading}
                    onRefresh={fetchPastBookings}
                    ListEmptyComponent={
                        !pastLoading ? (
                            <EmptyState icon="time-outline" title="No Past Bookings"
                                subtitle="Your completed and cancelled bookings will appear here." />
                        ) : null
                    }
                />
            ) : (
                <SectionList
                    sections={cancelledSections}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={renderPastBooking}
                    renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
                    stickySectionHeadersEnabled={false}
                    refreshing={pastLoading}
                    onRefresh={fetchPastBookings}
                    ListEmptyComponent={
                        !pastLoading ? (
                            <EmptyState icon="close-circle-outline" title="No Cancelled Bookings"
                                subtitle="Bookings you cancel (or that get rejected/expired) will appear here." />
                        ) : null
                    }
                />
            )}

            {reviewBooking && (
                <ReviewModal booking={reviewBooking} onClose={() => setReviewBooking(null)} onSubmit={handleReviewSubmitted} />
            )}
            <CancelReasonModal visible={!!cancelTarget} onClose={() => setCancelTarget(null)} onSubmit={executeCancel} />
            <SOSModal visible={sosVisible} onClose={() => setSosVisible(false)} />

            <Modal visible={!!addTarget} transparent animationType="fade" onRequestClose={() => setAddTarget(null)}>
                <View style={styles.addOverlay}>
                    <View style={styles.addSheet}>
                        <Text style={styles.addTitle}>Add seats</Text>
                        <Text style={styles.addSub}>{addAvailable} more seat{addAvailable !== 1 ? 's' : ''} available on this ride</Text>
                        <View style={styles.stepperRow}>
                            <Pressable style={styles.stepBtn} onPress={() => setAddCount(c => Math.max(1, c - 1))}>
                                <Ionicons name="remove" size={22} color={COLORS.primary} />
                            </Pressable>
                            <Text style={styles.stepVal}>{addCount}</Text>
                            <Pressable style={styles.stepBtn} onPress={() => setAddCount(c => Math.min(addAvailable, c + 1))}>
                                <Ionicons name="add" size={22} color={COLORS.primary} />
                            </Pressable>
                        </View>
                        <View style={styles.addActions}>
                            <Pressable style={[styles.addBtn, styles.addCancel]} onPress={() => setAddTarget(null)}>
                                <Text style={styles.addCancelText}>Cancel</Text>
                            </Pressable>
                            <Pressable style={[styles.addBtn, styles.addConfirm]} onPress={confirmAddSeats} disabled={addLoading || addAvailable < 1}>
                                {addLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.addConfirmText}>Add {addCount}</Text>}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { fontSize: 14, color: COLORS.gray },
    listContent: { padding: 16, paddingBottom: 32 },
    tabPills: { marginHorizontal: 16, marginBottom: 4, marginTop: 8 },
    sectionHeader: { fontSize: 13, fontWeight: '800', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 10, marginBottom: 10 },
    pastRow: { backgroundColor: COLORS.cardBg, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10, ...CURVE },
    pastTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 },
    pastRoute: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
    pastMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    pastMetaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.lightGray, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
    pastMetaText: { fontSize: 11, fontWeight: '600', color: COLORS.gray },
    pastBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
    pastAmount: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
    swipeCancel: { backgroundColor: COLORS.danger, justifyContent: 'center', alignItems: 'center', width: 96, borderRadius: 16, marginBottom: 16, gap: 2 },
    swipeCancelText: { color: '#fff', fontWeight: '800', fontSize: 12 },
    addSeatsBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.primary + '30', backgroundColor: COLORS.primary + '0d' },
    addSeatsText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
    addOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 28 },
    addSheet: { width: '100%', backgroundColor: '#fff', borderRadius: 22, padding: 22 },
    addTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
    addSub: { fontSize: 13, color: COLORS.gray, textAlign: 'center', marginTop: 6 },
    stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28, marginVertical: 22 },
    stepBtn: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: COLORS.primary + '30', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary + '0d' },
    stepVal: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary, minWidth: 44, textAlign: 'center' },
    addActions: { flexDirection: 'row', gap: 12 },
    addBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
    addCancel: { backgroundColor: COLORS.lightGray },
    addCancelText: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 15 },
    addConfirm: { backgroundColor: COLORS.primary },
    addConfirmText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    card: { backgroundColor: COLORS.cardBg, borderRadius: 16, overflow: 'hidden', marginBottom: 14, borderWidth: 1, borderColor: COLORS.border, ...CURVE },
    activeBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: COLORS.primary },
    activeBannerText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#fff' },
    sosBannerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    sosBannerText: { fontSize: 11, fontWeight: '800', color: '#fff' },

    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
    cardDate: { fontSize: 12, fontWeight: '600', color: COLORS.gray },

    routeBlock: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10, gap: 10 },
    routeTrack: { alignItems: 'center', width: 12 },
    trackDot: { width: 10, height: 10, borderRadius: 5 },
    trackLine: { width: 2, height: 22, backgroundColor: COLORS.border, marginVertical: 3 },
    routeCities: { flex: 1, justifyContent: 'space-between', gap: 14 },
    routeCity: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
    routeTimes: { alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 },
    routeTimeCell: { alignItems: 'flex-end' },
    routeLabel: { fontSize: 10, fontWeight: '600', color: COLORS.gray, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 1 },
    routeTime: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '700' },

    metaRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 14, flexWrap: 'wrap' },
    metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.lightGray, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    metaChipText: { fontSize: 12, fontWeight: '600', color: COLORS.gray },

    driverAmountRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
    driverMeta: { flex: 1 },
    driverName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
    driverVehicle: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
    phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    driverPhone: { fontSize: 11, color: COLORS.gray },
    amountBox: { alignItems: 'flex-end' },
    amountLabel: { fontSize: 10, color: COLORS.gray, marginBottom: 2 },
    amountValue: { fontSize: 18, fontWeight: '700', color: COLORS.primary },

    actionsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 14, paddingTop: 4, flexWrap: 'wrap' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
    actionBtnText: { fontSize: 12, fontWeight: '700' },
    actionBtnBlue: { backgroundColor: '#eff6ff', borderColor: COLORS.primary + '30' },
    actionBtnDanger: { backgroundColor: '#fff0f0', borderColor: '#ef444430' },
    actionBtnGold: { backgroundColor: COLORS.warningLight, borderColor: COLORS.warning + '40' },
    actionBtnPrimary: { borderRadius: 10 },
    actionBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: COLORS.primary },
    actionBtnPrimaryText: { fontSize: 12, fontWeight: '800', color: '#fff' },
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
    routeText: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
    routeDate: { fontSize: 12, color: COLORS.gray },
    stars: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 },
    ratingLabel: { alignItems: 'center', marginBottom: 16 },
    ratingLabelText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
    commentInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14, padding: 14, fontSize: 14, color: COLORS.textPrimary, minHeight: 80, textAlignVertical: 'top', marginBottom: 20 },
    btnRow: { flexDirection: 'row', gap: 12 },
    skipBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border },
    skipBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.gray },
    submitBtn: { flex: 2, borderRadius: 12, overflow: 'hidden' },
    submitInner: { alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
    submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

const sosStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
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
