import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated, Pressable, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '../components/theme';

// ─── Config ──────────────────────────────────────────────────────────────────
const CONFIGS = {
  success: {
    gradient:    ['#43a047', '#1b5e20'],
    iconBg:      '#e8f5e9',
    iconColor:   '#43a047',
    defaultIcon: 'checkmark-circle-outline',
  },
  error: {
    gradient:    ['#ff5252', '#c62828'],
    iconBg:      '#fdecea',
    iconColor:   '#ef4444',
    defaultIcon: 'close-circle-outline',
  },
  danger: {
    gradient:    ['#ff5252', '#c62828'],
    iconBg:      '#fdecea',
    iconColor:   '#ef4444',
    defaultIcon: 'warning-outline',
  },
  info: {
    gradient:    GRADIENTS.primary,
    iconBg:      '#eff6ff',
    iconColor:   COLORS.primary,
    defaultIcon: 'information-circle-outline',
  },
  warning: {
    gradient:    ['#f59e0b', '#b45309'],
    iconBg:      '#fffbeb',
    iconColor:   '#f59e0b',
    defaultIcon: 'alert-circle-outline',
  },
  confirm: {
    gradient:    GRADIENTS.primary,
    iconBg:      '#eff6ff',
    iconColor:   COLORS.primary,
    defaultIcon: 'help-circle-outline',
  },
};

// ─── Context ─────────────────────────────────────────────────────────────────
const GlobalModalContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function GlobalModalProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [visible, setVisible] = useState(false);

  const translateYAnim = useRef(new Animated.Value(600)).current;
  const opacityAnim    = useRef(new Animated.Value(0)).current;
  const iconScale      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateYAnim, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }),
        Animated.timing(opacityAnim,    { toValue: 1, duration: 300,             useNativeDriver: true }),
      ]).start(() => {
        Animated.spring(iconScale,      { toValue: 1, tension: 80, friction: 5,  useNativeDriver: true }).start();
      });
    } else {
      Animated.parallel([
        Animated.timing(translateYAnim, { toValue: 600, duration: 250, useNativeDriver: true }),
        Animated.timing(opacityAnim,    { toValue: 0,   duration: 250, useNativeDriver: true }),
        Animated.timing(iconScale,      { toValue: 0,   duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const showModal = (cfg) => {
    setConfig(cfg);
    setVisible(true);
  };

  const hideModal = () => {
    setVisible(false);
    setTimeout(() => setConfig(null), 300);
  };

  const handleConfirm = () => {
    hideModal();
    config?.onConfirm?.();
  };

  const handleCancel = () => {
    hideModal();
    config?.onCancel?.();
  };

  const cfg = config ? (CONFIGS[config.type] || CONFIGS.info) : CONFIGS.info;
  const iconName = config?.icon || cfg.defaultIcon;
  const isConfirm = config?.type === 'confirm' || config?.type === 'danger';

  return (
    <GlobalModalContext.Provider value={{ showModal }}>
      {children}

      <Modal visible={visible} transparent statusBarTranslucent animationType="none" onRequestClose={handleCancel}>
        <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={isConfirm ? undefined : handleCancel} />
        </Animated.View>

        <View style={styles.bottomSheetContainer} pointerEvents="box-none">
          <Animated.View style={[styles.sheet, { transform: [{ translateY: translateYAnim }] }]}>
            {/* Grab Handle */}
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>

            {/* Top accent line */}
            <View style={styles.accentLineWrap}>
                <LinearGradient colors={cfg.gradient} style={styles.accentLine} />
            </View>

            <Animated.View style={[styles.iconCircle, { backgroundColor: cfg.iconBg, transform: [{ scale: iconScale }] }]}>
              <View style={[styles.iconInner, { backgroundColor: cfg.iconBg }]}>
                <Ionicons name={iconName} size={42} color={cfg.iconColor} />
              </View>
            </Animated.View>

            <Text style={styles.title}>{config?.title || ''}</Text>
            {config?.message ? <Text style={styles.message}>{config.message}</Text> : null}

            <View style={styles.btnRow}>
              {isConfirm && (
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.7}>
                  <Text style={styles.cancelText}>{config?.cancelText || 'Cancel'}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.confirmBtnWrap} onPress={handleConfirm} activeOpacity={0.85}>
                <LinearGradient colors={cfg.gradient} style={styles.confirmBtn}>
                  <Text style={styles.confirmText}>{config?.confirmText || 'OK'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            {/* Bottom spacer for safe area (notches) */}
            <View style={{ height: Platform.OS === 'ios' ? 34 : 24 }} />
          </Animated.View>
        </View>
      </Modal>
    </GlobalModalContext.Provider>
  );
}

export const useGlobalModal = () => useContext(GlobalModalContext);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,30,0.65)',
  },
  bottomSheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingBottom: 0,
    paddingTop: 0,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -12 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 24,
      },
      web: {
        boxShadow: '0 -12px 20px rgba(0,0,0,0.15)',
      },
    }),
  },
  handleWrap: {
    width: '100%',
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#e2e8f0',
  },
  accentLineWrap: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  accentLine: {
    width: '100%',
    height: 0, // Accent hidden or subtle bar
  },
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 6px 10px rgba(0,0,0,0.12)',
      },
    }),
  },
  iconInner: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 4,
    paddingHorizontal: 0,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  confirmBtnWrap: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      web: {
        boxShadow: `0 4px 8px ${COLORS.primary}33`,
      },
    }),
  },
  confirmBtn: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
