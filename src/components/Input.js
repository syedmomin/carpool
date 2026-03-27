import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from './theme';

// ─── Form Input (icon + label + optional right action) ───────────────────────
export const FormInput = ({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  rightIcon,
  onRightIconPress,
  style,
  editable = true,
  multiline,
  numberOfLines,
}) => (
  <View style={[styles.wrapper, style]}>
    {label && <Text style={styles.label}>{label}</Text>}
    <View style={[styles.inputRow, !editable && styles.disabled]}>
      {icon && <Ionicons name={icon} size={20} color={COLORS.gray} style={styles.leftIcon} />}
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        editable={editable}
        multiline={multiline}
        numberOfLines={numberOfLines}
      />
      {rightIcon && (
        <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
          <Ionicons name={rightIcon} size={20} color={COLORS.gray} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

// ─── Search Input ────────────────────────────────────────────────────────────
export const SearchInput = ({ placeholder, value, onChangeText, onClear, style }) => (
  <View style={[styles.searchRow, style]}>
    <Ionicons name="search-outline" size={18} color={COLORS.gray} style={styles.leftIcon} />
    <TextInput
      style={styles.searchInput}
      placeholder={placeholder || 'Dhundhen...'}
      placeholderTextColor={COLORS.gray}
      value={value}
      onChangeText={onChangeText}
    />
    {value?.length > 0 && (
      <TouchableOpacity onPress={onClear}>
        <Ionicons name="close-circle" size={18} color={COLORS.gray} />
      </TouchableOpacity>
    )}
  </View>
);

// ─── OTP Input (6 boxes) ─────────────────────────────────────────────────────
export const OTPInput = ({ value = '', onChange }) => {
  const boxes = Array(6).fill('');
  return (
    <View style={styles.otpRow}>
      {boxes.map((_, i) => (
        <View key={i} style={[styles.otpBox, value[i] && styles.otpBoxFilled]}>
          <Text style={styles.otpText}>{value[i] || ''}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: SPACING.md },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
  },
  disabled: { backgroundColor: COLORS.lightGray },
  leftIcon: { marginRight: SPACING.sm },
  input: { flex: 1, fontSize: 15, color: COLORS.textPrimary, paddingVertical: 13 },
  multiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
  rightIcon: { padding: 4 },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary, marginLeft: 8 },

  otpRow: { flexDirection: 'row', justifyContent: 'space-between' },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  otpBoxFilled: { borderColor: COLORS.primary, backgroundColor: '#eff6ff' },
  otpText: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
});
