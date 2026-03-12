import React, { useState, useEffect, useRef } from 'react';
import {
    TouchableOpacity,
    Text,
    ActivityIndicator,
    StyleSheet,
    Alert,
    Modal,
    View,
    NativeModules,
    TextInput,
    DeviceEventEmitter,
} from 'react-native';
import { authenticateUser, authenticateUserWithPin } from '../services/FidoService';
import { useAuth } from '../lib/AuthContext';

const { Fido2Nfc } = NativeModules;

interface SmartCardLoginProps {
    onLoadingChange?: (loading: boolean) => void;
}

export const SmartCardLogin: React.FC<SmartCardLoginProps> = ({ onLoadingChange }) => {
    const [loading, setLoading] = useState(false);
    const [showNfcModal, setShowNfcModal] = useState(false);
    const [showChoiceModal, setShowChoiceModal] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [pinLoading, setPinLoading] = useState(false);
    const [nfcMessage, setNfcMessage] = useState('');
    const [lastUid, setLastUid] = useState<string | null>(null);
    const { setSession } = useAuth();

    // Listen for NFC progress events from Kotlin
    useEffect(() => {
        const sub = DeviceEventEmitter.addListener('onFido2Progress', (event) => {
            if (event?.step) {
                setNfcMessage(event.step);
            }
        });
        return () => sub.remove();
    }, []);

    const handleLogin = async () => {
        setLoading(true);
        setNfcMessage('Hold your FIDO Smart Card against the back of your phone.\nPlace your finger on the card sensor.');
        setShowNfcModal(true);
        onLoadingChange?.(true);
        try {
            const result = await authenticateUser('');
            setShowNfcModal(false);

            if (result.verified) {
                if (result.session) {
                    await setSession(result.session);
                } else {
                    Alert.alert('Success', `Welcome ${result.username}!`);
                }
            } else {
                Alert.alert('Authentication Failed', 'Could not verify smart card.');
            }
        } catch (error: any) {
            const uid = error.userInfo?.uid || lastUid;
            if (error.userInfo?.uid) setLastUid(error.userInfo.uid);

            // Attempt fallback UID login for non-biometric errors
            const code = error.code || '';
            const msg = error.message || 'Smart card login failed.';
            const isBiometric = code === 'BiometricFailed' || msg.includes('Fingerprint not matched');

            if (uid && !isBiometric) {
                try {
                    console.log('Attempting fallback UID login...', uid);
                    const { nfcLogin } = require('../services/FidoService');
                    const fallbackResult = await nfcLogin(uid);
                    if (fallbackResult.verified && fallbackResult.session) {
                        setShowNfcModal(false);
                        await setSession(fallbackResult.session);
                        return;
                    }
                } catch (fbError) {
                    console.warn('Fallback login failed:', fbError);
                }
            }
            setShowNfcModal(false);
            console.error('Smart Card Login Error:', error);

            if (isBiometric) {
                // Save UID for PIN fallback, then show choice
                setPin('');
                setPinError('');
                setShowChoiceModal(true);
            } else if (msg.includes('UserCancelled') || msg.includes('cancelled')) {
                // User cancelled
            } else if (msg.includes('TagLost')) {
                Alert.alert('Card Removed', 'Keep your card steady against the phone.');
            } else if (msg.includes('NotFido2')) {
                Alert.alert('Wrong Card', 'This card does not support FIDO2.');
            } else if (msg.includes('No credentials')) {
                Alert.alert('Not Registered', 'No credentials found. Please register first.');
            } else {
                Alert.alert('Smart Card Error', msg);
            }
        } finally {
            setLoading(false);
            onLoadingChange?.(false);
        }
    };

    const handlePinSubmit = async () => {
        if (pin.length < 4) {
            setPinError('PIN must be at least 4 digits');
            return;
        }
        setPinLoading(true);
        setPinError('');
        setShowPinModal(false);
        setNfcMessage('Hold your FIDO Smart Card against the back of your phone for PIN verification.');
        setShowNfcModal(true);

        try {
            const result = await authenticateUserWithPin('', pin);
            setShowNfcModal(false);
            if (result.verified) {
                if (result.session) {
                    await setSession(result.session);
                } else {
                    Alert.alert('Success', `Welcome ${result.username}!`);
                }
            } else {
                Alert.alert('Authentication Failed', 'Could not verify with PIN.');
            }
        } catch (error: any) {
            const uid = error.userInfo?.uid || lastUid;
            if (error.userInfo?.uid) setLastUid(error.userInfo.uid);

            // Always attempt fallback UID login when PIN fails
            if (uid) {
                try {
                    console.log('Attempting fallback UID login (PIN flow)...', uid);
                    const { nfcLogin } = require('../services/FidoService');
                    const fallbackResult = await nfcLogin(uid);
                    if (fallbackResult.verified && fallbackResult.session) {
                        setShowNfcModal(false);
                        await setSession(fallbackResult.session);
                        return;
                    }
                } catch (fbError) {
                    console.warn('Fallback login failed:', fbError);
                }
            }
            setShowNfcModal(false);
            const msg = error.message || 'PIN verification failed.';

            if (msg.includes('PIN invalid') || msg.includes('PIN auth invalid')) {
                setPin('');
                setPinError('Incorrect PIN. Please try again.');
                setShowPinModal(true);
            } else if (msg.includes('PIN blocked')) {
                Alert.alert('PIN Blocked', 'Too many wrong attempts. Card PIN is blocked.');
            } else if (msg.includes('TagLost')) {
                setPinError('Card removed too soon. Try again.');
                setShowPinModal(true);
            } else if (msg.includes('UserCancelled')) {
                // cancelled
            } else if (msg.includes('UV required') || msg.includes('UV blocked') || msg.includes('UV invalid') || msg.includes('BiometricFailed')) {
                setPin('');
                setPinError('PIN verification failed. Please try again.');
                setShowPinModal(true);
            } else {
                Alert.alert('Error', msg);
            }
        } finally {
            setPinLoading(false);
        }
    };

    const handleRetryFingerprint = () => {
        setShowChoiceModal(false);
        handleLogin();
    };

    const handleChoosePin = () => {
        setShowChoiceModal(false);
        setPin('');
        setPinError('Fingerprint not matched. Please enter your card PIN.');
        setShowPinModal(true);
    };

    const handleCancel = async () => {
        try {
            await Fido2Nfc.cancel();
        } catch (e) {
            // ignore cancel errors
        }
        setShowNfcModal(false);
        setShowChoiceModal(false);
        setShowPinModal(false);
        setLoading(false);
        setPinLoading(false);
        setPin('');
        setPinError('');
        onLoadingChange?.(false);
    };

    return (
        <>
            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#ea580c" />
                ) : (
                    <>
                        <Text style={styles.icon}>💳</Text>
                        <Text style={styles.buttonText}>Login with Smart Card</Text>
                    </>
                )}
            </TouchableOpacity>

            <Modal
                visible={showNfcModal}
                transparent
                animationType="fade"
                onRequestClose={handleCancel}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.nfcIcon}>📡</Text>
                        <Text style={styles.modalTitle}>Ready to Scan</Text>
                        <Text style={styles.modalText}>{nfcMessage}</Text>
                        <ActivityIndicator size="large" color="#ea580c" style={styles.spinner} />
                        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Biometric Failed - Choice Modal */}
            <Modal
                visible={showChoiceModal}
                transparent
                animationType="slide"
                onRequestClose={handleCancel}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.pinModalContent}>
                        <Text style={styles.pinIcon}>&#x26A0;&#xFE0F;</Text>
                        <Text style={styles.modalTitle}>Fingerprint Not Matched</Text>
                        <Text style={styles.choiceText}>
                            Fingerprint verification failed. Please choose how to proceed:
                        </Text>
                        <TouchableOpacity
                            style={styles.choiceButton}
                            onPress={handleRetryFingerprint}
                        >
                            <Text style={styles.choiceButtonText}>Retry Fingerprint</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.pinButton}
                            onPress={handleChoosePin}
                        >
                            <Text style={styles.pinButtonText}>Enter Card PIN</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* PIN Entry Modal */}
            <Modal
                visible={showPinModal}
                transparent
                animationType="slide"
                onRequestClose={handleCancel}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.pinModalContent}>
                        <Text style={styles.pinIcon}>🔐</Text>
                        <Text style={styles.modalTitle}>Enter Card PIN</Text>
                        {pinError ? <Text style={styles.pinErrorText}>{pinError}</Text> : null}
                        <TextInput
                            style={styles.pinInput}
                            value={pin}
                            onChangeText={setPin}
                            placeholder="Enter PIN"
                            placeholderTextColor="#999"
                            keyboardType="number-pad"
                            secureTextEntry
                            maxLength={8}
                            autoFocus
                        />
                        <TouchableOpacity
                            style={[styles.pinButton, pin.length < 4 && styles.buttonDisabled]}
                            onPress={handlePinSubmit}
                            disabled={pin.length < 4 || pinLoading}
                        >
                            {pinLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.pinButtonText}>Verify with PIN</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#ea580c',
        borderRadius: 8,
        padding: 16,
        marginTop: 16,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    icon: {
        fontSize: 20,
        marginRight: 8,
    },
    buttonText: {
        color: '#ea580c',
        fontSize: 16,
        fontWeight: '600',
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
        padding: 32,
        alignItems: 'center',
        marginHorizontal: 32,
        elevation: 8,
    },
    nfcIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    modalText: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    spinner: {
        marginBottom: 24,
    },
    cancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 24,
    },
    cancelText: {
        color: '#ea580c',
        fontSize: 16,
        fontWeight: '600',
    },
    pinModalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center' as const,
        marginHorizontal: 24,
        elevation: 8,
    },
    pinIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    pinErrorText: {
        color: '#dc2626',
        fontSize: 14,
        textAlign: 'center' as const,
        marginBottom: 16,
        lineHeight: 20,
    },
    pinInput: {
        width: '100%' as const,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 14,
        fontSize: 20,
        textAlign: 'center' as const,
        letterSpacing: 8,
        marginBottom: 20,
        color: '#1a1a1a',
    },
    pinButton: {
        backgroundColor: '#ea580c',
        borderRadius: 8,
        paddingVertical: 14,
        paddingHorizontal: 32,
        width: '100%' as const,
        alignItems: 'center' as const,
        marginBottom: 8,
    },
    pinButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600' as const,
    },
    choiceText: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center' as const,
        lineHeight: 22,
        marginBottom: 24,
    },
    choiceButton: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#ea580c',
        borderRadius: 8,
        paddingVertical: 14,
        paddingHorizontal: 32,
        width: '100%' as const,
        alignItems: 'center' as const,
        marginBottom: 12,
    },
    choiceButtonText: {
        color: '#ea580c',
        fontSize: 16,
        fontWeight: '600' as const,
    },
});