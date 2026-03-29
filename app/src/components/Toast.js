import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CONFIGS = {
  success: { bg: '#22c55e', icon: 'checkmark-circle',     text: '#fff' },
  error:   { bg: '#ef4444', icon: 'close-circle',          text: '#fff' },
  warning: { bg: '#f59e0b', icon: 'warning',               text: '#fff' },
  info:    { bg: '#1a73e8', icon: 'information-circle',    text: '#fff' },
};

export default function Toast({ visible, message, type = 'info', onHide }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  const nativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 60, friction: 10, useNativeDriver: nativeDriver }),
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: nativeDriver }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -100, duration: 260, useNativeDriver: nativeDriver }),
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: nativeDriver }),
      ]).start();
    }
  }, [visible]);

  const cfg = CONFIGS[type] || CONFIGS.info;

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: cfg.bg, transform: [{ translateY }], opacity, pointerEvents: visible ? 'auto' : 'none' }]}
    >
      <Ionicons name={cfg.icon} size={20} color={cfg.text} />
      <Text style={[styles.message, { color: cfg.text }]} numberOfLines={2}>{message}</Text>
      <TouchableOpacity onPress={onHide} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <Ionicons name="close" size={18} color={cfg.text} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 10,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 12,
  },
  message: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },
});
