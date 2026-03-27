import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS, PrimaryButton, GhostButton, FormInput,
  DividerText, TabPills,
} from '../../components';
import { useApp } from '../../context/AppContext';

const ROLE_TABS = [
  { value: 'passenger', label: 'Passenger' },
  { value: 'driver', label: 'Driver' },
];

export default function LoginScreen({ navigation }) {
  const { login } = useApp();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('passenger');

  const handleLogin = () => {
    if (!phone || !password) {
      Alert.alert('Error', 'Please enter your phone number and password.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const userData = {
        id: role === 'driver' ? 'd1' : 'p1',
        name: role === 'driver' ? 'Ahmad Raza' : 'Ali Hassan',
        phone,
        email: `${role}@safarishare.pk`,
        avatar: null,
        rating: 4.8,
        totalTrips: role === 'driver' ? 127 : 23,
        verified: true,
      };
      login(userData, role);
      navigation.replace(role === 'driver' ? 'DriverTabs' : 'PassengerTabs');
    }, 1200);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.bgCircle} />
        <View style={styles.iconWrapper}>
          <Ionicons name="car-sport" size={36} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>SafariShare</Text>
        <Text style={styles.headerSub}>Welcome Back!</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {/* Role Toggle */}
        <Text style={styles.fieldLabel}>Select Your Role</Text>
        <TabPills
          tabs={ROLE_TABS}
          activeTab={role}
          onSelect={setRole}
          style={styles.roleTabs}
        />

        {/* Phone */}
        <Text style={styles.fieldLabel}>Phone Number</Text>
        <View style={styles.phoneRow}>
          <View style={styles.countryCode}>
            <Text style={styles.countryCodeText}>🇵🇰 +92</Text>
          </View>
          <FormInput
            placeholder="300-1234567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={styles.phoneInput}
          />
        </View>

        {/* Password */}
        <FormInput
          label="Password"
          icon="lock-closed-outline"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPass}
          rightIcon={showPass ? 'eye-off-outline' : 'eye-outline'}
          onRightIconPress={() => setShowPass(!showPass)}
        />

        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <PrimaryButton title="Sign In" onPress={handleLogin} loading={loading} style={{ marginTop: 8 }} />

        <DividerText label="or" style={styles.divider} />

        <GhostButton
          title="Create New Account"
          onPress={() => navigation.navigate('Register')}
        />

        <View style={styles.demoBox}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
          <Text style={styles.demoText}>Demo: Enter any phone & password to sign in</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: 60, paddingBottom: 36, alignItems: 'center',
    backgroundColor: COLORS.primary, position: 'relative', overflow: 'hidden',
  },
  bgCircle: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)', top: -60, right: -40,
  },
  iconWrapper: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  body: { padding: 24, paddingBottom: 40 },
  fieldLabel: {
    fontSize: 13, fontWeight: '600', color: COLORS.textSecondary,
    marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  roleTabs: { marginBottom: 4 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  countryCode: {
    backgroundColor: COLORS.lightGray, paddingHorizontal: 14,
    height: 50, justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRightWidth: 0, borderRadius: 12,
    borderTopRightRadius: 0, borderBottomRightRadius: 0,
  },
  countryCodeText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  phoneInput: {
    flex: 1, marginBottom: 0,
    borderTopLeftRadius: 0, borderBottomLeftRadius: 0,
  },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 8, marginBottom: 4 },
  forgotText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  divider: { marginVertical: 20 },
  demoBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#eff6ff', borderRadius: 10,
    padding: 12, marginTop: 20, gap: 8,
  },
  demoText: { flex: 1, fontSize: 12, color: COLORS.primary, lineHeight: 18 },
});
