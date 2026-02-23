import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    Alert,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE = 'https://workerconnection-backend.vercel.app';

const SPECIALIZATION_ICONS: Record<string, string> = {
    'General Medicine': '\u{1FA7A}',
    'Cardiology': '\u{2764}\u{FE0F}',
    'Neurology': '\u{1F9E0}',
    'Dental': '\u{1F9B7}',
    'Dermatology': '\u{1F9D1}\u200D\u{2695}\u{FE0F}',
    'Gynecology': '\u{1F469}\u200D\u{2695}\u{FE0F}',
};

const SPECIALIZATION_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    'General Medicine': { bg: '#f0fdf4', border: '#86efac', text: '#16a34a' },
    'Cardiology': { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626' },
    'Neurology': { bg: '#f5f3ff', border: '#c4b5fd', text: '#7c3aed' },
    'Dental': { bg: '#ecfeff', border: '#67e8f9', text: '#0891b2' },
    'Dermatology': { bg: '#fff7ed', border: '#fdba74', text: '#ea580c' },
    'Gynecology': { bg: '#fdf2f8', border: '#f9a8d4', text: '#db2777' },
};

function calculateAge(dateOfBirth: string | null | undefined): string {
    if (!dateOfBirth) return '';
    const dob = new Date(dateOfBirth);
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970).toString();
}

export default function DoctorSelectionScreen({ route, navigation }: any) {
    const { selectedMember, family, scannedWorker, establishmentId } = route.params;
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
    const [visitNotes, setVisitNotes] = useState('');
    const [patientWeight, setPatientWeight] = useState('');
    const [patientTemp, setPatientTemp] = useState('');
    const [successData, setSuccessData] = useState<any>(null);

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            const url = establishmentId
                ? `${API_BASE}/api/doctors?establishment_id=${establishmentId}`
                : `${API_BASE}/api/doctors`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setDoctors(data.doctors || data || []);
        } catch (err: any) {
            console.error('Error fetching doctors:', err);
            Alert.alert('Error', 'Failed to load doctors. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToQueue = async () => {
        if (!selectedDoctor) {
            Alert.alert('Select Doctor', 'Please select a doctor first.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/queue/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doctor_id: selectedDoctor.id,
                    family_member_id: selectedMember.id,
                    family_id: family.id,
                    establishment_id: establishmentId || selectedDoctor.establishment_id,
                    notes: visitNotes || undefined,
                    vitals: (patientWeight || patientTemp) ? {
                        ...(patientWeight ? { weight: patientWeight + ' kg' } : {}),
                        ...(patientTemp ? { temperature: patientTemp + ' °F' } : {}),
                    } : undefined,
                }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setSuccessData({
                tokenNumber: data.queueEntry?.token_number || data.token_number || '?',
                doctorName: selectedDoctor.name,
                specialization: selectedDoctor.specialization,
                patientName: selectedMember.name,
            });
        } catch (err: any) {
            console.error('Error adding to queue:', err);
            Alert.alert('Error', err.message || 'Failed to add to queue.');
        } finally {
            setSubmitting(false);
        }
    };

    // Success view
    if (successData) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar backgroundColor="#16a34a" barStyle="light-content" />
                <View style={styles.successContainer}>
                    <View style={styles.successIcon}>
                        <Text style={{ fontSize: 48 }}>{'\u2705'}</Text>
                    </View>
                    <Text style={styles.successTitle}>Added to Queue!</Text>

                    <View style={styles.tokenCard}>
                        <Text style={styles.tokenLabel}>TOKEN NUMBER</Text>
                        <Text style={styles.tokenNumber}>{successData.tokenNumber}</Text>
                    </View>

                    <View style={styles.successDetails}>
                        <View style={styles.successRow}>
                            <Text style={styles.successDetailLabel}>Patient</Text>
                            <Text style={styles.successDetailValue}>{successData.patientName}</Text>
                        </View>
                        <View style={styles.successRow}>
                            <Text style={styles.successDetailLabel}>Doctor</Text>
                            <Text style={styles.successDetailValue}>{successData.doctorName}</Text>
                        </View>
                        <View style={styles.successRow}>
                            <Text style={styles.successDetailLabel}>Department</Text>
                            <Text style={styles.successDetailValue}>{successData.specialization}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.newScanButton}
                        onPress={() => navigation.replace('HealthScan')}
                    >
                        <Text style={styles.newScanButtonText}>{'\u{1F4E1}'}  Scan Next Card</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Confirm view (doctor selected)
    if (selectedDoctor) {
        const age = calculateAge(selectedMember.date_of_birth);
        const colors = SPECIALIZATION_COLORS[selectedDoctor.specialization] || SPECIALIZATION_COLORS['General Medicine'];

        return (
            <SafeAreaView style={styles.container}>
                <StatusBar backgroundColor="#f97316" barStyle="light-content" />
                <View style={styles.confirmHeader}>
                    <Text style={styles.confirmHeaderTitle}>Confirm Queue Entry</Text>
                    <Text style={styles.confirmHeaderSubtitle}>Review details before adding to queue</Text>
                </View>

                <ScrollView contentContainerStyle={styles.confirmContent}>
                    {/* Patient Info */}
                    <View style={styles.confirmSection}>
                        <Text style={styles.confirmSectionLabel}>PATIENT</Text>
                        <View style={styles.confirmCard}>
                            <Text style={styles.confirmName}>{selectedMember.name}</Text>
                            <Text style={styles.confirmDetail}>
                                {selectedMember.relation} {'\u2022'} {age} Yrs {'\u2022'} {selectedMember.gender || ''}
                            </Text>
                            {selectedMember.blood_group && (
                                <Text style={styles.confirmDetail}>Blood Group: {selectedMember.blood_group}</Text>
                            )}
                            {selectedMember.chronic_conditions && (
                                <Text style={[styles.confirmDetail, { color: '#ef4444' }]}>
                                    {'\u26A1'} {selectedMember.chronic_conditions}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Doctor Info */}
                    <View style={styles.confirmSection}>
                        <Text style={styles.confirmSectionLabel}>DOCTOR</Text>
                        <View style={[styles.confirmCard, { borderLeftWidth: 4, borderLeftColor: colors.text }]}>
                            <Text style={styles.confirmName}>{selectedDoctor.name}</Text>
                            <Text style={[styles.confirmDetail, { color: colors.text }]}>
                                {SPECIALIZATION_ICONS[selectedDoctor.specialization] || '\u{1FA7A}'} {selectedDoctor.specialization}
                            </Text>
                            {selectedDoctor.queue_count > 0 && (
                                <Text style={styles.confirmDetail}>
                                    Current queue: {selectedDoctor.queue_count} patients
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Intake Vitals */}
                    <View style={styles.confirmSection}>
                        <Text style={styles.confirmSectionLabel}>INTAKE VITALS (OPTIONAL)</Text>
                        <View style={styles.vitalsRow}>
                            <View style={styles.vitalInputWrap}>
                                <Text style={styles.vitalLabel}>Weight</Text>
                                <View style={styles.vitalInputContainer}>
                                    <TextInput
                                        style={styles.vitalInput}
                                        placeholder="e.g. 65"
                                        value={patientWeight}
                                        onChangeText={setPatientWeight}
                                        keyboardType="decimal-pad"
                                        maxLength={6}
                                    />
                                    <Text style={styles.vitalUnit}>kg</Text>
                                </View>
                            </View>
                            <View style={styles.vitalInputWrap}>
                                <Text style={styles.vitalLabel}>Temperature</Text>
                                <View style={styles.vitalInputContainer}>
                                    <TextInput
                                        style={styles.vitalInput}
                                        placeholder="e.g. 98.6"
                                        value={patientTemp}
                                        onChangeText={setPatientTemp}
                                        keyboardType="decimal-pad"
                                        maxLength={6}
                                    />
                                    <Text style={styles.vitalUnit}>°F</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Visit Notes */}
                    <View style={styles.confirmSection}>
                        <Text style={styles.confirmSectionLabel}>REASON FOR VISIT (OPTIONAL)</Text>
                        <TextInput
                            style={styles.notesInput}
                            placeholder="e.g. Fever, headache, follow-up..."
                            value={visitNotes}
                            onChangeText={setVisitNotes}
                            multiline
                            numberOfLines={3}
                        />
                    </View>
                </ScrollView>

                <View style={styles.confirmFooter}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => setSelectedDoctor(null)}
                    >
                        <Text style={styles.backButtonText}>{'\u2190'} Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.addQueueButton, submitting && { opacity: 0.6 }]}
                        onPress={handleAddToQueue}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.addQueueButtonText}>Add to Queue</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Doctor list view
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#f97316" barStyle="light-content" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Select Doctor</Text>
                <Text style={styles.headerSubtitle}>
                    Patient: {selectedMember.name} ({selectedMember.relation})
                </Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ea580c" />
                    <Text style={styles.loadingText}>Loading doctors...</Text>
                </View>
            ) : doctors.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <Text style={{ fontSize: 48 }}>{'\u{1F3E5}'}</Text>
                    <Text style={styles.emptyText}>No doctors available</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchDoctors}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.listContent}>
                    <Text style={styles.listLabel}>AVAILABLE DOCTORS</Text>
                    {doctors.map((doctor: any) => {
                        const colors = SPECIALIZATION_COLORS[doctor.specialization] || SPECIALIZATION_COLORS['General Medicine'];
                        const icon = SPECIALIZATION_ICONS[doctor.specialization] || '\u{1FA7A}';

                        return (
                            <TouchableOpacity
                                key={doctor.id}
                                style={[styles.doctorCard, { borderLeftWidth: 4, borderLeftColor: colors.text }]}
                                onPress={() => setSelectedDoctor(doctor)}
                            >
                                <View style={styles.doctorCardContent}>
                                    <View style={[styles.doctorIconCircle, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                                        <Text style={{ fontSize: 24 }}>{icon}</Text>
                                    </View>
                                    <View style={styles.doctorInfo}>
                                        <Text style={styles.doctorName}>{doctor.name}</Text>
                                        <Text style={[styles.doctorSpec, { color: colors.text }]}>{doctor.specialization}</Text>
                                        {doctor.qualification && (
                                            <Text style={styles.doctorQual}>{doctor.qualification}</Text>
                                        )}
                                    </View>
                                    <View style={styles.queueBadge}>
                                        <Text style={styles.queueCount}>{doctor.queue_count || 0}</Text>
                                        <Text style={styles.queueLabel}>in queue</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}

            <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.replace('FamilySelection', {
                    family,
                    familyMembers: route.params.familyMembers || [],
                    scannedWorker,
                    establishmentId,
                })}
            >
                <Text style={styles.cancelText}>{'\u2190'} Back to Family</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        backgroundColor: '#f97316',
        paddingVertical: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748b',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        color: '#64748b',
        fontWeight: '600',
    },
    retryButton: {
        marginTop: 16,
        backgroundColor: '#ea580c',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    listLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94a3b8',
        marginBottom: 16,
        letterSpacing: 1,
    },
    doctorCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    doctorCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    doctorIconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        borderWidth: 1,
    },
    doctorInfo: {
        flex: 1,
    },
    doctorName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 2,
    },
    doctorSpec: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 2,
    },
    doctorQual: {
        fontSize: 11,
        color: '#94a3b8',
    },
    queueBadge: {
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    queueCount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    queueLabel: {
        fontSize: 10,
        color: '#64748b',
    },
    cancelButton: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        alignItems: 'center',
        elevation: 4,
    },
    cancelText: {
        color: '#64748b',
        fontWeight: '600',
    },
    // Confirm view styles
    confirmHeader: {
        backgroundColor: '#f97316',
        paddingVertical: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        alignItems: 'center',
        elevation: 4,
    },
    confirmHeaderTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    confirmHeaderSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
    },
    confirmContent: {
        padding: 20,
        paddingBottom: 100,
    },
    confirmSection: {
        marginBottom: 20,
    },
    confirmSectionLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94a3b8',
        marginBottom: 8,
        letterSpacing: 1,
    },
    confirmCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    confirmName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    confirmDetail: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 2,
    },
    vitalsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    vitalInputWrap: {
        flex: 1,
    },
    vitalLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#94a3b8',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    vitalInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingRight: 12,
    },
    vitalInput: {
        flex: 1,
        padding: 14,
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    vitalUnit: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94a3b8',
    },
    notesInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 16,
        fontSize: 14,
        color: '#1e293b',
        textAlignVertical: 'top',
        minHeight: 80,
    },
    confirmFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        elevation: 8,
    },
    backButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        alignItems: 'center',
        marginRight: 12,
    },
    backButtonText: {
        color: '#64748b',
        fontWeight: '600',
        fontSize: 15,
    },
    addQueueButton: {
        flex: 2,
        backgroundColor: '#16a34a',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
    },
    addQueueButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Success view styles
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#f0fdf4',
    },
    successIcon: {
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#16a34a',
        marginBottom: 24,
    },
    tokenCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        marginBottom: 24,
        elevation: 4,
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        borderWidth: 2,
        borderColor: '#86efac',
        width: '70%',
    },
    tokenLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748b',
        letterSpacing: 2,
        marginBottom: 8,
    },
    tokenNumber: {
        fontSize: 64,
        fontWeight: 'bold',
        color: '#16a34a',
    },
    successDetails: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        marginBottom: 32,
        elevation: 1,
    },
    successRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    successDetailLabel: {
        fontSize: 14,
        color: '#64748b',
    },
    successDetailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    newScanButton: {
        backgroundColor: '#ea580c',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        elevation: 4,
        width: '100%',
        alignItems: 'center',
    },
    newScanButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
