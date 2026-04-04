import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, GradientHeader } from '../../components';

const FAQ = [
  { q: 'How do I book a ride?', a: 'Go to Home, search your route, choose a ride and tap Book.' },
  { q: 'How do I cancel a booking?', a: 'Go to My Bookings, find your booking and tap Cancel.' },
  { q: 'How is payment made?', a: 'Payment is cash on board — you pay the driver directly.' },
  { q: 'How do I become a driver?', a: 'Register, choose Driver role, add your vehicle and post rides.' },
  { q: 'Is my data safe?', a: 'Yes. We use industry-standard encryption to protect your data.' },
];

export default function SupportScreen({ navigation }) {
  const [expanded, setExpanded] = React.useState(null);

  const CONTACT = [
    { icon: 'call-outline',    label: 'Call Support',    sub: '+92 300 0000000',     onPress: () => Linking.openURL('tel:+923000000000'), color: COLORS.primary },
    { icon: 'mail-outline',    label: 'Email Us',        sub: 'support@chalparo.pk', onPress: () => Linking.openURL('mailto:support@chalparo.pk'), color: COLORS.teal },
    { icon: 'logo-whatsapp',   label: 'WhatsApp',        sub: '+92 300 0000000',     onPress: () => Linking.openURL('https://wa.me/923000000000'), color: COLORS.secondary },
  ];

  return (
    <View style={styles.container}>
      <GradientHeader colors={GRADIENTS.primary as any} title="Help & Support" subtitle="We're here to help" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Contact Options */}
        <Text style={styles.sectionTitle}>Contact Us</Text>
        {CONTACT.map((c, i) => (
          <TouchableOpacity key={i} style={styles.contactCard} onPress={c.onPress}>
            <View style={[styles.contactIcon, { backgroundColor: c.color + '15' }]}>
              <Ionicons name={(c.icon) as any} size={22} color={c.color} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>{c.label}</Text>
              <Text style={styles.contactSub}>{c.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
          </TouchableOpacity>
        ))}

        {/* FAQ */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {FAQ.map((item, i) => (
          <TouchableOpacity key={i} style={styles.faqCard} onPress={() => setExpanded(expanded === i ? null : i)}>
            <View style={styles.faqHeader}>
              <Text style={styles.faqQ}>{item.q}</Text>
              <Ionicons name={(expanded === i ? 'chevron-up' : 'chevron-down') as any} size={18} color={COLORS.gray} />
            </View>
            {expanded === i && <Text style={styles.faqA}>{item.a}</Text>}
          </TouchableOpacity>
        ))}

        {/* Other Links */}
        <Text style={styles.sectionTitle}>More</Text>
        {[
          { icon: 'document-text-outline', label: 'Terms & Conditions', screen: 'Terms' },
          { icon: 'shield-outline',        label: 'Privacy Policy',     screen: 'Privacy' },
          { icon: 'information-circle-outline', label: 'About App',     screen: 'About' },
        ].map((item, i) => (
          <TouchableOpacity key={i} style={styles.linkCard} onPress={() => navigation.navigate(item.screen)}>
            <Ionicons name={(item.icon) as any} size={20} color={COLORS.primary} />
            <Text style={styles.linkLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
          </TouchableOpacity>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  body: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12, marginTop: 8 },
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1, gap: 14 },
  contactIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  contactSub: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  faqCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQ: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, flex: 1, marginRight: 8 },
  faqA: { fontSize: 13, color: COLORS.gray, lineHeight: 20, marginTop: 10 },
  linkCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 8, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  linkLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
});
