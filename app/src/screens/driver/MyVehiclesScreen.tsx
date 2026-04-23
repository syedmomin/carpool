import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, AMENITY_CONFIG, GradientHeader, EmptyState, CardSkeleton } from '../../components';
import { useApp } from '../../context/AppContext';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/errorMessages';
import { vehiclesApi } from '../../services/api';

const AMENITY_MAP = Object.entries(AMENITY_CONFIG).map(([key, cfg]) => ({ key, ...cfg }));

const TYPE_ICON: any = {
  CAR: 'car-outline', VAN: 'car-sport-outline', HIACE: 'bus-outline',
  COASTER: 'bus-outline', BUS: 'bus-outline', PICKUP: 'car-outline',
};

export default function MyVehiclesScreen({ navigation }) {
  const { setActiveVehicle, deleteVehicle } = useApp();
  const { showModal } = useGlobalModal();
  const { showToast } = useToast();
  const [myVehicles, setMyVehicles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchVehicles = useCallback(async (showLoading = false) => {
    if (showLoading) setIsInitialLoad(true);
    setRefreshing(true);
    try {
      const { data } = await vehiclesApi.myVehicles();
      if (data?.data) setMyVehicles(data.data);
    } finally {
      setRefreshing(false);
      setIsInitialLoad(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchVehicles();
  }, []));

  const handleSetActive = async (vehicleId) => {
    await setActiveVehicle(vehicleId);
    setMyVehicles(prev => prev.map(v => ({ ...v, isActive: v.id === vehicleId })));
  };

  const renderVehicle = ({ item }) => {
    const amenities   = AMENITY_MAP.filter(a => item[a.key]);
    const imgCount    = (item.images || []).length;
    const firstImg    = item.images?.[0];
    const typeIcon    = TYPE_ICON[item.type] || 'car-outline';

    return (
      <View style={[styles.card, item.isActive && styles.cardActive]}>

        {/* Active gradient top bar */}
        {item.isActive && (
          <LinearGradient colors={GRADIENTS.primary as any} style={styles.activeTopBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        )}

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <View style={styles.cardHeader}>
          <View style={styles.brandRow}>
            <View style={[styles.typeIconBox, item.isActive && styles.typeIconBoxActive]}>
              <Ionicons name={typeIcon} size={18} color={item.isActive ? '#fff' : COLORS.primary} />
            </View>
            <View style={styles.brandInfo}>
              <Text style={styles.vehicleBrand} numberOfLines={1}>{item.brand}</Text>
              <Text style={styles.vehicleModelSub} numberOfLines={1}>{item.model || item.type}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {item.isActive && (
              <View style={styles.activeBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.activeBadgeText}>ACTIVE</Text>
              </View>
            )}
            <Text style={styles.plateBadge}>{item.plateNumber}</Text>
          </View>
        </View>

        {/* ── Image + Specs ───────────────────────────────────────────────────── */}
        <View style={styles.cardBody}>
          {/* Image */}
          <View style={styles.imgBox}>
            {firstImg ? (
              <>
                <Image source={{ uri: firstImg }} style={styles.thumbnail} resizeMode="cover" />
                {imgCount > 1 && (
                  <View style={styles.imgCountBadge}>
                    <Ionicons name="images-outline" size={10} color="#fff" />
                    <Text style={styles.imgCountText}>{imgCount}</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.imgPlaceholder}>
                <Ionicons name={typeIcon} size={30} color={COLORS.border} />
              </View>
            )}
          </View>

          {/* Specs */}
          <View style={styles.specsCol}>
            <View style={styles.specRow}>
              <Ionicons name="color-palette-outline" size={14} color={COLORS.gray} />
              <Text style={styles.specText}>{item.color || 'No color'}</Text>
            </View>
            <View style={styles.specRow}>
              <Ionicons name="car-sport-outline" size={14} color={COLORS.gray} />
              <Text style={styles.specText}>{item.type}</Text>
            </View>
            <View style={[styles.seatsBadge, item.isActive && styles.seatsBadgeActive]}>
              <Ionicons name="people-outline" size={14} color={item.isActive ? '#fff' : COLORS.primary} />
              <Text style={[styles.seatsText, item.isActive && { color: '#fff' }]}>{item.totalSeats} Seats</Text>
            </View>
          </View>
        </View>

        {/* ── Amenities ──────────────────────────────────────────────────────── */}
        {amenities.length > 0 && (
          <View style={styles.amenitiesRow}>
            {amenities.slice(0, 5).map(a => (
              <View key={a.key} style={[styles.amenityPill, { backgroundColor: a.color + '12', borderColor: a.color + '28' }]}>
                <Ionicons name={a.icon as any} size={12} color={a.color} />
                <Text style={[styles.amenityLabel, { color: a.color }]}>{a.label}</Text>
              </View>
            ))}
            {amenities.length > 5 && (
              <View style={styles.moreAmenities}>
                <Text style={styles.moreText}>+{amenities.length - 5}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Divider ─────────────────────────────────────────────────────────── */}
        <View style={styles.divider} />

        {/* ── Actions ─────────────────────────────────────────────────────────── */}
        <View style={styles.actionRow}>
          {!item.isActive ? (
            <TouchableOpacity style={styles.activateBtn} onPress={() => handleSetActive(item.id)}>
              <LinearGradient colors={GRADIENTS.primary as any} style={styles.activateGrad}>
                <Ionicons name="flash" size={16} color="#fff" />
                <Text style={styles.activateText}>Set as Active</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.activeIndicator}>
              <Ionicons name="checkmark-done-circle" size={20} color={COLORS.primary} />
              <Text style={styles.activeIndicatorText}>Currently Active</Text>
            </View>
          )}

          <View style={styles.iconActions}>
            <TouchableOpacity style={styles.iconBtn}
              onPress={() => navigation.navigate('VehicleSetup', { vehicleId: item.id })}>
              <Ionicons name="create-outline" size={19} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, styles.deleteBtn]}
              onPress={() => showModal({
                type: 'danger', title: 'Delete Vehicle?',
                message: 'This will permanently remove the vehicle.',
                confirmText: 'Yes, Delete', cancelText: 'Cancel', icon: 'trash-outline',
                onConfirm: async () => {
                  const { error } = await deleteVehicle(item.id);
                  if (error) showToast(parseApiError(error), 'error');
                  else setMyVehicles(prev => prev.filter(v => v.id !== item.id));
                },
              })}>
              <Ionicons name="trash-outline" size={19} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        colors={GRADIENTS.teal as any}
        title="My Garage"
        subtitle="Select the vehicle you're driving today"
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
        rightIcon="add"
        onRightPress={() => navigation.navigate('VehicleSetup', { vehicleId: null })}
      />

      {isInitialLoad ? (
        <View style={styles.listContent}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : (
        <FlatList
          data={myVehicles}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderVehicle}
          refreshing={refreshing}
          onRefresh={fetchVehicles}
          ListEmptyComponent={
            !refreshing ? (
              <EmptyState icon="car-outline" title="No Vehicles Found" subtitle="Add your vehicle to start posting rides" />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.bg },
  listContent: { padding: 16, paddingBottom: 100 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#eef2ff',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  cardActive: {
    borderColor: COLORS.primary + '35',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.12,
  },
  activeTopBar: {
    height: 4,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 10,
  },
  brandRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  brandInfo:  { flex: 1, minWidth: 0 },
  headerRight:{ flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  typeIconBox: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: COLORS.primary + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  typeIconBoxActive: { backgroundColor: COLORS.primary },
  vehicleBrand:   { fontSize: 16, fontWeight: '900', color: COLORS.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 },
  vehicleModelSub:{ fontSize: 11, color: COLORS.gray, fontWeight: '500', marginTop: 1 },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary + '25',
  },
  pulseDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  activeBadgeText: { fontSize: 9, fontWeight: '900', color: COLORS.primary, letterSpacing: 1 },
  plateBadge: {
    fontSize: 12, fontWeight: '700',
    backgroundColor: '#111827', color: '#f9fafb',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 7,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },

  cardBody:    { flexDirection: 'row', gap: 14, paddingHorizontal: 16, paddingBottom: 14 },
  imgBox: {
    width: 100, height: 88, borderRadius: 14,
    overflow: 'hidden', backgroundColor: '#f1f5f9',
    borderWidth: 1, borderColor: '#e2e8f0',
    position: 'relative',
  },
  thumbnail:      { width: '100%', height: '100%' },
  imgPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imgCountBadge: {
    position: 'absolute', bottom: 5, right: 5,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  imgCountText: { fontSize: 9, color: '#fff', fontWeight: '700' },

  specsCol:    { flex: 1, justifyContent: 'center', gap: 7 },
  specRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  specText:    { fontSize: 12, color: COLORS.gray, fontWeight: '500' },
  seatsBadge:  {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, alignSelf: 'flex-start',
  },
  seatsBadgeActive: { backgroundColor: COLORS.primary },
  seatsText:   { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  amenitiesRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: 16, paddingBottom: 14,
  },
  amenityPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  amenityLabel: { fontSize: 10, fontWeight: '700' },
  moreAmenities: {
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 20, backgroundColor: COLORS.lightGray,
    borderWidth: 1, borderColor: COLORS.border,
  },
  moreText: { fontSize: 10, fontWeight: '700', color: COLORS.gray },

  divider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 16, marginBottom: 12 },

  actionRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  activateBtn:  { flex: 1, height: 44, borderRadius: 12, overflow: 'hidden', marginRight: 10 },
  activateGrad: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  activateText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  activeIndicator: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
  activeIndicatorText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  iconActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#dbeafe',
  },
  deleteBtn: { backgroundColor: '#fff1f2', borderColor: '#ffe4e6' },
});
