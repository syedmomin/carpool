import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, StarRating } from '../../components';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useApp } from '../../context/AppContext';

const MENU_ITEMS = [
  { section: 'Account', items: [
    { icon: 'person-outline',      label: 'Edit Profile',      screen: 'EditProfile',   color: COLORS.primary },
    { icon: 'card-outline',        label: 'CNIC Verification', screen: 'CnicVerify',    color: COLORS.secondary },
    { icon: 'lock-closed-outline', label: 'Change Password',   screen: 'ChangePassword',color: COLORS.purple },
  ]},
  { section: 'Activity', items: [
    { icon: 'receipt-outline',      label: 'Booking History', screen: 'BookingHistory', color: COLORS.primary },
    { icon: 'star-outline',         label: 'My Reviews',      screen: null,             color: COLORS.accent },
    { icon: 'notifications-outline',label: 'Notifications',   screen: 'Notifications',  color: COLORS.warning },
  ]},
  { section: 'Support', items: [
    { icon: 'help-circle-outline',        label: 'Help & Support',     screen: 'Support', color: COLORS.gray },
    { icon: 'document-text-outline',      label: 'Terms & Conditions', screen: 'Terms',   color: COLORS.gray },
    { icon: 'shield-outline',             label: 'Privacy Policy',     screen: 'Privacy', color: COLORS.gray },
    { icon: 'information-circle-outline', label: 'About App',          screen: 'About',   color: COLORS.gray },
  ]},
];

export default function ProfileScreen({ navigation }) {
  const { currentUser, userRole, logout, getMyBookings, getMyRides } = useApp();
  const [logoutModal, setLogoutModal] = useState(false);
  const bookings = getMyBookings?.() || [];
  const myRides = getMyRides?.() || [];
  const headerColors = userRole === 'driver' ? GRADIENTS.teal : GRADIENTS.primary;

  const handleLogout = () => {
    logout();
    navigation.replace('Login');
  };

  const initials = currentUser?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={headerColors} style={styles.header}>
        <View style={styles.bgCircle} />

        {/* Avatar */}
        <TouchableOpacity style={styles.avatarWrap} onPress={() => navigation.navigate('EditProfile')}>
          {currentUser?.avatar ? (
            <Image source={{ uri: currentUser.avatar }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarInitBox}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={12} color="#fff" />
          </View>
        </TouchableOpacity>

        <Text style={styles.userName}>{currentUser?.name}</Text>
        <Text style={styles.userPhone}>{currentUser?.phone}</Text>

        <View style={styles.profileBadges}>
          <View style={styles.badge}>
            <Ionicons name={userRole === 'driver' ? 'car-outline' : 'person-outline'} size={13} color="#fff" />
            <Text style={styles.badgeText}>{userRole === 'driver' ? 'Driver' : 'Passenger'}</Text>
          </View>
          {currentUser?.verified && (
            <View style={[styles.badge, { backgroundColor: 'rgba(76,175,80,0.4)' }]}>
              <Ionicons name="shield-checkmark" size={13} color="#fff" />
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

      {/* Rating */}
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
          <View style={styles.menuGroup}>
            {section.items.map((item, ii) => (
              <TouchableOpacity
                key={ii}
                style={[styles.menuItem, ii > 0 && styles.menuItemBorder]}
                onPress={() => item.screen ? navigation.navigate(item.screen) : null}
              >
                <View style={[styles.menuItemIcon, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.gray} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={() => setLogoutModal(true)}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>SafariShare v1.0.0 • Made in Pakistan 🇵🇰</Text>
      <View style={{ height: 32 }} />

      <ConfirmModal
        visible={logoutModal}
        onClose={() => setLogoutModal(false)}
        onConfirm={handleLogout}
        title="Logout?"
        message="Are you sure you want to logout from SafariShare?"
        confirmText="Yes, Logout"
        cancelText="Stay"
        type="danger"
        icon="log-out-outline"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 60, paddingBottom: 28, paddingHorizontal: 20, alignItems: 'center', position: 'relative', overflow: 'hidden' },
  bgCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -40 },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatarImg: { width: 90, height: 90, borderRadius: 30, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  avatarInitBox: { width: 90, height: 90, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  avatarInitials: { fontSize: 30, fontWeight: '900', color: '#fff' },
  editBadge: { position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
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
  menuSectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  menuGroup: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  menuItemBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  menuItemIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuItemLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 20, marginTop: 24, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, borderWidth: 1.5, borderColor: COLORS.danger + '40', gap: 8 },
  logoutText: { fontSize: 16, fontWeight: '700', color: COLORS.danger },
  versionText: { textAlign: 'center', fontSize: 12, color: COLORS.gray, marginTop: 4 },
});
