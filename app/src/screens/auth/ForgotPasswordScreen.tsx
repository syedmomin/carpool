import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Pressable,
    ScrollView, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AuthBackground, AuthInput, Logo, GLASS, COLORS } from '../../components';
import { useToast } from '../../context/ToastContext';

const { width: W } = Dimensions.get('window');
// Match the splash screen logo sizing exactly.
const LOGO_SIZE = Math.max(160, Math.min(W * 0.44, 200));

const isValidPhone = (v) => /^\d{10}$/.test(v.replace(/[\s\-]/g, ''));

export default function ForgotPasswordScreen({ navigation }) {
    const { showToast } = useToast();
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async () => {
        if (!phone.trim()) { setError('Phone number is required'); return; }
        if (!isValidPhone(phone)) { setError('Enter exactly 10 digits after +92'); return; }

        setLoading(true);
        // TODO: wire to a real reset endpoint once the backend exposes one
        // (e.g. authApi.forgotPassword('92' + phone)). For now we confirm
        // optimistically without leaking whether the number is registered.
        setTimeout(() => {
            setLoading(false);
            setSent(true);
            showToast('If this number is registered, a reset code is on its way.', 'success');
        }, 700);
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
                            <Text style={styles.title}>Forgot Password?</Text>
                            <Text style={styles.subtitle}>
                                Enter your registered mobile number and we'll send you a code to reset your password.
                            </Text>
                        </Animated.View>

                        {sent ? (
                            <Animated.View entering={FadeIn.duration(400)} style={styles.card}>
                                <View style={styles.successIcon}>
                                    <Ionicons name="checkmark-circle" size={56} color="#9ec5ff" />
                                </View>
                                <Text style={styles.successTitle}>Check your phone</Text>
                                <Text style={styles.successSub}>
                                    If <Text style={styles.phoneHi}>+92 {phone}</Text> is registered, you'll receive a
                                    reset code shortly. Follow the instructions to set a new password.
                                </Text>
                                <Pressable style={styles.primaryBtn} onPress={() => navigation.navigate('Login')}>
                                    <Text style={styles.primaryText}>Back to Sign In</Text>
                                </Pressable>
                                <Pressable style={styles.resend} onPress={() => setSent(false)} hitSlop={6}>
                                    <Text style={styles.resendText}>Use a different number</Text>
                                </Pressable>
                            </Animated.View>
                        ) : (
                            <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.card}>
                                <AuthInput
                                    leftLabel="PK +92"
                                    placeholder="Mobile number"
                                    value={phone}
                                    onChangeText={(v) => { setPhone(v.replace(/[^0-9]/g, '').slice(0, 10)); setError(''); }}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    error={error}
                                />
                                <Pressable
                                    style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                                    onPress={handleSubmit}
                                    disabled={loading}
                                >
                                    <Text style={styles.primaryText}>{loading ? 'Sending…' : 'Send Reset Code'}</Text>
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
    // success state
    successIcon: { alignItems: 'center', marginBottom: 10 },
    successTitle: { color: GLASS.textOnDark, fontSize: 19, fontWeight: '800', textAlign: 'center' },
    successSub: {
        color: GLASS.subOnDark, fontSize: 14, fontWeight: '500',
        textAlign: 'center', lineHeight: 21, marginTop: 8,
    },
    phoneHi: { color: '#fff', fontWeight: '800' },
    resend: { alignSelf: 'center', marginTop: 16, paddingVertical: 4 },
    resendText: { color: '#9ec5ff', fontSize: 13, fontWeight: '700' },
    bottomRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 22, paddingVertical: 4 },
    bottomMuted: { color: GLASS.subOnDark, fontSize: 14, fontWeight: '500' },
    bottomLink: { color: '#9ec5ff', fontSize: 14, fontWeight: '800' },
});
