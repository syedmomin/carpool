import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, AppBar } from '../../components';

const SECTIONS = [
  { title: '1. Acceptance of Terms', body: 'By using the ChalParo app, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the app.' },
  { title: '2. About ChalParo', body: 'ChalParo is a ride-sharing platform that connects drivers who have empty seats with passengers travelling the same intercity route across Pakistan. ChalParo is only a technology platform. It is not a transport company, taxi service, or carrier, and it does not own vehicles or employ drivers.' },
  { title: '3. Eligibility', body: 'You must be at least 18 years old and legally able to enter into a contract to use ChalParo. By creating an account you confirm that the information you provide is true, accurate, and your own.' },
  { title: '4. Use of the App', body: 'You agree to use the app only for lawful purposes and in accordance with these terms. You are responsible for maintaining the confidentiality of your account, your phone number, and password.' },
  { title: '5. Driver Responsibilities', body: 'Drivers must follow all traffic laws and provide safe, professional and reliable service to passengers. Drivers must hold a valid CNIC and driving licence, keep their vehicle roadworthy and insured. Drivers set their own routes, departure times, seat prices, and may accept or decline booking requests.' },
  { title: '6. Passenger Responsibilities', body: 'Passengers must provide accurate trip details, arrive at the agreed pickup point on time, and behave respectfully during the ride. Passengers book seats per route segment and agree to pay the listed fare for the seats booked.' },
  { title: '7. Ride Requests & Bidding', body: 'Passengers may post a ride request, and drivers may place bids with a price per seat. A ride is created only when the passenger accepts a bid. Posting a request or a bid does not guarantee a match.' },
  { title: '8. Bookings & Cancellations', body: 'A booking is confirmed when the driver accepts the request and a seat is reserved. Either party may cancel before departure; repeated late cancellations or no-shows may lead to restrictions on your account.' },
  { title: '9. Payments', body: 'All fares are paid in cash directly between the passenger and the driver. ChalParo does not process, collect, or hold any payment, and charges no commission inside the app. Any fare dispute is between the passenger and driver.' },
  { title: '10. Safety & Verification', body: 'Drivers submit their CNIC and driving licence for review, and verified drivers display a badge. Verification is a basic check and not a guarantee of conduct. In an emergency call Rescue 1122, Police 15, or Motorway Police 130.' },
  { title: '11. Prohibited Conduct', body: 'You may not use ChalParo for any illegal activity, carry prohibited goods, harass other users, post false information, or attempt to bypass, scrape, or disrupt the service. Violations may result in immediate suspension.' },
  { title: '12. Limitation of Liability', body: 'ChalParo connects users but is not a party to the travel arrangement between them. To the maximum extent permitted by law, ChalParo is not liable for the conduct of any user or for any loss, injury, delay, or damage arising from a ride arranged through the app.' },
  { title: '13. Suspension & Termination', body: 'We may suspend or remove accounts that breach these terms, harm other users, or pose a safety risk, with or without prior notice.' },
  { title: '14. Governing Law', body: 'These terms are governed by the laws of the Islamic Republic of Pakistan, and any dispute is subject to the courts of Pakistan.' },
  { title: '15. Contact', body: 'For questions about these terms, contact us at support@chalparo.pk.' },
];

export default function TermsScreen({ navigation }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <View style={styles.container}>
      <AppBar title="Terms & Conditions" onBack={() => navigation.goBack()} />
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
          <Text style={styles.agreeText}>I have read and agree to the Terms & Conditions</Text>
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
