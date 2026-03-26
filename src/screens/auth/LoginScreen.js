import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, PrimaryButton, GhostButton } from '../../components';
import { useApp } from '../../context/AppContext';

export default function LoginScreen({ navigation }) {
  const { login } = useApp();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('passenger');

  const handleLogin = () => {
    if (!phone || !password) {
      Alert.alert('Error', 'Phone aur password dono bharen!');
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
      <LinearGradient colors={['#1a73e8', '#0d47a1']} style={styles.header}>
        <View style={styles.bgCircle} />
        <View style={styles.iconWrapper}>
          <Ionicons name="car-sport" size={36} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>SafariShare</Text>
        <Text style={styles.headerSub}>Dobara Swagat Hai!</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {/* Role Toggle */}
        <Text style={styles.label}>Aap kia hain?</Text>
        <View style={styles.roleToggle}>
          {['passenger', 'driver'].map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.roleBtn, role === r && styles.roleBtnActive]}
              onPress={() => setRole(r)}
            >
              <Ionicons
                name={r === 'passenger' ? 'person-outline' : 'car-outline'}
                size={18}
                color={role === r ? '#fff' : COLORS.gray}
              />
              <Text style={[styles.roleBtnText, role === r && { color: '#fff' }]}>
                {r === 'passenger' ? 'Passenger' : 'Driver'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Phone */}
        <Text style={styles.label}>Phone Number</Text>
        <View style={styles.inputRow}>
          <View style={styles.countryCode}>
            <Text style={styles.countryCodeText}>🇵🇰 +92</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="300-1234567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor={COLORS.gray}
          />
        </View>

        {/* Password */}
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
          <TextInput
            style={styles.inputWithIcon}
            placeholder="Password dalein"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            placeholderTextColor={COLORS.gray}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Password bhool gaye?</Text>
        </TouchableOpacity>

        <PrimaryButton title="Login Karen" onPress={handleLogin} loading={loading} style={{ marginTop: 8 }} />

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>ya</Text>
          <View style={styles.divider} />
        </View>

        <GhostButton
          title="Naya Account Banayein"
          onPress={() => navigation.navigate('Register')}
        />

        <View style={styles.demoBox}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
          <Text style={styles.demoText}>Demo: Koi bhi phone/password likhen aur login karen</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 60, paddingBottom: 36, alignItems: 'center', position: 'relative', overflow: 'hidden' },
  bgCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)', top: -60, right: -40 },
  iconWrapper: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  body: { padding: 24, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  roleToggle: { flexDirection: 'row', backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 4 },
  roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  roleBtnActive: { backgroundColor: COLORS.primary },
  roleBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.gray },
  inputRow: { flexDirection: 'row', borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: COLORS.border },
  countryCode: { backgroundColor: COLORS.lightGray, paddingHorizontal: 14, justifyContent: 'center' },
  countryCodeText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: COLORS.textPrimary, backgroundColor: '#fff' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: '#fff' },
  inputIcon: { marginLeft: 14 },
  inputWithIcon: { flex: 1, paddingHorizontal: 10, paddingVertical: 14, fontSize: 15, color: COLORS.textPrimary },
  eyeBtn: { padding: 14 },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 8, marginBottom: 4 },
  forgotText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { marginHorizontal: 12, color: COLORS.gray, fontSize: 13 },
  demoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 10, padding: 12, marginTop: 20, gap: 8 },
  demoText: { flex: 1, fontSize: 12, color: COLORS.primary, lineHeight: 18 },
});
