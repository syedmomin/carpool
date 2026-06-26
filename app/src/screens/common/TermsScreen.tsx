import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, GRADIENTS, GradientHeader } from '../../components';

const SECTIONS = [
  { title: '1. About ChalParo', body: 'ChalParo is a ride-sharing platform that connects drivers who have empty seats with passengers travelling the same intercity route across Pakistan. ChalParo is only a technology platform. It is not a transport company, taxi service, or carrier, and it does not own vehicles or employ drivers.' },
  { title: '2. Eligibility', body: 'You must be at least 18 years old and legally able to enter into a contract to use ChalParo. By creating an account you confirm that the information you provide is true, accurate, and your own.' },
  { title: '3. Your Account', body: 'You are responsible for keeping your phone number, password, and account secure. You must not share your account, impersonate another person, or create accounts using false information. You may request deletion of your account at any time.' },
  { title: '4. Driver Responsibilities', body: 'Drivers must hold a valid CNIC and driving licence, keep their vehicle roadworthy and insured, and obey all traffic and motorway laws. Drivers set their own routes, departure times, seat prices, and may accept or decline booking requests. Drivers must only carry the number of passengers their vehicle legally allows.' },
  { title: '5. Passenger Responsibilities', body: 'Passengers must provide accurate trip details, arrive at the agreed pickup point on time, and behave respectfully during the ride. Passengers book seats per route segment and agree to pay the listed fare for the seats booked.' },
  { title: '6. Ride Requests & Bidding', body: 'Passengers may post a ride request, and drivers may place bids with a price per seat. A ride is created only when the passenger accepts a bid. Posting a request or a bid does not guarantee a match.' },
  { title: '7. Bookings & Cancellations', body: 'A booking is confirmed when the driver accepts the request and a seat is reserved. Either party may cancel before departure; repeated late cancellations or no-shows may lead to restrictions on your account. Released seats become available to other passengers.' },
  { title: '8. Payments', body: 'All fares are paid in cash directly between the passenger and the driver. ChalParo does not process, collect, or hold any payment, and charges no commission inside the app. Any fare dispute is between the passenger and driver.' },
  { title: '9. Safety & Verification', body: 'Drivers submit their CNIC and driving licence for review, and verified drivers display a badge. Verification is a basic check and not a guarantee of conduct. Always check vehicle and driver details before travelling, and use the in-app chat and live tracking provided. In an emergency call Rescue 1122, Police 15, or Motorway Police 130.' },
  { title: '10. Prohibited Conduct', body: 'You may not use ChalParo for any illegal activity, carry prohibited goods, harass other users, post false information, or attempt to bypass, scrape, or disrupt the service. Violations may result in immediate suspension.' },
  { title: '11. Limitation of Liability', body: 'ChalParo connects users but is not a party to the travel arrangement between them. To the maximum extent permitted by law, ChalParo is not liable for the conduct of any user or for any loss, injury, delay, or damage arising from a ride arranged through the app.' },
  { title: '12. Suspension & Termination', body: 'We may suspend or remove accounts that breach these terms, harm other users, or pose a safety risk, with or without prior notice.' },
  { title: '13. Governing Law', body: 'These terms are governed by the laws of the Islamic Republic of Pakistan, and any dispute is subject to the courts of Pakistan.' },
  { title: '14. Changes to Terms', body: 'We may update these terms from time to time. Continued use of ChalParo after an update means you accept the revised terms.' },
  { title: '15. Contact', body: 'For questions about these terms, contact us at support@chalparo.pk.' },
];

export default function TermsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <GradientHeader colors={GRADIENTS.primary as any} title="Terms & Conditions" subtitle="Last updated: June 2026" onBack={() => navigation.goBack()} />
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
