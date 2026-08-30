import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, Animated, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const [config, setConfig]   = useState(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

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
    setLoading(false);
    setTimeout(() => setConfig(null), 300);
  };

  const handleConfirm = async () => {
    if (!config?.onConfirm) { hideModal(); return; }
    setLoading(true);
    try {
      await config.onConfirm();
    } finally {
      hideModal();
    }
  };

  const handleCancel = () => {
    if (loading) return;
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

            <Animated.View style={[styles.iconCircle, { backgroundColor: cfg.iconBg, transform: [{ scale: iconScale }] }]}>
              <Ionicons name={(iconName) as any} size={30} color={cfg.iconColor} />
            </Animated.View>

            <Text style={styles.title}>{config?.title || ''}</Text>
            {config?.message ? <Text style={styles.message}>{config.message}</Text> : null}

            <View style={styles.btnRow}>
              {isConfirm && (
                <Pressable style={[styles.cancelBtn, loading && { opacity: 0.4 }]} onPress={handleCancel} disabled={loading}>
                  <Text style={styles.cancelText}>{config?.cancelText || 'Cancel'}</Text>
                </Pressable>
              )}
              <Pressable style={styles.confirmBtnWrap} onPress={handleConfirm} disabled={loading}>
                <LinearGradient colors={cfg.gradient} style={styles.confirmBtn}>
                  {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.confirmText}>{config?.confirmText || 'OK'}</Text>
                  }
                </LinearGradient>
              </Pressable>
            </View>
            {/* Bottom spacer for safe area (notches) */}
            <View style={{ height: Math.max(insets.bottom, 16) }} />
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 0,
    paddingTop: 0,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 24,
      },
      web: {
        boxShadow: '0 -8px 16px rgba(0,0,0,0.1)',
      },
    }),
  },
  handleWrap: {
    width: '100%',
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
    paddingHorizontal: 0,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  confirmBtnWrap: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      web: {
        boxShadow: `0 3px 6px ${COLORS.primary}2a`,
      },
    }),
  },
  confirmBtn: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

