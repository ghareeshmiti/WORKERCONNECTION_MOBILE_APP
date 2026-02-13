import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface DigitalCardProps {
    visible: boolean;
    onClose: () => void;
    workerData: {
        worker_id: string;
        first_name: string;
        last_name: string;
        aadhaar_last_four?: string;
        phone?: string;
    };
}

export default function DigitalCard({ visible, onClose, workerData }: DigitalCardProps) {
    const qrValue = `https://workerconnect.miti.us/public/worker?workerid=${workerData.aadhaar_last_four || workerData.worker_id}`;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Digital Worker Card</Text>
                        <Text style={styles.subtitle}>One State - One Card</Text>
                    </View>

                    {/* Worker Info */}
                    <View style={styles.infoSection}>
                        <Text style={styles.name}>
                            {workerData.first_name} {workerData.last_name}
                        </Text>
                        <Text style={styles.workerId}>ID: {workerData.worker_id}</Text>
                        {workerData.phone && (
                            <Text style={styles.phone}>📱 {workerData.phone}</Text>
                        )}
                    </View>

                    {/* QR Code */}
                    <View style={styles.qrContainer}>
                        <QRCode
                            value={qrValue}
                            size={200}
                            backgroundColor="white"
                            color="black"
                        />
                    </View>

                    <Text style={styles.instruction}>
                        Scan this QR code to verify worker identity
                    </Text>

                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ea580c',
    },
    subtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
    },
    infoSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    workerId: {
        fontSize: 14,
        color: '#64748b',
        fontFamily: 'monospace',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 8,
    },
    phone: {
        fontSize: 14,
        color: '#475569',
    },
    qrContainer: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        marginBottom: 16,
    },
    instruction: {
        textAlign: 'center',
        fontSize: 12,
        color: '#64748b',
        marginBottom: 20,
    },
    closeButton: {
        backgroundColor: '#ea580c',
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
