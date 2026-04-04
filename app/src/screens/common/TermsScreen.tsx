import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, GRADIENTS, GradientHeader } from '../../components';

const SECTIONS = [
  { title: '1. Acceptance of Terms', body: 'By using ChalParo, you agree to these terms. If you do not agree, please do not use the app.' },
  { title: '2. User Responsibilities', body: 'Users must provide accurate information. Drivers are responsible for their vehicle safety and compliance with traffic laws.' },
  { title: '3. Ride Booking', body: 'Bookings are confirmed once a passenger books a seat. Cancellations must be made in advance to avoid penalties.' },
  { title: '4. Payments', body: 'All payments are made in cash directly between passengers and drivers. ChalParo does not handle payments.' },
  { title: '5. Safety', body: 'All drivers must have a valid CNIC and driving license. ChalParo reserves the right to remove unsafe drivers.' },
  { title: '6. Privacy', body: 'We collect minimal data to provide our services. Your data is never sold to third parties.' },
  { title: '7. Limitation of Liability', body: 'ChalParo is a platform connecting drivers and passengers. We are not liable for any incidents during rides.' },
  { title: '8. Changes to Terms', body: 'We may update these terms at any time. Continued use of the app implies acceptance of updated terms.' },
];

export default function TermsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <GradientHeader colors={GRADIENTS.primary} title="Terms & Conditions" subtitle="Last updated: March 2026" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>Please read these terms carefully before using ChalParo.</Text>
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
