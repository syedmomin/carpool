import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  KeyboardAvoidingView, Platform,
  Modal, FlatList, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURVE, AppBar, SectionHeader, PrimaryButton, DetailSkeleton, VehicleTypeImage } from '../../components';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/errorMessages';
import { vehiclesApi } from '../../services/api';
import { haptics } from '../../utils/haptics';

// ─── Vehicle types ────────────────────────────────────────────────────────────
// Each type maps to a fixed generic illustration (VehicleTypeImage) instead
// of a per-vehicle photo — see that component for why.
const VEHICLE_TYPES = [
  { label: 'Car',          value: 'CAR' },
  { label: 'Premium Car',  value: 'PREMIUM_CAR' },
  { label: 'Rickshaw',     value: 'RICKSHAW' },
  { label: 'Van',          value: 'VAN' },
  { label: 'Hiace',        value: 'HIACE' },
  { label: 'Coaster',      value: 'COASTER' },
  { label: 'Bus',          value: 'BUS' },
];

// ─── All vehicle features ─────────────────────────────────────────────────────
const ALL_FEATURES = [
  { key: 'ac',         label: 'Air Conditioning', icon: 'snow-outline' },
  { key: 'wifi',       label: 'WiFi',             icon: 'wifi-outline' },
  { key: 'music',      label: 'Music System',     icon: 'musical-notes-outline' },
  { key: 'usbCharging',label: 'USB Charging',     icon: 'flash-outline' },
  { key: 'waterCooler',label: 'Water Cooler',     icon: 'water-outline' },
  { key: 'blanket',    label: 'Blanket',          icon: 'bed-outline' },
  { key: 'firstAid',   label: 'First Aid Kit',    icon: 'medkit-outline' },
  { key: 'luggageRack',label: 'Luggage Rack',     icon: 'briefcase-outline' },
];

const STEPS = ['Basic Info', 'Features', 'Verification'];

// ─── Car brands available in Pakistan ─────────────────────────────────────────
const VEHICLE_BRANDS = [
  'Toyota', 'Suzuki', 'Honda', 'Daihatsu', 'Mitsubishi', 'Nissan', 'Mazda', 'Subaru',
  'Hyundai', 'Kia',
  'Changan', 'MG', 'Proton', 'FAW', 'DFSK', 'Haval', 'Chery', 'BYD', 'JAC', 'Jinbei', 'Joylong', 'Foton',
  'Hino', 'Daewoo', 'Isuzu', 'Master', 'Yutong', 'King Long', 'Ankai', 'Zhongtong', 'Ghandhara',
  'Sazgar', 'Qingqi', 'United', 'New Asia', 'Prince',
  'Mercedes', 'BMW', 'Audi', 'Land Rover',
  'Other',
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1979 }, (_, i) => String(CURRENT_YEAR - i));

const COMMON_COLORS = ['White', 'Black', 'Silver', 'Grey', 'Red', 'Blue', 'Green', 'Beige', 'Gold', 'Other'];

// ─── Picker Modal (shared list picker) ────────────────────────────────────────
function PickerModal({ visible, title, data, selected, onSelect, onClose }: any) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.pickerModal}>
        <View style={styles.pickerModalHeader}>
          <Text style={styles.pickerModalTitle}>{title}</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </Pressable>
        </View>
        <FlatList
          data={data}
          keyExtractor={item => item}
          contentContainerStyle={{ paddingVertical: 8 }}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.pickerItem, selected === item && styles.pickerItemActive]}
              onPress={() => { onSelect(item); onClose(); }}
            >
              <Text style={[styles.pickerItemText, selected === item && styles.pickerItemTextActive]}>{item}</Text>
              {selected === item && <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />}
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

// ─── Field row (picker-style) ─────────────────────────────────────────────────
function FieldPicker({ icon, label, value, placeholder, error, onPress }: any) {
  return (
    <Pressable style={[styles.fieldBtn, error && { borderColor: COLORS.danger }]} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.fieldLabel, error && { color: COLORS.danger }]}>{label}</Text>
        <Text style={[styles.fieldValue, !value && { color: COLORS.gray, fontWeight: '400' }]}>
          {value || placeholder}
        </Text>
      </View>
      <Ionicons name="chevron-down" size={16} color={COLORS.gray} />
    </Pressable>
  );
}

// Boxed text field matching FieldPicker's look — label inside the same
// bordered box as the value, so typed fields read identically to pickers.
function FieldInput({ label, value, placeholder, error, onChangeText, autoCapitalize, style }: any) {
  return (
    <View style={[styles.fieldBtn, error && { borderColor: COLORS.danger }, style]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.fieldLabel, error && { color: COLORS.danger }]}>{label}</Text>
        <TextInput
          style={styles.fieldInput}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize={autoCapitalize}
        />
      </View>
    </View>
  );
}

export default function VehicleSetupScreen({ navigation, route }) {
  const { registerVehicle, updateVehicle } = useApp();
  const { showToast } = useToast();
  const vehicleId = route?.params?.vehicleId;

  const [step,         setStep]         = useState(0);
  const [fetchLoading, setFetchLoading] = useState(!!vehicleId);
  const [existing,     setExisting]     = useState(null);

  const [form, setForm] = useState({
    type: '', brand: '', model: '', year: '', color: '', plateNumber: '', totalSeats: '4',
  });
  const [features, setFeatures] = useState({
    ac: false, wifi: false, music: false, usbCharging: false,
    waterCooler: false, blanket: false, firstAid: false, luggageRack: false,
  });
  const [typeModal, setTypeModal]   = useState(false);
  const [brandModal, setBrandModal] = useState(false);
  const [yearModal,  setYearModal]  = useState(false);
  const [colorModal, setColorModal] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [errors,     setErrors]     = useState<any>({});

  // Fetch existing vehicle from API when editing
  useEffect(() => {
    if (!vehicleId) return;
    vehiclesApi.getById(vehicleId).then(({ data, error }) => {
      if (error || !data?.data) {
        showToast('Vehicle not found.', 'error');
        navigation.goBack();
        return;
      }
      const v = data.data;
      setExisting(v);
      setForm({
        type:        v.type        || '',
        brand:       v.brand       || '',
        model:       v.model       || '',
        year:        v.year?.toString() || '',
        color:       v.color       || '',
        plateNumber: v.plateNumber || '',
        totalSeats:  v.totalSeats?.toString() || '4',
      });
      setFeatures({
        ac:          !!v.ac,
        wifi:        !!v.wifi,
        music:       !!v.music,
        usbCharging: !!v.usbCharging,
        waterCooler: !!v.waterCooler,
        blanket:     !!v.blanket,
        firstAid:    !!v.firstAid,
        luggageRack: !!v.luggageRack,
      });
      setFetchLoading(false);
    });
  }, [vehicleId]);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const toggleFeature = (key) => setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  const typeLabel = VEHICLE_TYPES.find(t => t.value === form.type)?.label;

  // ─── Validation ────────────────────────────────────────────────────────────
  const validateBasicInfo = () => {
    const newErrors: any = {};
    if (!form.type) newErrors.type = true;
    if (!form.brand?.trim()) newErrors.brand = true;
    if (!form.plateNumber?.trim()) newErrors.plateNumber = true;
    const seats = parseInt(form.totalSeats);
    if (isNaN(seats) || seats < 1 || seats > 60) newErrors.totalSeats = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Navigation ────────────────────────────────────────────────────────────
  const goNext = () => {
    if (step === 0) {
      if (!validateBasicInfo()) {
        showToast('Fill in the required fields to continue.', 'error');
        return;
      }
      setStep(1);
    } else if (step === 1) {
      setStep(2);
    } else {
      handleSave();
    }
  };

  const goBack = () => {
    if (step === 0) navigation.goBack();
    else setStep(s => s - 1);
  };

  // ─── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        type: form.type,
        brand: form.brand.trim(),
        model: form.model?.trim() || '',
        year: form.year ? Number(form.year) : undefined,
        color: form.color?.trim() || '',
        plateNumber: form.plateNumber.trim().toUpperCase(),
        totalSeats: Number(form.totalSeats),
        ...features,
      };

      const { error } = existing
        ? await vehiclesApi.update(vehicleId, payload)
        : await vehiclesApi.register(payload);
      if (error) { showToast(parseApiError(error), 'error'); return; }
      haptics.success();
      showToast(existing ? 'Vehicle updated' : 'Vehicle registered. You can now post rides.', 'success');
      navigation.goBack();
    } catch (e) {
      showToast("Couldn't save your vehicle, check your connection and try again.", 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 1: Basic Info ────────────────────────────────────────────────────
  const renderBasicInfo = () => (
    <View>
      <SectionHeader title="Vehicle Type" />
      <FieldPicker
        icon="car-outline" label="Vehicle Type" value={typeLabel} placeholder="Select vehicle type"
        error={errors.type} onPress={() => setTypeModal(true)}
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <FieldPicker
            label="Make" value={form.brand} placeholder="Select make"
            error={errors.brand} onPress={() => setBrandModal(true)}
          />
        </View>
        <View style={{ flex: 1 }}>
          <FieldInput
            label="Model"
            placeholder="e.g. Corolla Altis"
            value={form.model}
            onChangeText={v => update('model', v)}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <FieldPicker label="Year" value={form.year} placeholder="Select year" onPress={() => setYearModal(true)} />
        </View>
        <View style={{ flex: 1 }}>
          <FieldPicker label="Color" value={form.color} placeholder="Select color" onPress={() => setColorModal(true)} />
        </View>
      </View>

      <FieldInput
        label="Registration Number *"
        placeholder="e.g. LEA 2021"
        value={form.plateNumber}
        onChangeText={v => { update('plateNumber', v); if (errors.plateNumber) setErrors(prev => ({ ...prev, plateNumber: false })); }}
        autoCapitalize="characters"
        error={errors.plateNumber}
      />

      <View style={[styles.seatsRow, errors.totalSeats && { borderColor: COLORS.danger }]}>
        <Text style={styles.fieldLabelStandalone}>Seats Available</Text>
        <View style={styles.stepperRow}>
          <Pressable
            style={styles.stepperBtn}
            onPress={() => update('totalSeats', String(Math.max(1, parseInt(form.totalSeats || '1') - 1)))}
          >
            <Ionicons name="remove" size={18} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.seatsValue}>{form.totalSeats || '1'}</Text>
          <Pressable
            style={styles.stepperBtn}
            onPress={() => update('totalSeats', String(Math.min(60, parseInt(form.totalSeats || '1') + 1)))}
          >
            <Ionicons name="add" size={18} color={COLORS.primary} />
          </Pressable>
        </View>
      </View>
    </View>
  );

  // ─── Step 2: Features ───────────────────────────────────────────────────────
  const renderDocuments = () => (
    <View>
      <View style={styles.typePreview}>
        <VehicleTypeImage type={form.type} size={120} />
        <Text style={styles.typePreviewLabel}>{typeLabel}</Text>
      </View>

      <SectionHeader title="Amenities & Features" style={{ marginTop: 8 }} />
      <Text style={styles.featureHint}>Select all that apply. Passengers can filter rides by these.</Text>
      <View style={styles.featuresGrid}>
        {ALL_FEATURES.map(feat => {
          const active = features[feat.key];
          return (
            <Pressable
              key={feat.key}
              style={[styles.featureChip, active && styles.featureChipActive]}
              onPress={() => toggleFeature(feat.key)}
            >
              <View style={[styles.featureIconBox, active && styles.featureIconBoxActive]}>
                <Ionicons name={(feat.icon) as any} size={16} color={active ? COLORS.white : COLORS.gray} />
              </View>
              <Text style={[styles.featureLabel, active && styles.featureLabelActive]}>{feat.label}</Text>
              {active && <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} style={{ marginLeft: 'auto' }} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  // ─── Step 3: Verification (review + submit) ────────────────────────────────
  const renderVerification = () => {
    const SUMMARY_ROWS = [
      { label: 'Vehicle Type', value: typeLabel || '—' },
      { label: 'Make & Model', value: `${form.brand} ${form.model}`.trim() || '—' },
      { label: 'Year', value: form.year || '—' },
      { label: 'Color', value: form.color || '—' },
      { label: 'Registration Number', value: form.plateNumber.toUpperCase() || '—' },
      { label: 'Seats Available', value: form.totalSeats || '—' },
      { label: 'Features', value: `${Object.values(features).filter(Boolean).length} selected` },
    ];
    return (
      <View>
        <SectionHeader title="Review & Submit" />
        <View style={styles.summaryCard}>
          {SUMMARY_ROWS.map((row, i) => (
            <View key={row.label} style={[styles.summaryRow, i === SUMMARY_ROWS.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={styles.summaryLabel}>{row.label}</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>{row.value}</Text>
            </View>
          ))}
        </View>
        <View style={styles.verifyNotice}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
          <Text style={styles.verifyNoticeText}>
            Once registered, you can post rides with this vehicle right away.
          </Text>
        </View>
      </View>
    );
  };

  if (fetchLoading) {
    return (
      <View style={styles.container}>
        <AppBar title="Edit Vehicle" onBack={() => navigation.goBack()} />
        <DetailSkeleton />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <AppBar title={existing ? 'Edit Vehicle' : 'Vehicle Setup'} onBack={goBack} />

        {/* Step indicator */}
        <View style={styles.stepDotsRow}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <View style={styles.stepperItem}>
                <View style={[styles.stepDot, i === step && styles.stepDotActive, i < step && styles.stepDotDone]}>
                  {i < step
                    ? <Ionicons name="checkmark" size={13} color={COLORS.white} />
                    : <Text style={[styles.stepDotText, i === step && { color: COLORS.white }]}>{i + 1}</Text>
                  }
                </View>
                <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{s}</Text>
              </View>
              {i < STEPS.length - 1 && <View style={[styles.stepLine, i < step && styles.stepLineActive]} />}
            </React.Fragment>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {step === 0 ? renderBasicInfo() : step === 1 ? renderDocuments() : renderVerification()}
        </ScrollView>

        <View style={styles.bottomBar}>
          <PrimaryButton
            title={step === 0 ? 'Next: Features' : step === 1 ? 'Next: Verification' : (existing ? 'Save Changes' : 'Register Vehicle')}
            onPress={goNext}
            loading={loading}
            style={styles.continueBtn}
          />
        </View>
      </View>

      <PickerModal
        visible={typeModal} title="Select Vehicle Type"
        data={VEHICLE_TYPES.map(t => t.label)}
        selected={typeLabel}
        onSelect={(label) => { update('type', VEHICLE_TYPES.find(t => t.label === label)?.value || ''); if (errors.type) setErrors(prev => ({ ...prev, type: false })); }}
        onClose={() => setTypeModal(false)}
      />
      <PickerModal
        visible={brandModal} title="Select Make" data={VEHICLE_BRANDS} selected={form.brand}
        onSelect={(v) => { update('brand', v); if (errors.brand) setErrors(prev => ({ ...prev, brand: false })); }}
        onClose={() => setBrandModal(false)}
      />
      <PickerModal
        visible={yearModal} title="Select Year" data={YEARS} selected={form.year}
        onSelect={(v) => update('year', v)} onClose={() => setYearModal(false)}
      />
      <PickerModal
        visible={colorModal} title="Select Color" data={COMMON_COLORS} selected={form.color}
        onSelect={(v) => update('color', v)} onClose={() => setColorModal(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  stepDotsRow:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', paddingHorizontal: 16, paddingBottom: 16 },
  stepperItem:  { alignItems: 'center', width: 84 },
  stepDot:      { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.cardBg, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive:{ backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepDotDone:  { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepDotText:  { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  stepLabel:    { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary, marginTop: 6, textAlign: 'center' },
  stepLabelActive: { color: COLORS.primary },
  stepLine:     { flex: 1, height: 1.5, backgroundColor: COLORS.border, marginTop: 13, marginHorizontal: -8 },
  stepLineActive: { backgroundColor: COLORS.primary },

  body:         { padding: 16, paddingBottom: 32 },
  row:          { flexDirection: 'row', gap: 12 },

  fieldBtn:     { backgroundColor: COLORS.cardBg, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  fieldLabel:   { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 2 },
  fieldValue:   { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  fieldInput:   { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, padding: 0, margin: 0 },

  seatsRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.lightGray, borderRadius: 12, borderWidth: 1.5, borderColor: 'transparent', paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 },
  fieldLabelStandalone: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  stepperRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperBtn:   { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  seatsValue:   { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, minWidth: 20, textAlign: 'center' },

  // Vehicle type preview
  typePreview:      { alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 20, marginBottom: 8, ...CURVE },
  typePreviewLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginTop: 8 },

  // Features
  featureHint:    { fontSize: 12, color: COLORS.gray, marginBottom: 12, lineHeight: 18 },
  featuresGrid:   { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  featureChip:    { width: '48%', flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  featureChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  featureIconBox:    { width: 28, height: 28, borderRadius: 8, backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center' },
  featureIconBoxActive: { backgroundColor: COLORS.primary },
  featureLabel:      { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  featureLabelActive: { color: COLORS.primary },

  // Verification summary
  summaryCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, marginBottom: 16, ...CURVE },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  summaryValue: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, maxWidth: '55%', textAlign: 'right' },
  verifyNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: COLORS.primaryLight, borderRadius: 12, padding: 14 },
  verifyNoticeText: { flex: 1, fontSize: 12, color: COLORS.primaryDark, lineHeight: 18 },

  bottomBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20, backgroundColor: COLORS.bg },
  continueBtn: { marginTop: 0 },

  // Picker modal
  pickerModal:       { flex: 1, backgroundColor: COLORS.cardBg },
  pickerModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 55, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  pickerModalTitle:  { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  pickerItem:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  pickerItemActive:  { backgroundColor: COLORS.primaryLight },
  pickerItemText:    { fontSize: 16, color: COLORS.textPrimary, fontWeight: '500' },
  pickerItemTextActive: { color: COLORS.primary, fontWeight: '700' },
});
