import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, PrimaryButton, FormInput, OTPInput } from '../../components';
import { useApp } from '../../context/AppContext';

const STEPS = ['Role', 'Details', 'Verify'];

export default function RegisterScreen({ navigation }) {
  const { login } = useApp();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState('passenger');
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', cnic: '' });
  const [loading, setLoading] = useState(false);

  const updateForm = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleNext = () => {
    if (step === 0) { setStep(1); }
    else if (step === 1) {
      if (!form.name || !form.phone || !form.password) {
        Alert.alert('Error', 'Please fill in all required fields!');
        return;
      }
      setStep(2);
    } else { handleRegister(); }
  };

  const handleRegister = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      login(
        { id: `user_${Date.now()}`, name: form.name, phone: form.phone, email: form.email, rating: 0, totalTrips: 0, verified: false },
        role
      );
      navigation.replace(role === 'driver' ? 'DriverTabs' : 'PassengerTabs');
    }, 1500);
  };

  const renderStep = () => {
    if (step === 0) return (
      <View>
        <Text style={styles.stepTitle}>Choose Your Role</Text>
        <Text style={styles.stepSub}>What would you like to do on SafariShare?</Text>
        {[
          { value: 'passenger', icon: 'person', label: 'Passenger', sub: 'Find and book rides', colors: GRADIENTS.primary },
          { value: 'driver', icon: 'car-sport', label: 'Driver', sub: 'Post rides and earn money', colors: GRADIENTS.teal },
        ].map(r => (
          <TouchableOpacity
            key={r.value}
            style={[styles.roleCard, role === r.value && styles.roleCardActive]}
            onPress={() => setRole(r.value)}
          >
            <LinearGradient
              colors={role === r.value ? r.colors : [COLORS.bg, COLORS.bg]}
              style={styles.roleCardGrad}
            >
              <View style={[styles.roleIconBox, { backgroundColor: role === r.value ? 'rgba(255,255,255,0.2)' : COLORS.lightGray }]}>
                <Ionicons name={r.icon} size={28} color={role === r.value ? '#fff' : COLORS.gray} />
              </View>
              <View style={styles.roleCardText}>
                <Text style={[styles.roleTitle, { color: role === r.value ? '#fff' : COLORS.textPrimary }]}>{r.label}</Text>
                <Text style={[styles.roleSub, { color: role === r.value ? 'rgba(255,255,255,0.8)' : COLORS.gray }]}>{r.sub}</Text>
              </View>
              {role === r.value && <Ionicons name="checkmark-circle" size={24} color="#fff" />}
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    );

    if (step === 1) return (
      <View>
        <Text style={styles.stepTitle}>Personal Details</Text>
        <Text style={styles.stepSub}>Fill in your basic information</Text>
        <FormInput label="Full Name *" icon="person-outline" placeholder="e.g. Ahmad Raza" value={form.name} onChangeText={v => updateForm('name', v)} />
        <FormInput label="Phone Number *" icon="call-outline" placeholder="0300-1234567" value={form.phone} onChangeText={v => updateForm('phone', v)} keyboardType="phone-pad" />
        <FormInput label="Email (Optional)" icon="mail-outline" placeholder="ahmad@example.com" value={form.email} onChangeText={v => updateForm('email', v)} keyboardType="email-address" />
        <FormInput label="Password *" icon="lock-closed-outline" placeholder="Min 6 characters" value={form.password} onChangeText={v => updateForm('password', v)} secureTextEntry />
        {role === 'driver' && (
          <FormInput label="CNIC Number *" icon="card-outline" placeholder="42101-1234567-1" value={form.cnic} onChangeText={v => updateForm('cnic', v)} keyboardType="numeric" />
        )}
      </View>
    );

    return (
      <View style={styles.verifyContainer}>
        <LinearGradient colors={GRADIENTS.primary} style={styles.verifyIcon}>
          <Ionicons name="phone-portrait-outline" size={40} color="#fff" />
        </LinearGradient>
        <Text style={styles.stepTitle}>Verify Phone Number</Text>
        <Text style={styles.verifyText}>A 6-digit OTP has been sent to {form.phone}</Text>
        <OTPInput />
        <Text style={styles.resendText}>
          Didn't receive OTP?{' '}
          <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Resend</Text>
        </Text>
        <View style={styles.demoNote}>
          <Ionicons name="information-circle-outline" size={14} color={COLORS.primary} />
          <Text style={styles.demoNoteText}>Demo mode: Register directly</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
        <TouchableOpacity
          onPress={() => step > 0 ? setStep(step - 1) : navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
        <Text style={styles.headerSub}>Step {step + 1} of {STEPS.length}</Text>
        <View style={styles.progressRow}>
          {STEPS.map((s, i) => (
            <View key={i} style={styles.progressStep}>
              <View style={[styles.progressDot, i <= step && styles.progressDotActive]}>
                {i < step
                  ? <Ionicons name="checkmark" size={12} color={COLORS.primary} />
                  : <Text style={[styles.progressNum, i === step && { color: COLORS.primary }]}>{i + 1}</Text>
                }
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.progressLine, i < step && styles.progressLineActive]} />
              )}
            </View>
          ))}
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {renderStep()}
        <PrimaryButton
          title={step === STEPS.length - 1 ? 'Create Account' : 'Continue'}
          onPress={handleNext}
          loading={loading}
          style={{ marginTop: 32 }}
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
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 55, paddingBottom: 24, paddingHorizontal: 20 },
  backBtn: { marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2, marginBottom: 16 },
  progressRow: { flexDirection: 'row', alignItems: 'center' },
  progressStep: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  progressDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  progressDotActive: { backgroundColor: '#fff' },
  progressNum: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  progressLine: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 4 },
  progressLineActive: { backgroundColor: '#fff' },
  body: { padding: 24, paddingBottom: 40 },
  stepTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  stepSub: { fontSize: 14, color: COLORS.gray, marginBottom: 24, lineHeight: 20 },
  roleCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 16, borderWidth: 2, borderColor: 'transparent' },
  roleCardActive: { borderColor: COLORS.primary },
  roleCardGrad: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 14 },
  roleIconBox: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  roleCardText: { flex: 1 },
  roleTitle: { fontSize: 18, fontWeight: '700' },
  roleSub: { fontSize: 13, marginTop: 2 },
  verifyContainer: { alignItems: 'center', paddingTop: 20 },
  verifyIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  verifyText: { fontSize: 14, color: COLORS.gray, textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  resendText: { fontSize: 14, color: COLORS.gray, marginTop: 16 },
  demoNote: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 10, padding: 10, marginTop: 20, gap: 6 },
  demoNoteText: { fontSize: 12, color: COLORS.primary },
  loginLink: { alignItems: 'center', marginTop: 20 },
  loginLinkText: { fontSize: 14, color: COLORS.gray },
});
