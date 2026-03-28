import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, FormInput, PrimaryButton, GradientHeader } from '../../components';

export default function ChangePasswordScreen({ navigation }) {
  const [form, setForm] = useState({ current: '', newPass: '', confirm: '' });
  const [show, setShow] = useState({ current: false, newPass: false, confirm: false });
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const toggleShow = (key) => setShow(prev => ({ ...prev, [key]: !prev[key] }));

  const handleChange = () => {
    if (!form.current || !form.newPass || !form.confirm) {
      Alert.alert('Error', 'Please fill in all fields.'); return;
    }
    if (form.newPass.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters.'); return;
    }
    if (form.newPass !== form.confirm) {
      Alert.alert('Error', 'New passwords do not match.'); return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success!', 'Your password has been changed successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }, 1200);
  };

  const strength = form.newPass.length === 0 ? 0 : form.newPass.length < 6 ? 1 : form.newPass.length < 10 ? 2 : 3;
  const strengthColors = ['', COLORS.danger, COLORS.warning, COLORS.secondary];
  const strengthLabels = ['', 'Weak', 'Medium', 'Strong'];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <GradientHeader colors={GRADIENTS.purple} title="Change Password" subtitle="Keep your account secure" onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* Security tips */}
          <View style={styles.tipCard}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.purple} />
            <Text style={styles.tipText}>Use a mix of letters, numbers and symbols for a strong password.</Text>
          </View>

          <FormInput
            label="Current Password *"
            icon="lock-closed-outline"
            placeholder="Enter current password"
            value={form.current}
            onChangeText={v => update('current', v)}
            secureTextEntry={!show.current}
            rightIcon={show.current ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => toggleShow('current')}
          />
          <FormInput
            label="New Password *"
            icon="lock-open-outline"
            placeholder="Enter new password"
            value={form.newPass}
            onChangeText={v => update('newPass', v)}
            secureTextEntry={!show.newPass}
            rightIcon={show.newPass ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => toggleShow('newPass')}
          />

          {/* Strength Meter */}
          {form.newPass.length > 0 && (
            <View style={styles.strengthBox}>
              <View style={styles.strengthBars}>
                {[1, 2, 3].map(i => (
                  <View key={i} style={[styles.strengthBar, { backgroundColor: i <= strength ? strengthColors[strength] : COLORS.lightGray }]} />
                ))}
              </View>
              <Text style={[styles.strengthLabel, { color: strengthColors[strength] }]}>{strengthLabels[strength]}</Text>
            </View>
          )}

          <FormInput
            label="Confirm New Password *"
            icon="checkmark-circle-outline"
            placeholder="Confirm new password"
            value={form.confirm}
            onChangeText={v => update('confirm', v)}
            secureTextEntry={!show.confirm}
            rightIcon={show.confirm ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => toggleShow('confirm')}
          />

          <PrimaryButton title="Change Password" onPress={handleChange} loading={loading} icon="shield-checkmark-outline" colors={GRADIENTS.purple} style={{ marginTop: 24 }} />
          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  body: { padding: 24 },
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#f5f3ff', borderRadius: 14, padding: 14, marginBottom: 20, gap: 10 },
  tipText: { flex: 1, fontSize: 13, color: COLORS.purple, lineHeight: 20 },
  strengthBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, marginTop: -4 },
  strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '700', minWidth: 50 },
});
