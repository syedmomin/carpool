import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from './theme';

export function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'default', // 'default' | 'danger' | 'success'
  icon,
  loading = false,
}) {
  const config = {
    danger:  { colors: [COLORS.danger, '#c62828'],  iconBg: '#fdecea', iconColor: COLORS.danger,    defaultIcon: 'warning-outline' },
    success: { colors: GRADIENTS.secondary,          iconBg: '#e8f5e9', iconColor: COLORS.secondary, defaultIcon: 'checkmark-circle-outline' },
    default: { colors: GRADIENTS.primary,            iconBg: '#eff6ff', iconColor: COLORS.primary,   defaultIcon: 'help-circle-outline' },
  };
  const c = config[type] || config.default;
  const iconName = icon || c.defaultIcon;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: c.iconBg }]}>
            <Ionicons name={iconName} size={36} color={c.iconColor} />
          </View>

          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {/* Confirm Button */}
          <TouchableOpacity onPress={onConfirm} disabled={!!loading} style={styles.confirmBtn}>
            <LinearGradient colors={c.colors} style={styles.confirmGrad}>
              {!!loading
                ? <Text style={styles.confirmText}>Please wait...</Text>
                : <Text style={styles.confirmText}>{confirmText}</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>{cancelText}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12,
    alignItems: 'center',
  },
  handle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginBottom: 24 },
  iconWrap: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 8 },
  message: { fontSize: 14, color: COLORS.gray, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  confirmBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  confirmGrad: { paddingVertical: 16, alignItems: 'center' },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { paddingVertical: 12 },
  cancelText: { fontSize: 15, color: COLORS.gray, fontWeight: '600' },
});
