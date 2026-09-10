import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Pressable, Image,
    ScrollView, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthBackground, AuthInput, Logo, PrimaryButton, GhostButton, COLORS, FONTS } from '../../components';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/errorMessages';
import { digitsOnly, normalizePkPhone, isValidLocalPhone } from '../../utils/phone';

const { width: W } = Dimensions.get('window');
// Match the splash screen logo sizing exactly.
const LOGO_SIZE = Math.max(120, Math.min(W * 0.34, 150));
// Illustration is full-bleed (edge-to-edge, fixed to the screen bottom) —
// reserve exactly its rendered height at the bottom of the scroll content so
// it never covers the "Create New Account" button.
const ILLUSTRATION_H = W / (1737 / 906);

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
        else if (!isValidLocalPhone(phone)) e.phone = 'Enter your number as 0300 1234567';
        if (!password) e.password = 'Password is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;
        setLoading(true);
        const cleanPhone = normalizePkPhone(phone);
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
                            <Text style={styles.brandTagline}>Har Safar Mein Sath</Text>
                        </Animated.View>
                        <Animated.View entering={FadeInDown.delay(60).duration(500)} style={styles.header}>
                            <Text style={styles.title}>Welcome back!</Text>
                            <Text style={styles.subtitle}>Sign in to book your next ride</Text>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.card}>
                            <AuthInput
                                variant="light"
                                icon="call-outline"
                                rightLabel="+92"
                                placeholder="03001234567"
                                value={phone}
                                onChangeText={(v) => { setPhone(digitsOnly(v).slice(0, 11)); setErrors(p => ({ ...p, phone: '' })); }}
                                keyboardType="phone-pad"
                                maxLength={11}
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

                            <PrimaryButton
                                title={loading ? 'Signing In…' : 'Sign In'}
                                trailingIcon="arrow-forward"
                                onPress={handleLogin}
                                loading={loading}
                                style={styles.primaryBtnWrap}
                            />

                            <GhostButton
                                title="Create New Account"
                                onPress={() => navigation.navigate('RoleSelect')}
                                style={styles.ghostBtn}
                            />
                        </Animated.View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

            <Animated.View entering={FadeInDown.delay(180).duration(500)} style={styles.illustrationFixed} pointerEvents="none">
                <Image
                    source={require('../../assets/illustrations/carpool-hero.png')}
                    style={styles.illustrationImg}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={[COLORS.bg, 'rgba(245,247,255,0)']}
                    style={styles.illustrationFade}
                />
            </Animated.View>
        </AuthBackground>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: ILLUSTRATION_H + 16, justifyContent: 'center' },
    hero: { alignItems: 'center', marginBottom: 10 },
    brandTagline: { color: COLORS.primary, fontSize: 13, fontFamily: FONTS.bold, marginTop: -2 },
    header: { marginBottom: 12 },
    title: { color: COLORS.textPrimary, fontSize: 20, fontFamily: FONTS.extraBold, letterSpacing: -0.2 },
    subtitle: { color: COLORS.gray, fontSize: 14, fontFamily: FONTS.medium, marginTop: 2 },
    // No card background — inputs float directly on the light auth
    // background, each with its own shadow; a white card behind white inputs
    // made the fields nearly invisible.
    card: {
        paddingHorizontal: 2,
    },
    forgot: { alignSelf: 'flex-end', marginTop: 10 },
    forgotText: { color: COLORS.primary, fontSize: 13, fontFamily: FONTS.bold },
    primaryBtnWrap: { marginTop: 14 },
    ghostBtn: { marginTop: 14, backgroundColor: COLORS.primaryLight },
    illustrationFixed: {
        position: 'absolute', left: 0, right: 0, bottom: 0,
        width: '100%', aspectRatio: 1737 / 906,
    },
    illustrationImg: { width: '100%', height: '100%' },
    // Soft blend so the illustration's own background eases into the screen
    // background instead of showing a hard rectangular edge.
    illustrationFade: {
        position: 'absolute', top: 0, left: 0, right: 0, height: 28,
    },
});
