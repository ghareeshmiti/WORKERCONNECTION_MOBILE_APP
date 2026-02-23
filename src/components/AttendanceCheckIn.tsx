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

interface AttendanceCheckInProps {
    establishmentName: string;
    onCheckComplete?: () => void;
}

interface CheckResult {
    status: 'in' | 'out';
    message: string;
    username: string;
}

export const AttendanceCheckIn: React.FC<AttendanceCheckInProps> = ({
    establishmentName,
    onCheckComplete,
}) => {
    const [loading, setLoading] = useState(false);
    const [showNfcModal, setShowNfcModal] = useState(false);
    const [showChoiceModal, setShowChoiceModal] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [pinLoading, setPinLoading] = useState(false);
    const [nfcMessage, setNfcMessage] = useState('');
    const [result, setResult] = useState<CheckResult | null>(null);

    // Listen for NFC progress events from Kotlin
    useEffect(() => {
        const sub = DeviceEventEmitter.addListener('onFido2Progress', (event) => {
            if (event?.step) {
                setNfcMessage(event.step);
            }
        });
        return () => sub.remove();
    }, []);

    const handleCheckInOut = async () => {
        setLoading(true);
        setResult(null);
        setNfcMessage('Hold your FIDO Smart Card against the back of your phone.\nPlace your finger on the card sensor.');
        setShowNfcModal(true);
        try {
            const res = await authenticateUser('', 'toggle', establishmentName);
            setShowNfcModal(false);

            if (res.verified) {
                setResult({
                    status: res.status,
                    message: res.message,
                    username: res.username,
                });
                onCheckComplete?.();
            } else {
                Alert.alert('Authentication Failed', 'Could not verify smart card.');
            }
        } catch (error: any) {
            // Attempt fallback if UID is available from the FIDO2 error
            if (error.userInfo?.uid) {
                try {
                    console.log('Attempting fallback UID check-in...', error.userInfo.uid);
                    const { nfcLogin } = require('../services/FidoService');
                    const res = await nfcLogin(error.userInfo.uid, 'toggle', establishmentName);
                    if (res.verified) {
                        setShowNfcModal(false);
                        setResult({
                            status: res.status,
                            message: res.message,
                            username: res.username,
                        });
                        onCheckComplete?.();
                        return;
                    }
                } catch (fbError) {
                    console.warn('Fallback check-in failed:', fbError);
                }
            }
            setShowNfcModal(false);
            console.error('Attendance Check Error:', error);
            const msg = error.message || 'Smart card authentication failed.';
            const code = error.code || '';

            if (code === 'BiometricFailed' || msg.includes('Fingerprint not matched')) {
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
                Alert.alert('Not Registered', 'No credentials found on this card.');
            } else {
                Alert.alert('Smart Card Error', msg);
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
        setNfcMessage('Hold your FIDO Smart Card against the back of your phone for PIN verification.');
        setShowNfcModal(true);

        try {
            const res = await authenticateUserWithPin('', pin, 'toggle', establishmentName);
            setShowNfcModal(false);
            if (res.verified) {
                setResult({
                    status: res.status,
                    message: res.message,
                    username: res.username,
                });
                onCheckComplete?.();
            } else {
                Alert.alert('Authentication Failed', 'Could not verify with PIN.');
            }
        } catch (error: any) {
            // Attempt fallback if UID is available from the FIDO2 error
            if (error.userInfo?.uid) {
                try {
                    console.log('Attempting fallback UID check-in (PIN)...', error.userInfo.uid);
                    const { nfcLogin } = require('../services/FidoService');
                    const res = await nfcLogin(error.userInfo.uid, 'toggle', establishmentName);
                    if (res.verified) {
                        setShowNfcModal(false);
                        setResult({
                            status: res.status,
                            message: res.message,
                            username: res.username,
                        });
                        onCheckComplete?.();
                        return;
                    }
                } catch (fbError) {
                    console.warn('Fallback check-in failed:', fbError);
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
        handleCheckInOut();
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
    };

    const dismissResult = () => {
        setResult(null);
    };

    return (
        <View style={styles.container}>
            {/* Status Card */}
            <View style={styles.statusCard}>
                <Text style={styles.statusIcon}>
                    {result ? (result.status === 'in' ? '\u2705' : '\uD83D\uDC4B') : '\uD83D\uDCF3'}
                </Text>
                <Text style={styles.statusLabel}>
                    {result ? (result.status === 'in' ? 'CHECKED IN' : 'CHECKED OUT') : 'READY'}
                </Text>
                <Text style={styles.locationText}>{establishmentName}</Text>
            </View>

            {/* Result Display */}
            {result && (
                <View style={[
                    styles.resultCard,
                    result.status === 'in' ? styles.resultCardIn : styles.resultCardOut,
                ]}>
                    <Text style={styles.resultIcon}>
                        {result.status === 'in' ? '\u2705' : '\uD83D\uDC4B'}
                    </Text>
                    <Text style={styles.resultTitle}>
                        {result.status === 'in' ? 'Successfully Checked In' : 'Successfully Checked Out'}
                    </Text>
                    <Text style={styles.resultWorker}>Worker: {result.username}</Text>
                    <Text style={styles.resultTime}>
                        {new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <TouchableOpacity style={styles.dismissButton} onPress={dismissResult}>
                        <Text style={styles.dismissText}>OK</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Check In/Out Button */}
            <TouchableOpacity
                style={[styles.tapButton, loading && styles.buttonDisabled]}
                onPress={handleCheckInOut}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" size="large" />
                ) : (
                    <>
                        <Text style={styles.tapIcon}>{'\uD83D\uDCB3'}</Text>
                        <Text style={styles.tapButtonText}>Tap to Check In / Out</Text>
                        <Text style={styles.tapSubtext}>Hold smart card with finger on sensor</Text>
                    </>
                )}
            </TouchableOpacity>

            {/* NFC Scanning Modal */}
            <Modal
                visible={showNfcModal}
                transparent
                animationType="fade"
                onRequestClose={handleCancel}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.nfcIcon}>{'\uD83D\uDCE1'}</Text>
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
                        <Text style={styles.pinIcon}>{'\uD83D\uDD10'}</Text>
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    statusCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    statusIcon: {
        fontSize: 48,
        marginBottom: 8,
    },
    statusLabel: {
        fontSize: 18,
        fontWeight: '800' as const,
        color: '#16a34a',
        letterSpacing: 2,
    },
    locationText: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 8,
    },
    resultCard: {
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    resultCardIn: {
        backgroundColor: '#dcfce7',
        borderWidth: 1,
        borderColor: '#86efac',
    },
    resultCardOut: {
        backgroundColor: '#fef3c7',
        borderWidth: 1,
        borderColor: '#fcd34d',
    },
    resultIcon: {
        fontSize: 36,
        marginBottom: 8,
    },
    resultTitle: {
        fontSize: 18,
        fontWeight: '700' as const,
        color: '#1a1a1a',
        marginBottom: 4,
    },
    resultWorker: {
        fontSize: 14,
        color: '#475569',
        marginBottom: 2,
    },
    resultTime: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 12,
    },
    dismissButton: {
        backgroundColor: '#16a34a',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 24,
    },
    dismissText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600' as const,
    },
    tapButton: {
        backgroundColor: '#ea580c',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    tapIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    tapButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700' as const,
    },
    tapSubtext: {
        color: '#fed7aa',
        fontSize: 13,
        marginTop: 4,
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
        fontWeight: '700' as const,
        color: '#1a1a1a',
        marginBottom: 8,
    },
    modalText: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center' as const,
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
        fontWeight: '600' as const,
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