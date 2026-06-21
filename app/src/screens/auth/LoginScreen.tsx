import React, { useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, TouchableOpacity,
    ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, AuthHeader } from '../../components';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/errorMessages';

// phone: exactly 10 digits after +92 prefix
const isValidPhone = (v) => /^\d{10}$/.test(v.replace(/[\s\-]/g, ''));
const isValidPassword = (v) => v.length >= 6;

export default function LoginScreen({ navigation }) {
    const { login } = useApp();
    const { showToast } = useToast();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
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
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                
                {/* Shared curved header + logo */}
                <AuthHeader />

                {/* Form Section */}
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Welcome Back!</Text>
                    <Text style={styles.subtitle}>Login to continue your journey</Text>

                    {/* Phone Input */}
                    <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                        <View style={styles.countryCodeBox}>
                            <Text style={styles.countryCodeText}>PK +92</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your mobile number"
                            placeholderTextColor="#999"
                            value={phone}
                            onChangeText={(v) => { setPhone(v.replace(/[^0-9]/g, '').slice(0, 10)); setErrors(p => ({ ...p, phone: '' })); }}
                            keyboardType="phone-pad"
                            maxLength={10}
                        />
                    </View>
                    {!!errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

                    {/* Password Input */}
                    <View style={[styles.inputContainer, { marginTop: 16 }, errors.password && styles.inputError]}>
                        <View style={styles.iconBox}>
                            <Ionicons name="lock-closed-outline" size={20} color="#666" />
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your password"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={(v) => { setPassword(v); setErrors(p => ({ ...p, password: '' })); }}
                            secureTextEntry={!showPass}
                        />
                        <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.iconBoxRight}>
                            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#666" />
                        </TouchableOpacity>
                    </View>
                    {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                    <TouchableOpacity style={styles.forgotBtn}>
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    {/* Sign In Button */}
                    <TouchableOpacity style={styles.signInBtn} onPress={handleLogin} disabled={loading}>
                        <Text style={styles.signInText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Create Account Button */}
                    <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('Register')}>
                        <Ionicons name="person-outline" size={18} color="#1a73e8" style={{ marginRight: 8 }} />
                        <Text style={styles.createText}>Create New Account</Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>
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
        marginBottom: 22,
    },
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
    forgotBtn: {
        alignSelf: 'flex-end',
        marginTop: 10,
        marginBottom: 20,
    },
    forgotText: {
        fontSize: 13,
        color: '#1a73e8',
        fontWeight: '600',
    },
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
