import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, FormInput, PrimaryButton, GradientHeader } from '../../components';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/errorMessages';
import { showImagePickerOptions } from '../../utils/imagePicker';
import { verificationApi } from '../../services/api';

// ─── Image Upload Box ──────────────────────────────────────────────────────────
function UploadBox({ label, required, image, uploading, onPress }) {
  return (
    <View>
      <Text style={styles.uploadLabel}>
        {label}{required ? ' *' : ' (Optional)'}
      </Text>
      <TouchableOpacity style={styles.uploadBox} onPress={onPress} disabled={uploading}>
        {uploading
          ? <ActivityIndicator color={COLORS.primary} size="large" />
          : image
            ? <Image source={{ uri: image }} style={styles.uploadImg} resizeMode="cover" />
            : (
              <>
                <Ionicons name="cloud-upload-outline" size={32} color={COLORS.primary} />
                <Text style={styles.uploadText}>Tap to upload</Text>
              </>
            )
        }
      </TouchableOpacity>
    </View>
  );
}

export default function CnicVerificationScreen({ navigation }) {
  const { userRole } = useApp();
  const { showToast } = useToast();
  const isDriver = userRole === 'driver';

  const [cnic,        setCnic]        = useState('');
  const [frontImg,    setFrontImg]    = useState(null);
  const [backImg,     setBackImg]     = useState(null);
  const [licenceImg,  setLicenceImg]  = useState(null);
  const [upFront,     setUpFront]     = useState(false);
  const [upBack,      setUpBack]      = useState(false);
  const [upLicence,   setUpLicence]   = useState(false);
  const [loading,     setLoading]     = useState(false);

  const pickImage = async (setter, setUploading) => {
    showImagePickerOptions(async (result) => {
      if (result.cancelled) return;
      if (result.error) { showToast('Image upload failed. Please try again.', 'error'); return; }
      setUploading(true);
      setter(result.url);
      setUploading(false);
    }, 'documents');
  };

  const validateCnic = (value) => /^\d{5}-\d{7}-\d$/.test(value) || /^\d{13}$/.test(value.replace(/-/g, ''));

  const handleSubmit = async () => {
    // For drivers: CNIC is required + licence required
    // For passengers: CNIC is optional — but if they start filling, front image is required
    if (isDriver) {
      if (!cnic || !frontImg) {
        showToast('Drivers must provide CNIC number and front image.', 'error');
        return;
      }
      if (!licenceImg) {
        showToast('Please upload your driving licence to verify as a driver.', 'error');
        return;
      }
    } else {
      if ((cnic || frontImg) && (!cnic || !frontImg)) {
        showToast('Please enter your CNIC number and upload the front image.', 'error');
        return;
      }
    }

    if (cnic && !validateCnic(cnic)) {
      showToast('Please enter a valid CNIC number (e.g. 42101-1234567-1).', 'error');
      return;
    }

    setLoading(true);

    let cnicError = null;
    let licenceError = null;

    // Submit CNIC if provided
    if (cnic && frontImg) {
      const { error } = await verificationApi.submitCnic(cnic, frontImg, backImg || undefined);
      cnicError = error;
    }

    // Submit driving licence if driver provided one
    if (isDriver && licenceImg) {
      const { error } = await verificationApi.submitLicence(licenceImg);
      licenceError = error;
    }

    setLoading(false);

    if (cnicError || licenceError) {
      showToast(parseApiError(cnicError || licenceError), 'error');
      return;
    }

    if (!cnic && !licenceImg) {
      navigation.goBack();
      return;
    }

    showToast(
      isDriver
        ? 'CNIC and licence submitted! We will verify within 24 hours.'
        : 'CNIC submitted for verification. We will review within 24 hours.',
      'success',
    );
    navigation.goBack();
  };

  const cnicSteps = [
    { n: '1', title: isDriver ? 'Enter CNIC Number *' : 'Enter CNIC Number (Optional)', done: !!cnic },
    { n: '2', title: 'Upload CNIC Front',   done: !!frontImg },
    { n: '3', title: 'Upload CNIC Back',    done: !!backImg },
  ];
  const driverSteps = isDriver ? [
    { n: '4', title: 'Upload Driving Licence *', done: !!licenceImg },
  ] : [];
  const allSteps = [...cnicSteps, ...driverSteps, { n: String(cnicSteps.length + driverSteps.length + 1), title: 'Submit for Review', done: false }];

  return (
    <View style={styles.container}>
      <GradientHeader
        colors={GRADIENTS.secondary}
        title="Identity Verification"
        subtitle={isDriver ? 'CNIC & Driving Licence required' : 'CNIC verification (optional)'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.body}>

        {/* Info Banner */}
        <View style={[styles.infoBanner, isDriver ? styles.infoBannerDriver : styles.infoBannerPassenger]}>
          <Ionicons
            name={isDriver ? 'car-outline' : 'shield-checkmark'}
            size={28}
            color={isDriver ? COLORS.teal : COLORS.secondary}
          />
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>
              {isDriver ? 'Driver Verification' : 'Why verify?'}
            </Text>
            <Text style={styles.infoSub}>
              {isDriver
                ? 'Drivers must verify their CNIC and driving licence to post rides and build passenger trust.'
                : 'Verified users get a trust badge and are more likely to get bookings. Your data is kept secure and private.'}
            </Text>
          </View>
        </View>

        {/* Steps */}
        <View style={styles.stepsCard}>
          {allSteps.map((step, i) => (
            <View key={i} style={[styles.stepRow, i < allSteps.length - 1 && styles.stepRowBorder]}>
              <View style={[styles.stepNum, step.done && styles.stepNumDone]}>
                {step.done
                  ? <Ionicons name="checkmark" size={14} color="#fff" />
                  : <Text style={styles.stepNumText}>{step.n}</Text>
                }
              </View>
              <Text style={[styles.stepTitle, step.done && { color: COLORS.secondary }]}>{step.title}</Text>
            </View>
          ))}
        </View>

        {/* ── CNIC Section ──────────────────────────────────────────────── */}
        <Text style={styles.sectionHeader}>
          <Ionicons name="card-outline" size={16} color={COLORS.textPrimary} /> CNIC Details{!isDriver && '  (Optional)'}
        </Text>

        <FormInput
          label={`CNIC Number${isDriver ? ' *' : ' (Optional)'}`}
          icon="card-outline"
          placeholder="42101-1234567-1"
          value={cnic}
          onChangeText={setCnic}
          keyboardType="numeric"
        />

        <UploadBox
          label="CNIC Front"
          required={isDriver}
          image={frontImg}
          uploading={upFront}
          onPress={() => pickImage(setFrontImg, setUpFront)}
        />
        <UploadBox
          label="CNIC Back"
          required={false}
          image={backImg}
          uploading={upBack}
          onPress={() => pickImage(setBackImg, setUpBack)}
        />

        {/* ── Driving Licence Section (Driver Only) ─────────────────────── */}
        {isDriver && (
          <>
            <Text style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Ionicons name="document-text-outline" size={16} color={COLORS.textPrimary} /> Driving Licence *
            </Text>
            <View style={styles.licenceBanner}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
              <Text style={styles.licenceBannerText}>
                Upload a clear photo of your driving licence (front side).
              </Text>
            </View>
            <UploadBox
              label="Driving Licence"
              required={true}
              image={licenceImg}
              uploading={upLicence}
              onPress={() => pickImage(setLicenceImg, setUpLicence)}
            />
          </>
        )}

        <PrimaryButton
          title={isDriver ? 'Submit Verification' : (cnic || frontImg ? 'Submit Verification' : 'Skip for Now')}
          onPress={handleSubmit}
          loading={loading}
          icon={isDriver ? 'shield-checkmark-outline' : (cnic || frontImg ? 'shield-checkmark-outline' : 'arrow-forward-outline')}
          colors={GRADIENTS.secondary}
          style={{ marginTop: 28 }}
        />
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.bg },
  body:             { padding: 20 },

  // Info Banner
  infoBanner:       { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 16, padding: 16, marginBottom: 20, gap: 14 },
  infoBannerDriver: { backgroundColor: '#e0f7fa' },
  infoBannerPassenger: { backgroundColor: '#e8f5e9' },
  infoText:         { flex: 1 },
  infoTitle:        { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  infoSub:          { fontSize: 12, color: COLORS.gray, lineHeight: 18 },

  // Steps
  stepsCard:        { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  stepRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  stepRowBorder:    { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  stepNum:          { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center' },
  stepNumDone:      { backgroundColor: COLORS.secondary },
  stepNumText:      { fontSize: 12, fontWeight: '700', color: COLORS.gray },
  stepTitle:        { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },

  // Section headers
  sectionHeader:    { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },

  // Upload
  uploadLabel:      { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  uploadBox:        { borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', borderRadius: 16, height: 130, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', overflow: 'hidden' },
  uploadImg:        { width: '100%', height: '100%' },
  uploadText:       { fontSize: 13, color: COLORS.gray, marginTop: 8 },

  // Licence banner
  licenceBanner:    { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#eff6ff', borderRadius: 12, padding: 12, gap: 8, marginBottom: 4 },
  licenceBannerText:{ flex: 1, fontSize: 12, color: COLORS.primary, lineHeight: 18 },
});
