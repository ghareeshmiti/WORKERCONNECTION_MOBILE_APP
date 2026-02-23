import React, { useState, useEffect } from 'react';
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

const { Fido2Nfc } = NativeModules;

interface SmartCardVerifyProps {
    /** Called with the worker_id (username) when card is successfully verified */
    onVerified: (username: string) => void;
    /** Called when the user cancels */
    onCancel?: () => void;
    buttonLabel?: string;
    buttonStyle?: object;
    buttonTextStyle?: object;
}

/**
 * Reusable NFC card verification component.
 * Mirrors SmartCardLogin but calls onVerified(username) on success
 * instead of creating a session. Used by ConductorDashboardScreen.
 */
export const SmartCardVerify: React.FC<SmartCardVerifyProps> = ({
    onVerified,
    onCancel,
    buttonLabel = '📲  Scan Smart Card (NFC)',
    buttonStyle,
    buttonTextStyle,
}) => {
    const [loading, setLoading] = useState(false);
    const [showNfcModal, setShowNfcModal] = useState(false);
    const [showChoiceModal, setShowChoiceModal] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [pinLoading, setPinLoading] = useState(false);
    const [nfcMessage, setNfcMessage] = useState('');

    // Listen for NFC progress events from Kotlin
    useEffect(() => {
        const sub = DeviceEventEmitter.addListener('onFido2Progress', (event) => {
            if (event?.step) setNfcMessage(event.step);
        });
        return () => sub.remove();
    }, []);

    const handleScan = async () => {
        setLoading(true);
        setNfcMessage("Hold the citizen's Smart Card against the back of the phone.\nPlace their finger on the card sensor.");
        setShowNfcModal(true);

        try {
            const result = await authenticateUser('');
            setShowNfcModal(false);

            if (result.verified && result.username) {
                onVerified(result.username);
            } else {
                Alert.alert('Verification Failed', 'Could not verify the smart card.');
            }
        } catch (error: any) {
            // Attempt fallback if UID is available from the FIDO2 error
            if (error.userInfo?.uid) {
                try {
                    console.log('Attempting fallback UID login...', error.userInfo.uid);
                    // Use require to avoid circular dependency issues if any, or just import
                    const { nfcLogin } = require('../services/FidoService');
                    const fallbackResult = await nfcLogin(error.userInfo.uid);
                    if (fallbackResult.verified && fallbackResult.username) {
                        setShowNfcModal(false);
                        onVerified(fallbackResult.username);
                        return;
                    }
                } catch (fbError) {
                    console.warn('Fallback login failed:', fbError);
                }
            }
            setShowNfcModal(false);
            const msg = error.message || '';
            const code = error.code || '';

            const isBiometricError =
                code === 'BiometricFailed' ||
                msg.includes('Fingerprint not matched') ||
                msg.includes('Not allowed (UV required)') ||
                msg.includes('UV blocked') ||
                msg.includes('UV invalid') ||
                msg.includes('UV required');

            if (isBiometricError) {
                setPin('');
                setPinError('');
                setShowChoiceModal(true);
            } else if (msg.includes('UserCancelled') || msg.includes('cancelled')) {
                onCancel?.();
            } else if (msg.includes('TagLost')) {
                Alert.alert('Card Removed', 'Keep the card steady against the phone.');
            } else if (msg.includes('NotFido2')) {
                Alert.alert('Wrong Card', 'This card does not support FIDO2.');
            } else if (msg.includes('No credentials')) {
                Alert.alert('Not Registered', 'No credentials found on this card.');
            } else {
                Alert.alert('Scan Error', msg || 'Failed to read smart card. Please try again.');
            }
        } finally {
            setLoading(false);
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
        setNfcMessage("Hold the citizen's Smart Card against the back of the phone for PIN verification.");
        setShowNfcModal(true);

        try {
            const result = await authenticateUserWithPin('', pin);
            setShowNfcModal(false);

            if (result.verified && result.username) {
                onVerified(result.username);
            } else {
                Alert.alert('Verification Failed', 'Could not verify with PIN.');
            }
        } catch (error: any) {
            setShowNfcModal(false);
            const msg = error.message || '';

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

    const handleCancel = async () => {
        try { await Fido2Nfc.cancel(); } catch (_) { }
        setShowNfcModal(false);
        setShowChoiceModal(false);
        setShowPinModal(false);
        setLoading(false);
        setPinLoading(false);
        setPin('');
        setPinError('');
        onCancel?.();
    };

    return (
        <>
            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled, buttonStyle]}
                onPress={handleScan}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={[styles.buttonText, buttonTextStyle]}>{buttonLabel}</Text>
                )}
            </TouchableOpacity>

            {/* NFC Waiting Modal */}
            <Modal visible={showNfcModal} transparent animationType="fade" onRequestClose={handleCancel}>
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

            {/* Biometric Failed — Choice Modal */}
            <Modal visible={showChoiceModal} transparent animationType="slide" onRequestClose={handleCancel}>
                <View style={styles.modalOverlay}>
                    <View style={styles.pinModalContent}>
                        <Text style={styles.pinIcon}>⚠️</Text>
                        <Text style={styles.modalTitle}>Fingerprint Unavailable</Text>
                        <Text style={styles.choiceText}>
                            Fingerprint verification failed or is not available.{'\n'}
                            Please use the card PIN instead.
                        </Text>
                        <TouchableOpacity style={styles.choiceButton} onPress={() => { setShowChoiceModal(false); handleScan(); }}>
                            <Text style={styles.choiceButtonText}>Retry Fingerprint</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.pinButton} onPress={() => { setShowChoiceModal(false); setPin(''); setPinError(''); setShowPinModal(true); }}>
                            <Text style={styles.pinButtonText}>Enter Card PIN</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* PIN Entry Modal */}
            <Modal visible={showPinModal} transparent animationType="slide" onRequestClose={handleCancel}>
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
        backgroundColor: '#ea580c',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        marginHorizontal: 32,
        elevation: 8,
    },
    nfcIcon: { fontSize: 48, marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
    modalText: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    spinner: { marginBottom: 24 },
    cancelButton: { paddingVertical: 10, paddingHorizontal: 24 },
    cancelText: { color: '#ea580c', fontSize: 16, fontWeight: '600' },
    pinModalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        marginHorizontal: 24,
        elevation: 8,
    },
    pinIcon: { fontSize: 48, marginBottom: 16 },
    pinErrorText: { color: '#dc2626', fontSize: 14, textAlign: 'center', marginBottom: 12, lineHeight: 20 },
    pinInput: {
        width: '100%',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 14,
        fontSize: 20,
        textAlign: 'center',
        letterSpacing: 8,
        marginBottom: 20,
        color: '#1a1a1a',
    },
    pinButton: {
        backgroundColor: '#ea580c',
        borderRadius: 8,
        paddingVertical: 14,
        paddingHorizontal: 32,
        width: '100%',
        alignItems: 'center',
        marginBottom: 8,
    },
    pinButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    choiceText: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    choiceButton: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#ea580c',
        borderRadius: 8,
        paddingVertical: 14,
        paddingHorizontal: 32,
        width: '100%',
        alignItems: 'center',
        marginBottom: 12,
    },
    choiceButtonText: { color: '#ea580c', fontSize: 16, fontWeight: '600' },
});
