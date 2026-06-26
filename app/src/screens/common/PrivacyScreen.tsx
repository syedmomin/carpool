import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, GRADIENTS, GradientHeader } from '../../components';

const SECTIONS = [
  { title: 'Information We Collect', body: 'Account details: your name, phone number, email, city, and profile photo. Verification documents: your CNIC and driving licence (for drivers). Trip data: routes, bookings, ride requests, bids, and reviews. Device data: your push-notification token and, during active rides, your live location.' },
  { title: 'How We Use Your Data', body: 'We use your data to create your account, match passengers with drivers, show ride and driver details, enable in-app chat and live tracking, send ride and notification alerts, verify drivers, and keep the platform safe.' },
  { title: 'Live Location', body: 'Location is collected only while you are in an active ride, so passengers and the driver can see the trip in progress. It is used for the live trip view and is not used to track you outside of an active ride.' },
  { title: 'What Other Users See', body: 'When a booking is matched, the driver and passenger can see each other’s name, photo, rating, and contact number so they can coordinate the trip. Drivers also display vehicle details. Your CNIC and licence are never shown to other users.' },
  { title: 'Service Providers', body: 'We use trusted third parties to run the app: Cloudinary (image hosting for photos and documents), Google Firebase (push notifications), and our cloud database and cache providers for secure storage. These providers process data only on our behalf.' },
  { title: 'Payments', body: 'ChalParo does not collect or store any payment or card information. All fares are paid in cash directly between passengers and drivers.' },
  { title: 'Data Sharing', body: 'We never sell your personal data. We share information only as needed to provide the service, comply with the law, or respond to a lawful request from authorities.' },
  { title: 'Data Security', body: 'We protect your data with encrypted connections and access controls. Verification documents are stored securely and used only for review. No system is perfectly secure, so please keep your account credentials private.' },
  { title: 'Data Retention', body: 'We keep your data while your account is active. When you delete your account, we remove or anonymise your personal data, except where we must keep limited records to meet legal obligations.' },
  { title: 'Your Rights', body: 'You can view and edit your profile in the app, and request deletion of your account and associated data at any time by contacting support.' },
  { title: 'Children', body: 'ChalParo is intended for users aged 18 and over. We do not knowingly collect data from anyone under 18.' },
  { title: 'Contact', body: 'For any privacy question or a data deletion request, email us at privacy@chalparo.pk.' },
];

export default function PrivacyScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <GradientHeader colors={GRADIENTS.teal as any} title="Privacy Policy" subtitle="Last updated: June 2026" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>Your privacy is important to us. This policy explains how we handle your data.</Text>
        {SECTIONS.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  body: { padding: 20 },
  intro: { fontSize: 14, color: COLORS.gray, lineHeight: 22, marginBottom: 20 },
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  sectionBody: { fontSize: 13, color: COLORS.gray, lineHeight: 21 },
});
