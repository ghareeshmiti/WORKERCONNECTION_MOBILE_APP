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
    Modal,
    NativeModules,
} from 'react-native';
import { useAuth } from '../lib/AuthContext';


export default function LoginScreen() {
    const [aadhaar, setAadhaar] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'aadhaar' | 'otp'>('aadhaar');
    const [loading, setLoading] = useState(false);
    const [nfcWaiting, setNfcWaiting] = useState(false);
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

    const handleNfcLogin = () => {
        setNfcWaiting(true);
    };

    // NFC Event Listener
    React.useEffect(() => {
        const { DeviceEventEmitter } = require('react-native');

        const nfcListener = DeviceEventEmitter.addListener('onNfcTagDetected', async (event: any) => {
            console.log('NFC Tag Detected:', event);
            setNfcWaiting(false);
            setLoading(true);

            const cardId = event.uidHex || event.tagId || '';
            const apduHex = event.apduHex || '';

            try {
                const res = await fetch(`${BASE_URL}/api/auth/nfc-login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cardId, uidHex: cardId, apduHex }),
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'NFC login failed');
                }

                console.log('NFC Login Successful, setting session...');
                await setSession(data.session);
            } catch (error: any) {
                console.error('NFC Login Error:', error);
                Alert.alert(
                    'Smart Card Detected',
                    `Card UID: ${cardId}\nAPDU: ${apduHex}\n\n${error.message}`,
                    [
                        { text: 'OK', style: 'cancel' },
                    ]
                );
            } finally {
                setLoading(false);
            }
        });

        const nfcErrorListener = DeviceEventEmitter.addListener('onNfcTagError', (event: any) => {
            console.log('NFC Error:', event);
            setNfcWaiting(false);
        });

        return () => {
            nfcListener.remove();
            nfcErrorListener.remove();
        };
    }, []);

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

                {/* NFC Divider */}
                <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* NFC Login Button */}
                <TouchableOpacity
                    style={[styles.nfcButton, (loading || nfcWaiting) && styles.buttonDisabled]}
                    onPress={handleNfcLogin}
                    disabled={loading || nfcWaiting}
                >
                    {nfcWaiting ? (
                        <ActivityIndicator color="#ea580c" />
                    ) : (
                        <>
                            <Text style={styles.nfcIcon}>💳</Text>
                            <Text style={styles.nfcButtonText}>Login with NFC Smart Card</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Secure login powered by FIDO2
                    </Text>
                </View>
            </ScrollView>

            {/* NFC Tap Modal - auto-closes on tag detect */}
            <Modal
                visible={nfcWaiting}
                transparent
                animationType="fade"
                onRequestClose={() => setNfcWaiting(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Tap Your Smart Card</Text>
                        <Text style={styles.modalMessage}>
                            Hold your FIDO Smart Card near the back of your phone to login.
                        </Text>
                        <ActivityIndicator size="large" color="#ea580c" style={{ marginVertical: 16 }} />
                        <TouchableOpacity
                            style={styles.modalCancelButton}
                            onPress={() => setNfcWaiting(false)}
                        >
                            <Text style={styles.modalCancelText}>CANCEL</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e2e8f0',
    },
    dividerText: {
        marginHorizontal: 12,
        fontSize: 13,
        fontWeight: '600',
        color: '#94a3b8',
    },
    nfcButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#ea580c',
        borderRadius: 8,
        padding: 16,
    },
    nfcIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    nfcButtonText: {
        color: '#ea580c',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        marginTop: 32,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#94a3b8',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '80%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 8,
    },
    modalMessage: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
    },
    modalCancelButton: {
        paddingVertical: 8,
        paddingHorizontal: 24,
    },
    modalCancelText: {
        color: '#ea580c',
        fontSize: 14,
        fontWeight: '600',
    },
});
