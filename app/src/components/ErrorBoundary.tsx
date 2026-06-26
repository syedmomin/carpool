import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './theme';

interface State { hasError: boolean; }

/**
 * Catches render-time crashes anywhere below it so one bad screen/payload shows
 * a recoverable message instead of a blank white screen.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (__DEV__) console.error('[ErrorBoundary]', error);
  }

  handleReset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container}>
        <Ionicons name="alert-circle-outline" size={56} color={COLORS.danger} />
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>The app hit an unexpected error. Please try again.</Text>
        <TouchableOpacity style={styles.btn} onPress={this.handleReset} activeOpacity={0.85}>
          <Text style={styles.btnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: COLORS.bg },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginTop: 16 },
  message: { fontSize: 14, color: COLORS.gray, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  btn: { marginTop: 24, backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 12 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
