import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useAuth } from '../lib/AuthContext';


export default function LoginScreen() {
    const [aadhaar, setAadhaar] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'aadhaar' | 'otp'>('aadhaar');
    const [loading, setLoading] = useState(false);
    const { setSession } = useAuth();
    const BASE_URL = 'https://workerconnection-backend.vercel.app';

    const handleSendOTP = async () => {
        if (aadhaar.length !== 12) {
            Alert.alert('Error', 'Please enter a valid 12-digit Aadhaar number');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/api/auth/worker-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ aadhaar })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send OTP');
            }

            Alert.alert('Success', 'OTP sent to your registered mobile number.');
            setStep('otp');
        } catch (error: any) {
            console.error('Send OTP Error:', error);
            Alert.alert('Error', error.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (otp.length !== 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/api/auth/worker-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ aadhaar, otp })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            console.log('Login Successful, setting session...');
            await setSession(data.session);

            // Session set successfully, navigation will handle the rest via AuthContext
        } catch (error: any) {
            console.error('Verify OTP Error:', error);
            Alert.alert('Login Failed', error.message || 'Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    {/* Placeholder logo - replace with actual image later */}
                    <View style={styles.logoPlaceholder}>
                        <Text style={styles.logoText}>AP</Text>
                    </View>
                    <Text style={styles.title}>One State - One Card</Text>
                    <Text style={styles.subtitle}>Government of Andhra Pradesh</Text>
                </View>

                {/* Login Form */}
                <View style={styles.formContainer}>
                    {step === 'aadhaar' ? (
                        <>
                            <Text style={styles.label}>Enter Aadhaar Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="XXXX XXXX XXXX"
                                keyboardType="number-pad"
                                maxLength={12}
                                value={aadhaar}
                                onChangeText={setAadhaar}
                                editable={!loading}
                            />

                            <TouchableOpacity
                                style={[styles.button, loading && styles.buttonDisabled]}
                                onPress={handleSendOTP}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Send OTP</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.label}>Enter OTP</Text>
                            <Text style={styles.hint}>
                                OTP sent to Aadhaar-linked mobile number
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="XXXXXX"
                                keyboardType="number-pad"
                                maxLength={6}
                                value={otp}
                                onChangeText={setOtp}
                                editable={!loading}
                            />

                            <TouchableOpacity
                                style={[styles.button, loading && styles.buttonDisabled]}
                                onPress={handleVerifyOTP}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Verify & Login</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => setStep('aadhaar')}
                                disabled={loading}
                            >
                                <Text style={styles.backButtonText}>← Back to Aadhaar</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Secure login powered by FIDO2
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ea580c',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ea580c',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 8,
    },
    hint: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        marginBottom: 16,
        backgroundColor: '#f8fafc',
    },
    button: {
        backgroundColor: '#ea580c',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    backButton: {
        marginTop: 16,
        alignItems: 'center',
    },
    backButtonText: {
        color: '#ea580c',
        fontSize: 14,
        fontWeight: '500',
    },
    footer: {
        marginTop: 32,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#94a3b8',
    },
});
