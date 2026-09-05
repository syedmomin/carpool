import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Pressable, Image,
    ScrollView, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthBackground, AuthInput, Logo, CitySearchModal, COLORS, GRADIENTS, CURVE, FONTS } from '../../components';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/errorMessages';
import { digitsOnly, normalizePkPhone, isValidLocalPhone } from '../../utils/phone';

const { width: W } = Dimensions.get('window');
// Match the splash screen logo sizing exactly.
const LOGO_SIZE = Math.max(120, Math.min(W * 0.34, 150));

// ─── Validators ───────────────────────────────────────────────────────────────
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPassword = (v) => v.length >= 8;

const ROLE_META: Record<'passenger' | 'driver', { label: string; icon: keyof typeof Ionicons.glyphMap; sub: string }> = {
    passenger: { label: 'Passenger', icon: 'people', sub: 'Find affordable rides' },
    driver: { label: 'Driver', icon: 'car-sport', sub: 'Offer rides & earn' },
};

export default function RegisterScreen({ navigation, route }) {
    const { register } = useApp();
    const { showToast } = useToast();
    // Role is chosen on the RoleSelect screen and passed in — not switchable here.
    const role: 'passenger' | 'driver' = route?.params?.intendedRole === 'driver' ? 'driver' : 'passenger';
    const roleMeta = ROLE_META[role];
    const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', city: '' });
    const [errors, setErrors] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [cityModal, setCityModal] = useState(false);

    const set = (key, val) => {
        setForm(p => ({ ...p, [key]: val }));
        setErrors(p => ({ ...p, [key]: '' }));
    };

    const validate = () => {
        const e: any = {};
        if (!form.name.trim()) e.name = 'Full name is required';
        else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';

        if (!form.phone.trim()) e.phone = 'Phone number is required';
        else if (!isValidLocalPhone(form.phone)) e.phone = 'Enter your number as 0300 1234567';

        if (!form.email.trim()) e.email = 'Email is required';
        else if (!isValidEmail(form.email)) e.email = 'Enter a valid email address';

        if (!form.password) e.password = 'Password is required';
        else if (!isValidPassword(form.password)) e.password = 'Password must be at least 8 characters';

        if (!form.city.trim()) e.city = 'Please select your city';

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleRegister = async () => {
        if (!validate()) return;
        setLoading(true);
        const { error } = await register({
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            phone: normalizePkPhone(form.phone),
            password: form.password,
            city: form.city.trim(),
            role: role === 'driver' ? 'DRIVER' : 'PASSENGER',
        });
        setLoading(false);
        if (error) { showToast(parseApiError(error), 'error'); return; }
        showToast('Account created successfully! Welcome to ChalParo.', 'success');
        // Navigation happens automatically via AppNavigator when currentUser is set
    };

    return (
        <AuthBackground variant="light">
            <SafeAreaView style={styles.safe}>
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                        <Pressable style={styles.back} onPress={() => navigation.goBack()} hitSlop={10}>
                            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                        </Pressable>

                        <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
                            <Logo variant="auth" size={LOGO_SIZE} />
                            <Text style={styles.brandTagline}>Har Safar Mein Sath</Text>
                        </Animated.View>
                        <Animated.View entering={FadeInDown.delay(60).duration(500)} style={styles.header}>
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>Sign up to start your journey</Text>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.card}>
                            <Text style={styles.fieldLabel}>Joining as</Text>
                            <View style={styles.roleBadge}>
                                <LinearGradient colors={GRADIENTS.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.roleBadgeIcon}>
                                    <Ionicons name={roleMeta.icon} size={18} color="#fff" />
                                </LinearGradient>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.roleBadgeLabel}>{roleMeta.label}</Text>
                                    <Text style={styles.roleBadgeSub}>{roleMeta.sub}</Text>
                                </View>
                                <Pressable onPress={() => navigation.navigate('RoleSelect')} hitSlop={8}>
                                    <Text style={styles.roleChange}>Change</Text>
                                </Pressable>
                            </View>

                            <AuthInput
                                variant="light"
                                icon="person-outline"
                                placeholder="Full name"
                                value={form.name}
                                onChangeText={v => set('name', v)}
                                error={errors.name}
                            />
                            <AuthInput
                                variant="light"
                                icon="call-outline"
                                rightLabel="+92"
                                placeholder="03001234567"
                                value={form.phone}
                                onChangeText={v => set('phone', digitsOnly(v).slice(0, 11))}
                                keyboardType="phone-pad"
                                maxLength={11}
                                error={errors.phone}
                            />
                            <AuthInput
                                variant="light"
                                icon="mail-outline"
                                placeholder="Email address"
                                value={form.email}
                                onChangeText={v => set('email', v)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                error={errors.email}
                            />
                            <AuthInput
                                variant="light"
                                icon="lock-closed-outline"
                                placeholder="Create a password (min 8 chars)"
                                value={form.password}
                                onChangeText={v => set('password', v)}
                                password
                                error={errors.password}
                            />
                            <AuthInput
                                variant="light"
                                asButton
                                icon="location-outline"
                                placeholder="Select your city"
                                value={form.city}
                                onPress={() => setCityModal(true)}
                                error={errors.city}
                            />

                            <Pressable
                                style={[styles.primaryBtnWrap, loading && { opacity: 0.7 }]}
                                onPress={handleRegister}
                                disabled={loading}
                            >
                                <LinearGradient colors={GRADIENTS.primary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
                                    <Text style={styles.primaryText}>{loading ? 'Creating Account…' : 'Create Account'}</Text>
                                    <View style={styles.primaryBtnIcon}>
                                        <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                                    </View>
                                </LinearGradient>
                            </Pressable>
                        </Animated.View>

                        <Pressable style={styles.bottomRow} onPress={() => navigation.navigate('Login', { intendedRole: role })}>
                            <Text style={styles.bottomMuted}>Already have an account? </Text>
                            <Text style={styles.bottomLink}>Sign In</Text>
                        </Pressable>

                        <Animated.View entering={FadeInDown.delay(180).duration(500)} style={styles.illustrationWrap}>
                            <Image
                                source={require('../../assets/illustrations/carpool-hero.png')}
                                style={styles.illustrationImg}
                                resizeMode="cover"
                            />
                        </Animated.View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

            <CitySearchModal
                visible={cityModal}
                title="Select City"
                onSelect={(c) => set('city', c)}
                onClose={() => setCityModal(false)}
            />
        </AuthBackground>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 4 },
    back: { marginTop: 4, width: 40, height: 40, justifyContent: 'center' },
    hero: { alignItems: 'center', marginTop: 4, marginBottom: 2 },
    brandTagline: { color: COLORS.primary, fontSize: 13, fontFamily: FONTS.bold, marginTop: -2 },
    header: { marginBottom: 14 },
    title: { color: COLORS.textPrimary, fontSize: 20, fontFamily: FONTS.extraBold, letterSpacing: -0.2, marginTop: 8 },
    subtitle: { color: COLORS.gray, fontSize: 14, fontFamily: FONTS.medium, marginTop: 2 },
    // No card background — inputs float directly on the light auth
    // background, each with its own shadow; a white card behind white inputs
    // made the fields nearly invisible.
    card: {
        paddingHorizontal: 2,
    },
    fieldLabel: { color: COLORS.gray, fontSize: 12, fontFamily: FONTS.bold, letterSpacing: 0.4, marginBottom: 10 },
    // Read-only role badge (role is picked on RoleSelect)
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderRadius: 14,
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
        paddingHorizontal: 14,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 1,
    },
    roleBadgeIcon: {
        width: 36, height: 36, borderRadius: 11,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 12,
    },
    roleBadgeLabel: { color: COLORS.textPrimary, fontSize: 15, fontFamily: FONTS.extraBold },
    roleBadgeSub: { color: COLORS.gray, fontSize: 12, fontFamily: FONTS.medium, marginTop: 1 },
    roleChange: { color: COLORS.primary, fontSize: 13, fontFamily: FONTS.extraBold },
    // Primary button
    primaryBtnWrap: {
        marginTop: 22,
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 4,
        ...CURVE,
    },
    primaryBtn: {
        height: 42,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    primaryText: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold, letterSpacing: 0.3 },
    primaryBtnIcon: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: '#fff',
        alignItems: 'center', justifyContent: 'center',
    },
    bottomRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 22, paddingVertical: 4 },
    bottomMuted: { color: COLORS.gray, fontSize: 14, fontFamily: FONTS.medium },
    bottomLink: { color: COLORS.primary, fontSize: 14, fontFamily: FONTS.extraBold },
    illustrationWrap: {
        marginTop: 24,
        marginHorizontal: -24,
        aspectRatio: 1737 / 906,
    },
    illustrationImg: { width: '100%', height: '100%' },
});
