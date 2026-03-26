import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, StarRating } from '../../components';
import { useApp } from '../../context/AppContext';

const MENU_ITEMS = [
  { section: 'Account', items: [
    { icon: 'person-outline', label: 'Edit Profile', screen: null, color: COLORS.primary },
    { icon: 'card-outline', label: 'CNIC Verify', screen: null, color: COLORS.secondary },
    { icon: 'lock-closed-outline', label: 'Password Change', screen: null, color: '#7b1fa2' },
  ]},
  { section: 'Activity', items: [
    { icon: 'receipt-outline', label: 'Booking History', screen: 'BookingHistory', color: COLORS.primary },
    { icon: 'star-outline', label: 'My Reviews', screen: null, color: COLORS.accent },
    { icon: 'notifications-outline', label: 'Notifications', screen: 'Notifications', color: '#f57c00' },
  ]},
  { section: 'Support', items: [
    { icon: 'help-circle-outline', label: 'Help & Support', screen: null, color: COLORS.gray },
    { icon: 'document-text-outline', label: 'Terms & Conditions', screen: null, color: COLORS.gray },
    { icon: 'shield-outline', label: 'Privacy Policy', screen: null, color: COLORS.gray },
    { icon: 'information-circle-outline', label: 'About App', screen: null, color: COLORS.gray },
  ]},
];

export default function ProfileScreen({ navigation }) {
  const { currentUser, userRole, logout, getMyBookings, getMyRides } = useApp();
  const bookings = getMyBookings?.() || [];
  const myRides = getMyRides?.() || [];

  const handleLogout = () => {
    Alert.alert('Logout', 'Kya aap logout karna chahte hain?', [
      { text: 'Nahi', style: 'cancel' },
      {
        text: 'Haan, Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <LinearGradient
        colors={userRole === 'driver' ? ['#00897b', '#00695c'] : ['#1a73e8', '#0d47a1']}
        style={styles.header}
      >
        <View style={styles.bgCircle} />
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{currentUser?.name?.[0]}</Text>
            <View style={styles.onlineDot} />
          </View>
          <View style={styles.editAvatarBtn}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </View>

        <Text style={styles.userName}>{currentUser?.name}</Text>
        <Text style={styles.userPhone}>{currentUser?.phone}</Text>

        <View style={styles.profileBadges}>
          <View style={styles.badge}>
            <Ionicons name={userRole === 'driver' ? 'car-outline' : 'person-outline'} size={14} color="#fff" />
            <Text style={styles.badgeText}>{userRole === 'driver' ? 'Driver' : 'Passenger'}</Text>
          </View>
          {currentUser?.verified && (
            <View style={[styles.badge, { backgroundColor: 'rgba(76, 175, 80, 0.4)' }]}>
              <Ionicons name="shield-checkmark" size={14} color="#fff" />
              <Text style={styles.badgeText}>Verified</Text>
            </View>
          )}
        </View>

        {/* Stats */}
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
          <View style={styles.menuCard}>
            {section.items.map((item, ii) => (
              <TouchableOpacity
                key={ii}
                style={[styles.menuItem, ii < section.items.length - 1 && styles.menuItemBorder]}
                onPress={() => item.screen ? navigation.navigate(item.screen) : null}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.gray} />
              </TouchableOpacity>
            ))}
          </View>
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
  avatarSection: { position: 'relative', marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  avatarInitial: { fontSize: 34, fontWeight: '800', color: '#fff' },
  onlineDot: { position: 'absolute', bottom: 3, right: 3, width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.secondary, borderWidth: 2, borderColor: '#fff' },
  editAvatarBtn: { position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
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
  menuCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 14 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 20, marginTop: 24, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, borderWidth: 1.5, borderColor: COLORS.danger + '40', gap: 8 },
  logoutText: { fontSize: 16, fontWeight: '700', color: COLORS.danger },
  versionText: { textAlign: 'center', fontSize: 12, color: COLORS.gray, marginTop: 4 },
});
