import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, AppBar } from '../../components';

const SECTIONS = [
  { title: '1. Information We Collect', body: 'Account details: your name, phone number, email, city, and profile photo. Verification documents: your CNIC and driving licence (for drivers). Trip data: routes, bookings, ride requests, bids, and reviews. Device data: your push-notification token and, during active rides, your live location.' },
  { title: '2. How We Use Information', body: 'We use your data to create your account, match passengers with drivers, show ride and driver details, enable in-app chat and live tracking, send ride and notification alerts, verify drivers, and keep the platform safe.' },
  { title: '3. Live Location', body: 'Location is collected only while you are in an active ride, so passengers and the driver can see the trip in progress. It is used for the live trip view and is not used to track you outside of an active ride.' },
  { title: '4. Information Sharing', body: 'We do not sell your personal data. Information may be shared with service providers to operate the app: Cloudinary (image hosting), Google Firebase (push notifications), and our cloud database and cache providers. We share information only as needed to provide the service, comply with the law, or respond to a lawful request from authorities.' },
  { title: '5. What Other Users See', body: 'When a booking is matched, the driver and passenger can see each other’s name, photo, rating, and contact number so they can coordinate the trip. Drivers also display vehicle details. Your CNIC and licence are never shown to other users.' },
  { title: '6. Payments', body: 'ChalParo does not collect or store any payment or card information. All fares are paid in cash directly between passengers and drivers.' },
  { title: '7. Data Security', body: 'We protect your data with encrypted connections and access controls. Verification documents are stored securely and used only for review. No system is perfectly secure, so please keep your account credentials private.' },
  { title: '8. Data Retention', body: 'We keep your data while your account is active. When you delete your account, we remove or anonymise your personal data, except where we must keep limited records to meet legal obligations.' },
  { title: '9. Your Rights', body: 'You can view and edit your profile in the app, and request deletion of your account and associated data at any time by contacting support.' },
  { title: '10. Children', body: 'ChalParo is intended for users aged 18 and over. We do not knowingly collect data from anyone under 18.' },
  { title: '11. Contact', body: 'For any privacy question or a data deletion request, email us at privacy@chalparo.pk.' },
];

export default function PrivacyScreen({ navigation }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <View style={styles.container}>
      <AppBar title="Privacy Policy" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>Last updated: 10 May 2024</Text>
        {SECTIONS.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}

        <Pressable style={styles.agreeRow} onPress={() => setAgreed(a => !a)}>
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
          </View>
          <Text style={styles.agreeText}>I have read and agree to the Privacy Policy</Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  body: { padding: 20 },
  updated: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  sectionBody: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  agreeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  agreeText: { flex: 1, fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
});
