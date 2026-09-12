import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURVE, AppBar, DetailSkeleton } from '../../components';
import { useToast } from '../../context/ToastContext';
import { verificationApi } from '../../services/api';

const STATUS_TOKEN: Record<string, { label: string; color: string; bg: string }> = {
  APPROVED: { label: 'Approved', color: COLORS.secondary, bg: '#e8f5e9' },
  PENDING:  { label: 'Pending Review', color: '#b45309', bg: '#fffbeb' },
  REJECTED: { label: 'Rejected', color: COLORS.danger, bg: '#fef2f2' },
};

function DocRow({ label, image, status }: { label: string; image?: string | null; status?: string }) {
  const { showToast } = useToast();
  const token = status ? STATUS_TOKEN[status] : null;

  const download = async () => {
    if (!image) return;
    try {
      await Linking.openURL(image);
    } catch {
      showToast("Couldn't open the image.", 'error');
    }
  };

  if (!image) return null;

  return (
    <View style={styles.docRow}>
      <Image source={{ uri: image }} style={styles.docThumb} resizeMode="cover" />
      <View style={{ flex: 1 }}>
        <Text style={styles.docLabel}>{label}</Text>
        {token && (
          <View style={[styles.statusPill, { backgroundColor: token.bg }]}>
            <Text style={[styles.statusPillText, { color: token.color }]}>{token.label}</Text>
          </View>
        )}
      </View>
      <Pressable style={styles.downloadBtn} onPress={download} hitSlop={8}>
        <Ionicons name="download-outline" size={20} color={COLORS.primary} />
      </Pressable>
    </View>
  );
}

// Read-only viewer for the documents submitted during the mandatory
// onboarding stepper (see VerificationGateScreen) — reachable any time from
// Profile > Documents. No upload controls here; submission only ever
// happens once, at the gate, before a user can use the app at all.
export default function CnicVerificationScreen({ navigation }) {
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    setLoading(true);
    verificationApi.status().then(({ data }) => {
      if (!cancelled) setRecord(data?.data || null);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []));

  return (
    <View style={styles.container}>
      <AppBar title="My Documents" onBack={() => navigation.goBack()} />

      {loading ? (
        <DetailSkeleton />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {!record ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-lock-outline" size={40} color={COLORS.border} />
              <Text style={styles.emptyText}>No documents on file yet.</Text>
            </View>
          ) : (
            <>
              {(record.cnicName || record.cnicNumber) && (
                <View style={styles.cnicNumberCard}>
                  {record.cnicName && (
                    <>
                      <Text style={styles.cnicNumberLabel}>Full Name</Text>
                      <Text style={styles.cnicNumberValue}>{record.cnicName}</Text>
                    </>
                  )}
                  {record.cnicNumber && (
                    <>
                      <Text style={[styles.cnicNumberLabel, { marginTop: record.cnicName ? 10 : 0 }]}>CNIC Number</Text>
                      <Text style={styles.cnicNumberValue}>{record.cnicNumber}</Text>
                    </>
                  )}
                </View>
              )}
              <DocRow label="CNIC Front" image={record.cnicFront} status={record.cnicStatus} />
              <DocRow label="CNIC Back" image={record.cnicBack} status={record.cnicStatus} />
              <DocRow label="Selfie" image={record.selfieImage} status={record.selfieStatus} />
              {record.licenceNumber && (
                <View style={styles.cnicNumberCard}>
                  <Text style={styles.cnicNumberLabel}>Licence Number</Text>
                  <Text style={styles.cnicNumberValue}>{record.licenceNumber}</Text>
                </View>
              )}
              <DocRow label="Driving Licence" image={record.licenceImage} status={record.licenceStatus} />
              {record.rejectedReason && (
                <View style={styles.rejectionCard}>
                  <Ionicons name="alert-circle-outline" size={16} color={COLORS.danger} />
                  <Text style={styles.rejectionText}>{record.rejectedReason}</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  body:      { padding: 20, paddingBottom: 32, gap: 12 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 10 },
  emptyText:  { fontSize: 13, color: COLORS.textSecondary },

  cnicNumberCard: { backgroundColor: COLORS.cardBg, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 4, ...CURVE },
  cnicNumberLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  cnicNumberValue: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginTop: 2, letterSpacing: 0.5 },

  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.cardBg, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 12, ...CURVE },
  docThumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: COLORS.lightGray },
  docLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  statusPill: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  downloadBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryLight },

  rejectionCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#fef2f2', borderRadius: 12, padding: 12 },
  rejectionText: { flex: 1, fontSize: 12.5, color: COLORS.danger, lineHeight: 18 },
});
