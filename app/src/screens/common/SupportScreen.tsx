import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, CURVE, AppBar, SectionHeader } from '../../components';

const TOPICS = [
  {
    key: 'account', icon: 'person-outline', title: 'Account & Profile', sub: 'Update profile, documents, verification',
    faqs: [
      { q: 'How do I edit my profile?', a: 'Go to Profile > Edit Profile to update your name, phone, and photo.' },
      { q: 'How do I verify my CNIC?', a: 'Go to Profile > Documents and upload your CNIC front, back, and a selfie.' },
    ],
  },
  {
    key: 'earnings', icon: 'card-outline', title: 'Earnings & Payments', sub: 'Payouts, incentives, transactions',
    faqs: [
      { q: 'How is payment made?', a: 'Payment is cash on board. Passengers pay the driver directly at the end of the ride.' },
    ],
  },
  {
    key: 'rides', icon: 'car-outline', title: 'Rides & Bookings', sub: 'Ride issues, cancellations, requests',
    faqs: [
      { q: 'How do I book a ride?', a: 'Go to Home, search your route, choose a ride and tap Book.' },
      { q: 'How do I cancel a booking?', a: 'Go to My Bookings, find your booking and tap Cancel.' },
      { q: 'How do I become a driver?', a: 'Register, choose Driver role, add your vehicle and post rides.' },
    ],
  },
  {
    key: 'technical', icon: 'construct-outline', title: 'App & Technical', sub: 'App performance, bugs, features',
    faqs: [
      { q: 'The app is running slowly, what should I do?', a: 'Try closing and reopening the app, or check for an update in your app store.' },
    ],
  },
  {
    key: 'safety', icon: 'shield-checkmark-outline', title: 'Safety & Guidelines', sub: 'Safety tips, community guidelines',
    faqs: [
      { q: 'Is my data safe?', a: 'Yes. We use industry-standard encryption to protect your data.' },
      { q: 'What do I do in an emergency during a ride?', a: 'Use the SOS button on the Live Tracking screen to call emergency services immediately.' },
    ],
  },
];

export default function SupportScreen({ navigation }) {
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const CONTACT = [
    { icon: 'call-outline', label: 'Call Support', sub: '+92 300 0000000', onPress: () => Linking.openURL('tel:+923000000000') },
    { icon: 'mail-outline', label: 'Email Us', sub: 'support@chalparo.pk', onPress: () => Linking.openURL('mailto:support@chalparo.pk') },
  ];

  return (
    <View style={styles.container}>
      <AppBar title="Support" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={GRADIENTS.primary as any} style={styles.hero}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>How can we help you?</Text>
            <Text style={styles.heroSub}>We're here to assist you 24/7</Text>
          </View>
          <View style={styles.heroIconBox}>
            <Ionicons name="headset" size={30} color={COLORS.white} />
          </View>
        </LinearGradient>

        {/* Help Topics */}
        <SectionHeader title="Help Topics" />
        <View style={styles.topicsCard}>
          {TOPICS.map((topic, i) => (
            <View key={topic.key}>
              <Pressable
                style={[styles.topicRow, i > 0 && styles.topicRowBorder]}
                onPress={() => setExpandedTopic(expandedTopic === topic.key ? null : topic.key)}
              >
                <View style={styles.topicIcon}>
                  <Ionicons name={topic.icon as any} size={20} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.topicTitle}>{topic.title}</Text>
                  <Text style={styles.topicSub}>{topic.sub}</Text>
                </View>
                <Ionicons name={expandedTopic === topic.key ? 'chevron-up' : 'chevron-forward'} size={18} color={COLORS.textSecondary} />
              </Pressable>
              {expandedTopic === topic.key && (
                <View style={styles.faqWrap}>
                  {topic.faqs.map((f, fi) => (
                    <View key={fi} style={styles.faqItem}>
                      <Text style={styles.faqQ}>{f.q}</Text>
                      <Text style={styles.faqA}>{f.a}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Start Chat */}
        <View style={styles.chatCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.chatTitle}>Still need help?</Text>
            <Text style={styles.chatSub}>Chat with our support team</Text>
          </View>
          <Pressable style={styles.chatBtn} onPress={() => Linking.openURL('https://wa.me/923000000000')}>
            <Text style={styles.chatBtnText}>Start Chat</Text>
          </Pressable>
        </View>

        {/* Other contact methods */}
        <SectionHeader title="Other Ways to Reach Us" />
        {CONTACT.map((c, i) => (
          <Pressable key={i} style={styles.contactCard} onPress={c.onPress}>
            <View style={styles.contactIcon}>
              <Ionicons name={c.icon as any} size={20} color={COLORS.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>{c.label}</Text>
              <Text style={styles.contactSub}>{c.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
          </Pressable>
        ))}

        {/* Other Links */}
        <SectionHeader title="More" />
        {[
          { icon: 'document-text-outline', label: 'Terms & Conditions', screen: 'Terms' },
          { icon: 'shield-outline', label: 'Privacy Policy', screen: 'Privacy' },
          { icon: 'information-circle-outline', label: 'About App', screen: 'About' },
        ].map((item, i) => (
          <Pressable key={i} style={styles.linkCard} onPress={() => navigation.navigate(item.screen)}>
            <Ionicons name={item.icon as any} size={20} color={COLORS.primary} />
            <Text style={styles.linkLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
          </Pressable>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  body: { padding: 16 },

  hero: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 18, marginBottom: 20 },
  heroTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  heroIconBox: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  topicsCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20, ...CURVE },
  topicRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  topicRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  topicIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  topicTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  topicSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  faqWrap: { paddingHorizontal: 14, paddingBottom: 14, gap: 10 },
  faqItem: { backgroundColor: COLORS.lightGray, borderRadius: 10, padding: 12 },
  faqQ: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  faqA: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },

  chatCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 20, gap: 12, ...CURVE },
  chatTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  chatSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  chatBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11 },
  chatBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },

  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border, gap: 12 },
  contactIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  contactSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  linkCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 14, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: COLORS.border },
  linkLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
});
