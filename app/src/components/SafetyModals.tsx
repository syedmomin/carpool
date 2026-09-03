import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ActivityIndicator, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from './theme';

// ─── SOS Modal ────────────────────────────────────────────────────────────────
export function SOSModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const insets = useSafeAreaInsets();
    const emergencyNumbers = [
        { label: 'Rescue 1122', number: '1122', icon: 'medkit-outline',  color: '#ef4444' },
        { label: 'Police 15',   number: '15',   icon: 'shield-outline',  color: '#3b82f6' },
        { label: 'Edhi 115',    number: '115',  icon: 'heart-outline',   color: COLORS.warning },
        { label: 'Motorway 130',number: '130',  icon: 'car-outline',     color: '#8b5cf6' },
    ];
    const call = (number: string) => {
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

// ─── Cancel Reason Modal ──────────────────────────────────────────────────────
export function CancelReasonModal({ visible, onClose, onSubmit }: { visible: boolean; onClose: () => void; onSubmit: (reason: string) => Promise<void> | void }) {
    const insets = useSafeAreaInsets();
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const submit = async () => {
        if (!reason.trim()) return;
        setSubmitting(true);
        await onSubmit(reason.trim());
        setSubmitting(false);
        setReason('');
    };
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={cStyles.overlay}>
                <View style={cStyles.sheet}>
                    <View style={[cStyles.sheetHeader, { backgroundColor: '#fecaca' }]}>
                        <View style={[cStyles.starIcon, { backgroundColor: 'rgba(239,68,68,0.2)' }]}>
                            <Ionicons name="alert-circle" size={32} color="#ef4444" />
                        </View>
                        <Text style={[cStyles.sheetTitle, { color: '#b91c1c' }]}>Cancel Booking</Text>
                        <Text style={[cStyles.sheetSub, { color: '#991b1b' }]}>Please tell the driver why you are cancelling.</Text>
                    </View>
                    <View style={[cStyles.sheetBody, { paddingBottom: 24 + insets.bottom }]}>
                        <TextInput style={cStyles.commentInput} placeholder="Reason for cancellation..."
                            placeholderTextColor={COLORS.gray} value={reason} onChangeText={setReason}
                            multiline numberOfLines={3} maxLength={200} />
                        <View style={cStyles.btnRow}>
                            <Pressable style={cStyles.skipBtn} onPress={onClose} disabled={submitting}>
                                <Text style={cStyles.skipBtnText}>Go Back</Text>
                            </Pressable>
                            <Pressable
                                style={[cStyles.submitBtn, cStyles.submitInner, { backgroundColor: COLORS.danger, opacity: reason.trim().length ? 1 : 0.5 }]}
                                onPress={submit} disabled={!reason.trim().length || submitting}>
                                {submitting ? <ActivityIndicator size="small" color="#fff" />
                                    : <Text style={cStyles.submitBtnText}>Cancel Booking</Text>}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const cStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
    sheetHeader: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, paddingHorizontal: 20 },
    starIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    sheetTitle: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
    sheetSub: { fontSize: 14 },
    sheetBody: { padding: 24 },
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
