import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURVE, FormInput, AppBar, PrimaryButton } from '../../components';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../services/api';
import { parseApiError } from '../../utils/errorMessages';

export default function ChangePasswordScreen({ navigation }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({ current: '', newPass: '', confirm: '' });
  const [show, setShow] = useState({ current: false, newPass: false, confirm: false });
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const toggleShow = (key) => setShow(prev => ({ ...prev, [key]: !prev[key] }));

  const hasMinLength = form.newPass.length >= 8;
  const hasUppercase = /[A-Z]/.test(form.newPass);
  const hasNumberOrSymbol = /[0-9]|[^A-Za-z0-9]/.test(form.newPass);
  const meetsAllCriteria = hasMinLength && hasUppercase && hasNumberOrSymbol;

  const handleChange = async () => {
    if (!form.current || !form.newPass || !form.confirm) {
      showToast('Fill in all fields to continue.', 'error'); return;
    }
    if (!meetsAllCriteria) {
      showToast("Your new password doesn't meet all the requirements yet.", 'error'); return;
    }
    if (form.newPass !== form.confirm) {
      showToast("Passwords don't match.", 'error'); return;
    }
    setLoading(true);
    const { error } = await authApi.changePassword(form.current, form.newPass);
    setLoading(false);
    if (error) { showToast(parseApiError(error), 'error'); return; }
    setForm({ current: '', newPass: '', confirm: '' });
    showToast('Password changed', 'success');
    navigation.goBack();
  };

  const CRITERIA = [
    { label: 'At least 8 characters', met: hasMinLength },
    { label: 'One uppercase letter', met: hasUppercase },
    { label: 'One number or special character', met: hasNumberOrSymbol },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <AppBar title="Change Password" onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <FormInput
            label="Current Password"
            placeholder="Enter current password"
            value={form.current}
            onChangeText={v => update('current', v)}
            secureTextEntry={!show.current}
            rightIcon={show.current ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => toggleShow('current')}
          />
          <FormInput
            label="New Password"
            placeholder="Enter new password"
            value={form.newPass}
            onChangeText={v => update('newPass', v)}
            secureTextEntry={!show.newPass}
            rightIcon={show.newPass ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => toggleShow('newPass')}
          />
          <Text style={styles.hint}>Minimum 8 characters</Text>

          <FormInput
            label="Confirm New Password"
            placeholder="Confirm new password"
            value={form.confirm}
            onChangeText={v => update('confirm', v)}
            secureTextEntry={!show.confirm}
            rightIcon={show.confirm ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => toggleShow('confirm')}
          />

          <View style={styles.criteriaWrap}>
            {CRITERIA.map((c) => (
              <View key={c.label} style={styles.criteriaRow}>
                <Ionicons
                  name={c.met ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={c.met ? COLORS.secondary : COLORS.textSecondary}
                />
                <Text style={[styles.criteriaText, c.met && { color: COLORS.secondary }]}>{c.label}</Text>
              </View>
            ))}
          </View>

          <PrimaryButton title="Update Password" onPress={handleChange} loading={loading} style={styles.submitBtn} />
          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  body: { padding: 20 },
  hint: { fontSize: 12, color: COLORS.textSecondary, marginTop: -8, marginBottom: 14 },
  criteriaWrap: { marginTop: 6, marginBottom: 24, gap: 10 },
  criteriaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  criteriaText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  submitBtn: { marginTop: 0 },
});
