import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, FormInput, PrimaryButton, GradientHeader } from '../../components';
import { useApp } from '../../context/AppContext';

export default function EditProfileScreen({ navigation }) {
  const { currentUser, updateProfile } = useApp();
  const [form, setForm] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    city: currentUser?.city || '',
  });
  const [avatar, setAvatar] = useState(currentUser?.avatar || null);
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    if (!form.name || !form.phone) {
      Alert.alert('Error', 'Name and phone number are required.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      updateProfile({ ...form, avatar });
      setLoading(false);
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }, 1000);
  };

  const pickImage = () => {
    // Cycle through sample avatars for demo
    const samples = [
      'https://i.pravatar.cc/150?img=12',
      'https://i.pravatar.cc/150?img=47',
      'https://i.pravatar.cc/150?img=68',
    ];
    const next = samples[Math.floor(Math.random() * samples.length)];
    setAvatar(next);
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
            <TouchableOpacity style={styles.avatarWrap} onPress={pickImage}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImg} />
              ) : (
                <LinearGradient colors={GRADIENTS.primary} style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </LinearGradient>
              )}
              <View style={styles.cameraBtn}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to change photo</Text>
          </View>

          {/* Form */}
          <FormInput label="Full Name *" icon="person-outline" placeholder="Your full name" value={form.name} onChangeText={v => update('name', v)} />
          <FormInput label="Phone Number *" icon="call-outline" placeholder="0300-1234567" value={form.phone} onChangeText={v => update('phone', v)} keyboardType="phone-pad" />
          <FormInput label="Email Address" icon="mail-outline" placeholder="your@email.com" value={form.email} onChangeText={v => update('email', v)} keyboardType="email-address" />
          <FormInput label="City" icon="location-outline" placeholder="e.g. Karachi" value={form.city} onChangeText={v => update('city', v)} />

          <PrimaryButton title="Save Changes" onPress={handleSave} loading={loading} icon="checkmark-circle-outline" style={{ marginTop: 24 }} />
          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  body: { padding: 24 },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarWrap: { position: 'relative', marginBottom: 8 },
  avatarImg: { width: 96, height: 96, borderRadius: 32 },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 32, fontWeight: '900', color: '#fff' },
  cameraBtn: { position: 'absolute', bottom: -4, right: -4, width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  avatarHint: { fontSize: 12, color: COLORS.gray },
});
