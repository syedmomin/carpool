import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Pressable,
    ScrollView, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AuthBackground, AuthInput, Logo, CitySearchModal, GLASS, COLORS } from '../../components';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/errorMessages';

const { width: W } = Dimensions.get('window');
// Match the splash screen logo sizing exactly.
const LOGO_SIZE = Math.max(160, Math.min(W * 0.44, 200));

// ─── Validators ───────────────────────────────────────────────────────────────
const isValidPhone = (v) => /^\d{10}$/.test(v.replace(/[\s\-]/g, ''));
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPassword = (v) => v.length >= 6;

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
        else if (!isValidPhone(form.phone)) e.phone = 'Enter exactly 10 digits after +92';

        if (!form.email.trim()) e.email = 'Email is required';
        else if (!isValidEmail(form.email)) e.email = 'Enter a valid email address';

        if (!form.password) e.password = 'Password is required';
        else if (!isValidPassword(form.password)) e.password = 'Password must be at least 6 characters';

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
            phone: '92' + form.phone.replace(/[\s\-]/g, ''),
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
        <AuthBackground>
            <SafeAreaView style={styles.safe}>
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                        <Pressable style={styles.back} onPress={() => navigation.goBack()} hitSlop={10}>
                            <Ionicons name="chevron-back" size={24} color="#fff" />
                        </Pressable>

                        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
                            <Logo variant="splash" size={LOGO_SIZE} />
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>Sign up to start your journey</Text>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.card}>
                            <Text style={styles.fieldLabel}>Joining as</Text>
                            <View style={styles.roleBadge}>
                                <View style={styles.roleBadgeIcon}>
                                    <Ionicons name={roleMeta.icon} size={18} color="#fff" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.roleBadgeLabel}>{roleMeta.label}</Text>
                                    <Text style={styles.roleBadgeSub}>{roleMeta.sub}</Text>
                                </View>
                                <Pressable onPress={() => navigation.navigate('RoleSelect')} hitSlop={8}>
                                    <Text style={styles.roleChange}>Change</Text>
                                </Pressable>
                            </View>

                            <AuthInput
                                icon="person-outline"
                                placeholder="Full name"
                                value={form.name}
                                onChangeText={v => set('name', v)}
                                error={errors.name}
                            />
                            <AuthInput
                                leftLabel="PK +92"
                                placeholder="Mobile number"
                                value={form.phone}
                                onChangeText={v => set('phone', v.replace(/[^0-9]/g, '').slice(0, 10))}
                                keyboardType="phone-pad"
                                maxLength={10}
                                error={errors.phone}
                            />
                            <AuthInput
                                icon="mail-outline"
                                placeholder="Email address"
                                value={form.email}
                                onChangeText={v => set('email', v)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                error={errors.email}
                            />
                            <AuthInput
                                icon="lock-closed-outline"
                                placeholder="Create a password (min 6 chars)"
                                value={form.password}
                                onChangeText={v => set('password', v)}
                                password
                                error={errors.password}
                            />
                            <AuthInput
                                asButton
                                icon="location-outline"
                                placeholder="Select your city"
                                value={form.city}
                                onPress={() => setCityModal(true)}
                                error={errors.city}
                            />

                            <Pressable
                                style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                                onPress={handleRegister}
                                disabled={loading}
                            >
                                <Text style={styles.primaryText}>{loading ? 'Creating Account…' : 'Create Account'}</Text>
                            </Pressable>
                        </Animated.View>

                        <Pressable style={styles.bottomRow} onPress={() => navigation.navigate('Login', { intendedRole: role })}>
                            <Text style={styles.bottomMuted}>Already have an account? </Text>
                            <Text style={styles.bottomLink}>Sign In</Text>
                        </Pressable>

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
    scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 28 },
    back: { marginTop: 4, width: 40, height: 40, justifyContent: 'center' },
    header: { alignItems: 'center', marginTop: 4, marginBottom: 22 },
    title: { color: GLASS.textOnDark, fontSize: 24, fontWeight: '800', letterSpacing: -0.4, marginTop: 14 },
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
    fieldLabel: { color: GLASS.subOnDark, fontSize: 12, fontWeight: '700', letterSpacing: 0.4, marginBottom: 10 },
    // Read-only role badge (role is picked on RoleSelect)
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(89,150,255,0.16)',
        borderWidth: 1,
        borderColor: '#7fb0ff',
        paddingHorizontal: 14,
    },
    roleBadgeIcon: {
        width: 36, height: 36, borderRadius: 11,
        backgroundColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 12,
    },
    roleBadgeLabel: { color: GLASS.textOnDark, fontSize: 15, fontWeight: '800' },
    roleBadgeSub: { color: GLASS.subOnDark, fontSize: 12, fontWeight: '500', marginTop: 1 },
    roleChange: { color: '#9ec5ff', fontSize: 13, fontWeight: '800' },
    // Primary button
    primaryBtn: {
        marginTop: 22,
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
    bottomRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 22, paddingVertical: 4 },
    bottomMuted: { color: GLASS.subOnDark, fontSize: 14, fontWeight: '500' },
    bottomLink: { color: '#9ec5ff', fontSize: 14, fontWeight: '800' },
});
