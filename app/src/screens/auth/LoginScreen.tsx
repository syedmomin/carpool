import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Pressable,
    ScrollView, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthBackground, AuthInput, Logo, GLASS, COLORS, CURVE } from '../../components';
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
        <AuthBackground>
            <SafeAreaView style={styles.safe}>
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
                            <Logo variant="splash" size={LOGO_SIZE} />
                            <Text style={styles.title}>Welcome Back</Text>
                            <Text style={styles.subtitle}>Login to continue your journey</Text>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.card}>
                            <AuthInput
                                leftLabel="PK +92"
                                placeholder="Mobile number"
                                value={phone}
                                onChangeText={(v) => { setPhone(v.replace(/[^0-9]/g, '').slice(0, 10)); setErrors(p => ({ ...p, phone: '' })); }}
                                keyboardType="phone-pad"
                                maxLength={10}
                                error={errors.phone}
                            />
                            <AuthInput
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
                                style={[styles.primaryBtnWrap, loading && { opacity: 0.7 }]}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                <LinearGradient colors={['#2196f3', '#1a73e8', '#1557b0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
                                    {loading ? (
                                        <Text style={styles.primaryText}>Signing In…</Text>
                                    ) : (
                                        <>
                                            <Text style={styles.primaryText}>Sign In</Text>
                                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                                        </>
                                    )}
                                </LinearGradient>
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
    header: { alignItems: 'center', marginBottom: 26 },
    title: { color: GLASS.textOnDark, fontSize: 26, fontWeight: '800', letterSpacing: -0.4, marginTop: 16 },
    subtitle: { color: GLASS.subOnDark, fontSize: 14, fontWeight: '500', marginTop: 5 },
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
    forgot: { alignSelf: 'flex-end', marginTop: 12 },
    forgotText: { color: '#9ec5ff', fontSize: 13, fontWeight: '700' },
    primaryBtnWrap: {
        marginTop: 18,
        borderRadius: 16,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
        elevation: 6,
        ...CURVE,
    },
    primaryBtn: {
        height: 52,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...CURVE,
    },
    primaryText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    dividerLine: { flex: 1, height: 1, backgroundColor: GLASS.border },
    dividerText: { marginHorizontal: 14, color: GLASS.faintOnDark, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
    ghostBtn: {
        height: 52,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: GLASS.borderFocus,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        ...CURVE,
    },
    ghostText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
});
