import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated, Pressable, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from './theme';

const CONFIGS = {
  danger: {
    gradient:  ['#ff5252', '#c62828'],
    iconBg:    '#fdecea',
    iconColor: '#ef4444',
    ripple:    '#fdecea',
    defaultIcon: 'warning-outline',
  },
  success: {
    gradient:  ['#43a047', '#1b5e20'],
    iconBg:    '#e8f5e9',
    iconColor: '#43a047',
    ripple:    '#e8f5e9',
    defaultIcon: 'checkmark-circle-outline',
  },
  default: {
    gradient:  GRADIENTS.primary,
    iconBg:    '#eff6ff',
    iconColor: COLORS.primary,
    ripple:    '#eff6ff',
    defaultIcon: 'help-circle-outline',
  },
};

export function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmText  = 'Confirm',
  cancelText   = 'Cancel',
  type         = 'default',
  icon,
  loading      = false,
}) {
  const scaleAnim   = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconBounce  = useRef(new Animated.Value(0)).current;

  const cfg      = CONFIGS[type] || CONFIGS.default;
  const iconName = icon || cfg.defaultIcon;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim,   { toValue: 1,    tension: 65, friction: 9,  useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1,    duration: 200,             useNativeDriver: true }),
      ]).start(() => {
        Animated.sequence([
          Animated.spring(iconBounce, { toValue: -6, tension: 80, friction: 5, useNativeDriver: true }),
          Animated.spring(iconBounce, { toValue:  0, tension: 80, friction: 6, useNativeDriver: true }),
        ]).start();
      });
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim,   { toValue: 0.85, duration: 160, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0,    duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Card */}
      <View style={styles.centeredView} pointerEvents="box-none">
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
          {/* Decorative top bar */}
          <LinearGradient colors={cfg.gradient} style={styles.topBar} />

          {/* Icon */}
          <Animated.View style={[styles.iconCircle, { backgroundColor: cfg.iconBg, transform: [{ translateY: iconBounce }] }]}>
            <View style={[styles.iconInner, { backgroundColor: cfg.iconBg }]}>
              <Ionicons name={iconName} size={38} color={cfg.iconColor} />
            </View>
          </Animated.View>

          {/* Text */}
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {/* Buttons */}
          <View style={styles.btnRow}>
            {/* Cancel */}
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>

            {/* Confirm */}
            <TouchableOpacity
              style={styles.confirmBtnWrap}
              onPress={onConfirm}
              disabled={!!loading}
              activeOpacity={0.85}
            >
              <LinearGradient colors={cfg.gradient} style={styles.confirmBtn}>
                {loading
                  ? <Ionicons name="sync-outline" size={18} color="#fff" />
                  : <Text style={styles.confirmText}>{confirmText}</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,30,0.55)',
  },
  centeredView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 0,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
    overflow: 'hidden',
  },
  topBar: {
    width: '100%',
    height: 6,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginBottom: 0,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  iconInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  confirmBtnWrap: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  confirmBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
