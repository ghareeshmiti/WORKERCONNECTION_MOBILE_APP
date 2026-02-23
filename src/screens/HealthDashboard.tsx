import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    FlatList,
    SafeAreaView,
    StatusBar,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useAuth } from '../lib/AuthContext';

const API_BASE = 'https://workerconnection-backend.vercel.app';

// Mock Data matching screenshots
const PATIENT_PROFILE = {
    address: '42, MG Road, Sector 15, Gurugram, Haryana - 122001',
    phone: '+91 98765 43210',
    email: 'rajesh.kumar@email.com',
    emergency: '+91 91234 56789',
};

const PATIENT = {
    name: 'Rajesh Kumar',
    phr: 'PHR-2024-00847',
    bloodGroup: 'B+',
    allergies: 'Penicillin, Dust',
    conditions: 'Type 2 Diabetes, Hypertension',
};

const APPOINTMENTS = [
    {
        id: '1',
        doctor: 'Dr. Priya Sharma',
        specialty: 'General Medicine',
        date: '2025-02-20',
        time: '10:30 AM',
        status: 'Scheduled',
        note: 'Follow-up for blood sugar levels',
    },
    {
        id: '2',
        doctor: 'Dr. Vikram Singh',
        specialty: 'Endocrinology',
        date: '2025-03-05',
        time: '9:00 AM',
        status: 'Scheduled',
        note: 'HbA1c review and medication adjustment',
    },
    {
        id: '3',
        doctor: 'Dr. Anil Mehta',
        specialty: 'Cardiology',
        date: '2025-02-14',
        time: '2:00 PM',
        status: 'Completed',
        note: 'Annual heart checkup, ECG normal',
    },
    {
        id: '4',
        doctor: 'Dr. Sunita Rao',
        specialty: 'Ophthalmology',
        date: '2025-01-28',
        time: '11:00 AM',
        status: 'Completed',
        note: 'Routine eye exam, minor prescription update',
    },
];

const PRESCRIPTIONS = [
    {
        id: '1',
        condition: 'Type 2 Diabetes Mellitus',
        doctor: 'Dr. Vikram Singh',
        hospital: 'Fortis Hospital, Gurugram',
        date: '2024-12-15',
        status: 'Current',
        medicines: [
            { name: 'Metformin 1000mg', dosage: '1 - 0 - 1', duration: '30 days', instructions: 'After food' },
            { name: 'Glimepiride 2mg', dosage: '1 - 0 - 0', duration: '30 days', instructions: 'Before breakfast' },
        ],
        note: 'Review HbA1c after 3 months',
    },
    {
        id: '2',
        condition: 'Hypertension',
        doctor: 'Dr. Anil Mehta',
        hospital: 'Max Hospital, Delhi',
        date: '2025-02-14',
        status: 'Current',
        medicines: [
            { name: 'Telmisartan 40mg', dosage: '1 - 0 - 0', duration: '30 days', instructions: 'Before food' },
            { name: 'Atorvastatin 10mg', dosage: '0 - 0 - 1', duration: '30 days', instructions: 'After dinner' },
        ],
        note: 'BP monitoring weekly',
    },
];

const SERVICE_RECORDS = [
    {
        id: '1',
        service: 'Cardiology consultation with ECG',
        condition: 'Hypertension',
        date: '2025-02-14',
        type: 'Consultation',
        amount: '1500',
        status: 'Paid',
        icon: '🩺',
    },
    {
        id: '2',
        service: 'Complete lipid profile test',
        condition: 'Hyperlipidemia',
        date: '2025-02-14',
        type: 'Laboratory',
        amount: '850',
        status: 'Paid',
        icon: '🧪',
    },
    {
        id: '3',
        service: 'Ophthalmology checkup',
        condition: 'Myopia',
        date: '2025-01-28',
        type: 'Consultation',
        amount: '800',
        status: 'Paid',
        icon: '🩺',
    },
    {
        id: '4',
        service: 'Antibiotics & fever medication',
        condition: 'Upper Respiratory Infection',
        date: '2025-01-10',
        type: 'Pharmacy',
        amount: '320',
        status: 'Paid',
        icon: '💊',
    },
];

type Tab = 'Home' | 'Appts' | 'Rx' | 'Records' | 'Services' | 'Profile';

export default function HealthDashboard({ route, navigation }: any) {
    const { signOut } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('Home');
    const [prescriptions, setPrescriptions] = useState(PRESCRIPTIONS);
    const [loadingRx, setLoadingRx] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [newRx, setNewRx] = useState({
        condition: '',
        medicine: '',
        dosage: '',
        duration: '',
        instructions: ''
    });

    // Fetch real prescriptions if family_member_id is available
    const paramsPatientForEffect = route?.params?.patient;
    const familyMemberId = paramsPatientForEffect?.id;
    const isFamilyMember = paramsPatientForEffect?.name && !paramsPatientForEffect?.first_name;

    useEffect(() => {
        if (isFamilyMember && familyMemberId) {
            fetchRealPrescriptions(familyMemberId);
        }
    }, [familyMemberId]);

    const fetchRealPrescriptions = async (memberId: string) => {
        setLoadingRx(true);
        try {
            const res = await fetch(`${API_BASE}/api/prescriptions/patient/${memberId}`);
            const data = await res.json();
            if (data.prescriptions && data.prescriptions.length > 0) {
                const mapped = data.prescriptions.map((rx: any) => ({
                    id: rx.id,
                    condition: rx.diagnosis || 'General Consultation',
                    doctor: rx.doctor_name || 'Doctor',
                    hospital: 'Guntur General Hospital',
                    date: rx.created_at ? rx.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
                    status: 'Current',
                    medicines: (rx.medicines || []).map((med: any) => ({
                        name: med.name || med.medicine,
                        dosage: med.dosage || '',
                        duration: med.duration || '',
                        instructions: med.instructions || '',
                    })),
                    note: rx.advice || rx.tests_recommended || '',
                }));
                setPrescriptions(mapped);
            }
        } catch (err) {
            console.warn('Failed to fetch prescriptions, using defaults:', err);
        } finally {
            setLoadingRx(false);
        }
    };

    const handleAddPrescription = () => {
        if (!newRx.condition || !newRx.medicine || !newRx.dosage) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        const newPrescriptionObj = {
            id: Date.now().toString(),
            condition: newRx.condition,
            doctor: 'Dr. Health Emp', // Logged in user ideally
            hospital: 'Guntur General Hospital',
            date: new Date().toISOString().split('T')[0],
            status: 'Current',
            medicines: [
                {
                    name: newRx.medicine,
                    dosage: newRx.dosage,
                    duration: newRx.duration || '5 days',
                    instructions: newRx.instructions || 'After food'
                }
            ],
            note: 'Newly prescribed'
        };

        setPrescriptions([newPrescriptionObj, ...prescriptions]);
        setModalVisible(false);
        setNewRx({ condition: '', medicine: '', dosage: '', duration: '', instructions: '' });
        Alert.alert('Success', 'Prescription added successfully');
    };

    // Get patient from navigation params, or fallback to mock
    const paramsPatient = route?.params?.patient;

    // Calculate age if DOB exists
    let age = '42';
    if (paramsPatient?.date_of_birth) {
        const dob = new Date(paramsPatient.date_of_birth);
        const diff = Date.now() - dob.getTime();
        const ageDate = new Date(diff);
        age = Math.abs(ageDate.getUTCFullYear() - 1970).toString();
    }

    // Handle both worker objects (first_name + last_name) and family_member objects (name)
    const patientName = paramsPatient?.name
        ? paramsPatient.name
        : paramsPatient
            ? `${paramsPatient.first_name} ${paramsPatient.last_name}`
            : PATIENT.name;

    const patientData = {
        name: patientName,
        phr: paramsPatient?.worker_id || paramsPatient?.id?.slice(-8) || PATIENT.phr,
        bloodGroup: paramsPatient?.blood_group || PATIENT.bloodGroup,
        allergies: paramsPatient?.allergies || PATIENT.allergies,
        conditions: paramsPatient?.chronic_conditions || PATIENT.conditions,
        age: age,
        gender: paramsPatient?.gender || 'Male',
    };

    const renderHeader = () => (
        <View style={styles.topHeader}>
            <View style={styles.headerLeft}>
                <Image
                    source={require('../assets/ap-logo.png')}
                    style={styles.apLogo}
                    resizeMode="contain"
                />
                <View style={styles.headerTextContainer}>
                    <Text style={styles.hospitalName} numberOfLines={1}>Guntur General Hospital</Text>
                    <Text style={styles.deptName}>AP HEALTH DEPARTMENT</Text>
                </View>
            </View>
            <View style={styles.headerRight}>
                {/* New Scan Button */}
                <TouchableOpacity
                    style={styles.newScanHeaderBtn}
                    onPress={() => navigation.replace('HealthScan')}
                >
                    <Text style={styles.newScanHeaderIcon}>⛶</Text>
                    <Text style={styles.newScanHeaderText}>New Scan</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderPatientCard = () => (
        <View style={styles.patientCard}>
            <View style={styles.patientHeader}>
                <View>
                    <Text style={styles.patientName}>{patientData.name || PATIENT.name}</Text>
                    <Text style={styles.patientPhr}>{patientData.phr || PATIENT.phr}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>
                        {patientData.age} Yrs • {patientData.gender}
                    </Text>
                </View>
                <View style={styles.bloodTypeBadge}>
                    <Text style={styles.bloodTypeText}>{patientData.bloodGroup || PATIENT.bloodGroup}</Text>
                </View>
            </View>
            <View style={styles.patientDetailsRow}>
                <View style={[styles.detailBox, { marginRight: 12 }]}>
                    <Text style={styles.detailLabel}>⚠ Allergies</Text>
                    <Text style={styles.detailValue}>{patientData.allergies || PATIENT.allergies}</Text>
                </View>
                <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>⚡ Conditions</Text>
                    <Text style={styles.detailValue}>{patientData.conditions || PATIENT.conditions}</Text>
                </View>
            </View>
        </View>
    );

    const renderActionButtons = () => (
        <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionIcon}>📅</Text>
                <Text style={styles.actionText}>Record Service</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.replace('HealthScan')}
            >
                <Text style={styles.actionIcon}>⛶</Text>
                <Text style={styles.actionText}>New Scan</Text>
            </TouchableOpacity>
        </View>
    );

    const renderAppointments = (limit?: number) => {
        const data = limit ? APPOINTMENTS.slice(0, limit) : APPOINTMENTS;
        return (
            <View style={styles.section}>
                <View style={styles.rowBetween}>
                    <Text style={styles.sectionTitle}>
                        {limit ? 'Upcoming Appointments' : 'Appointments'}
                    </Text>
                    {/* Add Logout here since we removed it from header */}
                    {limit && (
                        <TouchableOpacity onPress={signOut} style={styles.miniLogout}>
                            <Text style={styles.miniLogoutText}>Log Out</Text>
                        </TouchableOpacity>
                    )}
                </View>
                {data.map((appt) => (
                    <View key={appt.id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View>
                                <Text style={styles.doctorName}>{appt.doctor}</Text>
                                <Text style={styles.specialty}>{appt.specialty}</Text>
                            </View>
                            <View style={[
                                styles.statusBadge,
                                appt.status === 'Completed' ? styles.statusCompleted : styles.statusScheduled
                            ]}>
                                <Text style={[
                                    styles.statusText,
                                    appt.status === 'Completed' ? styles.textCompleted : styles.textScheduled
                                ]}>{appt.status}</Text>
                            </View>
                        </View>
                        <View style={styles.dateTimeRow}>
                            <Text style={styles.dateTime}>📅 {appt.date}</Text>
                            <Text style={styles.dateTime}>🕒 {appt.time}</Text>
                        </View>
                        {appt.note && (
                            <Text style={styles.note}>{appt.note}</Text>
                        )}
                    </View>
                ))}
            </View>
        );
    };

    const renderPrescriptions = () => (
        <View style={styles.section}>
            <View style={styles.rowBetween}>
                <Text style={styles.rowTitle}>📋 E-Prescriptions for {patientData.name}</Text>
                <TouchableOpacity
                    style={styles.addRxButton}
                    onPress={() => setModalVisible(true)}
                >
                    <Text style={styles.addRxButtonText}>+ Add Rx</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.subHeader}>CURRENT PRESCRIPTIONS</Text>

            {prescriptions.map((rx) => (
                <View key={rx.id} style={styles.rxCard}>
                    <View style={styles.rxHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.conditionTitle}>{rx.condition}</Text>
                            <Text style={styles.doctorInfo}>{rx.doctor} • {rx.hospital}</Text>
                        </View>
                        <View style={styles.currentBadge}>
                            <Text style={styles.currentText}>{rx.status}</Text>
                        </View>
                    </View>
                    <Text style={styles.dateRight}>{rx.date}</Text>

                    <View style={styles.tableHeader}>
                        <Text style={[styles.col, { flex: 2 }]}>Medicine</Text>
                        <Text style={[styles.col, { flex: 1 }]}>Dosage</Text>
                        <Text style={[styles.col, { flex: 1 }]}>Duration</Text>
                        <Text style={[styles.col, { flex: 1.5 }]}>Instructions</Text>
                    </View>

                    {rx.medicines.map((med, idx) => (
                        <View key={idx} style={styles.tableRow}>
                            <Text style={[styles.tableCell, { flex: 2, fontWeight: '600' }]}>{med.name}</Text>
                            <Text style={[styles.tableCell, { flex: 1, color: '#f97316', fontWeight: 'bold' }]}>{med.dosage}</Text>
                            <Text style={[styles.tableCell, { flex: 1 }]}>{med.duration}</Text>
                            <Text style={[styles.tableCell, { flex: 1.5 }]}>{med.instructions}</Text>
                        </View>
                    ))}

                    <View style={styles.noteBox}>
                        <Text style={styles.noteText}>Note: {rx.note}</Text>
                    </View>
                </View>
            ))}
        </View>
    );

    const renderServiceRecords = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Records</Text>
            {SERVICE_RECORDS.map((svc) => (
                <View key={svc.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.serviceIconBox}>
                            <Text style={{ fontSize: 20 }}>{svc.icon}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.doctorName}>{svc.service}</Text>
                            <Text style={styles.specialty}>{svc.condition}</Text>
                            <Text style={styles.dateText}>{svc.date} • {svc.type}</Text>
                        </View>
                    </View>
                    <View style={styles.rowBetween}>
                        <Text style={styles.amount}>₹{svc.amount}</Text>
                        <View style={styles.paidBadge}>
                            <Text style={styles.paidText}>{svc.status}</Text>
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );

    const renderHealthRecords = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health Records</Text>
            {APPOINTMENTS.map((appt) => (
                <View key={appt.id} style={styles.accordianCard}>
                    <View style={styles.rowBetween}>
                        <View>
                            <Text style={styles.doctorName}>{appt.doctor}</Text>
                            <Text style={styles.specialty}>{appt.specialty}</Text>
                            <Text style={styles.dateText}>{appt.date}</Text>
                        </View>
                        <Text>⌄</Text>
                    </View>
                </View>
            ))}
        </View>
    );

    const renderProfile = () => (
        <View style={styles.profileContainer}>
            <View style={styles.profileHeaderBand}>
                <Text style={styles.profileHeaderTitle}>Patient Health Records</Text>
            </View>

            <View style={styles.profileContent}>
                {/* Avatar Section */}
                <View style={styles.profileAvatarSection}>
                    <View style={styles.profileAvatarCircle}>
                        <Text style={styles.profileAvatarIcon}>👤</Text>
                    </View>
                    <Text style={styles.profileName}>{patientData.name}</Text>
                    <Text style={styles.profilePhr}>{patientData.phr}</Text>
                </View>

                {/* Personal Details Card */}
                <View style={styles.profileCard}>
                    <Text style={styles.profileCardTitle}>PERSONAL DETAILS</Text>

                    <View style={styles.profileRow}>
                        <Text style={styles.profileRowIcon}>💳</Text>
                        <View>
                            <Text style={styles.profileRowLabel}>Card Number</Text>
                            <Text style={styles.profileRowValue}>ABHA-{String(patientData.phr).replace(/[^0-9]/g, '').padEnd(14, '0').match(/.{1,4}/g)?.join('-')}</Text>
                        </View>
                    </View>

                    <View style={styles.profileRow}>
                        <Text style={styles.profileRowIcon}>📍</Text>
                        <View>
                            <Text style={styles.profileRowLabel}>Address</Text>
                            <Text style={styles.profileRowValue}>{PATIENT_PROFILE.address}</Text>
                        </View>
                    </View>

                    <View style={styles.profileRow}>
                        <Text style={styles.profileRowIcon}>📞</Text>
                        <View>
                            <Text style={styles.profileRowLabel}>Phone</Text>
                            <Text style={styles.profileRowValue}>{PATIENT_PROFILE.phone}</Text>
                        </View>
                    </View>

                    <View style={styles.profileRow}>
                        <Text style={styles.profileRowIcon}>✉️</Text>
                        <View>
                            <Text style={styles.profileRowLabel}>Email</Text>
                            <Text style={styles.profileRowValue}>{patientData.name.toLowerCase().replace(/\s/g, '.')}@email.com</Text>
                        </View>
                    </View>

                    <View style={[styles.profileRow, { borderBottomWidth: 0 }]}>
                        <Text style={styles.profileRowIcon}>🚑</Text>
                        <View>
                            <Text style={styles.profileRowLabel}>Emergency</Text>
                            <Text style={styles.profileRowValue}>{PATIENT_PROFILE.emergency}</Text>
                        </View>
                    </View>
                </View>

                {/* Eligibility Card */}
                <View style={styles.profileCard}>
                    <Text style={styles.profileCardTitle}>ELIGIBILITY & SCHEMES</Text>

                    <View style={styles.schemeRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.checkIcon}>🛡️</Text>
                            <View>
                                <Text style={styles.schemeName}>Ayushman Bharat</Text>
                                <Text style={styles.schemeDate}>Valid till 2026-03-31</Text>
                            </View>
                        </View>
                        <View style={styles.eligibleBadge}>
                            <Text style={styles.eligibleText}>Eligible</Text>
                        </View>
                    </View>

                    <View style={[styles.schemeRow, { borderBottomWidth: 0 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.checkIcon}>🏥</Text>
                            <View>
                                <Text style={styles.schemeName}>State Health Card</Text>
                                <Text style={styles.schemeDate}>Valid till 2025-12-31</Text>
                            </View>
                        </View>
                        <View style={styles.activeBadge}>
                            <Text style={styles.activeText}>Active</Text>
                        </View>
                    </View>
                </View>

                {/* Settings / Menu */}
                <View style={styles.profileCard}>
                    <TouchableOpacity style={styles.menuRow}>
                        <Text style={styles.menuIcon}>🔔</Text>
                        <Text style={styles.menuText}>Notifications</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuRow}>
                        <Text style={styles.menuIcon}>⚙️</Text>
                        <Text style={styles.menuText}>Preferences</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.menuRow, { borderBottomWidth: 0 }]}>
                        <Text style={styles.menuIcon}>❓</Text>
                        <Text style={styles.menuText}>Help & Support</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </View>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'Home':
                return (
                    <>
                        {renderPatientCard()}
                        {renderActionButtons()}
                        {renderAppointments(2)}
                    </>
                );
            case 'Appts':
                return renderAppointments();
            case 'Rx':
                return renderPrescriptions();
            case 'Records':
                return renderHealthRecords();
            case 'Services':
                return renderServiceRecords();
            case 'Profile':
                return renderProfile();
            default:
                return (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text>Profile Placeholder</Text>
                    </View>
                );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#f97316" barStyle="light-content" />
            <View style={styles.yellowHeader} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {renderHeader()}
                {renderContent()}
            </ScrollView>

            {/* Bottom Tab Bar */}
            <View style={styles.tabBar}>
                {[
                    { key: 'Home', icon: '🏠', label: 'Home' },
                    { key: 'Appts', icon: '📅', label: 'Appts' },
                    { key: 'Rx', icon: '📋', label: 'Rx' },
                    { key: 'Records', icon: '📄', label: 'Records' },
                    { key: 'Services', icon: '💼', label: 'Services' },
                    { key: 'Profile', icon: '👤', label: 'Profile' }
                ].map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={styles.tabItem}
                        onPress={() => setActiveTab(tab.key as Tab)}
                    >
                        <Text style={[styles.tabIcon, activeTab === tab.key && { color: '#f97316' }]}>{tab.icon}</Text>
                        <Text style={[styles.tabLabel, activeTab === tab.key && { color: '#f97316' }]}>{tab.label}</Text>
                        {activeTab === tab.key && <View style={styles.activeIndicator} />}
                    </TouchableOpacity>
                ))}
            </View>

            {/* Add Prescription Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Prescription</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            <Text style={styles.inputLabel}>Condition / Diagnosis *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Viral Fever"
                                value={newRx.condition}
                                onChangeText={(t) => setNewRx({ ...newRx, condition: t })}
                            />

                            <Text style={styles.sectionHeader}>Medicine Details</Text>

                            <Text style={styles.inputLabel}>Medicine Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Paracetamol 500mg"
                                value={newRx.medicine}
                                onChangeText={(t) => setNewRx({ ...newRx, medicine: t })}
                            />

                            <View style={styles.rowInput}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={styles.inputLabel}>Dosage *</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="1-0-1"
                                        value={newRx.dosage}
                                        onChangeText={(t) => setNewRx({ ...newRx, dosage: t })}
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text style={styles.inputLabel}>Duration</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="5 days"
                                        value={newRx.duration}
                                        onChangeText={(t) => setNewRx({ ...newRx, duration: t })}
                                    />
                                </View>
                            </View>

                            <Text style={styles.inputLabel}>Instructions</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. After food"
                                value={newRx.instructions}
                                onChangeText={(t) => setNewRx({ ...newRx, instructions: t })}
                            />

                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={handleAddPrescription}
                            >
                                <Text style={styles.submitButtonText}>Issue Prescription</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    yellowHeader: {
        height: 0,
        backgroundColor: '#f97316',
    },
    scrollContent: {
        paddingBottom: 80,
    },
    header: {
        backgroundColor: '#f97316',
        padding: 16,
        paddingBottom: 60, // Extend for overlapping card
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    logoutButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 8,
    },
    logoutText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    patientCard: {
        backgroundColor: '#f97316',
        marginHorizontal: 16,
        marginTop: 20, // Adjusted for new header
        borderRadius: 16,
        padding: 20,
        elevation: 4,
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        marginBottom: 20,
    },
    patientHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    patientName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    patientPhr: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        marginTop: 4,
    },
    bloodTypeBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    bloodTypeText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    patientDetailsRow: {
        flexDirection: 'row',
    },
    detailBox: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 8,
        padding: 12,
    },
    detailLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginBottom: 4,
    },
    detailValue: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    actionRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 16,
        marginBottom: 24,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#f97316',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
    },
    actionIcon: {
        fontSize: 24,
        color: '#fff',
        marginBottom: 8,
    },
    actionText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    doctorName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    specialty: {
        color: '#64748b',
        fontSize: 14,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusScheduled: {
        backgroundColor: '#ffedd5',
    },
    statusCompleted: {
        backgroundColor: '#dcfce7',
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    textScheduled: {
        color: '#f97316',
    },
    textCompleted: {
        color: '#16a34a',
    },
    dateTimeRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 8,
    },
    dateTime: {
        fontSize: 13,
        color: '#64748b',
    },
    note: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 4,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rowTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginLeft: 4,
    },
    subHeader: {
        fontSize: 12,
        color: '#f97316',
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    rxCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 1,
    },
    rxHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    conditionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    doctorInfo: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    currentBadge: {
        backgroundColor: '#ffedd5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    currentText: {
        color: '#f97316',
        fontSize: 11,
        fontWeight: 'bold',
    },
    dateRight: {
        fontSize: 11,
        color: '#64748b',
        textAlign: 'right',
        marginBottom: 12,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        padding: 8,
        borderRadius: 6,
        marginBottom: 8,
    },
    col: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '600',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    tableCell: {
        fontSize: 12,
        color: '#334155',
    },
    noteBox: {
        marginTop: 12,
        padding: 8,
        backgroundColor: '#fff7ed',
        borderRadius: 6,
    },
    noteText: {
        fontSize: 12,
        color: '#f97316',
        fontStyle: 'italic',
    },
    serviceIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ffedd5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    dateText: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    paidBadge: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    paidText: {
        color: '#16a34a',
        fontSize: 12,
        fontWeight: 'bold',
    },
    accordianCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingVertical: 8,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabIcon: {
        fontSize: 20,
        color: '#64748b',
        marginBottom: 4,
    },
    tabLabel: {
        fontSize: 10,
        color: '#64748b',
    },
    activeIndicator: {
        width: 20,
        height: 2,
        backgroundColor: '#f97316',
        marginTop: 2,
        borderRadius: 1,
    },
    // New Header Styles
    topHeader: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#fed7aa',
        zIndex: 10,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    apLogo: {
        width: 40,
        height: 40,
        marginRight: 12,
    },
    headerTextContainer: {
        flex: 1,
    },
    hospitalName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ea580c', // Orange brand color
    },
    deptName: {
        fontSize: 10,
        fontWeight: '600',
        color: '#64748b',
        marginTop: 2,
        letterSpacing: 0.5,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    cmPhotoContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    cmPhoto: {
        width: '100%',
        height: '100%',
    },
    miniLogout: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: '#fff7ed',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fdba74',
    },
    miniLogoutText: {
        fontSize: 11,
        color: '#ea580c',
        fontWeight: 'bold',
    },
    // Employee Profile styles
    userInfo: {
        alignItems: 'flex-end',
        marginHorizontal: 8,
    },
    userName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    profilePicContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#e0e7ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#c7d2fe',
        marginLeft: 4,
    },
    profilePicText: {
        fontSize: 14,
    },
    // New Scan Header Button
    newScanHeaderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff7ed',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#fdba74',
    },
    newScanHeaderIcon: {
        fontSize: 14,
        color: '#ea580c',
        marginRight: 6,
    },
    newScanHeaderText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#ea580c',
    },
    // Rx Add styles
    addRxButton: {
        backgroundColor: '#ea580c',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    addRxButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    closeButton: {
        fontSize: 24,
        color: '#94a3b8',
        fontWeight: 'bold',
    },
    modalForm: {
        maxHeight: 500,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#1e293b',
        marginBottom: 16,
        backgroundColor: '#f8fafc',
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ea580c',
        marginTop: 8,
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    rowInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    submitButton: {
        backgroundColor: '#ea580c',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
        elevation: 2,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Profile Tab Styles
    profileContainer: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    profileHeaderBand: {
        backgroundColor: '#f97316',
        paddingVertical: 16,
        paddingHorizontal: 16,
        alignItems: 'center',
        marginBottom: 20,
    },
    profileHeaderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    profileContent: {
        paddingHorizontal: 16,
    },
    profileAvatarSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    profileAvatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ffb703', // Yellowish orange
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 3,
        borderColor: '#fff',
        elevation: 2,
    },
    profileAvatarIcon: {
        fontSize: 40,
        color: '#fff',
    },
    profileName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    profilePhr: {
        fontSize: 14,
        color: '#64748b',
    },
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    profileCardTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
        marginBottom: 16,
        letterSpacing: 0.5,
    },
    profileRow: {
        flexDirection: 'row',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    profileRowIcon: {
        fontSize: 18,
        marginRight: 16,
        marginTop: 2,
        width: 24,
        textAlign: 'center',
    },
    profileRowLabel: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 2,
    },
    profileRowValue: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '500',
    },
    schemeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    checkIcon: {
        fontSize: 16,
        marginRight: 12,
    },
    schemeName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    schemeDate: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
    },
    eligibleBadge: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    eligibleText: {
        color: '#16a34a',
        fontSize: 11,
        fontWeight: 'bold',
    },
    activeBadge: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    activeText: {
        color: '#16a34a',
        fontSize: 11,
        fontWeight: 'bold',
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    menuIcon: {
        fontSize: 18,
        marginRight: 16,
        width: 24,
        textAlign: 'center',
        color: '#64748b',
    },
    menuText: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '500',
    },
});
