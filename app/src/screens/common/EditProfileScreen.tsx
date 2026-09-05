import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Image, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURVE, FormInput, AppBar, SectionHeader, PrimaryButton } from '../../components';
import CitySearchModal from '../../components/CitySearchModal';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { parseApiError } from '../../utils/errorMessages';
import { showImagePickerOptions } from '../../utils/imagePicker';
import { digitsOnly, normalizePkPhone, toLocalDisplay, isValidLocalPhone } from '../../utils/phone';

export default function EditProfileScreen({ navigation }) {
  const { currentUser, updateProfile, deleteAccount } = useApp();
  const { showToast } = useToast();
  const { showModal } = useGlobalModal();
  const savedRef = useRef(false);
  const [form, setForm] = useState({
    name:  currentUser?.name  || '',
    phone: toLocalDisplay(currentUser?.phone || ''),
    email: currentUser?.email || '',
    city:  currentUser?.city  || '',
  });
  const [avatar, setAvatar]       = useState(currentUser?.avatar || null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState(false);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  // Warn before leaving with unsaved edits. `form.phone` is local display
  // format (leading 0); `currentUser.phone` is wire format (92-prefixed) —
  // normalize both before comparing, or every load shows as "dirty".
  const isDirty = useMemo(() =>
    form.name  !== (currentUser?.name  || '') ||
    normalizePkPhone(form.phone) !== normalizePkPhone(currentUser?.phone || '') ||
    form.email !== (currentUser?.email || '') ||
    form.city  !== (currentUser?.city  || '') ||
    avatar     !== (currentUser?.avatar || null),
  [form, avatar, currentUser]);

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e: any) => {
      if (!isDirty || savedRef.current) return;
      e.preventDefault();
      showModal({
        type: 'danger',
        title: 'Discard changes?',
        message: "You'll lose these changes if you leave now.",
        confirmText: 'Discard',
        cancelText: 'Keep Editing',
        icon: 'alert-circle-outline',
        onConfirm: () => navigation.dispatch(e.data.action),
      });
    });
    return unsub;
  }, [navigation, isDirty, showModal]);

  const handlePickImage = () => {
    showImagePickerOptions(async (result) => {
      if (result.cancelled) return;
      if (result.error) { showToast("Couldn't upload the photo, try again.", 'error'); return; }
      setUploading(true);
      setAvatar(result.url);
      setUploading(false);
    }, 'profile');
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Name is required.', 'error'); return; }
    if (!isValidLocalPhone(form.phone)) { showToast('Enter your number as 0300 1234567.', 'error'); return; }
    setLoading(true);
    const { error } = await updateProfile({ ...form, phone: normalizePkPhone(form.phone), avatar });
    setLoading(false);
    if (error) { showToast(parseApiError(error), 'error'); return; }
    savedRef.current = true; // bypass the unsaved-changes guard
    showToast('Profile updated', 'success');
    navigation.goBack();
  };

  const initials = form.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  // Account deletion is serious and irreversible — confirm first, then hit
  // the real endpoint. On success `deleteAccount()` already clears the local
  // session (via logout()), so normal navigation drops the user back to Login.
  const handleDeleteAccount = () => {
    showModal({
      type: 'danger',
      title: 'Delete Account?',
      message: 'This will delete and anonymize your profile, rides, bookings, and history for good.',
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      icon: 'trash-outline',
      onConfirm: async () => {
        setDeleting(true);
        const { error } = await deleteAccount();
        setDeleting(false);
        if (error) { showToast(parseApiError(error), 'error'); return; }
        savedRef.current = true; // bypass the unsaved-changes guard on the way out
      },
    });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <AppBar
          title="Edit Profile"
          onBack={() => navigation.goBack()}
          rightAction={
            <Pressable onPress={handleSave} disabled={loading} hitSlop={8}>
              {loading
                ? <ActivityIndicator color={COLORS.primary} size="small" />
                : <Text style={styles.saveLink}>Save</Text>
              }
            </Pressable>
          }
        />

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <Pressable style={styles.avatarWrap} onPress={handlePickImage}>
              {uploading ? (
                <View style={styles.avatarPlaceholder}>
                  <ActivityIndicator color={COLORS.white} size="large" />
                </View>
              ) : avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
              <View style={styles.cameraBtn}>
                <Ionicons name="camera" size={15} color={COLORS.white} />
              </View>
            </Pressable>
            <Text style={styles.avatarHint}>Tap to change profile photo</Text>
          </View>

          {/* Role / verified badges */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Ionicons name={(currentUser?.role === 'DRIVER' ? 'car-sport' : 'person') as any} size={14} color={COLORS.primary} />
              <Text style={styles.badgeText}>{currentUser?.role === 'DRIVER' ? 'Driver' : 'Passenger'}</Text>
            </View>
            {currentUser?.isVerified && (
              <View style={[styles.badge, styles.badgeGreen]}>
                <Ionicons name="shield-checkmark" size={14} color={COLORS.secondary} />
                <Text style={[styles.badgeText, { color: COLORS.secondary }]}>Verified</Text>
              </View>
            )}
          </View>

          <SectionHeader title="Personal Information" style={styles.sectionHeader} />
          <FormInput label="Full Name *"    rightIcon="person-outline"   placeholder="Your full name"  value={form.name}  onChangeText={v => set('name', v)} />
          <FormInput label="Phone Number *" rightIcon="call-outline"     placeholder="03001234567"     value={form.phone} onChangeText={v => set('phone', digitsOnly(v).slice(0, 11))} keyboardType="phone-pad" maxLength={11} />
          <FormInput label="Email Address"  rightIcon="mail-outline"     placeholder="your@email.com" value={form.email} onChangeText={v => set('email', v)} keyboardType="email-address" autoCapitalize="none" />
          <FormInput
            label="City" rightIcon="location-outline" placeholder="Select your city"
            value={form.city} editable={false} onRightIconPress={() => setCityModalOpen(true)}
          />

          <PrimaryButton title="Save Changes" onPress={handleSave} loading={loading} style={styles.saveBtn} />

          <Pressable onPress={handleDeleteAccount} disabled={deleting} hitSlop={8} style={styles.deleteLink}>
            {deleting
              ? <ActivityIndicator color={COLORS.danger} size="small" />
              : <Text style={styles.deleteLinkText}>Delete Account</Text>
            }
          </Pressable>
        </ScrollView>
      </View>

      <CitySearchModal
        visible={cityModalOpen}
        title="Select City"
        onSelect={(name) => set('city', name)}
        onClose={() => setCityModalOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: COLORS.bg },
  body:              { padding: 24, paddingBottom: 32 },
  saveLink:          { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  avatarSection:     { alignItems: 'center', marginBottom: 16 },
  avatarWrap:        { position: 'relative', marginBottom: 8 },
  avatarImg:         { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: COLORS.primary + '50' },
  avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  avatarInitials:    { fontSize: 36, fontWeight: '700', color: COLORS.white },
  cameraBtn:         { position: 'absolute', bottom: -2, right: -2, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: COLORS.white, backgroundColor: COLORS.primary },
  avatarHint:        { fontSize: 12, color: COLORS.textSecondary },
  badgeRow:          { flexDirection: 'row', gap: 10, marginBottom: 20, justifyContent: 'center' },
  badge:             { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primaryLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  badgeGreen:        { backgroundColor: '#e8f5e9' },
  badgeText:         { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  sectionHeader:     { marginBottom: 12 },
  saveBtn:           { marginTop: 24 },
  deleteLink:        { alignItems: 'center', marginTop: 18, paddingVertical: 8 },
  deleteLinkText:    { color: COLORS.danger, fontSize: 14, fontWeight: '700' },
});
