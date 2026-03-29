import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '../../components';
import { useApp } from '../../context/AppContext';
import { useGlobalModal } from '../../context/GlobalModalContext';

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

// ─── Verification Progress Section ────────────────────────────────────────────
function VerificationProgress({ user, onNavigate }) {
  const emailVerified = !!user?.emailVerified;
  const phoneVerified = !!user?.phoneVerified;
  const cnicUploaded  = !!user?.cnicStatus && user.cnicStatus !== 'NONE';
  const cnicApproved  = user?.cnicStatus === 'APPROVED';
  const fullyVerified = emailVerified && phoneVerified && cnicApproved;

  const steps = [
    { label: 'Email Address',  done: emailVerified, icon: 'mail-outline',          color: COLORS.primary  },
    { label: 'Phone Number',   done: phoneVerified, icon: 'call-outline',          color: COLORS.teal     },
    { label: 'CNIC Submitted', done: cnicUploaded,  icon: 'card-outline',          color: COLORS.secondary, screen: 'CnicVerify' },
    { label: 'CNIC Approved',  done: cnicApproved,  icon: 'shield-checkmark-outline', color: COLORS.purple },
  ];

  const doneCount = steps.filter(s => s.done).length;
  const progress  = doneCount / steps.length;

  return (
    <View style={vStyles.card}>
      <View style={vStyles.header}>
        <View style={vStyles.headerLeft}>
          <Ionicons name={fullyVerified ? 'shield-checkmark' : 'shield-outline'} size={22} color={fullyVerified ? COLORS.secondary : COLORS.warning} />
          <Text style={vStyles.title}>Identity Verification</Text>
        </View>
        {fullyVerified && (
          <View style={vStyles.verifiedPill}>
            <Ionicons name="checkmark-circle" size={13} color={COLORS.secondary} />
            <Text style={vStyles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>

      {/* Progress bar */}
      <View style={vStyles.progressTrack}>
        <View style={[vStyles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={vStyles.progressLabel}>{doneCount} of {steps.length} steps completed</Text>

      {/* Steps */}
      <View style={vStyles.stepsGrid}>
        {steps.map((s, i) => (
          <TouchableOpacity
            key={i}
            style={[vStyles.stepChip, s.done && vStyles.stepChipDone]}
            onPress={() => s.screen && !s.done ? onNavigate(s.screen) : null}
            activeOpacity={s.screen && !s.done ? 0.7 : 1}
          >
            <View style={[vStyles.stepIcon, { backgroundColor: s.done ? s.color + '20' : COLORS.lightGray }]}>
              <Ionicons name={s.done ? 'checkmark-circle' : s.icon} size={16} color={s.done ? s.color : COLORS.gray} />
            </View>
            <Text style={[vStyles.stepLabel, s.done && { color: s.color }]}>{s.label}</Text>
            {!s.done && s.screen && <Ionicons name="chevron-forward" size={12} color={COLORS.gray} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { currentUser, userRole, logout } = useApp();
  const { showModal } = useGlobalModal();
  const headerColors = userRole === 'driver' ? GRADIENTS.teal : GRADIENTS.primary;

  const handleLogout = async () => {
    await logout();
    navigation.replace('Onboarding');
  };

  const initials = currentUser?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={headerColors} style={styles.header}>
        <View style={styles.bgCircle} />

        {/* Avatar + Info row */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.avatarWrap} onPress={() => navigation.navigate('EditProfile')}>
            {currentUser?.avatar ? (
              <Image source={{ uri: currentUser.avatar }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarInitBox}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={10} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.userName} numberOfLines={1}>{currentUser?.name}</Text>
            <Text style={styles.userPhone}>{currentUser?.phone}</Text>
            <View style={styles.profileBadges}>
              <View style={styles.badge}>
                <Ionicons name={userRole === 'driver' ? 'car-outline' : 'person-outline'} size={11} color="#fff" />
                <Text style={styles.badgeText}>{userRole === 'driver' ? 'Driver' : 'Passenger'}</Text>
              </View>
              {(currentUser?.isVerified || currentUser?.verification?.cnicStatus === 'APPROVED') && (
                <View style={[styles.badge, { backgroundColor: 'rgba(76,175,80,0.35)' }]}>
                  <Ionicons name="shield-checkmark" size={11} color="#fff" />
                  <Text style={styles.badgeText}>Verified</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{currentUser?.city || '—'}</Text>
            <Text style={styles.statLabel}>City</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{currentUser?.rating || '—'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{currentUser?.city || '—'}</Text>
            <Text style={styles.statLabel}>City</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Verification Progress */}
      <View style={styles.section}>
        <VerificationProgress user={currentUser} onNavigate={screen => navigation.navigate(screen)} />
      </View>

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
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => showModal({
          type:        'danger',
          title:       'Logout?',
          message:     'Are you sure you want to logout from ChalParo?',
          confirmText: 'Yes, Logout',
          cancelText:  'Stay',
          icon:        'log-out-outline',
          onConfirm:   handleLogout,
        })}
      >
        <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>ChalParo v1.0.0 • Made in Pakistan 🇵🇰</Text>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Verification styles ──────────────────────────────────────────────────────
const vStyles = StyleSheet.create({
  card:         { backgroundColor: '#fff', borderRadius: 18, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title:        { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  verifiedPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4 },
  verifiedText: { fontSize: 12, fontWeight: '700', color: COLORS.secondary },
  progressTrack:{ height: 6, backgroundColor: COLORS.lightGray, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: 3 },
  progressLabel:{ fontSize: 12, color: COLORS.gray, marginBottom: 14 },
  stepsGrid:    { gap: 8 },
  stepChip:     { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 10, padding: 10, gap: 10 },
  stepChipDone: { backgroundColor: '#f0fdf4' },
  stepIcon:     { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stepLabel:    { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.gray },
});

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.bg },
  header:           { paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  bgCircle:         { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.06)', top: -50, right: -30 },
  // Horizontal row: avatar left, info right
  headerRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 16 },
  avatarWrap:       { position: 'relative', flexShrink: 0 },
  avatarImg:        { width: 72, height: 72, borderRadius: 22, borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)' },
  avatarInitBox:    { width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  avatarInitials:   { fontSize: 24, fontWeight: '900', color: '#fff' },
  editBadge:        { position: 'absolute', bottom: -3, right: -3, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },
  headerInfo:       { flex: 1 },
  userName:         { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 2 },
  userPhone:        { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 8 },
  profileBadges:    { flexDirection: 'row', gap: 6 },
  badge:            { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
  badgeText:        { color: '#fff', fontSize: 11, fontWeight: '600' },
  statsRow:         { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 8 },
  stat:             { flex: 1, alignItems: 'center' },
  statValue:        { fontSize: 17, fontWeight: '800', color: '#fff' },
  statLabel:        { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  statDivider:      { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },
  ratingCard:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginTop: -12, borderRadius: 14, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3, gap: 10 },
  ratingNote:       { fontSize: 12, color: COLORS.gray },
  section:          { paddingHorizontal: 20, marginTop: 12 },
  menuSection:      { paddingHorizontal: 20, marginTop: 20 },
  menuSectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  menuGroup:        { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  menuItem:         { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  menuItemBorder:   { borderTopWidth: 1, borderTopColor: COLORS.border },
  menuItemIcon:     { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuItemLabel:    { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  logoutBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 20, marginTop: 24, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, borderWidth: 1.5, borderColor: COLORS.danger + '40', gap: 8 },
  logoutText:       { fontSize: 16, fontWeight: '700', color: COLORS.danger },
  versionText:      { textAlign: 'center', fontSize: 12, color: COLORS.gray, marginTop: 4 },
});
