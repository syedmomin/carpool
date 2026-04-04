import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, GRADIENTS, GradientHeader } from '../../components';

const SECTIONS = [
  { title: 'Information We Collect', body: 'We collect your name, phone number, email address, and location data to provide ride-sharing services.' },
  { title: 'How We Use Your Data', body: 'Your data is used to match passengers with drivers, send notifications, and improve our services.' },
  { title: 'Data Sharing', body: 'We never sell your data. We only share necessary information between matched drivers and passengers.' },
  { title: 'Data Security', body: 'We use industry-standard encryption to protect your data. Your CNIC and personal documents are stored securely.' },
  { title: 'Your Rights', body: 'You can request deletion of your account and all associated data at any time by contacting support.' },
  { title: 'Location Data', body: 'Location data is used only during active rides and is not stored permanently.' },
  { title: 'Contact', body: 'For privacy concerns, email us at privacy@chalparo.pk' },
];

export default function PrivacyScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <GradientHeader colors={GRADIENTS.teal as any} title="Privacy Policy" subtitle="Last updated: March 2026" onBack={() => navigation.goBack()} />
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
