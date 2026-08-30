import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, CURVE, PressableScale, DetailSkeleton } from '../../components';
import { reviewsApi, ridesApi, bookingsApi } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { useToast } from '../../context/ToastContext';

const getMenuItems = (userRole: string, docsBadge?: { label: string; color: string; bg: string }) => {
  const items: any[] = [
    ...(userRole === 'driver' ? [{ icon: 'car-sport-outline', label: 'My Vehicles', screen: 'MyVehiclesTab' }] : []),
    ...(userRole === 'driver' ? [{ icon: 'card-outline', label: 'Documents', screen: 'CnicVerify', badge: docsBadge }] : []),
    { icon: 'help-circle-outline', label: 'Help & Support', screen: 'Support' },
    { icon: 'flag-outline', label: 'Report Suspicious Activity', screen: 'ReportIssue' },
    { icon: 'lock-closed-outline', label: 'Change Password', screen: 'ChangePassword' },
    {
      icon: 'receipt-outline',
      label: userRole === 'driver' ? 'Ride History' : 'Booking History',
      screen: userRole === 'driver' ? 'RideHistory' : 'PastBookings',
    },
    { icon: 'star-outline', label: 'My Reviews', screen: 'Reviews' },
    { icon: 'notifications-outline', label: 'Notifications', screen: 'Notifications' },
    { icon: 'document-text-outline', label: 'Terms & Conditions', screen: 'Terms' },
    { icon: 'shield-outline', label: 'Privacy Policy', screen: 'Privacy' },
    { icon: 'information-circle-outline', label: 'About App', screen: 'About' },
  ];
  return items;
};

export default function ProfileScreen({ navigation }) {
  const { currentUser, userRole, logout } = useApp();
  const { showModal } = useGlobalModal();
  const { showToast } = useToast();

  // Rating isn't part of the /auth/me payload — pull it from the reviews endpoint.
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [ratingLoading, setRatingLoading] = useState(true);
  const [totalRides, setTotalRides] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

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

  const fetchTotalRides = useCallback(async () => {
    const { data } = userRole === 'driver'
      ? await ridesApi.myRides(1, 1)
      : await bookingsApi.myBookings(1, 1);
    const total = data?.meta?.total;
    if (typeof total === 'number') setTotalRides(total);
  }, [userRole]);

  useFocusEffect(useCallback(() => {
    Promise.all([fetchRating(), fetchTotalRides()]).finally(() => setLoaded(true));
  }, [fetchRating, fetchTotalRides]));

  const ratingValue = reviewStats?.total ? reviewStats.averageRating : currentUser?.rating;

  const handleComingSoon = (label: string) => showToast(`${label} is coming soon`, 'info');

  const docsBadge = (() => {
    const cnicStatus = currentUser?.cnicStatus ?? currentUser?.verification?.cnicStatus;
    if (cnicStatus === 'APPROVED') return { label: 'Verified', color: COLORS.secondary, bg: '#e8f5e9' };
    if (cnicStatus) return { label: 'Pending', color: '#b45309', bg: '#fffbeb' };
    return undefined;
  })();

  const handleLogout = async () => {
    await logout();
  };

  const initials = currentUser?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const menuItems = getMenuItems(userRole, docsBadge);

  if (!loaded) {
    return (
      <View style={styles.container}>
        <DetailSkeleton />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={GRADIENTS.primary as any} style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable style={styles.avatarWrap} onPress={() => navigation.navigate('EditProfile')}>
            {currentUser?.avatar ? (
              <Image source={{ uri: currentUser.avatar }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarInitBox}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </Pressable>

          <View style={styles.headerTextCol}>
            <Text style={styles.userName} numberOfLines={1}>{currentUser?.name}</Text>
            <Text style={styles.userPhone}>{currentUser?.phone}</Text>
            {currentUser?.isVerified && (
              <View style={styles.verifiedPill}>
                <Ionicons name="checkmark-circle" size={12} color={COLORS.white} />
                <Text style={styles.verifiedPillText}>Verified {userRole === 'driver' ? 'Driver' : 'Passenger'}</Text>
              </View>
            )}
          </View>

          <Pressable style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
            <Ionicons name="pencil" size={13} color={COLORS.white} />
            <Text style={styles.editBtnText}>Edit</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* Floating Stats Card — overlaps header */}
      <View style={styles.statsCard}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Rating</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.statValue}>
              {ratingLoading && !reviewStats ? '…' : ratingValue ? Number(ratingValue).toFixed(1) : 'New'}
            </Text>
            {!!ratingValue && <Ionicons name="star" size={13} color={COLORS.warning} style={{ marginLeft: 3 }} />}
          </View>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Total {userRole === 'driver' ? 'Rides' : 'Bookings'}</Text>
          <Text style={styles.statValue}>{totalRides ?? '-'}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Member Since</Text>
          <Text style={styles.statValue}>
            {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '-'}
          </Text>
        </View>
      </View>

      {/* Menu — one flat list, matching the reference exactly */}
      <View style={styles.menuGroup}>
        {menuItems.map((item: any, ii) => (
          <Pressable
            key={ii}
            style={({ pressed }) => [styles.menuItem, ii > 0 && styles.menuItemBorder, pressed && { backgroundColor: COLORS.lightGray }]}
            onPress={() => item.comingSoon ? handleComingSoon(item.label) : item.screen ? navigation.navigate(item.screen) : null}
          >
            <Ionicons name={item.icon as any} size={19} color={COLORS.textPrimary} style={styles.menuItemIcon} />
            <Text style={styles.menuItemLabel}>{item.label}</Text>
            {item.badge && (
              <View style={[styles.menuBadge, { backgroundColor: item.badge.bg }]}>
                <Text style={[styles.menuBadgeText, { color: item.badge.color }]}>{item.badge.label}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
          </Pressable>
        ))}
      </View>

      {/* Logout */}
      <PressableScale
        style={styles.logoutRow}
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
        <Ionicons name="exit-outline" size={19} color={COLORS.danger} style={styles.menuItemIcon} />
        <Text style={styles.logoutText}>Logout</Text>
      </PressableScale>

      <Text style={styles.versionText}>ChalParo v1.0.0 · Made in Pakistan</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { backgroundColor: COLORS.primary, paddingTop: 52, paddingBottom: 28, paddingHorizontal: 20 },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerTextCol: { flex: 1, gap: 3 },
  avatarWrap: { position: 'relative' },
  avatarImg: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: COLORS.white },
  avatarInitBox: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.white },
  avatarInitials: { fontSize: 22, fontWeight: '700', color: COLORS.white },

  userName: { fontSize: 17, fontWeight: '700', color: COLORS.white },
  userPhone: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  editBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '600' },

  verifiedPill: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, marginTop: 8,
  },
  verifiedPillText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },

  // Floating stats card — overlaps header with negative marginTop
  statsCard: {
    flexDirection: 'row',
    marginTop: -20,
    marginHorizontal: 0,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 0,
    ...CURVE,
  },
  stat: { flex: 1, alignItems: 'center', gap: 5 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  statLabel: { fontSize: 11, color: COLORS.textSecondary },
  statDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 2 },

  menuGroup: {
    backgroundColor: COLORS.cardBg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border,
    marginHorizontal: 0, marginTop: 0,
    borderTopLeftRadius: 0, borderTopRightRadius: 0,
    borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, gap: 14 },
  menuItemBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  menuItemIcon: { width: 20 },
  menuItemLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  menuBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, marginRight: 4 },
  menuBadgeText: { fontSize: 11, fontWeight: '700' },

  logoutRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 0, paddingHorizontal: 16, paddingVertical: 16, gap: 14 },
  logoutText: { fontSize: 14, fontWeight: '600', color: COLORS.danger },

  versionText: { textAlign: 'center', fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
});
