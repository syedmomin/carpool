import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, FormInput, PrimaryButton, GradientHeader } from '../../components';
import { showImagePickerOptions } from '../../utils/imagePicker';
import { verificationApi } from '../../services/api';

export default function CnicVerificationScreen({ navigation }) {
  const [cnic, setCnic] = useState('');
  const [frontImg, setFrontImg] = useState(null);
  const [backImg, setBackImg] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [uploadingFront, setUpFront]    = useState(false);
  const [uploadingBack,  setUpBack]     = useState(false);

  const pickFront = () => {
    showImagePickerOptions(async (result) => {
      if (result.cancelled) return;
      if (result.error) { Alert.alert('Error', result.error); return; }
      setUpFront(true);
      setFrontImg(result.url);
      setUpFront(false);
    });
  };

  const pickBack = () => {
    showImagePickerOptions(async (result) => {
      if (result.cancelled) return;
      if (result.error) { Alert.alert('Error', result.error); return; }
      setUpBack(true);
      setBackImg(result.url);
      setUpBack(false);
    });
  };

  const handleSubmit = async () => {
    if (!cnic || !frontImg) {
      Alert.alert('Error', 'Please enter CNIC number and upload the front image.');
      return;
    }
    setLoading(true);
    const { error } = await verificationApi.submit(cnic, frontImg, backImg);
    setLoading(false);
    if (error) { Alert.alert('Error', error); return; }
    Alert.alert('Submitted!', 'Your CNIC has been submitted for verification. We will review it within 24 hours.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        colors={GRADIENTS.secondary}
        title="CNIC Verification"
        subtitle="Verify your identity to build trust"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.body}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={28} color={COLORS.secondary} />
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Why verify?</Text>
            <Text style={styles.infoSub}>Verified users get a badge and higher trust from passengers. Your data is kept secure.</Text>
          </View>
        </View>

        {/* Steps */}
        {[
          { n: '1', title: 'Enter CNIC Number', done: !!cnic },
          { n: '2', title: 'Upload Front Image', done: !!frontImg },
          { n: '3', title: 'Upload Back Image', done: !!backImg },
          { n: '4', title: 'Submit for Review', done: false },
        ].map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={[styles.stepNum, step.done && styles.stepNumDone]}>
              {step.done
                ? <Ionicons name="checkmark" size={14} color="#fff" />
                : <Text style={styles.stepNumText}>{step.n}</Text>
              }
            </View>
            <Text style={[styles.stepTitle, step.done && { color: COLORS.secondary }]}>{step.title}</Text>
          </View>
        ))}

        <FormInput
          label="CNIC Number *"
          icon="card-outline"
          placeholder="42101-1234567-1"
          value={cnic}
          onChangeText={setCnic}
          keyboardType="numeric"
        />

        {/* Upload Boxes */}
        <Text style={styles.uploadLabel}>CNIC Front *</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={pickFront} disabled={uploadingFront}>
          {uploadingFront ? <ActivityIndicator color={COLORS.primary} size="large" />
          : frontImg ? <Image source={{ uri: frontImg }} style={styles.uploadImg} resizeMode="cover" />
          : (<><Ionicons name="cloud-upload-outline" size={32} color={COLORS.primary} /><Text style={styles.uploadText}>Tap to upload front side</Text></>)}
        </TouchableOpacity>

        <Text style={styles.uploadLabel}>CNIC Back</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={pickBack} disabled={uploadingBack}>
          {uploadingBack ? <ActivityIndicator color={COLORS.primary} size="large" />
          : backImg ? <Image source={{ uri: backImg }} style={styles.uploadImg} resizeMode="cover" />
          : (<><Ionicons name="cloud-upload-outline" size={32} color={COLORS.primary} /><Text style={styles.uploadText}>Tap to upload back side</Text></>)}
        </TouchableOpacity>

        <PrimaryButton title="Submit for Verification" onPress={handleSubmit} loading={loading} icon="shield-checkmark-outline" colors={GRADIENTS.secondary} style={{ marginTop: 24 }} />
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  body: { padding: 20 },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#e8f5e9', borderRadius: 16, padding: 16, marginBottom: 24, gap: 14 },
  infoText: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  infoSub: { fontSize: 12, color: COLORS.gray, lineHeight: 18 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center' },
  stepNumDone: { backgroundColor: COLORS.secondary },
  stepNumText: { fontSize: 12, fontWeight: '700', color: COLORS.gray },
  stepTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  uploadLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  uploadBox: { borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', borderRadius: 16, height: 130, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', overflow: 'hidden' },
  uploadImg: { width: '100%', height: '100%' },
  uploadText: { fontSize: 13, color: COLORS.gray, marginTop: 8 },
});
