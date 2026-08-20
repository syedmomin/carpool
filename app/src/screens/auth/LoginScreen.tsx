import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Pressable,
    ScrollView, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AuthBackground, AuthInput, Logo, COLORS, CURVE, FONTS, HEADING_FONTS } from '../../components';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/errorMessages';

const { width: W } = Dimensions.get('window');
// Match the splash screen logo sizing exactly.
const LOGO_SIZE = Math.max(160, Math.min(W * 0.44, 200));

// phone: exactly 10 digits after +92 prefix
const isValidPhone = (v) => /^\d{10}$/.test(v.replace(/[\s\-]/g, ''));
const isValidPassword = (v) => v.length >= 6;

export default function LoginScreen({ navigation }) {
    const { login } = useApp();
    const { showToast } = useToast();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<any>({});

    const validate = () => {
        const e: any = {};
        if (!phone.trim()) e.phone = 'Phone number is required';
        else if (!isValidPhone(phone)) e.phone = 'Enter exactly 10 digits after +92';
        if (!password) e.password = 'Password is required';
        else if (!isValidPassword(password)) e.password = 'Password must be at least 6 characters';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;
        setLoading(true);
        const cleanPhone = '92' + phone.replace(/[\s\-]/g, '');
        const { error, role } = await login(cleanPhone, password);
        setLoading(false);
        if (error) { showToast(parseApiError(error), 'error'); return; }
        // Navigation happens automatically via AppNavigator when currentUser is set
    };

    return (
        <AuthBackground variant="light">
            <SafeAreaView style={styles.safe}>
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                        <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
                            <Logo variant="auth" size={LOGO_SIZE} />
                            <Text style={styles.brandTagline}>Saath Chalein, Saath Bachaein</Text>
                        </Animated.View>
                        <Animated.View entering={FadeInDown.delay(60).duration(500)} style={styles.header}>
                            <Text style={styles.title}>Welcome back!</Text>
                            <Text style={styles.subtitle}>Login to continue your journey</Text>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.card}>
                            <AuthInput
                                variant="light"
                                leftLabel="PK +92"
                                placeholder="Mobile number"
                                value={phone}
                                onChangeText={(v) => { setPhone(v.replace(/[^0-9]/g, '').slice(0, 10)); setErrors(p => ({ ...p, phone: '' })); }}
                                keyboardType="phone-pad"
                                maxLength={10}
                                error={errors.phone}
                            />
                            <AuthInput
                                variant="light"
                                icon="lock-closed-outline"
                                placeholder="Password"
                                value={password}
                                onChangeText={(v) => { setPassword(v); setErrors(p => ({ ...p, password: '' })); }}
                                password
                                error={errors.password}
                            />

                            <Pressable style={styles.forgot} hitSlop={6} onPress={() => navigation.navigate('ForgotPassword')}>
                                <Text style={styles.forgotText}>Forgot Password?</Text>
                            </Pressable>

                            <Pressable
                                style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                <Text style={styles.primaryText}>{loading ? 'Signing In…' : 'Sign In'}</Text>
                                <View style={styles.primaryBtnIcon}>
                                    <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                                </View>
                            </Pressable>

                            <View style={styles.dividerRow}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>OR</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <Pressable
                                style={styles.ghostBtn}
                                onPress={() => navigation.navigate('RoleSelect')}
                            >
                                <Text style={styles.ghostText}>Create New Account</Text>
                            </Pressable>
                        </Animated.View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </AuthBackground>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 28, justifyContent: 'center' },
    hero: { alignItems: 'center', marginBottom: 22 },
    brandTagline: { color: COLORS.primary, fontSize: 13, fontFamily: HEADING_FONTS.bold, marginTop: 8 },
    header: { marginBottom: 22 },
    title: { color: COLORS.textPrimary, fontSize: 22, fontFamily: HEADING_FONTS.extraBold, letterSpacing: -0.2 },
    subtitle: { color: COLORS.gray, fontSize: 14, fontFamily: FONTS.medium, marginTop: 5 },
    card: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
        elevation: 2,
    },
    forgot: { alignSelf: 'flex-end', marginTop: 12 },
    forgotText: { color: COLORS.primary, fontSize: 13, fontFamily: FONTS.bold },
    primaryBtn: {
        marginTop: 18,
        height: 52,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 4,
        ...CURVE,
    },
    primaryText: { color: '#fff', fontSize: 16, fontFamily: HEADING_FONTS.bold, letterSpacing: 0.3 },
    primaryBtnIcon: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: '#fff',
        alignItems: 'center', justifyContent: 'center',
    },
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
    dividerText: { marginHorizontal: 14, color: COLORS.gray, fontSize: 12, fontFamily: FONTS.bold, letterSpacing: 1 },
    ghostBtn: {
        height: 52,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primaryLight,
        ...CURVE,
    },
    ghostText: { color: COLORS.primary, fontSize: 15, fontFamily: HEADING_FONTS.bold, letterSpacing: 0.2 },
});
