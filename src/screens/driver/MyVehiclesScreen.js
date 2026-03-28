import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, GradientHeader, FAB, EmptyState } from '../../components';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useApp } from '../../context/AppContext';

export default function MyVehiclesScreen({ navigation }) {
  const { getVehiclesByDriver, currentUser, setActiveVehicle, deleteVehicle } = useApp();
  const myVehicles = getVehiclesByDriver(currentUser?.id);
  const [deleteModal, setDeleteModal] = useState({ visible: false, vehicleId: null });

  const handleSetActive = (vehicleId) => {
    setActiveVehicle(vehicleId);
  };

  const handleDelete = () => {
    deleteVehicle(deleteModal.vehicleId);
    setDeleteModal({ visible: false, vehicleId: null });
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
          {item.ac && (
            <View style={styles.featureChip}>
              <Ionicons name="snow-outline" size={13} color={COLORS.teal} />
              <Text style={[styles.featureText, { color: COLORS.teal }]}>AC</Text>
            </View>
          )}
          {item.wifi && (
            <View style={styles.featureChip}>
              <Ionicons name="wifi-outline" size={13} color={COLORS.purple} />
              <Text style={[styles.featureText, { color: COLORS.purple }]}>WiFi</Text>
            </View>
          )}
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
          <TouchableOpacity style={styles.deleteBtn} onPress={() => setDeleteModal({ visible: true, vehicleId: item.id })}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <GradientHeader
        colors={GRADIENTS.purple}
        title="My Vehicles"
        subtitle={`${myVehicles.length} vehicle${myVehicles.length !== 1 ? 's' : ''} registered`}
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={myVehicles}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderVehicle}
        ListEmptyComponent={
          <EmptyState icon="car-outline" title="No Vehicles" subtitle="Add your vehicle to start posting rides" />
        }
      />

      <FAB icon="add" onPress={() => navigation.navigate('VehicleSetup', { vehicleId: null })} colors={GRADIENTS.purple} style={styles.fab} />

      <ConfirmModal
        visible={deleteModal.visible}
        onClose={() => setDeleteModal({ visible: false, vehicleId: null })}
        onConfirm={handleDelete}
        title="Delete Vehicle?"
        message="This will permanently remove the vehicle. Any active rides using this vehicle may be affected."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="danger"
        icon="trash-outline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  listContent: { padding: 16, paddingBottom: 80 },
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
  featureRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
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
