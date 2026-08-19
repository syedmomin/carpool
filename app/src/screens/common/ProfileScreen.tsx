import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, CURVE, TrustBadgesRow, PressableScale } from '../../components';
import { reviewsApi } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { useGlobalModal } from '../../context/GlobalModalContext';

const getMenuItems = (userRole: string) => [
  {
    section: 'Account', items: [
      { icon: 'person-outline', label: 'Edit Profile', screen: 'EditProfile', color: COLORS.primary },
      { icon: 'card-outline', label: 'CNIC Verification', screen: 'CnicVerify', color: COLORS.secondary },
      { icon: 'lock-closed-outline', label: 'Change Password', screen: 'ChangePassword', color: COLORS.purple },
    ]
  },
  {
    section: 'Activity', items: [
      {
        icon: 'receipt-outline',
        label: userRole === 'driver' ? 'Ride History' : 'Booking History',
        screen: userRole === 'driver' ? 'RideHistory' : 'PastBookings',
        color: COLORS.primary
      },

      { icon: 'star-outline', label: 'My Reviews', screen: 'Reviews', color: COLORS.accent },
      { icon: 'notifications-outline', label: 'Notifications', screen: 'Notifications', color: COLORS.warning },
    ]
  },

  {
    section: 'Support', items: [
      { icon: 'help-circle-outline', label: 'Help & Support', screen: 'Support', color: COLORS.gray },
      { icon: 'document-text-outline', label: 'Terms & Conditions', screen: 'Terms', color: COLORS.gray },
      { icon: 'shield-outline', label: 'Privacy Policy', screen: 'Privacy', color: COLORS.gray },
      { icon: 'information-circle-outline', label: 'About App', screen: 'About', color: COLORS.gray },
    ]
  },
];


// ─── Verification Progress Section ────────────────────────────────────────────
function VerificationProgress({ user, userRole, onNavigate }) {
  const isDriver = userRole === 'driver';
  const cnicStatus = user?.cnicStatus ?? user?.verification?.cnicStatus;
  const cnicUploaded = !!cnicStatus;
  const cnicApproved = cnicStatus === 'APPROVED';
  const licenceStatus = user?.licenceStatus ?? user?.verification?.licenceStatus;
  const licenceUploaded = !!licenceStatus && licenceStatus !== 'NONE';
  const licenceApproved = licenceStatus === 'APPROVED';
  const fullyVerified = isDriver ? (cnicApproved && licenceApproved) : cnicApproved;

  const steps = [
    { label: 'CNIC Submitted',   done: cnicUploaded,    icon: 'card-outline',            color: COLORS.secondary, screen: 'CnicVerify' },
    { label: 'CNIC Approved',    done: cnicApproved,    icon: 'shield-checkmark-outline', color: COLORS.purple },
    ...(isDriver ? [
      { label: 'Licence Submitted', done: licenceUploaded, icon: 'document-text-outline', color: COLORS.primary,   screen: 'CnicVerify' },
      { label: 'Licence Approved',  done: licenceApproved, icon: 'car-sport-outline',      color: COLORS.teal },
    ] : []),
  ];

  const doneCount = steps.filter(s => s.done).length;
  const progress = doneCount / steps.length;

  return (
    <View style={[vStyles.card, CURVE]}>
      <View style={vStyles.header}>
        <View style={vStyles.headerLeft}>
          <Ionicons name={(fullyVerified ? 'shield-checkmark' : 'shield-outline') as any} size={22} color={fullyVerified ? COLORS.secondary : COLORS.warning} />
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
          <Pressable
            key={i}
            style={[vStyles.stepChip, s.done && vStyles.stepChipDone]}
            onPress={() => s.screen && !s.done ? onNavigate(s.screen) : null}
          >
            <View style={[vStyles.stepIcon, { backgroundColor: s.done ? s.color + '20' : COLORS.lightGray }]}>
              <Ionicons name={(s.done ? 'checkmark-circle' : s.icon) as any} size={16} color={s.done ? s.color : COLORS.gray} />
            </View>
            <Text style={[vStyles.stepLabel, s.done && { color: s.color }]}>{s.label}</Text>
            {!s.done && s.screen && <Ionicons name="chevron-forward" size={12} color={COLORS.gray} />}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { currentUser, userRole, logout } = useApp();
  const { showModal } = useGlobalModal();
  const headerColors = userRole === 'driver' ? GRADIENTS.teal : GRADIENTS.primary;

  // Rating isn't part of the /auth/me payload — pull it from the reviews endpoint.
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [ratingLoading, setRatingLoading] = useState(true);

  const fetchRating = useCallback(async () => {
    if (!currentUser?.id) { setRatingLoading(false); return; }
    try {
      const { data } = await reviewsApi.forUser(currentUser.id);
      if (data) setReviewStats(data.data?.stats || null);
    } catch (err) {
      console.error('Fetch profile rating error:', err);
    } finally {
      setRatingLoading(false);
    }
  }, [currentUser?.id]);

  useFocusEffect(useCallback(() => {
    fetchRating();
  }, [fetchRating]));

  const ratingValue = reviewStats?.total ? reviewStats.averageRating : currentUser?.rating;

  const handleLogout = async () => {
    await logout();
  };

  const initials = currentUser?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={headerColors as any} style={styles.header}>
        <View style={styles.bgCircle} />

        {/* Avatar left, text right — single row */}
        <View style={styles.headerRow}>
          <Pressable style={styles.avatarWrap} onPress={() => navigation.navigate('EditProfile')}>
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
          </Pressable>

          <View style={styles.headerTextCol}>
            <Text style={styles.userName} numberOfLines={1}>{currentUser?.name}</Text>
            <Text style={styles.userPhone}>{currentUser?.phone}</Text>
            <View style={styles.profileBadges}>
              <View style={styles.badge}>
                <Ionicons name={(userRole === 'driver' ? 'car-outline' : 'person-outline') as any} size={11} color="#fff" />
                <Text style={styles.badgeText}>{userRole === 'driver' ? 'Driver' : 'Passenger'}</Text>
              </View>
            </View>
            <TrustBadgesRow user={currentUser} style={{ marginTop: 6 }} />
          </View>
        </View>
      </LinearGradient>

      {/* Floating Stats Card — overlaps gradient */}
      <View style={styles.statsCard}>
        <View style={styles.stat}>
          <Text style={styles.statValue} numberOfLines={1}>{currentUser?.city || '-'}</Text>
          <Text style={styles.statLabel}>City</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {ratingLoading && !reviewStats ? '…' : ratingValue ? `${Number(ratingValue).toFixed(1)} ★` : 'New'}
          </Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {currentUser?.createdAt ? new Date(currentUser.createdAt).getFullYear() : '-'}
          </Text>
          <Text style={styles.statLabel}>Member</Text>
        </View>
      </View>

      {/* Verification Progress */}
      <View style={styles.section}>
        <VerificationProgress user={currentUser} userRole={userRole} onNavigate={screen => navigation.navigate(screen)} />
      </View>

      {/* Menu */}
      {getMenuItems(userRole).map((section, si) => (

        <View key={si} style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>{section.section}</Text>
          <View style={[styles.menuGroup, CURVE]}>
            {section.items.map((item, ii) => (
              <Pressable
                key={ii}
                style={({ pressed }) => [styles.menuItem, CURVE, ii > 0 && styles.menuItemBorder, pressed && { backgroundColor: COLORS.lightGray }]}
                onPress={() => item.screen ? navigation.navigate(item.screen) : null}
              >
                <View style={[styles.menuItemIcon, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={(item.icon) as any} size={18} color={item.color} />
                </View>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      {/* Logout */}
      <PressableScale
        style={[styles.logoutBtn, CURVE]}
        onPress={() => showModal({
          type: 'danger',
          title: 'Logout?',
          message: 'Are you sure you want to logout from ChalParo?',
          confirmText: 'Yes, Logout',
          cancelText: 'Stay',
          icon: 'log-out-outline',
          onConfirm: handleLogout,
        })}
      >
        <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
        <Text style={styles.logoutText}>Logout</Text>
      </PressableScale>

      <Text style={styles.versionText}>ChalParo v1.0.0 · Made in Pakistan</Text>
    </ScrollView>
  );
}

// ─── Verification styles ──────────────────────────────────────────────────────
const vStyles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  verifiedPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4 },
  verifiedText: { fontSize: 12, fontWeight: '700', color: COLORS.secondary },
  progressTrack: { height: 6, backgroundColor: COLORS.lightGray, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  progressLabel: { fontSize: 12, color: COLORS.gray, marginBottom: 14 },
  stepsGrid: { gap: 8 },
  stepChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 10, padding: 10, gap: 10 },
  stepChipDone: { backgroundColor: '#f0fdf4' },
  stepIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.gray },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 52, paddingBottom: 28, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  bgCircle: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.06)', top: -50, right: -30 },

  // Avatar left, text right layout
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerTextCol: { flex: 1, gap: 3 },
  avatarWrap: { position: 'relative' },
  avatarImg: { width: 76, height: 76, borderRadius: 38, borderWidth: 2.5, borderColor: '#fff' },
  avatarInitBox: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: '#fff' },
  avatarInitials: { fontSize: 26, fontWeight: '900', color: '#fff' },
  editBadge: { position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },

  userName: { fontSize: 20, fontWeight: '900', color: '#fff' },
  userPhone: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  profileBadges: { flexDirection: 'row', gap: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  // Floating stats card — overlaps gradient with negative marginTop
  statsCard: {
    flexDirection: 'row',
    marginTop: -24,
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 10, color: COLORS.gray, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },

  section: { paddingHorizontal: 20, marginTop: 12 },
  menuSection: { paddingHorizontal: 20, marginTop: 20 },
  menuSectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  menuGroup: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  menuItemBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  menuItemIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  menuItemLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 20, marginTop: 24, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 14, borderWidth: 1.5, borderColor: COLORS.danger + '30', gap: 8 },
  logoutText: { fontSize: 15, fontWeight: '700', color: COLORS.danger },

  versionText: { textAlign: 'center', fontSize: 12, color: COLORS.gray, marginTop: 4 },
});
