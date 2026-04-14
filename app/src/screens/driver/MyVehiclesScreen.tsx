import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, GradientHeader, FAB, EmptyState } from '../../components';
import { useApp } from '../../context/AppContext';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/errorMessages';
import { vehiclesApi } from '../../services/api';

export default function MyVehiclesScreen({ navigation }) {
  const { setActiveVehicle, deleteVehicle } = useApp();
  const { showModal } = useGlobalModal();
  const { showToast } = useToast();
  const [myVehicles, setMyVehicles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVehicles = useCallback(async () => {
    setRefreshing(true);
    const { data } = await vehiclesApi.myVehicles();
    setRefreshing(false);
    if (data?.data) setMyVehicles(data.data);
  }, []);

  useFocusEffect(useCallback(() => {
    fetchVehicles();
  }, []));

  const handleSetActive = async (vehicleId) => {
    await setActiveVehicle(vehicleId);
    setMyVehicles(prev => prev.map(v => ({ ...v, isActive: v.id === vehicleId })));
  };

  const renderVehicle = ({ item }) => (
    <View style={[styles.card, item.isActive && styles.cardActive]}>
      {/* ── Header: Brand & Status ────────────────────────────────────────── */}
      <View style={styles.cardHeader}>
        <View style={styles.brandRow}>
          <Ionicons name="car-sport" size={20} color={COLORS.primary} />
          <Text style={styles.vehicleBrand}>{item.brand}</Text>
          {item.isActive && (
            <View style={styles.activeBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.activeBadgeText}>ACTIVE</Text>
            </View>
          )}
        </View>
        <Text style={styles.plateBadge}>{item.plateNumber}</Text>
      </View>

      {/* ── Body: Image & Basic Info ─────────────────────────────────────── */}
      <View style={styles.cardContent}>
        <View style={styles.imgContainer}>
          {item.images?.[0] ? (
            <Image source={{ uri: item.images[0] }} style={styles.thumbnail} resizeMode="cover" />
          ) : (
            <View style={styles.imgPlaceholder}>
              <Ionicons name="images-outline" size={24} color={COLORS.gray} />
            </View>
          )}
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.vehicleModel}>{item.model}</Text>
          <Text style={styles.vehicleMeta}>{item.type} • {item.color}</Text>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={14} color={COLORS.gray} />
              <Text style={styles.statText}>{item.totalSeats} Seats</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Ionicons name="flash" size={14} color={COLORS.gray} />
              <Text style={styles.statText}>{item.type}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Amenities: Clean Icon Row ────────────────────────────────────── */}
      <View style={styles.amenitiesRow}>
        {[
          { key: 'ac', icon: 'snow-outline', color: '#0ea5e9' },
          { key: 'wifi', icon: 'wifi-outline', color: '#6366f1' },
          { key: 'music', icon: 'musical-notes-outline', color: '#ec4899' },
          { key: 'usbCharging', icon: 'flash-outline', color: '#f59e0b' },
          { key: 'waterCooler', icon: 'water-outline', color: '#06b6d4' },
          { key: 'blanket', icon: 'bed-outline', color: '#8b5cf6' },
          { key: 'firstAid', icon: 'medkit-outline', color: '#ef4444' },
        ].filter(f => item[f.key]).slice(0, 6).map(f => (
          <View key={f.key} style={[styles.amenityIcon, { backgroundColor: f.color + '10' }]}>
            <Ionicons name={(f.icon) as any} size={14} color={f.color} />
          </View>
        ))}
        {Object.keys(item).filter(k => ['ac', 'wifi', 'music', 'usbCharging', 'waterCooler', 'blanket', 'firstAid'].includes(k) && item[k]).length > 6 && (
          <Text style={styles.moreText}>+{Object.keys(item).filter(k => ['ac', 'wifi', 'music', 'usbCharging', 'waterCooler', 'blanket', 'firstAid'].includes(k) && item[k]).length - 6} more</Text>
        )}
      </View>

      {/* ── Footer: Unified Actions ───────────────────────────────────────── */}
      <View style={styles.actionRow}>
        {!item.isActive ? (
          <TouchableOpacity style={styles.primaryAction} onPress={() => handleSetActive(item.id)}>
            <LinearGradient colors={GRADIENTS.primary as any} style={styles.actionGrad}>
              <Ionicons name="flash" size={16} color="#fff" />
              <Text style={styles.actionText}>Make Active</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.activeAction}>
            <Ionicons name="checkmark-done-circle" size={18} color={COLORS.primary} />
            <Text style={styles.activeActionText}>Currently Used</Text>
          </View>
        )}

        <View style={styles.secondaryActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('VehicleSetup', { vehicleId: item.id })}>
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, styles.deleteBtn]}
            onPress={() => showModal({
              type: 'danger',
              title: 'Delete Vehicle?',
              message: 'This will permanently remove the vehicle.',
              confirmText: 'Yes, Delete',
              cancelText: 'Cancel',
              icon: 'trash-outline',
              onConfirm: async () => {
                const { error } = await deleteVehicle(item.id);
                if (error) showToast(parseApiError(error), 'error');
                else setMyVehicles(prev => prev.filter(v => v.id !== item.id));
              },
            })}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

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
          ) : (
            <View style={styles.loaderContainer}>
              <Text style={styles.loaderText}>Loading your fleet...</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  listContent: { padding: 16, paddingBottom: 100 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f3ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  cardActive: {
    borderColor: COLORS.primary + '40',
    backgroundColor: '#f8faff',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vehicleBrand: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 5,
    borderWidth: 1,
    borderColor: '#e8f5e9',
  },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.secondary },
  activeBadgeText: { fontSize: 9, fontWeight: '900', color: COLORS.secondary, letterSpacing: 1 },
  plateBadge: {
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: '#111827',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  cardContent: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  imgContainer: {
    width: 90,
    height: 90,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  thumbnail: { width: '100%', height: '100%' },
  imgPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  infoCol: { flex: 1, justifyContent: 'center' },
  vehicleModel: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  vehicleMeta: { fontSize: 13, color: COLORS.gray, marginTop: 2, marginBottom: 8 },

  statRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  divider: { width: 1, height: 12, backgroundColor: '#e2e8f0' },

  amenitiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginBottom: 20,
  },
  amenityIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: { fontSize: 11, color: COLORS.gray, fontWeight: '600', marginLeft: 4 },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  primaryAction: { flex: 1, height: 46, borderRadius: 14, overflow: 'hidden', marginRight: 12 },
  activeAction: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.8 },
  activeActionText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  actionGrad: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  secondaryActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 46,
    height: 46,
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  deleteBtn: { backgroundColor: '#fff1f2', borderColor: '#ffe4e6' },

  loaderContainer: { padding: 40, alignItems: 'center' },
  loaderText: { color: COLORS.gray, fontSize: 14, fontWeight: '500' },
});
