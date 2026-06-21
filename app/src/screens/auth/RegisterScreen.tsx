import React, { useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, TouchableOpacity,
    ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, AuthHeader, CitySearchModal } from '../../components';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/errorMessages';

// ─── Validators ───────────────────────────────────────────────────────────────
const isValidPhone = (v) => /^\d{10}$/.test(v.replace(/[\s\-]/g, ''));
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPassword = (v) => v.length >= 6;

const ROLES = [
    { value: 'passenger', label: 'Passenger', icon: 'person' },
    { value: 'driver', label: 'Driver', icon: 'car-sport' },
];

export default function RegisterScreen({ navigation }) {
    const { register } = useApp();
    const { showToast } = useToast();
    const [role, setRole] = useState('passenger');
    const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', city: '' });
    const [showPass, setShowPass] = useState(false);
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
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                {/* Shared curved header + logo */}
                <AuthHeader />

                {/* Form Section */}
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Sign up to start your journey</Text>

                    {/* Role Selection — same button language as the reference */}
                    <Text style={styles.fieldLabel}>I want to join as</Text>
                    <View style={styles.roleRow}>
                        {ROLES.map(r => {
                            const active = role === r.value;
                            return (
                                <TouchableOpacity
                                    key={r.value}
                                    style={[styles.roleBtn, active ? styles.roleBtnActive : styles.roleBtnInactive]}
                                    onPress={() => setRole(r.value)}
                                    activeOpacity={0.85}
                                >
                                    <Ionicons
                                        name={(active ? r.icon : `${r.icon}-outline`) as any}
                                        size={18}
                                        color={active ? '#fff' : '#1a73e8'}
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text style={[styles.roleBtnText, active && styles.roleBtnTextActive]}>{r.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Full Name */}
                    <View style={[styles.inputContainer, { marginTop: 20 }, errors.name && styles.inputError]}>
                        <View style={styles.iconBox}>
                            <Ionicons name="person-outline" size={20} color="#666" />
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your full name"
                            placeholderTextColor="#999"
                            value={form.name}
                            onChangeText={v => set('name', v)}
                        />
                    </View>
                    {!!errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

                    {/* Phone */}
                    <View style={[styles.inputContainer, { marginTop: 16 }, errors.phone && styles.inputError]}>
                        <View style={styles.countryCodeBox}>
                            <Text style={styles.countryCodeText}>PK +92</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your mobile number"
                            placeholderTextColor="#999"
                            value={form.phone}
                            onChangeText={v => set('phone', v.replace(/[^0-9]/g, '').slice(0, 10))}
                            keyboardType="phone-pad"
                            maxLength={10}
                        />
                    </View>
                    {!!errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

                    {/* Email */}
                    <View style={[styles.inputContainer, { marginTop: 16 }, errors.email && styles.inputError]}>
                        <View style={styles.iconBox}>
                            <Ionicons name="mail-outline" size={20} color="#666" />
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor="#999"
                            value={form.email}
                            onChangeText={v => set('email', v)}
                            keyboardType="email-address"
                            autoCapitalize={'none' as any}
                        />
                    </View>
                    {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                    {/* Password */}
                    <View style={[styles.inputContainer, { marginTop: 16 }, errors.password && styles.inputError]}>
                        <View style={styles.iconBox}>
                            <Ionicons name="lock-closed-outline" size={20} color="#666" />
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Create a password (min 6 chars)"
                            placeholderTextColor="#999"
                            value={form.password}
                            onChangeText={v => set('password', v)}
                            secureTextEntry={!showPass}
                        />
                        <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.iconBoxRight}>
                            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#666" />
                        </TouchableOpacity>
                    </View>
                    {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                    {/* City Selector */}
                    <TouchableOpacity
                        style={[styles.inputContainer, { marginTop: 16 }, errors.city && styles.inputError]}
                        onPress={() => setCityModal(true)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.iconBox}>
                            <Ionicons name="location-outline" size={20} color="#666" />
                        </View>
                        <Text style={[styles.selectorText, !form.city && styles.selectorPlaceholder]}>
                            {form.city || 'Select your city'}
                        </Text>
                        <View style={styles.iconBoxRight}>
                            <Ionicons name="chevron-down" size={18} color="#666" />
                        </View>
                    </TouchableOpacity>
                    {!!errors.city && <Text style={styles.errorText}>{errors.city}</Text>}

                    {/* Create Account Button */}
                    <TouchableOpacity style={[styles.signInBtn, { marginTop: 24 }]} onPress={handleRegister} disabled={loading}>
                        <Text style={styles.signInText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Sign In Button */}
                    <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('Login')}>
                        <Ionicons name="log-in-outline" size={18} color="#1a73e8" style={{ marginRight: 8 }} />
                        <Text style={styles.createText}>Sign In Instead</Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>

            {/* City Picker Modal */}
            <CitySearchModal
                visible={cityModal}
                title="Select City"
                onSelect={(c) => set('city', c)}
                onClose={() => setCityModal(false)}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
        backgroundColor: '#fff',
        paddingBottom: 32,
    },
    formContainer: {
        paddingTop: 14,
        paddingHorizontal: 22,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#666',
        marginBottom: 18,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    // Role buttons — reuse the reference's blue/outlined button language
    roleRow: {
        flexDirection: 'row',
        gap: 12,
    },
    roleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 44,
        borderRadius: 10,
        borderWidth: 1,
    },
    roleBtnActive: {
        backgroundColor: '#1a73e8',
        borderColor: '#1a73e8',
    },
    roleBtnInactive: {
        backgroundColor: '#fff',
        borderColor: '#1a73e8',
    },
    roleBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1a73e8',
    },
    roleBtnTextActive: {
        color: '#fff',
    },
    // Inputs (identical to LoginScreen)
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 10,
        height: 46,
        overflow: 'hidden',
    },
    inputError: {
        borderColor: '#d32f2f',
    },
    countryCodeBox: {
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 16,
        height: '100%',
        justifyContent: 'center',
        borderRightWidth: 1,
        borderRightColor: '#e0e0e0',
    },
    countryCodeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        paddingHorizontal: 14,
        height: '100%',
    },
    selectorText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        paddingHorizontal: 14,
    },
    selectorPlaceholder: {
        color: '#999',
    },
    iconBox: {
        paddingLeft: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconBoxRight: {
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
    },
    errorText: {
        fontSize: 12,
        color: '#d32f2f',
        marginTop: 4,
        marginLeft: 4,
    },
    // Primary button (identical to LoginScreen)
    signInBtn: {
        backgroundColor: '#1a73e8',
        borderRadius: 10,
        height: 46,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    signInText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    // Divider (identical to LoginScreen)
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e0e0e0',
    },
    dividerText: {
        marginHorizontal: 14,
        color: '#999',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    // Secondary button (identical to LoginScreen)
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 46,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#1a73e8',
        backgroundColor: '#fff',
    },
    createText: {
        color: '#1a73e8',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
