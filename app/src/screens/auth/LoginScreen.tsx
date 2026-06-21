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
                        {!loading && (
                            <View style={styles.signInIconBox}>
                                <Ionicons name="arrow-forward" size={16} color="#1565c0" />
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Create Account Button */}
                    <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('Register')}>
                        <Ionicons name="person-outline" size={18} color="#1565c0" style={{ marginRight: 8 }} />
                        <Text style={styles.createText}>Create New Account</Text>
                    </TouchableOpacity>

                    {/* Bottom Features Box */}
                    <View style={styles.featuresBox}>
                        <View style={styles.featureItem}>
                            <View style={styles.featureIconBlue}>
                                <Ionicons name="shield-checkmark" size={16} color="#1565c0" />
                            </View>
                            <Text style={styles.featureTitle}>Safe & Secure</Text>
                            <Text style={styles.featureSub}>Your safety is{'\n'}our priority</Text>
                        </View>

                        <View style={styles.featureDivider} />

                        <View style={styles.featureItem}>
                            <View style={styles.featureIconGreen}>
                                <Ionicons name="people" size={16} color="#2e7d32" />
                            </View>
                            <Text style={styles.featureTitle}>Ride Together</Text>
                            <Text style={styles.featureSub}>Share rides,{'\n'}save money</Text>
                        </View>

                        <View style={styles.featureDivider} />

                        <View style={styles.featureItem}>
                            <View style={styles.featureIconLeaf}>
                                <Ionicons name="leaf" size={16} color="#388e3c" />
                            </View>
                            <Text style={styles.featureTitle}>Eco Friendly</Text>
                            <Text style={styles.featureSub}>Better for you,{'\n'}better for planet</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    formContainer: {
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        height: 56,
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
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#333',
        paddingHorizontal: 16,
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
        marginTop: 12,
        marginBottom: 24,
    },
    forgotText: {
        fontSize: 14,
        color: '#1565c0',
        fontWeight: '600',
    },
    signInBtn: {
        backgroundColor: '#1565c0',
        borderRadius: 12,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    signInText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 10,
    },
    signInIconBox: {
        position: 'absolute',
        right: 12,
        width: 32,
        height: 32,
        backgroundColor: '#fff',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e0e0e0',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#666',
        fontSize: 14,
    },
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1565c0',
        backgroundColor: '#fff',
    },
    createText: {
        color: '#1565c0',
        fontSize: 16,
        fontWeight: 'bold',
    },
    featuresBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 12,
        marginTop: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    featureItem: {
        flex: 1,
        alignItems: 'center',
    },
    featureDivider: {
        width: 1,
        height: '80%',
        backgroundColor: '#f0f0f0',
        alignSelf: 'center',
    },
    featureIconBlue: {
        marginBottom: 8,
    },
    featureIconGreen: {
        marginBottom: 8,
    },
    featureIconLeaf: {
        marginBottom: 8,
    },
    featureTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    featureSub: {
        fontSize: 10,
        color: '#888',
        textAlign: 'center',
        lineHeight: 14,
    },
});
