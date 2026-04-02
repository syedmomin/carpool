import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, PrimaryButton, GhostButton, FormInput, DividerText } from '../../components';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/errorMessages';

// phone: exactly 10 digits after +92 prefix
const isValidPhone = (v) => /^\d{10}$/.test(v.replace(/[\s\-]/g, ''));
const isValidPassword = (v) => v.length >= 6;

export default function LoginScreen({ navigation }) {
  const { login } = useApp();
  const { showToast } = useToast();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!phone.trim()) e.phone = 'Phone number is required';
    else if (!isValidPhone(phone)) e.phone = 'Enter exactly 10 digits after +92 (e.g. 3001234567)';
    if (!password) e.password = 'Password is required';
    else if (!isValidPassword(password)) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    const cleanPhone = '92' + phone.replace(/[\s\-]/g, '');
    const { error, role } = await login(cleanPhone, password);
    setLoading(false);
    if (error) { showToast(parseApiError(error), 'error'); return; }
    navigation.replace(role === 'driver' ? 'DriverApp' : 'PassengerApp');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.bgCircle} />
        <View style={styles.iconWrapper}>
          <Ionicons name="car-sport" size={36} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>ChalParo</Text>
        <Text style={styles.headerSub}>Welcome Back!</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {/* Phone */}
        <View style={styles.phoneRow}>
          <View style={styles.countryCode}>
            <Text style={styles.countryCodeText}>🇵🇰 +92</Text>
          </View>
          <View style={styles.phoneDivider} />
          <TextInput
            style={styles.phoneInput}
            placeholder="3001234567"
            placeholderTextColor={COLORS.gray}
            value={phone}
            onChangeText={(v) => { setPhone(v.replace(/[^0-9]/g, '').slice(0, 10)); setErrors(p => ({ ...p, phone: '' })); }}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>
        {!!errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

        {/* Password */}
        <FormInput
          label="Password"
          icon="lock-closed-outline"
          placeholder="Enter your password"
          value={password}
          onChangeText={(v) => { setPassword(v); setErrors(p => ({ ...p, password: '' })); }}
          secureTextEntry={!showPass}
          rightIcon={showPass ? 'eye-off-outline' : 'eye-outline'}
          onRightIconPress={() => setShowPass(!showPass)}
        />
        {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <PrimaryButton title="Sign In" onPress={handleLogin} loading={loading} style={{ marginTop: 8 }} />

        <DividerText label="or" style={styles.divider} />

        <GhostButton title="Create New Account" onPress={() => navigation.navigate('Register')} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 60, paddingBottom: 36, alignItems: 'center', backgroundColor: COLORS.primary, position: 'relative', overflow: 'hidden', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  bgCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)', top: -60, right: -40 },
  iconWrapper: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  body: { padding: 24, paddingBottom: 40 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 2, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden' },
  countryCode: { backgroundColor: COLORS.lightGray, paddingHorizontal: 14, height: 50, justifyContent: 'center' },
  countryCodeText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  phoneDivider: { width: 1, height: 28, backgroundColor: COLORS.border },
  phoneInput: { flex: 1, fontSize: 15, color: COLORS.textPrimary, paddingHorizontal: 14, height: 50 },
  errorText: { fontSize: 12, color: COLORS.danger, marginTop: 4, marginBottom: 6, marginLeft: 4 },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 8, marginBottom: 4 },
  forgotText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  divider: { marginVertical: 20 },
});
