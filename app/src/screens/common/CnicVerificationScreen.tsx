import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURVE, FormInput, AppBar, PrimaryButton } from '../../components';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/errorMessages';
import { showImagePickerOptions, pickImageFromCamera } from '../../utils/imagePicker';
import { verificationApi } from '../../services/api';

// ─── CNIC Illustration (decorative ID-card graphic) ─────────────────────────────
function CnicIllustration() {
  return (
    <View style={styles.illustrationCard}>
      <View style={styles.illustrationAvatar}>
        <Ionicons name="person" size={28} color="rgba(17,24,39,0.25)" />
      </View>
      <View style={styles.illustrationLines}>
        <View style={[styles.illustrationBar, { width: '70%' }]} />
        <View style={[styles.illustrationBar, { width: '85%' }]} />
        <View style={[styles.illustrationBar, { width: '55%' }]} />
      </View>
      <Ionicons name="person-outline" size={56} color="rgba(17,24,39,0.12)" style={styles.illustrationWatermark} />
    </View>
  );
}

// ─── Upload Box ────────────────────────────────────────────────────────────────
function UploadBox({ image, uploading, onPress }) {
  return (
    <Pressable style={styles.uploadBox} onPress={onPress} disabled={uploading}>
      {uploading
        ? <ActivityIndicator color={COLORS.primary} size="large" />
        : image
          ? <Image source={{ uri: image }} style={styles.uploadImg} resizeMode="cover" />
          : (
            <>
              <Ionicons name="cloud-upload-outline" size={28} color={COLORS.primary} />
              <Text style={styles.uploadText}>Tap to upload</Text>
              <Text style={styles.uploadHint}>JPG, PNG up to 5MB</Text>
            </>
          )
      }
    </Pressable>
  );
}

export default function CnicVerificationScreen({ navigation }) {
  const { userRole, refreshUser } = useApp();
  const { showToast } = useToast();
  const isDriver = userRole === 'driver';

  const [cnic,        setCnic]        = useState('');
  const [frontImg,    setFrontImg]    = useState(null);
  const [backImg,     setBackImg]     = useState(null);
  const [selfieImg,   setSelfieImg]   = useState(null);
  const [licenceImg,  setLicenceImg]  = useState(null);
  const [upFront,     setUpFront]     = useState(false);
  const [upBack,      setUpBack]      = useState(false);
  const [upSelfie,    setUpSelfie]    = useState(false);
  const [upLicence,   setUpLicence]   = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [step,        setStep]        = useState(0);

  const STEPS = useMemo(() => {
    const base = [
      { key: 'front', label: 'Front Side' },
      { key: 'back', label: 'Back Side' },
      { key: 'selfie', label: 'Selfie' },
    ];
    return isDriver ? [...base, { key: 'licence', label: 'Licence' }] : base;
  }, [isDriver]);

  const pickImage = async (setter, setUploading) => {
    showImagePickerOptions(async (result) => {
      if (result.cancelled) return;
      if (result.error) { showToast("Couldn't upload the image, try again.", 'error'); return; }
      setUploading(true);
      setter(result.url);
      setUploading(false);
    }, 'documents');
  };

  const pickSelfie = async () => {
    setUpSelfie(true);
    const result: any = await pickImageFromCamera({ aspect: [3, 4] }, 'documents');
    setUpSelfie(false);
    if (result.cancelled) return;
    if (result.error) { showToast("Couldn't upload the selfie, try again.", 'error'); return; }
    setSelfieImg(result.url);
  };

  const validateCnic = (value) => /^\d{5}-\d{7}-\d$/.test(value) || /^\d{13}$/.test(value.replace(/-/g, ''));

  // Auto-format CNIC as user types: 42101-1234567-1
  const handleCnicChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 13);
    let formatted = digits;
    if (digits.length > 5)  formatted = digits.slice(0, 5) + '-' + digits.slice(5);
    if (digits.length > 12) formatted = digits.slice(0, 5) + '-' + digits.slice(5, 12) + '-' + digits.slice(12);
    setCnic(formatted);
  };

  const handleSubmit = async () => {
    // For drivers: CNIC is required + licence required
    // For passengers: CNIC is optional — but if they start filling, front image is required
    if (isDriver) {
      if (!cnic || !frontImg) {
        showToast('Drivers must provide CNIC number and front image.', 'error');
        return;
      }
      if (!licenceImg) {
        showToast('Upload your driving licence to verify as a driver.', 'error');
        return;
      }
    } else {
      if ((cnic || frontImg) && (!cnic || !frontImg)) {
        showToast('Add your CNIC number and the front image.', 'error');
        return;
      }
    }

    if (cnic && !validateCnic(cnic)) {
      showToast('Enter a valid CNIC number, e.g. 42101-1234567-1.', 'error');
      return;
    }

    setLoading(true);

    let cnicError = null;
    let licenceError = null;

    // Submit CNIC if provided
    if (cnic && frontImg) {
      const { error } = await verificationApi.submitCnic(cnic, frontImg, backImg || undefined, selfieImg || undefined);
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

    // Refresh user so ProfileScreen VerificationProgress reflects the new status
    await refreshUser();

    showToast(
      isDriver
        ? "CNIC and licence submitted! We'll review them shortly."
        : "CNIC submitted for verification. We'll review it shortly.",
      'success',
    );
    navigation.goBack();
  };

  const isLastStep = step === STEPS.length - 1;

  const handleContinue = () => {
    const key = STEPS[step].key;
    if (key === 'front' && isDriver && (!cnic || !frontImg)) {
      showToast('Add your CNIC number and the front image.', 'error');
      return;
    }
    if (key === 'front' && !isDriver && cnic && !frontImg) {
      showToast('Upload the CNIC front image.', 'error');
      return;
    }
    if (key === 'licence' || isLastStep) { handleSubmit(); return; }
    setStep(s => Math.min(STEPS.length - 1, s + 1));
  };

  const renderStepContent = () => {
    const key = STEPS[step].key;
    if (key === 'front') {
      return (
        <>
          <CnicIllustration />
          <Text style={styles.stepHeading}>Upload CNIC Front Side</Text>
          <Text style={styles.stepSub}>Make sure the details are clear and visible</Text>
          <UploadBox image={frontImg} uploading={upFront} onPress={() => pickImage(setFrontImg, setUpFront)} />
          <FormInput
            label={`CNIC Number${isDriver ? ' *' : ' (Optional)'}`}
            icon="card-outline"
            placeholder="42101-1234567-1"
            value={cnic}
            onChangeText={handleCnicChange}
            keyboardType="numeric"
            maxLength={15}
            style={{ marginTop: 20 }}
          />
        </>
      );
    }
    if (key === 'back') {
      return (
        <>
          <CnicIllustration />
          <Text style={styles.stepHeading}>Upload CNIC Back Side</Text>
          <Text style={styles.stepSub}>Optional, but helps speed up verification</Text>
          <UploadBox image={backImg} uploading={upBack} onPress={() => pickImage(setBackImg, setUpBack)} />
        </>
      );
    }
    if (key === 'selfie') {
      return (
        <>
          <Text style={styles.stepHeading}>Take a Selfie</Text>
          <Text style={styles.stepSub}>Optional. Helps us confirm it's really you.</Text>
          <UploadBox image={selfieImg} uploading={upSelfie} onPress={pickSelfie} />
        </>
      );
    }
    // licence
    return (
      <>
        <Text style={styles.stepHeading}>Upload Driving Licence *</Text>
        <Text style={styles.stepSub}>Make sure all the details are clearly visible</Text>
        <UploadBox image={licenceImg} uploading={upLicence} onPress={() => pickImage(setLicenceImg, setUpLicence)} />
      </>
    );
  };

  return (
    <View style={styles.container}>
      <AppBar title="CNIC Verification" onBack={() => navigation.goBack()} />

      {/* Stepper */}
      <View style={styles.stepperRow}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s.key}>
            <Pressable style={styles.stepperItem} onPress={() => i < step && setStep(i)} disabled={i >= step}>
              <View style={[
                styles.stepCircle,
                i === step && styles.stepCircleActive,
                i < step && styles.stepCircleDone,
              ]}>
                {i < step
                  ? <Ionicons name="checkmark" size={13} color={COLORS.white} />
                  : <Text style={[styles.stepCircleText, i === step && styles.stepCircleTextActive]}>{i + 1}</Text>
                }
              </View>
              <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{s.label}</Text>
            </Pressable>
            {i < STEPS.length - 1 && <View style={[styles.stepConnector, i < step && styles.stepConnectorDone]} />}
          </React.Fragment>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {renderStepContent()}
      </ScrollView>

      <View style={styles.bottomBar}>
        <PrimaryButton
          title={isLastStep ? 'Submit' : 'Continue'}
          onPress={handleContinue}
          loading={loading}
          style={styles.continueBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.bg },
  body:             { padding: 20, paddingBottom: 32 },

  // Stepper
  stepperRow:       { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 24, paddingBottom: 16 },
  stepperItem:      { alignItems: 'center', width: 64 },
  stepCircle:       { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.cardBg, alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  stepCircleDone:   { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  stepCircleText:   { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  stepCircleTextActive: { color: COLORS.white },
  stepLabel:        { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary, marginTop: 6, textAlign: 'center' },
  stepLabelActive:  { color: COLORS.primary },
  stepConnector:    { flex: 1, height: 1.5, backgroundColor: COLORS.border, marginTop: 13, marginHorizontal: -8 },
  stepConnectorDone:{ backgroundColor: COLORS.primary },

  stepHeading:      { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 6 },
  stepSub:          { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20 },

  // Illustration
  illustrationCard: {
    height: 130, borderRadius: 16, backgroundColor: '#eefaf3',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 14,
    marginBottom: 24, overflow: 'hidden', position: 'relative',
  },
  illustrationAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(17,24,39,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  illustrationLines: { flex: 1, gap: 8 },
  illustrationBar: { height: 8, borderRadius: 4, backgroundColor: 'rgba(17,24,39,0.12)' },
  illustrationWatermark: { position: 'absolute', right: 16, top: '50%', marginTop: -28 },

  // Upload
  uploadBox:        { borderWidth: 1.5, borderColor: COLORS.primary + '60', borderStyle: 'dashed', borderRadius: 16, height: 150, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.cardBg, overflow: 'hidden', ...CURVE },
  uploadImg:        { width: '100%', height: '100%' },
  uploadText:       { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginTop: 8 },
  uploadHint:       { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },

  bottomBar:        { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, backgroundColor: COLORS.bg },
  continueBtn:      { borderRadius: 26 },
});
