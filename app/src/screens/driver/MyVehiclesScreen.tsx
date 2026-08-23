import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURVE, AppBar, EmptyState, CardSkeleton } from '../../components';
import { useApp } from '../../context/AppContext';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/errorMessages';
import { vehiclesApi } from '../../services/api';

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
    const { error } = await setActiveVehicle(vehicleId);
    if (error) { showToast(parseApiError(error), 'error'); return; }
    setMyVehicles(prev => prev.map(v => ({ ...v, isActive: v.id === vehicleId })));
  };

  const renderVehicle = ({ item }) => {
    const firstImg = item.images?.[0];
    const typeIcon = TYPE_ICON[item.type] || 'car-outline';

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.imgBox}>
            {firstImg ? (
              <Image source={{ uri: firstImg }} style={styles.thumbnail} resizeMode="cover" />
            ) : (
              <View style={styles.imgPlaceholder}>
                <Ionicons name={typeIcon} size={30} color={COLORS.border} />
              </View>
            )}
          </View>

          <View style={styles.infoCol}>
            <View style={styles.nameRow}>
              <Text style={styles.vehicleName} numberOfLines={1}>{item.brand} {item.model}</Text>
              <View style={[styles.statusPill, item.isActive ? styles.statusPillActive : styles.statusPillInactive]}>
                <Text style={[styles.statusPillText, item.isActive ? styles.statusTextActive : styles.statusTextInactive]}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            <Text style={styles.vehicleSub} numberOfLines={1}>
              {item.plateNumber}{item.color ? ` • ${item.color}` : ''}
            </Text>
            <View style={styles.specRow}>
              <Ionicons name="people-outline" size={13} color={COLORS.textSecondary} />
              <Text style={styles.specText}>{item.totalSeats} Seats</Text>
              <Ionicons name={typeIcon} size={13} color={COLORS.textSecondary} style={{ marginLeft: 10 }} />
              <Text style={styles.specText}>{item.type}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={styles.editBtn}
            onPress={() => navigation.navigate('VehicleSetup', { vehicleId: item.id })}
          >
            <Ionicons name="pencil-outline" size={15} color={COLORS.primary} />
            <Text style={styles.editBtnText}>Edit</Text>
          </Pressable>
          {item.isActive ? (
            <View style={styles.activeBtn}>
              <Ionicons name="checkmark-circle" size={15} color={COLORS.secondary} />
              <Text style={styles.activeBtnText}>Active</Text>
            </View>
          ) : (
            <Pressable style={styles.activateBtn} onPress={() => handleSetActive(item.id)}>
              <Text style={styles.activateBtnText}>Activate</Text>
            </Pressable>
          )}
          <Pressable
            style={styles.deleteIconBtn}
            onPress={() => showModal({
              type: 'danger', title: 'Delete Vehicle?',
              message: 'This will permanently remove the vehicle.',
              confirmText: 'Yes, Delete', cancelText: 'Cancel', icon: 'trash-outline',
              onConfirm: async () => {
                const { error } = await deleteVehicle(item.id);
                if (error) showToast(parseApiError(error), 'error');
                else setMyVehicles(prev => prev.filter(v => v.id !== item.id));
              },
            })}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppBar
        title="My Vehicles"
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
        rightAction={
          <Pressable style={styles.addBtn} onPress={() => navigation.navigate('VehicleSetup', { vehicleId: null })}>
            <Ionicons name="add" size={18} color={COLORS.white} />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        }
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
  listContent: { padding: 16, paddingBottom: 32 },

  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, height: 38, borderRadius: 12, backgroundColor: COLORS.primary, ...CURVE },
  addBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    marginBottom: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...CURVE,
  },

  cardTopRow:  { flexDirection: 'row', gap: 12, marginBottom: 14 },
  imgBox: {
    width: 96, height: 84, borderRadius: 12,
    overflow: 'hidden', backgroundColor: COLORS.lightGray,
  },
  thumbnail:      { width: '100%', height: '100%' },
  imgPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  infoCol:    { flex: 1, minWidth: 0, justifyContent: 'center', gap: 4 },
  nameRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  vehicleName:{ flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  vehicleSub: { fontSize: 12, color: COLORS.textSecondary },

  statusPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  statusPillActive: { backgroundColor: '#e8f5e9' },
  statusPillInactive: { backgroundColor: COLORS.lightGray },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  statusTextActive: { color: COLORS.secondary },
  statusTextInactive: { color: COLORS.textSecondary },

  specRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  specText:    { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },

  actionRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  editBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 40, borderRadius: 10, backgroundColor: COLORS.primaryLight,
  },
  editBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  activeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 40, borderRadius: 10, backgroundColor: '#e8f5e9',
  },
  activeBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.secondary },
  activateBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    height: 40, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.primary,
  },
  activateBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  deleteIconBtn:{ width: 40, height: 40, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.danger + '40', backgroundColor: '#fff5f5', alignItems: 'center', justifyContent: 'center' },
});


