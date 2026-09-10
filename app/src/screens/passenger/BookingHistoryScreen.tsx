import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, SectionList, Pressable,
    ActivityIndicator, Modal, TextInput, ScrollView, Platform, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, GRADIENTS, OVERLAYS, CURVE, EmptyState, AppBar, StatusPill, TabPills, BookingCardSkeleton, Avatar, RouteTag, CancelReasonModal, SOSModal, PrimaryButton } from '../../components';
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
                <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
                    <Ionicons name={(n <= rating ? 'star' : 'star-outline') as any} size={30}
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
                        <View style={rStyles.starIcon}><Ionicons name="star" size={24} color={COLORS.warning} /></View>
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
                            <PrimaryButton
                                title="Submit Review"
                                onPress={submit}
                                loading={submitting}
                                style={rStyles.submitBtn}
                            />
                        </View>
                    </View>
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

    const openDirections = (lat: number, lng: number) => {
        const url = Platform.select({
            ios: `maps://app?daddr=${lat},${lng}`,
            android: `google.navigation:q=${lat},${lng}`,
            default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        });
        Linking.openURL(url as string).catch(() => showToast('Could not open navigation app', 'error'));
    };

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
    const [cancelTarget, setCancelTarget]       = useState(null);
    const [cancellingId, setCancellingId]       = useState<string | null>(null);
    const [refreshing, setRefreshing]           = useState(false);
    const [expandedId, setExpandedId]           = useState<string | null>(null);
    const [sosVisible, setSosVisible]           = useState(false);
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

    const addAvailable = addTarget ? Math.max(0, (addTarget.ride?.totalSeats ?? 0) - (addTarget.ride?.bookedSeats ?? 0)) : 0;

    const confirmAddSeats = async () => {
        if (!addTarget) return;
        setAddLoading(true);
        const { error } = await bookingsApi.addSeats(addTarget.id, addCount);
        setAddLoading(false);
        if (error) { showToast(parseApiError(error), 'error'); return; }
        showToast(`${addCount} seat${addCount !== 1 ? 's' : ''} added`, 'success');
        setAddTarget(null);
        loadMyBookings(true);
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
        const driverName    = ride.driver?.name || 'Driver';
        const driverPhone   = ride.driver?.phone || '';
        const vehicle       = ride.vehicle;
        const vehicleLabel  = vehicle ? `${vehicle.brand} · ${vehicle.plateNumber}` : 'N/A';
        const isActive      = item.status === 'CONFIRMED';
        const isInProgress  = ride.status === 'IN_PROGRESS';
        const isCancelling  = cancellingId === item.id;
        const canCancel     = isActive && !isInProgress;
        const seatsLeft     = (ride?.totalSeats ?? 0) - (ride?.bookedSeats ?? 0);
        const isExpanded    = expandedId === item.id;

        // Swipe a cancellable booking left to reveal a quick Cancel action.
        const renderRightActions = () => canCancel ? (
            <Pressable style={styles.swipeCancel} onPress={() => confirmCancel(item)} disabled={isCancelling}>
                {isCancelling
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <><Ionicons name="close-circle" size={26} color="#fff" /><Text style={styles.swipeCancelText}>Cancel</Text></>
                }
            </Pressable>
        ) : null;

        return (
          <Swipeable renderRightActions={renderRightActions} overshootRight={false} friction={2}>
            <Pressable
                style={styles.pastRow}
                onPress={() => setExpandedId(isExpanded ? null : item.id)}
            >
                {isInProgress && isActive && (
                    <View style={styles.inlineBanner}>
                        <Ionicons name="navigate-outline" size={12} color={COLORS.primary} />
                        <Text style={styles.inlineBannerText}>Ride is in progress</Text>
                    </View>
                )}
                <View style={styles.pastTopRow}>
                    <RouteTag from={fromCity} to={toCity} textStyle={styles.pastRoute} style={{ flex: 1 }} />
                    <StatusPill status={item.status} />
                </View>
                <View style={styles.pastMetaRow}>
                    <View style={styles.pastMetaChip}>
                        <Ionicons name="calendar-outline" size={12} color={COLORS.gray} />
                        <Text style={styles.pastMetaText}>{ride.date}</Text>
                    </View>
                    <View style={styles.pastMetaChip}>
                        <Ionicons name="time-outline" size={12} color={COLORS.gray} />
                        <Text style={styles.pastMetaText}>{ride.departureTime}</Text>
                    </View>
                    <View style={styles.pastMetaChip}>
                        <Ionicons name="people-outline" size={12} color={COLORS.gray} />
                        <Text style={styles.pastMetaText}>{item.seats} seat{item.seats !== 1 ? 's' : ''}</Text>
                    </View>
                </View>
                <View style={styles.pastBottomRow}>
                    <Text style={styles.pastAmount}>Rs {item.totalAmount?.toLocaleString()}</Text>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.gray} />
                </View>

                {isExpanded && (
                    <View style={styles.expandedSection}>
                        <View style={styles.driverRow}>
                            <Avatar name={driverName} uri={ride.driver?.avatar} size={40} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.driverName}>{driverName}</Text>
                                <Text style={styles.driverVehicle}>{vehicleLabel}</Text>
                                {!!driverPhone && (
                                    <View style={styles.phoneRow}>
                                        <Ionicons name="call-outline" size={11} color={COLORS.gray} />
                                        <Text style={styles.driverPhone}>{driverPhone}</Text>
                                    </View>
                                )}
                            </View>
                            {isActive && (
                                <Pressable
                                    style={styles.iconBtn}
                                    onPress={(e) => { e.stopPropagation(); navigation.navigate('Chat', {
                                        bookingId: item.id,
                                        otherUser: ride.driver,
                                        rideInfo: { label: `${ride.fromCity} > ${ride.toCity}` },
                                    }); }}>
                                    <Ionicons name="chatbubble-ellipses" size={16} color={COLORS.primary} />
                                </Pressable>
                            )}
                            {canCancel && (
                                <Pressable
                                    style={[styles.iconBtn, styles.iconBtnDanger, isCancelling && { opacity: 0.5 }]}
                                    onPress={(e) => { e.stopPropagation(); confirmCancel(item); }} disabled={isCancelling}>
                                    {isCancelling
                                        ? <ActivityIndicator size="small" color={COLORS.danger} />
                                        : <Ionicons name="close" size={17} color={COLORS.danger} />
                                    }
                                </Pressable>
                            )}
                        </View>

                        {(isInProgress || (isActive && !isInProgress && seatsLeft > 0)) && (
                            <View style={styles.expandedActionsRow}>
                                {isInProgress && (
                                    <Pressable style={[styles.actionBtn, styles.actionBtnBlue]}
                                        onPress={(e) => { e.stopPropagation(); navigation.navigate('RideTracking', { rideId: ride.id }); }}>
                                        <Ionicons name="map" size={14} color={COLORS.primary} />
                                        <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Live Map</Text>
                                    </Pressable>
                                )}
                                {isInProgress && (
                                    <Pressable style={[styles.actionBtn, styles.actionBtnDanger]}
                                        onPress={(e) => { e.stopPropagation(); setSosVisible(true); }}>
                                        <Ionicons name="warning-outline" size={14} color="#ef4444" />
                                        <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>SOS</Text>
                                    </Pressable>
                                )}
                                {isActive && !isInProgress && seatsLeft > 0 && (
                                    <Pressable style={[styles.actionBtn, styles.actionBtnBlue]}
                                        onPress={(e) => { e.stopPropagation(); setAddCount(1); setAddTarget(item); }}>
                                        <Ionicons name="add-circle-outline" size={14} color={COLORS.primary} />
                                        <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Add Seats</Text>
                                    </Pressable>
                                )}
                                {item.pickupLat != null && item.pickupLng != null && (
                                    <Pressable style={[styles.actionBtn, styles.actionBtnBlue]}
                                        onPress={(e) => { e.stopPropagation(); openDirections(item.pickupLat, item.pickupLng); }}>
                                        <Ionicons name="navigate-outline" size={14} color={COLORS.primary} />
                                        <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Get to Pickup</Text>
                                    </Pressable>
                                )}
                            </View>
                        )}
                    </View>
                )}
            </Pressable>
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
                                <EmptyState icon="receipt-outline" title="Couldn't Load Your Bookings"
                                    subtitle="Check your internet and try again."
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
                                subtitle="Bookings you cancel, or that get rejected or expire, will appear here." />
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
                        <Text style={styles.addTitle}>Add Seats</Text>
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

    inlineBanner: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, marginBottom: 10 },
    inlineBannerText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
    actionBtnText: { fontSize: 12, fontWeight: '700' },
    actionBtnBlue: { backgroundColor: '#eff6ff', borderColor: COLORS.primary + '30' },
    actionBtnDanger: { backgroundColor: '#fff0f0', borderColor: '#ef444430' },
    actionBtnGold: { backgroundColor: COLORS.warningLight, borderColor: COLORS.warning + '40' },

    expandedSection: { marginTop: 2, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
    driverRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    driverName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
    driverVehicle: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
    phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    driverPhone: { fontSize: 11, color: COLORS.gray },
    iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
    iconBtnDanger: { backgroundColor: '#fff0f0' },
    expandedActionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },

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
});

const rStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
    sheetHeader: { alignItems: 'center', paddingTop: 24, paddingBottom: 18, paddingHorizontal: 20 },
    starIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    sheetTitle: { fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 3 },
    sheetSub: { fontSize: 12.5, color: 'rgba(255,255,255,0.85)' },
    sheetBody: { padding: 22 },
    routeRecap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 12, marginBottom: 18 },
    routeText: { fontSize: 13.5, fontWeight: '700', color: COLORS.textPrimary },
    routeDate: { fontSize: 11, color: COLORS.gray },
    stars: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 10 },
    ratingLabel: { alignItems: 'center', marginBottom: 18 },
    ratingLabelText: { fontSize: 13.5, fontWeight: '600', color: COLORS.textSecondary },
    commentInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14, padding: 13, fontSize: 13.5, color: COLORS.textPrimary, minHeight: 80, textAlignVertical: 'top', marginBottom: 18 },
    btnRow: { flexDirection: 'row', gap: 12 },
    skipBtn: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border },
    skipBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.gray },
    submitBtn: { flex: 2 },
});

