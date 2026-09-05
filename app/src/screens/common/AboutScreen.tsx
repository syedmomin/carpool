import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, AppBar } from '../../components';
import Logo from '../../components/Logo';

export default function AboutScreen({ navigation }) {
  const FEATURES = [
    { icon: 'search-outline',          label: 'Find intercity rides across Pakistan instantly' },
    { icon: 'pricetags-outline',       label: 'Post a request and let drivers bid their fare' },
    { icon: 'shield-checkmark-outline',label: 'CNIC & licence verified drivers' },
    { icon: 'navigate-outline',        label: 'Live ride tracking from pickup to drop-off' },
    { icon: 'chatbubble-ellipses-outline', label: 'In-app chat with your driver or passenger' },
    { icon: 'wallet-outline',          label: 'Affordable fares, paid in cash, no commission' },
    { icon: 'star-outline',            label: 'Real ratings and reviews after every trip' },
    { icon: 'car-sport-outline',       label: 'Cars, Hiace, Coaster and more' },
  ];

  const STEPS = [
    { n: '1', label: 'Search a route or post a ride request for your trip.' },
    { n: '2', label: 'Drivers offer seats or bid a price. Pick the one you like.' },
    { n: '3', label: 'Chat, track the ride live, and pay the driver in cash.' },
    { n: '4', label: 'Rate each other after every ride.' },
  ];

  return (
    <View style={styles.container}>
      <AppBar title="About ChalParo" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Logo variant="auth" width={200} height={72} />
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.tagline}>Affordable Intercity Rides Across Pakistan</Text>
        </View>

        {/* About */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Our Mission</Text>
          <Text style={styles.cardText}>ChalParo connects drivers with empty seats to passengers who need an affordable ride across Pakistan.</Text>
        </View>

        {/* Contact */}
        <View style={styles.card}>
          <Pressable style={styles.contactRow} onPress={() => Linking.openURL('mailto:support@chalparo.com')}>
            <Ionicons name="mail-outline" size={18} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Support Email</Text>
              <Text style={styles.contactValue}>support@chalparo.com</Text>
            </View>
          </Pressable>
          <View style={styles.contactDivider} />
          <Pressable style={styles.contactRow} onPress={() => Linking.openURL('https://www.chalparo.com')}>
            <Ionicons name="globe-outline" size={18} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Website</Text>
              <Text style={styles.contactValue}>www.chalparo.com</Text>
            </View>
          </Pressable>
        </View>

        {/* How it works */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>How It Works</Text>
          {STEPS.map((s, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{s.n}</Text>
              </View>
              <Text style={styles.featureText}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Features */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Features</Text>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={(f.icon) as any} size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.featureText}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* Team */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Made With Love In Pakistan</Text>
          <Text style={styles.cardText}>We're a small team in Pakistan trying to make going city to city less of a hassle.</Text>
        </View>

        <Text style={styles.copyright}>© 2026 ChalParo. All rights reserved.</Text>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  body: { padding: 20 },
  logoSection: { alignItems: 'center', marginBottom: 28, paddingVertical: 20 },
  logoBox: { width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  appName: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary },
  version: { fontSize: 12, color: COLORS.gray, marginTop: 4 },
  tagline: { fontSize: 14, color: COLORS.gray, marginTop: 8, textAlign: 'center' },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10 },
  cardText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 21 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  featureIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  featureText: { fontSize: 13, color: COLORS.textPrimary, flex: 1 },
  copyright: { textAlign: 'center', fontSize: 12, color: COLORS.textSecondary, marginTop: 8 },

  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  contactLabel: { fontSize: 12, color: COLORS.textSecondary },
  contactValue: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginTop: 2 },
  contactDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
});
