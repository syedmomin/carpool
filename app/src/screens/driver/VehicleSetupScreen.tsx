import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, KeyboardAvoidingView, Platform, ActivityIndicator,
  Modal, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, PrimaryButton, FormInput, GradientHeader } from '../../components';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/errorMessages';
import { pickMultipleImagesLocal, pickImageFromCameraLocal, uploadImages } from '../../utils/imagePicker';
import { vehiclesApi, uploadApi } from '../../services/api';

// ─── Vehicle types ─────────────────────────────────────────────────────────────
const VEHICLE_TYPES = [
  { label: 'Car',     value: 'CAR',     icon: 'car-outline'       },
  { label: 'Van',     value: 'VAN',     icon: 'car-sport-outline' },
  { label: 'Hiace',   value: 'HIACE',   icon: 'bus-outline'       },
  { label: 'Coaster', value: 'COASTER', icon: 'bus-outline'       },
  { label: 'Bus',     value: 'BUS',     icon: 'bus-outline'       },
];

// ─── All vehicle features ──────────────────────────────────────────────────────
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

const STEPS = ['Vehicle Type', 'Details & Photos'];

// ─── Car brands available in Pakistan ─────────────────────────────────────────
const VEHICLE_BRANDS = [
  // Japanese
  'Toyota', 'Suzuki', 'Honda', 'Daihatsu', 'Mitsubishi', 'Nissan', 'Mazda', 'Subaru',
  // Korean
  'Hyundai', 'Kia',
  // Chinese
  'Changan', 'MG', 'Proton', 'FAW', 'DFSK', 'Haval', 'Chery', 'BYD',
  // European / American
  'Mercedes', 'BMW', 'Audi', 'Land Rover',
  // Other
  'Other',
];

// ─── Year picker: 1980 to current year + 1 ────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1979 }, (_, i) => String(CURRENT_YEAR - i));

export default function VehicleSetupScreen({ navigation, route }) {
  const { registerVehicle, updateVehicle } = useApp();
  const { showToast } = useToast();
  const vehicleId = route?.params?.vehicleId;

  const [step,         setStep]         = useState(0);
  const [fetchLoading, setFetchLoading] = useState(!!vehicleId);
  const [existing,     setExisting]     = useState(null);

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
      setSelectedType(v.type || '');
      setImages(v.images || []);
      setForm({
        brand:       v.brand       || '',
        model:       v.model       || '',
        color:       v.color       || '',
        plateNumber: v.plateNumber || '',
        totalSeats:  v.totalSeats?.toString() || '',
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

  // Step 1
  const [selectedType, setSelectedType] = useState('');

  // Step 2
  const [images, setImages]             = useState([]);
  const [imgUploading, setImgUploading] = useState(false);
  const [form, setForm] = useState({
    brand: '', model: '', color: '', plateNumber: '', totalSeats: '',
  });
  const [features, setFeatures] = useState({
    ac: false, wifi: false, music: false, usbCharging: false,
    waterCooler: false, blanket: false, firstAid: false, luggageRack: false,
  });
  const [yearModal,  setYearModal]  = useState(false);
  const [brandModal, setBrandModal] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [errors,     setErrors]     = useState({});

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const toggleFeature = (key) => setFeatures(prev => ({ ...prev, [key]: !prev[key] }));

  // ─── Multi-image picker (local only, no upload yet) ─────────────────────────
  const addVehicleImages = async () => {
    const { uris, error, cancelled } = await pickMultipleImagesLocal();
    if (cancelled) return;
    if (error) { showToast('Photo library permission denied. Please allow in settings.', 'error'); return; }
    setImages(prev => [...prev, ...uris]);
  };

  const addFromCamera = async () => {
    const result = await pickImageFromCameraLocal({ aspect: [4, 3] });
    if (result.error) { showToast('Camera access denied. Please allow in settings.', 'error'); return; }
    if (!result.cancelled) setImages(prev => [...prev, result.uri]);
  };

  // ─── Navigation ──────────────────────────────────────────────────────────────
  const goNext = () => {
    if (step === 0) {
      if (!selectedType) {
        showToast('Please choose a vehicle type to continue.', 'warning');
        return;
      }
      setStep(1);
    } else {
      handleSave();
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.brand?.trim()) newErrors.brand = true;
    if (!form.plateNumber?.trim()) newErrors.plateNumber = true;
    if (!form.totalSeats) newErrors.totalSeats = true;
    
    const seats = parseInt(form.totalSeats);
    if (isNaN(seats) || seats < 1 || seats > 60) newErrors.totalSeats = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goBack = () => {
    if (step === 0) navigation.goBack();
    else setStep(0);
  };

  // ─── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) {
      showToast('Please fill all required fields correctly.', 'error');
      return;
    }

    if (images.length === 0) {
      showToast('Please add at least one vehicle photo.', 'error'); return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('type', selectedType);
    formData.append('brand', form.brand.trim());
    formData.append('model', form.model?.trim() || '');
    formData.append('color', form.color?.trim() || '');
    formData.append('plateNumber', form.plateNumber.trim().toUpperCase());
    formData.append('totalSeats', form.totalSeats);

    // Append feature booleans
    Object.keys(features).forEach(key => {
      formData.append(key, features[key] ? 'true' : 'false');
    });

    // Handle images
    const localUris = images.filter(i => !i.startsWith('http'));
    const existingUrls = images.filter(i => i.startsWith('http'));

    // Append existing URLs to body
    existingUrls.forEach(url => formData.append('existingImages', url));

    // Append new local files
    await Promise.all(localUris.map(async (uri, index) => {
      const filename = uri.split('/').pop() || `image_${index}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const mimeType = match ? `image/${match[1]}` : 'image/jpeg';
      const cleanUri = Platform.OS === 'android' && !uri.startsWith('file://') ? `file://${uri}` : uri;

      if (Platform.OS === 'web') {
        // Web: fetch and append as Blob
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('images', blob, filename);
      } else {
        // Mobile: append as {uri, name, type}
        formData.append('images', {
          uri: cleanUri,
          name: filename,
          type: mimeType,
        });
      }
    }));

    if (existing) {
      const { error } = await vehiclesApi.update(vehicleId, formData);
      setLoading(false);
      if (error) { showToast(parseApiError(error), 'error'); return; }
      showToast('Vehicle updated successfully!', 'success');
      navigation.goBack();
    } else {
      const { error } = await vehiclesApi.register(formData);
      setLoading(false);
      if (error) { showToast(parseApiError(error), 'error'); return; }
      showToast('Vehicle registered! You can now post rides.', 'success');
      navigation.goBack();
    }
  };

  // ─── Step 1: Type ─────────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>Choose Vehicle Type</Text>
      <Text style={styles.stepSub}>Select the type that best matches your vehicle</Text>
      <View style={styles.typeGrid}>
        {VEHICLE_TYPES.map(vt => {
          const active = selectedType === vt.value;
          return (
            <TouchableOpacity
              key={vt.value}
              style={[styles.typeCard, active && styles.typeCardSelected]}
              onPress={() => setSelectedType(vt.value)}
              activeOpacity={0.85}
            >
              <LinearGradient colors={active ? GRADIENTS.primary : ['#f8f9fa', '#f0f0f0']} style={styles.typeCardInner}>
                <View style={[styles.typeIconBox, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : COLORS.lightGray }]}>
                  <Ionicons name={vt.icon} size={26} color={active ? '#fff' : COLORS.gray} />
                </View>
                <Text style={[styles.typeLabel, { color: active ? '#fff' : COLORS.textPrimary }]}>{vt.label}</Text>
                <View style={[styles.typeRadio, active && styles.typeRadioActive]}>
                  {active && <View style={styles.typeRadioDot} />}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // ─── Step 2: Details + Photos ─────────────────────────────────────────────────
  const renderStep2 = () => (
    <View>
      {/* ── Vehicle Photos ───────────────────────────────────────────── */}
      <Text style={styles.sectionLabel}>Photos (Optional)</Text>
      <View style={styles.photosRow}>
        {images.map((img, i) => (
          <View key={i} style={styles.photoWrapper}>
            <Image source={{ uri: img }} style={styles.photo} />
            <TouchableOpacity style={styles.photoDeleteBtn} onPress={() => setImages(prev => prev.filter((_, j) => j !== i))}>
              <Ionicons name="close-circle" size={22} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        ))}
        {imgUploading ? (
          <View style={styles.addPhotoBtn}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <View style={styles.photoAddGroup}>
            <TouchableOpacity style={styles.addPhotoBtn} onPress={addVehicleImages}>
              <Ionicons name="images-outline" size={26} color={COLORS.primary} />
              <Text style={styles.addPhotoText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addPhotoBtn} onPress={addFromCamera}>
              <Ionicons name="camera-outline" size={26} color={COLORS.teal} />
              <Text style={[styles.addPhotoText, { color: COLORS.teal }]}>Camera</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Vehicle Details ──────────────────────────────────────────── */}
      <Text style={styles.sectionLabel}>Vehicle Details</Text>

      {/* Brand Picker */}
      <TouchableOpacity 
        style={[styles.yearPickerBtn, errors.brand && { borderColor: COLORS.danger }]} 
        onPress={() => setBrandModal(true)} 
        activeOpacity={0.8}
      >
        <View style={[styles.yearPickerIcon, { backgroundColor: errors.brand ? COLORS.danger + '12' : COLORS.lightGray }]}>
          <Ionicons name="car-outline" size={18} color={errors.brand ? COLORS.danger : COLORS.gray} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.yearPickerLabel, errors.brand && { color: COLORS.danger }]}>Brand *</Text>
          <Text style={[styles.yearPickerValue, !form.brand && { color: COLORS.gray }]}>
            {form.brand || 'Select brand'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color={COLORS.gray} />
      </TouchableOpacity>

      {/* Year picker */}
      <TouchableOpacity style={styles.yearPickerBtn} onPress={() => setYearModal(true)} activeOpacity={0.8}>
        <View style={[styles.yearPickerIcon, { backgroundColor: COLORS.lightGray }]}>
          <Ionicons name="calendar-outline" size={18} color={COLORS.gray} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.yearPickerLabel}>Manufacturing Year</Text>
          <Text style={[styles.yearPickerValue, !form.model && { color: COLORS.gray }]}>
            {form.model || 'Select year'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color={COLORS.gray} />
      </TouchableOpacity>

      <FormInput
        label="Color"
        icon="color-palette-outline"
        placeholder="e.g. White"
        value={form.color}
        onChangeText={v => update('color', v)}
      />
      <FormInput
        label="Number Plate *"
        icon="card-outline"
        placeholder="e.g. KHI-2022"
        value={form.plateNumber}
        onChangeText={v => { update('plateNumber', v); if (errors.plateNumber) setErrors(prev => ({...prev, plateNumber: false})); }}
        autoCapitalize="characters"
        error={errors.plateNumber}
      />
      <FormInput
        label="Total Seats *"
        icon="people-outline"
        placeholder="e.g. 4"
        value={form.totalSeats}
        onChangeText={v => { update('totalSeats', v.replace(/[^0-9]/g, '')); if (errors.totalSeats) setErrors(prev => ({...prev, totalSeats: false})); }}
        keyboardType="numeric"
        error={errors.totalSeats}
      />

      {/* ── Features ─────────────────────────────────────────────────── */}
      <Text style={styles.sectionLabel}>Amenities & Features</Text>
      <Text style={styles.featureHint}>Select all that apply — passengers can filter by these</Text>
      <View style={styles.featuresGrid}>
        {ALL_FEATURES.map(feat => {
          const active = features[feat.key];
          return (
            <TouchableOpacity
              key={feat.key}
              style={[styles.featureChip, active && styles.featureChipActive]}
              onPress={() => toggleFeature(feat.key)}
              activeOpacity={0.8}
            >
              <View style={[styles.featureIconBox, active && styles.featureIconBoxActive]}>
                <Ionicons name={feat.icon} size={16} color={active ? '#fff' : COLORS.gray} />
              </View>
              <Text style={[styles.featureLabel, active && styles.featureLabelActive]}>{feat.label}</Text>
              {active && <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} style={{ marginLeft: 'auto' }} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const headerGradient = GRADIENTS.primary;

  if (fetchLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ fontSize: 14, color: COLORS.gray }}>Loading vehicle details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <GradientHeader
          colors={headerGradient}
          title={existing ? 'Edit Vehicle' : 'Register Vehicle'}
          subtitle={`Step ${step + 1} of 2 — ${STEPS[step]}`}
          onBack={goBack}
        />

        {/* Progress */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: step === 0 ? '50%' : '100%' }]} />
        </View>

        {/* Step dots */}
        <View style={styles.stepDotsRow}>
          {STEPS.map((s, i) => (
            <View key={i} style={styles.stepDotWrap}>
              <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
                {i < step
                  ? <Ionicons name="checkmark" size={12} color="#fff" />
                  : <Text style={[styles.stepDotText, i <= step && { color: '#fff' }]}>{i + 1}</Text>
                }
              </View>
              {i < STEPS.length - 1 && <View style={[styles.stepLine, i < step && styles.stepLineActive]} />}
            </View>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {step === 0 ? renderStep1() : renderStep2()}

          <PrimaryButton
            title={step === 0 ? 'Continue' : (existing ? 'Save Changes' : 'Register Vehicle')}
            onPress={goNext}
            loading={loading}
            icon={step === 0 ? 'arrow-forward-outline' : 'checkmark-circle-outline'}
            colors={headerGradient}
            style={{ marginTop: 28 }}
          />
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>

      {/* Brand Picker Modal */}
      <Modal visible={brandModal} animationType="slide" onRequestClose={() => setBrandModal(false)}>
        <View style={styles.yearModal}>
          <View style={styles.yearModalHeader}>
            <Text style={styles.yearModalTitle}>Select Brand</Text>
            <TouchableOpacity onPress={() => setBrandModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={VEHICLE_BRANDS}
            keyExtractor={item => item}
            contentContainerStyle={{ paddingVertical: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.yearItem, form.brand === item && styles.yearItemActive]}
                onPress={() => { update('brand', item); setBrandModal(false); }}
              >
                <Text style={[styles.yearItemText, form.brand === item && styles.yearItemTextActive]}>{item}</Text>
                {form.brand === item && <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Year Picker Modal */}
      <Modal visible={yearModal} animationType="slide" onRequestClose={() => setYearModal(false)}>
        <View style={styles.yearModal}>
          <View style={styles.yearModalHeader}>
            <Text style={styles.yearModalTitle}>Select Year</Text>
            <TouchableOpacity onPress={() => setYearModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={YEARS}
            keyExtractor={item => item}
            contentContainerStyle={{ paddingVertical: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.yearItem, form.model === item && styles.yearItemActive]}
                onPress={() => { update('model', item); setYearModal(false); }}
              >
                <Text style={[styles.yearItemText, form.model === item && styles.yearItemTextActive]}>{item}</Text>
                {form.model === item && <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  progressBar:  { height: 4, backgroundColor: COLORS.border },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  stepDotsRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  stepDotWrap:  { flexDirection: 'row', alignItems: 'center' },
  stepDot:      { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.lightGray, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive:{ backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepDotText:  { fontSize: 12, fontWeight: '700', color: COLORS.gray },
  stepLine:     { width: 60, height: 2, backgroundColor: COLORS.border, marginHorizontal: 4 },
  stepLineActive:{ backgroundColor: COLORS.primary },
  body:         { padding: 20, paddingBottom: 40 },
  stepTitle:    { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
  stepSub:      { fontSize: 13, color: COLORS.gray, marginBottom: 20, lineHeight: 19 },

  // Type cards
  typeGrid:      { gap: 12 },
  typeCard:      { borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  typeCardSelected: { borderColor: COLORS.primary },
  typeCardInner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  typeIconBox:   { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  typeLabel:     { flex: 1, fontSize: 17, fontWeight: '700' },
  typeRadio:     { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  typeRadioActive: { borderColor: '#fff' },
  typeRadioDot:  { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },

  // Step 2
  sectionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginTop: 4, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.6 },

  // Photos
  photosRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  photoWrapper:  { position: 'relative' },
  photo:         { width: 90, height: 80, borderRadius: 12 },
  photoDeleteBtn:{ position: 'absolute', top: -8, right: -8 },
  photoAddGroup: { flexDirection: 'row', gap: 8 },
  addPhotoBtn:   { width: 90, height: 80, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', gap: 4 },
  addPhotoText:  { fontSize: 11, color: COLORS.primary, fontWeight: '600' },

  // Year picker
  yearPickerBtn:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 14, gap: 12, marginBottom: 12 },
  yearPickerIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primary + '12', alignItems: 'center', justifyContent: 'center' },
  yearPickerLabel:{ fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  yearPickerValue:{ fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginTop: 2 },

  // Features
  featureHint:    { fontSize: 12, color: COLORS.gray, marginBottom: 12, marginTop: -6, lineHeight: 18 },
  featuresGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featureChip:    { width: '48.5%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  featureChipActive: { borderColor: COLORS.primary, backgroundColor: '#eff6ff' },
  featureIconBox:    { width: 28, height: 28, borderRadius: 8, backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center' },
  featureIconBoxActive: { backgroundColor: COLORS.primary },
  featureLabel:      { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  featureLabelActive: { color: COLORS.primary },

  // Year modal
  yearModal:       { flex: 1, backgroundColor: '#fff' },
  yearModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 55, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  yearModalTitle:  { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  yearItem:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  yearItemActive:  { backgroundColor: '#eff6ff' },
  yearItemText:    { flex: 1, fontSize: 18, color: COLORS.textPrimary, fontWeight: '500' },
  yearItemTextActive: { color: COLORS.primary, fontWeight: '700' },
});
