import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, PrimaryButton, FormInput } from '../../components';
import { useApp } from '../../context/AppContext';
import { useGlobalModal } from '../../context/GlobalModalContext';

// ─── Validators ───────────────────────────────────────────────────────────────
const isValidPhone    = (v) => /^\d{11,13}$/.test(v.replace(/[\s\-]/g, ''));
const isValidEmail    = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPassword = (v) => v.length >= 6;

const STEPS = ['Role', 'Details'];

export default function RegisterScreen({ navigation }) {
  const { register } = useApp();
  const { showModal } = useGlobalModal();
  const [step, setStep]   = useState(0);
  const [role, setRole]   = useState('passenger');
  const [form, setForm]   = useState({ name: '', phone: '', email: '', password: '', city: '' });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);

  const set = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: '' }));
  };

  const validateStep1 = () => true; // just role selection

  const validateStep2 = () => {
    const e = {};
    if (!form.name.trim())           e.name     = 'Full name is required';
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';

    if (!form.phone.trim())          e.phone    = 'Phone number is required';
    else if (!isValidPhone(form.phone)) e.phone = 'Phone must be 11–13 digits (numbers only)';

    if (!form.email.trim())          e.email    = 'Email is required';
    else if (!isValidEmail(form.email)) e.email = 'Enter a valid email address';

    if (!form.password)              e.password = 'Password is required';
    else if (!isValidPassword(form.password)) e.password = 'Password must be at least 6 characters';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 0) { setStep(1); return; }
    handleRegister();
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    const { error, role: userRole } = await register({
      name:     form.name.trim(),
      email:    form.email.trim().toLowerCase(),
      phone:    form.phone.replace(/[\s\-]/g, ''),
      password: form.password,
      city:     form.city.trim() || undefined,
      role:     role === 'driver' ? 'DRIVER' : 'PASSENGER',
    });
    setLoading(false);
    if (error) { showModal({ type: 'error', title: 'Registration Failed', message: error }); return; }
    navigation.replace(userRole === 'driver' ? 'DriverApp' : 'PassengerApp');
  };

  // ─── Step 1: Role ─────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Choose Your Role</Text>
      <Text style={styles.stepSub}>What would you like to do on SafariShare?</Text>
      {[
        { value: 'passenger', icon: 'person',   label: 'Passenger', sub: 'Find & book rides', colors: GRADIENTS.primary },
        { value: 'driver',    icon: 'car-sport', label: 'Driver',   sub: 'Post rides & earn', colors: GRADIENTS.teal    },
      ].map(r => (
        <TouchableOpacity
          key={r.value}
          style={[styles.roleCard, role === r.value && styles.roleCardActive]}
          onPress={() => setRole(r.value)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={role === r.value ? r.colors : ['#f8f9fa', '#f8f9fa']}
            style={styles.roleCardInner}
          >
            <View style={[styles.roleIcon, { backgroundColor: role === r.value ? 'rgba(255,255,255,0.25)' : COLORS.lightGray }]}>
              <Ionicons name={r.icon} size={26} color={role === r.value ? '#fff' : COLORS.gray} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.roleLabel, { color: role === r.value ? '#fff' : COLORS.textPrimary }]}>{r.label}</Text>
              <Text style={[styles.roleSub,   { color: role === r.value ? 'rgba(255,255,255,0.8)' : COLORS.gray }]}>{r.sub}</Text>
            </View>
            <View style={[styles.radioOuter, role === r.value && styles.radioOuterActive]}>
              {role === r.value && <View style={styles.radioInner} />}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ─── Step 2: Details ──────────────────────────────────────────────────────
  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personal Details</Text>
      <Text style={styles.stepSub}>Fill in your account information</Text>

      <FormInput
        label="Full Name *"
        icon="person-outline"
        placeholder="e.g. Ahmad Raza"
        value={form.name}
        onChangeText={v => set('name', v)}
      />
      {!!errors.name && <Text style={styles.errText}>{errors.name}</Text>}

      <View style={styles.phoneRow}>
        <View style={styles.countryCode}><Text style={styles.countryCodeTxt}>🇵🇰 +92</Text></View>
        <FormInput
          placeholder="03001234567"
          value={form.phone}
          onChangeText={v => set('phone', v.replace(/[^0-9\s\-]/g, ''))}
          keyboardType="phone-pad"
          style={styles.phoneInput}
        />
      </View>
      {!!errors.phone && <Text style={styles.errText}>{errors.phone}</Text>}

      <FormInput
        label="Email Address *"
        icon="mail-outline"
        placeholder="ahmad@example.com"
        value={form.email}
        onChangeText={v => set('email', v)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {!!errors.email && <Text style={styles.errText}>{errors.email}</Text>}

      <FormInput
        label="Password *"
        icon="lock-closed-outline"
        placeholder="Min 6 characters"
        value={form.password}
        onChangeText={v => set('password', v)}
        secureTextEntry={!showPass}
        rightIcon={showPass ? 'eye-off-outline' : 'eye-outline'}
        onRightIconPress={() => setShowPass(p => !p)}
      />
      {!!errors.password && <Text style={styles.errText}>{errors.password}</Text>}

      <FormInput
        label="City (Optional)"
        icon="location-outline"
        placeholder="e.g. Karachi"
        value={form.city}
        onChangeText={v => set('city', v)}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
        <TouchableOpacity
          onPress={() => step > 0 ? setStep(step - 1) : navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSub}>Step {step + 1} of {STEPS.length} — {STEPS[step]}</Text>
        </View>
        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` }]} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {step === 0 ? renderStep1() : renderStep2()}

        <PrimaryButton
          title={step === STEPS.length - 1 ? 'Create Account' : 'Continue'}
          onPress={handleNext}
          loading={loading}
          style={styles.btn}
          icon={step === STEPS.length - 1 ? 'checkmark-circle-outline' : 'arrow-forward-outline'}
        />

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
          <Text style={styles.loginLinkText}>
            Already have an account?{' '}
            <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.bg },
  header:         { paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20 },
  backBtn:        { marginBottom: 10 },
  headerText:     { marginBottom: 14 },
  headerTitle:    { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub:      { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  progressBar:    { height: 4, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 2, overflow: 'hidden' },
  progressFill:   { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  body:           { padding: 20, paddingBottom: 36 },
  stepContent:    { marginBottom: 4 },
  stepTitle:      { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginTop: 8, marginBottom: 6 },
  stepSub:        { fontSize: 13, color: COLORS.gray, marginBottom: 20, lineHeight: 19 },
  // Role cards
  roleCard:       { borderRadius: 14, overflow: 'hidden', marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  roleCardActive: { borderColor: COLORS.primary },
  roleCardInner:  { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  roleIcon:       { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  roleLabel:      { fontSize: 17, fontWeight: '700', marginBottom: 2 },
  roleSub:        { fontSize: 12 },
  radioOuter:     { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: '#fff' },
  radioInner:     { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  // Form
  phoneRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 2, marginTop: 4 },
  countryCode:    { backgroundColor: COLORS.lightGray, paddingHorizontal: 12, height: 50, justifyContent: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRightWidth: 0, borderRadius: 12, borderTopRightRadius: 0, borderBottomRightRadius: 0 },
  countryCodeTxt: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  phoneInput:     { flex: 1, marginBottom: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  errText:        { fontSize: 12, color: COLORS.danger, marginTop: 2, marginBottom: 8, marginLeft: 4 },
  btn:            { marginTop: 24 },
  loginLink:      { alignItems: 'center', marginTop: 16 },
  loginLinkText:  { fontSize: 14, color: COLORS.gray },
});
