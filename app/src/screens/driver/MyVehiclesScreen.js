import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
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
  const [myVehicles,  setMyVehicles]  = useState([]);
  const [refreshing,  setRefreshing]  = useState(false);

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
      {item.isActive && (
        <View style={styles.activeBanner}>
          <Ionicons name="checkmark-circle" size={14} color={COLORS.secondary} />
          <Text style={styles.activeBannerText}>Active Vehicle</Text>
        </View>
      )}

      {/* Image */}
      {item.images?.[0] ? (
        <Image source={{ uri: item.images[0] }} style={styles.vehicleImg} resizeMode="cover" />
      ) : (
        <View style={[styles.vehicleImg, styles.vehicleImgPlaceholder]}>
          <Ionicons name="car-sport-outline" size={48} color={COLORS.gray} />
        </View>
      )}

      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.vehicleName}>{item.brand}</Text>
            <Text style={styles.vehicleType}>{item.type} • {item.color} • {item.model}</Text>
          </View>
          <Text style={styles.plateBadge}>{item.plateNumber}</Text>
        </View>

        <View style={styles.featureRow}>
          <View style={styles.featureChip}>
            <Ionicons name="people-outline" size={13} color={COLORS.primary} />
            <Text style={styles.featureText}>{item.totalSeats} seats</Text>
          </View>
          {[
            { key: 'ac',          icon: 'snow-outline',          label: 'AC',        color: COLORS.teal   },
            { key: 'wifi',        icon: 'wifi-outline',          label: 'WiFi',       color: COLORS.purple },
            { key: 'music',       icon: 'musical-notes-outline', label: 'Music',      color: '#e91e63'     },
            { key: 'usbCharging', icon: 'flash-outline',         label: 'USB',        color: '#ff9800'     },
            { key: 'waterCooler', icon: 'water-outline',         label: 'Water',      color: '#03a9f4'     },
            { key: 'blanket',     icon: 'bed-outline',           label: 'Blanket',    color: '#795548'     },
            { key: 'firstAid',    icon: 'medkit-outline',        label: 'First Aid',  color: COLORS.danger },
            { key: 'luggageRack', icon: 'briefcase-outline',     label: 'Luggage',    color: COLORS.gray   },
          ].filter(f => item[f.key]).map(f => (
            <View key={f.key} style={styles.featureChip}>
              <Ionicons name={f.icon} size={13} color={f.color} />
              <Text style={[styles.featureText, { color: f.color }]}>{f.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actionRow}>
          {!item.isActive && (
            <TouchableOpacity style={styles.setActiveBtn} onPress={() => handleSetActive(item.id)}>
              <LinearGradient colors={GRADIENTS.secondary} style={styles.setActiveBtnGrad}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                <Text style={styles.setActiveBtnText}>Set Active</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('VehicleSetup', { vehicleId: item.id })}>
            <Ionicons name="create-outline" size={18} color={COLORS.primary} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => showModal({
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
            })}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <GradientHeader
        colors={GRADIENTS.teal}
        title="My Vehicles"
        subtitle="Manage your registered vehicles for ride-sharing"
        onBack={() => navigation.goBack()}
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
            <EmptyState icon="car-outline" title="No Vehicles" subtitle="Add your vehicle to start posting rides" />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  headerStats: { flexDirection: 'row', gap: 20, marginTop: 4, marginBottom: -4 },
  headerStat: { alignItems: 'center' },
  headerStatVal: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  listContent: { padding: 16, paddingBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  cardActive: { borderWidth: 2, borderColor: COLORS.secondary },
  activeBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', paddingHorizontal: 16, paddingVertical: 8, gap: 6 },
  activeBannerText: { fontSize: 12, fontWeight: '700', color: COLORS.secondary },
  vehicleImg: { width: '100%', height: 160 },
  vehicleImgPlaceholder: { backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  vehicleName: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  vehicleType: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  plateBadge: { fontSize: 12, fontWeight: '700', backgroundColor: COLORS.lightGray, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, color: COLORS.textPrimary },
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  featureChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, gap: 5 },
  featureText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  actionRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  setActiveBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  setActiveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 6 },
  setActiveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 6 },
  editBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  deleteBtn: { width: 42, height: 42, backgroundColor: '#fdecea', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', bottom: 24, right: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
});
