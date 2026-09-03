import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, CURVE } from './theme';
import { Avatar } from './Avatar';
import { StarRating } from './StarRating';
import { useToast } from '../context/ToastContext';
import { useGlobalModal } from '../context/GlobalModalContext';
import { useSocketData } from '../context/SocketDataContext';
import { bookingsApi } from '../services/api';

function requestedAtLabel(createdAt?: string) {
    if (!createdAt) return null;
    const d = new Date(createdAt);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface RideBookingsSheetProps {
    visible: boolean;
    ride: any;
    initialTab?: 'pending' | 'accepted';
    onClose: () => void;
    onOpenBooking?: (booking: any) => void; // called with onClose already fired
}

// Quick, low-friction way to manage a ride's passengers (pending accept/reject,
// browse accepted) without leaving the list for a full screen — a full screen
// is overkill when a ride usually only has a couple of bookings.
export function RideBookingsSheet({ visible, ride, initialTab = 'pending', onClose, onOpenBooking }: RideBookingsSheetProps) {
    const insets = useSafeAreaInsets();
    const { showToast } = useToast();
    const { showModal } = useGlobalModal();
    const { patchBookingInRide } = useSocketData();
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [tab, setTab] = useState<'pending' | 'accepted'>(initialTab);

    useEffect(() => { if (visible) setTab(initialTab); }, [visible, initialTab]);

    const bookings = ride?.bookings || [];
    const pending = bookings.filter((b: any) => b.status === 'PENDING');
    const accepted = bookings.filter((b: any) => b.status === 'CONFIRMED' || b.status === 'COMPLETED');

    const handleAccept = (bookingId: string, name: string) => {
        showModal({
            type: 'primary', title: 'Accept Booking?',
            message: `Are you sure you want to accept ${name}'s booking request?`,
            confirmText: 'Accept', cancelText: 'Cancel', icon: 'checkmark-circle-outline',
            onConfirm: async () => {
                setActionLoading(bookingId);
                const { error } = await bookingsApi.accept(bookingId);
                setActionLoading(null);
                if (error) { showToast(error, 'error'); return; }
                showToast('Booking accepted', 'success');
                patchBookingInRide(ride.id, bookingId, { status: 'CONFIRMED' });
            },
        });
    };

    const handleReject = (bookingId: string, name: string) => {
        showModal({
            type: 'danger', title: 'Reject Booking?',
            message: `Are you sure you want to reject ${name}'s request? The seats will be released.`,
            confirmText: 'Reject', cancelText: 'Cancel', icon: 'close-circle-outline',
            onConfirm: async () => {
                setActionLoading(bookingId);
                const { error } = await bookingsApi.reject(bookingId);
                setActionLoading(null);
                if (error) { showToast(error, 'error'); return; }
                showToast('Booking rejected', 'info');
                patchBookingInRide(ride.id, bookingId, { status: 'REJECTED' });
            },
        });
    };

    const openBooking = (booking: any) => {
        onClose();
        onOpenBooking?.({ ...booking, ride });
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={[styles.sheet, { paddingBottom: 16 + insets.bottom }]} onPress={() => {}}>
                    <View style={styles.handle} />
                    <Text style={styles.title}>Ride Bookings</Text>

                    <View style={styles.tabRow}>
                        <Pressable style={[styles.tabBtn, tab === 'pending' && styles.tabBtnActive]} onPress={() => setTab('pending')}>
                            <Text style={[styles.tabBtnText, tab === 'pending' && styles.tabBtnTextActive]}>Pending ({pending.length})</Text>
                        </Pressable>
                        <Pressable style={[styles.tabBtn, tab === 'accepted' && styles.tabBtnActive]} onPress={() => setTab('accepted')}>
                            <Text style={[styles.tabBtnText, tab === 'accepted' && styles.tabBtnTextActive]}>Accepted ({accepted.length})</Text>
                        </Pressable>
                    </View>

                    <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                        {tab === 'pending' ? (
                            pending.length === 0 ? (
                                <View style={styles.emptyBox}>
                                    <Ionicons name="checkmark-done-circle-outline" size={32} color={COLORS.gray} />
                                    <Text style={styles.emptyText}>No pending requests right now</Text>
                                </View>
                            ) : pending.map((item: any) => {
                                const p = item.passenger;
                                const isActioning = actionLoading === item.id;
                                const requestedAt = requestedAtLabel(item.createdAt);
                                return (
                                    <View key={item.id} style={styles.card}>
                                        <View style={styles.cardTop}>
                                            <Avatar name={p?.name} uri={p?.avatar} size={44} color={COLORS.primary} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.pName}>{p?.name}</Text>
                                                {p?.rating > 0 && <StarRating rating={p.rating} size={12} />}
                                                <Text style={styles.pMeta}>{item.seats} seat{item.seats !== 1 ? 's' : ''} · Rs {item.totalAmount?.toLocaleString()}</Text>
                                            </View>
                                        </View>
                                        {requestedAt && <Text style={styles.requestedAt}>Requested at {requestedAt}</Text>}
                                        {!!item.pickupAddress && (
                                            <View style={styles.pickupRow}>
                                                <Ionicons name="location-outline" size={13} color={COLORS.gray} />
                                                <Text style={styles.pickupText} numberOfLines={1}>{item.pickupAddress}</Text>
                                            </View>
                                        )}
                                        {!!item.dropAddress && (
                                            <View style={styles.pickupRow}>
                                                <Ionicons name="flag-outline" size={13} color={COLORS.gray} />
                                                <Text style={styles.pickupText} numberOfLines={1}>{item.dropAddress}</Text>
                                            </View>
                                        )}
                                        <View style={styles.actionRow}>
                                            <Pressable style={[styles.btn, styles.rejectBtn]} onPress={() => handleReject(item.id, p?.name)} disabled={!!actionLoading}>
                                                <Ionicons name="close" size={17} color={COLORS.danger} />
                                                <Text style={styles.rejectText}>Reject</Text>
                                            </Pressable>
                                            <Pressable style={[styles.btn, styles.acceptBtn]} onPress={() => handleAccept(item.id, p?.name)} disabled={!!actionLoading}>
                                                {isActioning
                                                    ? <ActivityIndicator size="small" color="#fff" />
                                                    : <><Ionicons name="checkmark" size={17} color="#fff" /><Text style={styles.acceptText}>Accept</Text></>
                                                }
                                            </Pressable>
                                        </View>
                                    </View>
                                );
                            })
                        ) : (
                            accepted.length === 0 ? (
                                <View style={styles.emptyBox}>
                                    <Ionicons name="people-outline" size={32} color={COLORS.gray} />
                                    <Text style={styles.emptyText}>No accepted bookings yet</Text>
                                </View>
                            ) : accepted.map((item: any) => {
                                const p = item.passenger;
                                return (
                                    <Pressable
                                        key={item.id}
                                        style={({ pressed }) => [styles.acceptedRow, pressed && { backgroundColor: COLORS.lightGray }]}
                                        onPress={() => openBooking(item)}
                                    >
                                        <Avatar name={p?.name} uri={p?.avatar} size={40} color={COLORS.primary} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.pName}>{p?.name}</Text>
                                            {p?.rating > 0 && <StarRating rating={p.rating} size={12} />}
                                            <Text style={styles.pMeta}>{item.seats} seat{item.seats !== 1 ? 's' : ''}</Text>
                                        </View>
                                        <Text style={styles.bookingPrice}>Rs {item.totalAmount?.toLocaleString()}</Text>
                                        <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
                                    </Pressable>
                                );
                            })
                        )}
                    </ScrollView>
                    <Pressable style={styles.closeBtn} onPress={onClose}>
                        <Text style={styles.closeBtnText}>Close</Text>
                    </Pressable>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12 },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 14 },
    title: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },
    tabRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10, backgroundColor: COLORS.lightGray },
    tabBtnActive: { backgroundColor: COLORS.primary },
    tabBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
    tabBtnTextActive: { color: '#fff' },
    emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36, gap: 8 },
    emptyText: { fontSize: 13, color: COLORS.gray },
    card: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, ...CURVE },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
    pName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 3 },
    pMeta: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
    requestedAt: { fontSize: 11, color: COLORS.gray, marginBottom: 10 },
    pickupRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
    pickupText: { fontSize: 12, color: COLORS.gray, flex: 1 },
    actionRow: { flexDirection: 'row', gap: 10 },
    btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6, borderWidth: 1.5 },
    rejectBtn: { borderColor: COLORS.danger + '30', backgroundColor: '#fff5f5' },
    rejectText: { color: COLORS.danger, fontWeight: '700', fontSize: 13 },
    acceptBtn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    acceptText: { color: '#fff', fontWeight: '800', fontSize: 13 },
    acceptedRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.cardBg, borderRadius: 16,
        padding: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border, ...CURVE,
    },
    bookingPrice: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
    closeBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 4, marginBottom: 8 },
    closeBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.gray },
});
