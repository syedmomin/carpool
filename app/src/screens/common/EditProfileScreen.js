import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, FormInput, PrimaryButton, GradientHeader } from '../../components';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/errorMessages';
import { showImagePickerOptions } from '../../utils/imagePicker';

export default function EditProfileScreen({ navigation }) {
  const { currentUser, updateProfile } = useApp();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name:  currentUser?.name  || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    city:  currentUser?.city  || '',
  });
  const [avatar, setAvatar]       = useState(currentUser?.avatar || null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading]     = useState(false);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handlePickImage = () => {
    showImagePickerOptions(async (result) => {
      if (result.cancelled) return;
      if (result.error) { showToast('Image upload failed. Please try again.', 'error'); return; }
      setUploading(true);
      setAvatar(result.url);
      setUploading(false);
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Name is required.', 'error'); return; }
    setLoading(true);
    const { error } = await updateProfile({ ...form, avatar });
    setLoading(false);
    if (error) { showToast(parseApiError(error), 'error'); return; }
    showToast('Profile updated successfully!', 'success');
    navigation.goBack();
  };

  const initials = form.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <GradientHeader
          colors={GRADIENTS.primary}
          title="Edit Profile"
          subtitle="Update your personal information"
          onBack={() => navigation.goBack()}
        />

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarWrap} onPress={handlePickImage} activeOpacity={0.85}>
              {uploading ? (
                <LinearGradient colors={GRADIENTS.primary} style={styles.avatarPlaceholder}>
                  <ActivityIndicator color="#fff" size="large" />
                </LinearGradient>
              ) : avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImg} />
              ) : (
                <LinearGradient colors={GRADIENTS.primary} style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </LinearGradient>
              )}
              <LinearGradient colors={GRADIENTS.primary} style={styles.cameraBtn}>
                <Ionicons name="camera" size={15} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to change profile photo</Text>
          </View>

          {/* Role / verified badges */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Ionicons name={currentUser?.role === 'DRIVER' ? 'car-sport' : 'person'} size={14} color={COLORS.primary} />
              <Text style={styles.badgeText}>{currentUser?.role === 'DRIVER' ? 'Driver' : 'Passenger'}</Text>
            </View>
            {currentUser?.isVerified && (
              <View style={[styles.badge, styles.badgeGreen]}>
                <Ionicons name="shield-checkmark" size={14} color={COLORS.secondary} />
                <Text style={[styles.badgeText, { color: COLORS.secondary }]}>Verified</Text>
              </View>
            )}
          </View>

          <FormInput label="Full Name *"    icon="person-outline"    placeholder="Your full name"  value={form.name}  onChangeText={v => set('name', v)} />
          <FormInput label="Phone Number *" icon="call-outline"       placeholder="03001234567"     value={form.phone} onChangeText={v => set('phone', v)} keyboardType="phone-pad" />
          <FormInput label="Email Address"  icon="mail-outline"       placeholder="your@email.com" value={form.email} onChangeText={v => set('email', v)} keyboardType="email-address" autoCapitalize="none" />
          <FormInput label="City"           icon="location-outline"   placeholder="e.g. Karachi"   value={form.city}  onChangeText={v => set('city', v)} />

          <PrimaryButton title="Save Changes" onPress={handleSave} loading={loading} icon="checkmark-circle-outline" style={{ marginTop: 24 }} />
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: COLORS.bg },
  body:              { padding: 24 },
  avatarSection:     { alignItems: 'center', marginBottom: 16 },
  avatarWrap:        { position: 'relative', marginBottom: 8 },
  avatarImg:         { width: 100, height: 100, borderRadius: 32, borderWidth: 3, borderColor: COLORS.primary + '50' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarInitials:    { fontSize: 34, fontWeight: '900', color: '#fff' },
  cameraBtn:         { position: 'absolute', bottom: -4, right: -4, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: '#fff' },
  avatarHint:        { fontSize: 12, color: COLORS.gray },
  badgeRow:          { flexDirection: 'row', gap: 10, marginBottom: 20, justifyContent: 'center' },
  badge:             { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary + '12', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  badgeGreen:        { backgroundColor: COLORS.secondary + '12' },
  badgeText:         { fontSize: 13, fontWeight: '700', color: COLORS.primary },
});
