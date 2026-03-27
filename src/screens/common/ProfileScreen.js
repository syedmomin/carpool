import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, StarRating, Avatar, MenuCard } from '../../components';
import { useApp } from '../../context/AppContext';

const MENU_ITEMS = [
  { section: 'Account', items: [
    { icon: 'person-outline',      label: 'Edit Profile',      screen: null, color: COLORS.primary },
    { icon: 'card-outline',        label: 'CNIC Verify',       screen: null, color: COLORS.secondary },
    { icon: 'lock-closed-outline', label: 'Password Change',   screen: null, color: COLORS.purple },
  ]},
  { section: 'Activity', items: [
    { icon: 'receipt-outline',      label: 'Booking History', screen: 'BookingHistory', color: COLORS.primary },
    { icon: 'star-outline',         label: 'My Reviews',      screen: null,             color: COLORS.accent },
    { icon: 'notifications-outline',label: 'Notifications',   screen: 'Notifications',  color: COLORS.warning },
  ]},
  { section: 'Support', items: [
    { icon: 'help-circle-outline',        label: 'Help & Support',     screen: null, color: COLORS.gray },
    { icon: 'document-text-outline',      label: 'Terms & Conditions', screen: null, color: COLORS.gray },
    { icon: 'shield-outline',             label: 'Privacy Policy',     screen: null, color: COLORS.gray },
    { icon: 'information-circle-outline', label: 'About App',          screen: null, color: COLORS.gray },
  ]},
];

export default function ProfileScreen({ navigation }) {
  const { currentUser, userRole, logout, getMyBookings, getMyRides } = useApp();
  const bookings = getMyBookings?.() || [];
  const myRides = getMyRides?.() || [];
  const headerColors = userRole === 'driver' ? GRADIENTS.teal : GRADIENTS.primary;

  const handleLogout = () => {
    Alert.alert('Logout', 'Kya aap logout karna chahte hain?', [
      { text: 'Nahi', style: 'cancel' },
      { text: 'Haan, Logout', style: 'destructive', onPress: () => { logout(); navigation.replace('Login'); } },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <LinearGradient colors={headerColors} style={styles.header}>
        <View style={styles.bgCircle} />

        <Avatar
          name={currentUser?.name}
          size={80}
          color="rgba(255,255,255,0.25)"
          onlineIndicator
          onEdit={() => {}}
          style={styles.avatarWrapper}
        />

        <Text style={styles.userName}>{currentUser?.name}</Text>
        <Text style={styles.userPhone}>{currentUser?.phone}</Text>

        <View style={styles.profileBadges}>
          <View style={styles.badge}>
            <Ionicons name={userRole === 'driver' ? 'car-outline' : 'person-outline'} size={14} color="#fff" />
            <Text style={styles.badgeText}>{userRole === 'driver' ? 'Driver' : 'Passenger'}</Text>
          </View>
          {currentUser?.verified && (
            <View style={[styles.badge, { backgroundColor: 'rgba(76,175,80,0.4)' }]}>
              <Ionicons name="shield-checkmark" size={14} color="#fff" />
              <Text style={styles.badgeText}>Verified</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{currentUser?.totalTrips || 0}</Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{currentUser?.rating || '—'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{userRole === 'driver' ? myRides.length : bookings.length}</Text>
            <Text style={styles.statLabel}>{userRole === 'driver' ? 'Rides Posted' : 'Bookings'}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Rating Display */}
      {currentUser?.rating ? (
        <View style={styles.ratingCard}>
          <StarRating rating={currentUser.rating} size={18} />
          <Text style={styles.ratingNote}>Based on {currentUser.totalTrips} trips</Text>
        </View>
      ) : null}

      {/* Menu */}
      {MENU_ITEMS.map((section, si) => (
        <View key={si} style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>{section.section}</Text>
          {section.items.map((item, ii) => (
            <MenuCard
              key={ii}
              icon={item.icon}
              label={item.label}
              color={item.color}
              onPress={() => item.screen ? navigation.navigate(item.screen) : null}
              style={ii > 0 && styles.menuCardNoTop}
            />
          ))}
        </View>
      ))}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>SafariShare v1.0.0 • Made in Pakistan 🇵🇰</Text>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 60, paddingBottom: 28, paddingHorizontal: 20, alignItems: 'center', position: 'relative', overflow: 'hidden' },
  bgCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -40 },
  avatarWrapper: { marginBottom: 12, alignSelf: 'center' },
  userName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  userPhone: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 12 },
  profileBadges: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 16, width: '100%' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },
  ratingCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginTop: -12, borderRadius: 14, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3, gap: 10 },
  ratingNote: { fontSize: 12, color: COLORS.gray },
  menuSection: { paddingHorizontal: 20, marginTop: 20 },
  menuSectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  menuCardNoTop: { marginTop: -1, borderTopLeftRadius: 0, borderTopRightRadius: 0 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 20, marginTop: 24, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, borderWidth: 1.5, borderColor: COLORS.danger + '40', gap: 8 },
  logoutText: { fontSize: 16, fontWeight: '700', color: COLORS.danger },
  versionText: { textAlign: 'center', fontSize: 12, color: COLORS.gray, marginTop: 4 },
});
