import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, PrimaryButton } from '../../components';
import { useApp } from '../../context/AppContext';

const STEPS = ['Role', 'Details', 'Verify'];

export default function RegisterScreen({ navigation }) {
  const { login } = useApp();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState('passenger');
  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '', cnic: '',
  });
  const [loading, setLoading] = useState(false);

  const updateForm = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleNext = () => {
    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      if (!form.name || !form.phone || !form.password) {
        Alert.alert('Error', 'Sab required fields bharen!');
        return;
      }
      setStep(2);
    } else {
      handleRegister();
    }
  };

  const handleRegister = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const userData = {
        id: `user_${Date.now()}`,
        name: form.name,
        phone: form.phone,
        email: form.email,
        rating: 0,
        totalTrips: 0,
        verified: false,
      };
      login(userData, role);
      navigation.replace(role === 'driver' ? 'DriverTabs' : 'PassengerTabs');
    }, 1500);
  };

  const renderStep = () => {
    if (step === 0) return (
      <View>
        <Text style={styles.stepTitle}>Apna Role Chunein</Text>
        <Text style={styles.stepSub}>Aap SafariShare pe kia karna chahte hain?</Text>

        <TouchableOpacity
          style={[styles.roleCard, role === 'passenger' && styles.roleCardActive]}
          onPress={() => setRole('passenger')}
        >
          <LinearGradient
            colors={role === 'passenger' ? ['#1a73e8', '#0d47a1'] : ['#f8f9ff', '#f8f9ff']}
            style={styles.roleCardGrad}
          >
            <View style={[styles.roleIconBox, { backgroundColor: role === 'passenger' ? 'rgba(255,255,255,0.2)' : COLORS.lightGray }]}>
              <Ionicons name="person" size={28} color={role === 'passenger' ? '#fff' : COLORS.gray} />
            </View>
            <View style={styles.roleCardText}>
              <Text style={[styles.roleTitle, { color: role === 'passenger' ? '#fff' : COLORS.textPrimary }]}>Passenger</Text>
              <Text style={[styles.roleSub, { color: role === 'passenger' ? 'rgba(255,255,255,0.8)' : COLORS.gray }]}>
                Rides dhundho aur book karo
              </Text>
            </View>
            {role === 'passenger' && (
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleCard, role === 'driver' && styles.roleCardActive]}
          onPress={() => setRole('driver')}
        >
          <LinearGradient
            colors={role === 'driver' ? ['#00897b', '#00695c'] : ['#f8f9ff', '#f8f9ff']}
            style={styles.roleCardGrad}
          >
            <View style={[styles.roleIconBox, { backgroundColor: role === 'driver' ? 'rgba(255,255,255,0.2)' : COLORS.lightGray }]}>
              <Ionicons name="car-sport" size={28} color={role === 'driver' ? '#fff' : COLORS.gray} />
            </View>
            <View style={styles.roleCardText}>
              <Text style={[styles.roleTitle, { color: role === 'driver' ? '#fff' : COLORS.textPrimary }]}>Driver</Text>
              <Text style={[styles.roleSub, { color: role === 'driver' ? 'rgba(255,255,255,0.8)' : COLORS.gray }]}>
                Rides post karo, income kamao
              </Text>
            </View>
            {role === 'driver' && (
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );

    if (step === 1) return (
      <View>
        <Text style={styles.stepTitle}>Personal Details</Text>
        <Text style={styles.stepSub}>Apni basic info bharen</Text>

        {[
          { key: 'name', label: 'Poora Naam *', icon: 'person-outline', placeholder: 'e.g. Ahmad Raza' },
          { key: 'phone', label: 'Phone Number *', icon: 'call-outline', placeholder: '0300-1234567', type: 'phone-pad' },
          { key: 'email', label: 'Email (Optional)', icon: 'mail-outline', placeholder: 'ahmad@example.com', type: 'email-address' },
          { key: 'password', label: 'Password *', icon: 'lock-closed-outline', placeholder: 'Min 6 characters', secure: true },
        ].map(field => (
          <View key={field.key} style={styles.fieldBlock}>
            <Text style={styles.label}>{field.label}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name={field.icon} size={20} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder={field.placeholder}
                value={form[field.key]}
                onChangeText={v => updateForm(field.key, v)}
                keyboardType={field.type || 'default'}
                secureTextEntry={field.secure}
                placeholderTextColor={COLORS.gray}
              />
            </View>
          </View>
        ))}

        {role === 'driver' && (
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>CNIC Number *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="card-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="42101-1234567-1"
                value={form.cnic}
                onChangeText={v => updateForm('cnic', v)}
                keyboardType="numeric"
                placeholderTextColor={COLORS.gray}
              />
            </View>
          </View>
        )}
      </View>
    );

    return (
      <View style={styles.verifyContainer}>
        <LinearGradient colors={['#1a73e8', '#0d47a1']} style={styles.verifyIcon}>
          <Ionicons name="phone-portrait-outline" size={40} color="#fff" />
        </LinearGradient>
        <Text style={styles.stepTitle}>OTP Verify Karen</Text>
        <Text style={styles.verifyText}>
          {form.phone} pe 6-digit OTP bheja gaya hai
        </Text>
        <View style={styles.otpRow}>
          {[0,1,2,3,4,5].map(i => (
            <View key={i} style={styles.otpBox}>
              <Text style={styles.otpDigit}>•</Text>
            </View>
          ))}
        </View>
        <Text style={styles.resendText}>OTP nahi mila? <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Resend</Text></Text>
        <View style={styles.demoNote}>
          <Ionicons name="information-circle-outline" size={14} color={COLORS.primary} />
          <Text style={styles.demoNoteText}>Demo mode: Direct register ho jayen</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <LinearGradient colors={['#1a73e8', '#0d47a1']} style={styles.header}>
        <TouchableOpacity onPress={() => step > 0 ? setStep(step - 1) : navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Banayein</Text>
        <Text style={styles.headerSub}>Step {step + 1} of {STEPS.length}</Text>

        {/* Progress */}
        <View style={styles.progressRow}>
          {STEPS.map((s, i) => (
            <View key={i} style={[styles.progressStep, i <= step && styles.progressStepActive]}>
              <View style={[styles.progressDot, i <= step && styles.progressDotActive]}>
                {i < step ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : (
                  <Text style={[styles.progressNum, i === step && { color: '#fff' }]}>{i + 1}</Text>
                )}
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
          title={step === STEPS.length - 1 ? 'Register Karen' : 'Aage'}
          onPress={handleNext}
          loading={loading}
          style={{ marginTop: 32 }}
          icon={step === STEPS.length - 1 ? 'checkmark-circle-outline' : 'arrow-forward-outline'}
        />

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
          <Text style={styles.loginLinkText}>
            Pehle se account hai? <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Login Karen</Text>
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
  progressStepActive: {},
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
  fieldBlock: { marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: '#fff' },
  inputIcon: { marginLeft: 14 },
  inputWithIcon: { flex: 1, paddingHorizontal: 10, paddingVertical: 14, fontSize: 15, color: COLORS.textPrimary },
  verifyContainer: { alignItems: 'center', paddingTop: 20 },
  verifyIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  verifyText: { fontSize: 14, color: COLORS.gray, textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  otpRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  otpBox: { width: 48, height: 56, borderRadius: 12, borderWidth: 2, borderColor: COLORS.primary, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  otpDigit: { fontSize: 20, color: COLORS.primary },
  resendText: { fontSize: 14, color: COLORS.gray },
  demoNote: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 10, padding: 10, marginTop: 20, gap: 6 },
  demoNoteText: { fontSize: 12, color: COLORS.primary },
  loginLink: { alignItems: 'center', marginTop: 20 },
  loginLinkText: { fontSize: 14, color: COLORS.gray },
});
