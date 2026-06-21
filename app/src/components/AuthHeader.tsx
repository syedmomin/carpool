import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Logo from './Logo';

const { width } = Dimensions.get('window');

// Shared curved blue header + ChalParo logo used across all auth screens
// (Login, Register) so they stay pixel-identical.
export default function AuthHeader() {
  return (
    <>
      <View style={styles.headerBackground}>
        <View style={styles.headerCurve} />
      </View>

      <View style={styles.logoContainer}>
        <Logo variant="auth" size={220} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    overflow: 'hidden',
  },
  headerCurve: {
    position: 'absolute',
    top: -150,
    left: -50,
    width: width + 100,
    height: 350,
    backgroundColor: '#1565c0',
    borderBottomLeftRadius: 300,
    borderBottomRightRadius: 200,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
});
