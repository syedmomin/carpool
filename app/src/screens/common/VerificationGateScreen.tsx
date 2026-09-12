import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURVE, FONTS, FormInput, PrimaryButton } from '../../components';
import { parseApiError } from '../../utils/errorMessages';
import {
  showImagePickerOptionsLocal, pickImageFromCameraLocal, uploadToServer,
} from '../../utils/imagePicker';
import { verificationApi } from '../../services/api';

// ─── Upload Box ────────────────────────────────────────────────────────────────
function UploadBox({ image, onPress, label, style }: any) {
  return (
    <Pressable style={[styles.uploadBox, style]} onPress={onPress}>
      {image
        ? <Image source={{ uri: image }} style={styles.uploadImg} resizeMode="cover" />
        : (
          <>
            <Ionicons name="cloud-upload-outline" size={24} color={COLORS.primary} />
            <Text style={styles.uploadText}>{label}</Text>
            <Text style={styles.uploadHint}>JPG, PNG up to 5MB</Text>
          </>
        )
      }
    </Pressable>
  );
}

interface Props {
  isDriver: boolean;
  onComplete: () => void;
}

// Mandatory identity-verification stepper — the ONLY screen reachable until
// every required document is submitted (see AppNavigator, which renders this
// in place of the entire app, no tabs/back-out). Once submitted, the full
// upload UI moves out of reach — CnicVerificationScreen (Profile > Documents)
// becomes a read-only viewer for what was submitted here.
//
// Steps: 1) CNIC (name + number + front/back on one page), 2) Licence
// (drivers only), 3) Selfie. Passengers skip the licence step entirely.
//
// Images are picked locally only (no per-image auto-upload) — every image
// for the current step uploads together, in one batch, only when the user
// taps Continue/Submit, with a single status banner covering the whole
// batch (uploading, then error if any of it failed) instead of a spinner
// per box.
export default function VerificationGateScreen({ isDriver, onComplete }: Props) {
  const insets = useSafeAreaInsets();

  const [cnicName,   setCnicName]   = useState('');
  const [cnic,       setCnic]       = useState('');
  const [frontImg,   setFrontImg]   = useState(null);
  const [backImg,    setBackImg]    = useState(null);
  const [selfieImg,  setSelfieImg]  = useState(null);
  const [licenceImg, setLicenceImg] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [topError,   setTopError]   = useState<string | null>(null);
  const [step,       setStep]       = useState(0);

  const STEPS = useMemo(() => {
    const base = [{ key: 'cnic', label: 'CNIC' }];
    return isDriver
      ? [...base, { key: 'licence', label: 'Licence' }, { key: 'selfie', label: 'Selfie' }]
      : [...base, { key: 'selfie', label: 'Selfie' }];
  }, [isDriver]);

  const pickImage = (setter) => {
    setTopError(null);
    showImagePickerOptionsLocal((result) => {
      if (result.cancelled) return;
      if (result.error) { setTopError("Couldn't access that image, try again."); return; }
      setter(result.uri);
    });
  };

  const pickSelfie = async () => {
    setTopError(null);
    const result: any = await pickImageFromCameraLocal({ aspect: [3, 4] });
    if (result.cancelled) return;
    if (result.error) { setTopError("Couldn't open the camera, try again."); return; }
    setSelfieImg(result.uri);
  };

  const validateCnic = (value) => /^\d{5}-\d{7}-\d$/.test(value) || /^\d{13}$/.test(value.replace(/-/g, ''));

  const handleCnicChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 13);
    let formatted = digits;
    if (digits.length > 5)  formatted = digits.slice(0, 5) + '-' + digits.slice(5);
    if (digits.length > 12) formatted = digits.slice(0, 5) + '-' + digits.slice(5, 12) + '-' + digits.slice(12);
    setCnic(formatted);
  };

  const isLastStep = step === STEPS.length - 1;
  const isRemoteUrl = (uri: string | null) => !!uri && /^https?:\/\//.test(uri);

  // Uploads every local (not-yet-remote) image for the given step in one
  // batch, updating state to the returned URLs on success. Also returns the
  // resolved URLs directly (in the same order as `entries`) — a caller that
  // needs the URL in the very same tick (i.e. before the next render) must
  // use the returned value, not the state it just set: setState doesn't
  // update the current closure's variable, only a future render's.
  const uploadStepImages = async (
    entries: { uri: string | null; setter: (url: string) => void }[],
  ): Promise<{ ok: boolean; urls: (string | null)[] }> => {
    const pending = entries
      .map((e, i) => ({ ...e, i }))
      .filter(e => e.uri && !isRemoteUrl(e.uri));
    if (pending.length === 0) return { ok: true, urls: entries.map(e => e.uri) };

    setProcessing(true);
    const results = await Promise.all(pending.map(e => uploadToServer(e.uri, 'documents')));
    setProcessing(false);

    const failed = results.find(r => r.error);
    if (failed) {
      setTopError(parseApiError(failed.error));
      return { ok: false, urls: [] };
    }
    const urls = entries.map(e => e.uri);
    pending.forEach((e, idx) => {
      urls[e.i] = results[idx].url;
      e.setter(results[idx].url);
    });
    return { ok: true, urls };
  };

  const handleContinue = async () => {
    setTopError(null);
    const key = STEPS[step].key;

    if (key === 'cnic') {
      if (!cnicName.trim()) return setTopError('Enter your full name as printed on the CNIC.');
      if (!cnic) return setTopError('Enter your CNIC number.');
      if (!validateCnic(cnic)) return setTopError('Enter a valid CNIC number, e.g. 42101-1234567-1.');
      if (!frontImg) return setTopError('Upload the CNIC front image.');
      if (!backImg) return setTopError('Upload the CNIC back image.');

      const { ok } = await uploadStepImages([
        { uri: frontImg, setter: setFrontImg },
        { uri: backImg, setter: setBackImg },
      ]);
      if (!ok) return;
      setStep(s => s + 1);
      return;
    }

    if (key === 'licence') {
      if (!licenceImg) return setTopError('Upload your driving licence to continue.');
      const { ok } = await uploadStepImages([{ uri: licenceImg, setter: setLicenceImg }]);
      if (!ok) return;
      setStep(s => s + 1);
      return;
    }

    // selfie — always the final step for both roles
    if (!selfieImg) return setTopError('Take a selfie to continue.');
    const { ok, urls } = await uploadStepImages([{ uri: selfieImg, setter: setSelfieImg }]);
    if (!ok) return;
    // Pass the just-resolved URL straight through — setSelfieImg above won't
    // be visible on selfieImg until the next render, and handleSubmit runs
    // right now, in this same tick.
    handleSubmit(urls[0]);
  };

  const handleSubmit = async (selfieUrl: string) => {
    setProcessing(true);
    const { error: cnicError } = await verificationApi.submitCnic(cnic, frontImg, backImg, selfieUrl, cnicName.trim());
    let licenceError = null;
    if (isDriver) {
      ({ error: licenceError } = await verificationApi.submitLicence(licenceImg));
    }
    setProcessing(false);

    if (cnicError || licenceError) {
      setTopError(parseApiError(cnicError || licenceError));
      return;
    }

    onComplete();
  };

  const renderStepContent = () => {
    const key = STEPS[step].key;
    if (key === 'cnic') {
      return (
        <>
          <Text style={styles.stepHeading}>CNIC Details</Text>
          <Text style={styles.stepSub}>Enter your details exactly as printed on your CNIC</Text>

          <FormInput
            label="Full Name (as on CNIC) *"
            icon="person-outline"
            placeholder="Muhammad Ali Khan"
            value={cnicName}
            onChangeText={setCnicName}
            autoCapitalize="words"
          />
          <FormInput
            label="CNIC Number *"
            icon="card-outline"
            placeholder="42101-1234567-1"
            value={cnic}
            onChangeText={handleCnicChange}
            keyboardType="numeric"
            maxLength={15}
            style={{ marginTop: 14 }}
          />

          <View style={styles.uploadStack}>
            <UploadBox
              label="Front Side"
              image={frontImg}
              onPress={() => pickImage(setFrontImg)}
              style={{ height: 150 }}
            />
            <UploadBox
              label="Back Side"
              image={backImg}
              onPress={() => pickImage(setBackImg)}
              style={{ height: 150, marginTop: 14 }}
            />
          </View>
        </>
      );
    }
    if (key === 'licence') {
      return (
        <>
          <Text style={styles.stepHeading}>Upload Driving Licence *</Text>
          <Text style={styles.stepSub}>Make sure all the details are clearly visible</Text>
          <UploadBox label="Tap to upload" image={licenceImg} onPress={() => pickImage(setLicenceImg)} style={{ height: 150 }} />
        </>
      );
    }
    return (
      <>
        <Text style={styles.stepHeading}>Take a Selfie</Text>
        <Text style={styles.stepSub}>Helps us confirm it's really you</Text>
        <UploadBox label="Tap to open camera" image={selfieImg} onPress={pickSelfie} style={{ height: 150 }} />
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Verify Your Identity</Text>
        <Text style={styles.headerSub}>Required once, before you can use ChalParo</Text>
      </View>

      {/* Stepper — no back-navigation once a step is passed; this is a
          one-way onboarding gate, not an editable form. */}
      <View style={styles.stepperRow}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s.key}>
            <View style={styles.stepperItem}>
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
            </View>
            {i < STEPS.length - 1 && <View style={[styles.stepConnector, i < step && styles.stepConnectorDone]} />}
          </React.Fragment>
        ))}
      </View>

      {/* Batch upload / submit status — covers every image for the step at
          once, so there's one clear signal instead of per-box spinners. */}
      {processing && (
        <View style={styles.statusBanner}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.statusBannerText}>Uploading and validating…</Text>
        </View>
      )}
      {!!topError && !processing && (
        <View style={[styles.statusBanner, styles.statusBannerError]}>
          <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
          <Text style={[styles.statusBannerText, styles.statusBannerErrorText]}>{topError}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {renderStepContent()}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <PrimaryButton
          title={isLastStep ? 'Submit' : 'Continue'}
          onPress={handleContinue}
          loading={processing}
          style={styles.continueBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header:    { paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 20, fontFamily: FONTS.extraBold, color: COLORS.textPrimary },
  headerSub:   { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  body:      { padding: 20, paddingBottom: 32 },

  stepperRow:       { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 24, paddingBottom: 16 },
  stepperItem:      { alignItems: 'center', width: 70 },
  stepCircle:       { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.cardBg, alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  stepCircleDone:   { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  stepCircleText:   { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  stepCircleTextActive: { color: COLORS.white },
  stepLabel:        { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary, marginTop: 6, textAlign: 'center' },
  stepLabelActive:  { color: COLORS.primary },
  stepConnector:    { flex: 1, height: 1.5, backgroundColor: COLORS.border, marginTop: 13, marginHorizontal: -8 },
  stepConnectorDone:{ backgroundColor: COLORS.primary },

  statusBanner:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginBottom: 12, backgroundColor: COLORS.primaryLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  statusBannerError: { backgroundColor: '#fef2f2' },
  statusBannerText:  { flex: 1, fontSize: 12.5, fontWeight: '600', color: COLORS.primaryDark },
  statusBannerErrorText: { color: COLORS.danger },

  stepHeading:      { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'left', marginBottom: 6 },
  stepSub:          { fontSize: 13, color: COLORS.textSecondary, textAlign: 'left', marginBottom: 20 },

  uploadStack:      { marginTop: 20 },
  uploadBox:        { borderWidth: 1.5, borderColor: COLORS.primary + '60', borderStyle: 'dashed', borderRadius: 16, height: 130, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.cardBg, overflow: 'hidden', ...CURVE },
  uploadImg:        { width: '100%', height: '100%' },
  uploadText:       { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginTop: 8, textAlign: 'center' },
  uploadHint:       { fontSize: 10.5, color: COLORS.textSecondary, marginTop: 2 },

  bottomBar:        { paddingHorizontal: 20, paddingTop: 12, backgroundColor: COLORS.bg },
  continueBtn:      { borderRadius: 26 },
});
