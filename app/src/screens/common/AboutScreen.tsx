import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, GradientHeader } from '../../components';

export default function AboutScreen({ navigation }) {
  const FEATURES = [
    { icon: 'search-outline',          label: 'Find rides across Pakistan instantly' },
    { icon: 'shield-checkmark-outline',label: 'CNIC verified drivers for safety' },
    { icon: 'wallet-outline',          label: 'Affordable fares, cash payment' },
    { icon: 'star-outline',            label: 'Real ratings and reviews' },
    { icon: 'car-sport-outline',       label: 'Multiple vehicle types: Car, Hiace, Coaster' },
    { icon: 'people-outline',          label: 'Seat sharing for cost efficiency' },
  ];

  return (
    <View style={styles.container}>
      <GradientHeader colors={GRADIENTS.primary} title="About ChalParo" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <LinearGradient colors={GRADIENTS.primary} style={styles.logoBox}>
            <Ionicons name="car-sport" size={48} color="#fff" />
          </LinearGradient>
          <Text style={styles.appName}>ChalParo</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.tagline}>Pakistan's Smart Ride Sharing App</Text>
        </View>

        {/* About */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Our Mission</Text>
          <Text style={styles.cardText}>ChalParo connects drivers with empty seats to passengers who need affordable travel across Pakistan. We believe travel should be safe, affordable, and accessible to everyone.</Text>
        </View>

        {/* Features */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Features</Text>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.featureText}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* Team */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Made With Love in Pakistan 🇵🇰</Text>
          <Text style={styles.cardText}>ChalParo is built by a passionate team dedicated to solving Pakistan's intercity travel challenges.</Text>
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
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10 },
  cardText: { fontSize: 13, color: COLORS.gray, lineHeight: 21 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  featureIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  featureText: { fontSize: 13, color: COLORS.textPrimary, flex: 1 },
  copyright: { textAlign: 'center', fontSize: 12, color: COLORS.gray, marginTop: 8 },
});
