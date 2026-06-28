import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Pressable,
    ScrollView, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AuthBackground, AuthInput, Logo, GLASS, COLORS } from '../../components';
import { authApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/errorMessages';

const { width: W } = Dimensions.get('window');
// Match the splash screen logo sizing exactly.
const LOGO_SIZE = Math.max(160, Math.min(W * 0.44, 200));

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

type Step = 'request' | 'reset';

export default function ForgotPasswordScreen({ navigation }) {
    const { showToast } = useToast();
    const [step, setStep] = useState<Step>('request');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<any>({});

    const setErr = (k: string, v: string) => setErrors((p: any) => ({ ...p, [k]: v }));

    // ── Step 1: request a reset code ──────────────────────────────────────────
    const handleRequest = async () => {
        if (!email.trim()) return setErr('email', 'Email is required');
        if (!isValidEmail(email)) return setErr('email', 'Enter a valid email address');

        setLoading(true);
        const { error } = await authApi.forgotPassword(email.trim().toLowerCase());
        setLoading(false);
        if (error) { showToast(parseApiError(error), 'error'); return; }
        showToast('If that email is registered, a reset code has been sent.', 'success');
        setStep('reset');
    };

    // ── Step 2: verify code + set new password ────────────────────────────────
    const handleReset = async () => {
        const e: any = {};
        if (!code.trim()) e.code = 'Enter the 6-digit code';
        else if (!/^\d{6}$/.test(code)) e.code = 'Code must be 6 digits';
        if (!password) e.password = 'New password is required';
        else if (password.length < 6) e.password = 'Password must be at least 6 characters';
        setErrors(e);
        if (Object.keys(e).length) return;

        setLoading(true);
        const { error } = await authApi.resetPassword(email.trim().toLowerCase(), code, password);
        setLoading(false);
        if (error) { showToast(parseApiError(error), 'error'); return; }
        showToast('Password reset successfully. Please sign in.', 'success');
        navigation.navigate('Login');
    };

    const handleResend = async () => {
        setLoading(true);
        const { error } = await authApi.forgotPassword(email.trim().toLowerCase());
        setLoading(false);
        showToast(error ? parseApiError(error) : 'A new code has been sent.', error ? 'error' : 'success');
    };

    return (
        <AuthBackground>
            <SafeAreaView style={styles.safe}>
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                        <Pressable
                            style={styles.back}
                            hitSlop={10}
                            onPress={() => step === 'reset' ? setStep('request') : navigation.goBack()}
                        >
                            <Ionicons name="chevron-back" size={24} color="#fff" />
                        </Pressable>

                        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
                            <Logo variant="splash" size={LOGO_SIZE} />
                            <Text style={styles.title}>Forgot Password?</Text>
                            <Text style={styles.subtitle}>
                                {step === 'request'
                                    ? 'Enter your registered email and we’ll send you a reset code.'
                                    : `Enter the 6-digit code sent to ${email} and choose a new password.`}
                            </Text>
                        </Animated.View>

                        {step === 'request' ? (
                            <Animated.View entering={FadeIn.duration(350)} style={styles.card}>
                                <AuthInput
                                    icon="mail-outline"
                                    placeholder="Email address"
                                    value={email}
                                    onChangeText={(v) => { setEmail(v); setErr('email', ''); }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    error={errors.email}
                                />
                                <Pressable
                                    style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                                    onPress={handleRequest}
                                    disabled={loading}
                                >
                                    <Text style={styles.primaryText}>{loading ? 'Sending…' : 'Send Reset Code'}</Text>
                                </Pressable>
                            </Animated.View>
                        ) : (
                            <Animated.View entering={FadeIn.duration(350)} style={styles.card}>
                                <AuthInput
                                    icon="keypad-outline"
                                    placeholder="6-digit code"
                                    value={code}
                                    onChangeText={(v) => { setCode(v.replace(/[^0-9]/g, '').slice(0, 6)); setErr('code', ''); }}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    error={errors.code}
                                />
                                <AuthInput
                                    icon="lock-closed-outline"
                                    placeholder="New password (min 6 chars)"
                                    value={password}
                                    onChangeText={(v) => { setPassword(v); setErr('password', ''); }}
                                    password
                                    error={errors.password}
                                />
                                <Pressable
                                    style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                                    onPress={handleReset}
                                    disabled={loading}
                                >
                                    <Text style={styles.primaryText}>{loading ? 'Resetting…' : 'Reset Password'}</Text>
                                </Pressable>
                                <Pressable style={styles.resend} onPress={handleResend} hitSlop={6} disabled={loading}>
                                    <Text style={styles.resendText}>Didn’t get a code? Resend</Text>
                                </Pressable>
                            </Animated.View>
                        )}

                        <Pressable style={styles.bottomRow} onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.bottomMuted}>Remember your password? </Text>
                            <Text style={styles.bottomLink}>Sign In</Text>
                        </Pressable>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </AuthBackground>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 28, justifyContent: 'center' },
    back: { position: 'absolute', top: 8, left: 18, width: 40, height: 40, justifyContent: 'center', zIndex: 2 },
    header: { alignItems: 'center', marginBottom: 26 },
    title: { color: GLASS.textOnDark, fontSize: 26, fontWeight: '800', letterSpacing: -0.4, marginTop: 16 },
    subtitle: {
        color: GLASS.subOnDark, fontSize: 14, fontWeight: '500', marginTop: 8,
        textAlign: 'center', lineHeight: 20, paddingHorizontal: 6,
    },
    card: {
        backgroundColor: GLASS.fill,
        borderWidth: 1,
        borderColor: GLASS.border,
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
    },
    primaryBtn: {
        marginTop: 18,
        height: 48,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 6,
    },
    primaryText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
    resend: { alignSelf: 'center', marginTop: 16, paddingVertical: 4 },
    resendText: { color: '#9ec5ff', fontSize: 13, fontWeight: '700' },
    bottomRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 22, paddingVertical: 4 },
    bottomMuted: { color: GLASS.subOnDark, fontSize: 14, fontWeight: '500' },
    bottomLink: { color: '#9ec5ff', fontSize: 14, fontWeight: '800' },
});
