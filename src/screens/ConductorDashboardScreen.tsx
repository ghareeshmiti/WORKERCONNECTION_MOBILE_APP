import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    Modal,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { SmartCardVerify } from '../components/SmartCardVerify';

// ─── Types ─────────────────────────────────────────────────────────────────────
type TicketState = 'IDLE' | 'SCANNING' | 'VERIFIED' | 'ISSUING' | 'ISSUED';

interface PassengerDetails {
    id: string;
    name: string;
    age: number;
    gender: string;
    cardId: string;
    isEligibleFree: boolean;
    schemeName?: string;
    photoUrl?: string;
}

const STATIONS = ['Guntur', 'Vijayawada', 'Tenali', 'Mangalagiri', 'Amaravati', 'Ongole', 'Nellore', 'Kurnool'];

// ─── Component ─────────────────────────────────────────────────────────────────
export default function ConductorDashboardScreen() {
    const { userContext, signOut } = useAuth();

    const [state, setState] = useState<TicketState>('IDLE');
    const [passenger, setPassenger] = useState<PassengerDetails | null>(null);
    const [source, setSource] = useState('Guntur');
    const [destination, setDestination] = useState('');
    const [fare, setFare] = useState(0);
    const [ticketId, setTicketId] = useState('');

    // Station picker modal
    const [showSourcePicker, setShowSourcePicker] = useState(false);
    const [showDestPicker, setShowDestPicker] = useState(false);

    // Fare calculation
    useEffect(() => {
        if (source && destination) {
            setFare(passenger?.isEligibleFree ? 0 : 45);
        }
    }, [source, destination, passenger]);

    // ── Called by SmartCardVerify when card is successfully verified ────────────
    const handleCardVerified = async (username: string) => {
        setState('SCANNING');
        await fetchPassengerDetails(username);
    };

    // ── Fetch Passenger from Supabase ───────────────────────────────────────────
    const fetchPassengerDetails = async (workerId: string) => {
        try {
            const { data: worker, error } = await supabase
                .from('workers')
                .select('id, worker_id, first_name, last_name, date_of_birth, gender, photo_url')
                .eq('worker_id', workerId)
                .maybeSingle();

            if (error || !worker) {
                Alert.alert('Worker Not Found', 'Card verified but worker profile is missing.');
                setState('IDLE');
                return;
            }

            const w = worker as any;
            let age = 0;
            if (w.date_of_birth) {
                const dob = new Date(w.date_of_birth);
                age = Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
            }

            const isEligibleFree = w.gender === 'Female' || age > 60;
            const schemeName = w.gender === 'Female' ? 'Mahila Shakti' : age > 60 ? 'Senior Citizen' : undefined;

            setPassenger({
                id: w.id,
                name: `${w.first_name} ${w.last_name}`,
                age,
                gender: w.gender || 'Other',
                cardId: w.worker_id,
                isEligibleFree,
                schemeName,
                photoUrl: w.photo_url,
            });
            setDestination('');
            setState('VERIFIED');
        } catch (err) {
            Alert.alert('Error', 'Failed to fetch passenger details.');
            setState('IDLE');
        }
    };

    // ── Issue Ticket ────────────────────────────────────────────────────────────
    const handleIssueTicket = async () => {
        if (!destination) {
            Alert.alert('Error', 'Please select a destination');
            return;
        }

        setState('ISSUING');
        const newTicketId = `T${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

        try {
            const ticketFare = passenger?.isEligibleFree ? 0 : fare;
            const { error } = await supabase.from('tickets' as any).insert({
                ticket_id: newTicketId,
                passenger_name: passenger?.name || 'Unknown',
                source,
                destination,
                from_stop: source,
                to_stop: destination,
                fare: ticketFare,
                is_free: passenger?.isEligibleFree || false,
                govt_subsidy_amount: passenger?.isEligibleFree ? fare : 0,
                payment_mode: passenger?.isEligibleFree ? 'FREE' : 'CASH',
                bus_number: 'AP07-1234',
                route_id: 'R-101',
                route_name: `${source} - ${destination} Express`,
                worker_id: passenger?.id || null,
                establishment_id: userContext?.establishmentId || null,
                conductor_id: userContext?.authUserId || null,
                issued_by: userContext?.fullName || 'Conductor',
                remarks: passenger?.schemeName || 'Standard Ticket',
                issued_at: new Date().toISOString(),
            });

            if (error) throw error;

            setTicketId(newTicketId);
            setState('ISSUED');
        } catch (error: any) {
            console.error('Ticket save error:', error);
            Alert.alert('Error', 'Could not save ticket. Please try again.');
            setState('VERIFIED');
        }
    };

    const handleNextPassenger = () => {
        setPassenger(null);
        setDestination('');
        setFare(0);
        setTicketId('');
        setState('IDLE');
    };

    const handleLogout = async () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => signOut() },
        ]);
    };

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.headerTitle}>APSRTC</Text>
                    <Text style={styles.headerSubtitle}>Conductor Terminal</Text>
                </View>
                <View style={styles.headerRight}>
                    <View style={styles.cmPhotoContainer}>
                        <Image
                            source={require('../assets/cm.jpg')}
                            style={styles.cmPhoto}
                            resizeMode="cover"
                        />
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.conductorName}>{userContext?.fullName || 'Conductor'}</Text>
                        <Text style={styles.busNumber}>Bus: AP07-1234</Text>
                    </View>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Text style={styles.logoutText}>⏻</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* ── IDLE ── */}
                {state === 'IDLE' && (
                    <View style={styles.card}>
                        <View style={styles.nfcIconContainer}>
                            <Text style={styles.nfcBigIcon}>📡</Text>
                        </View>
                        <Text style={styles.cardTitle}>Scan Citizen Card</Text>
                        <Text style={styles.cardSubtitle}>
                            Ask the passenger to tap their smart card on the back of this device
                        </Text>

                        <View style={styles.nfcVisual}>
                            <Text style={styles.nfcVisualIcon}>💳</Text>
                        </View>

                        {/* SmartCardVerify handles the entire NFC flow */}
                        <SmartCardVerify
                            onVerified={handleCardVerified}
                            onCancel={() => setState('IDLE')}
                            buttonLabel="📲  Scan Smart Card (NFC)"
                        />
                    </View>
                )}

                {/* ── SCANNING (fetching passenger details) ── */}
                {state === 'SCANNING' && (
                    <View style={styles.card}>
                        <ActivityIndicator size="large" color="#ea580c" style={{ marginVertical: 32 }} />
                        <Text style={styles.cardSubtitle}>Loading passenger details...</Text>
                    </View>
                )}

                {/* ── VERIFIED / ISSUING ── */}
                {(state === 'VERIFIED' || state === 'ISSUING') && passenger && (
                    <View style={styles.card}>
                        {/* Verification Badge */}
                        <View style={styles.verifiedBadge}>
                            <Text style={styles.verifiedIcon}>✅</Text>
                            <Text style={styles.verifiedText}>Card Verified</Text>
                        </View>

                        {/* Passenger Info */}
                        <View style={styles.passengerRow}>
                            <View style={styles.photoContainer}>
                                {passenger.photoUrl ? (
                                    <Image
                                        source={{ uri: passenger.photoUrl }}
                                        style={styles.photo}
                                        defaultSource={require('../assets/ap-logo.png')}
                                    />
                                ) : (
                                    <Text style={styles.photoPlaceholder}>👤</Text>
                                )}
                            </View>
                            <View style={styles.passengerInfo}>
                                <Text style={styles.passengerName}>{passenger.name}</Text>
                                <Text style={styles.passengerCard}>Card: {passenger.cardId}</Text>
                                <View style={styles.tagRow}>
                                    <View style={styles.tag}>
                                        <Text style={styles.tagText}>{passenger.age} yrs</Text>
                                    </View>
                                    <View style={styles.tag}>
                                        <Text style={styles.tagText}>{passenger.gender}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Eligibility Banner */}
                        {passenger.isEligibleFree ? (
                            <View style={styles.freeBanner}>
                                <Text style={styles.freeBannerTitle}>✅ Eligible for Free Scheme</Text>
                                <Text style={styles.freeBannerScheme}>{passenger.schemeName}</Text>
                            </View>
                        ) : (
                            <View style={styles.paidBanner}>
                                <Text style={styles.paidBannerText}>Paid Ticket Only</Text>
                            </View>
                        )}

                        {/* Route Selection */}
                        <View style={styles.routeRow}>
                            <View style={styles.routeField}>
                                <Text style={styles.routeLabel}>📍 FROM</Text>
                                <TouchableOpacity
                                    style={styles.stationPicker}
                                    onPress={() => setShowSourcePicker(true)}
                                >
                                    <Text style={styles.stationPickerText}>{source}</Text>
                                    <Text style={styles.stationPickerArrow}>▼</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.routeArrow}>
                                <Text style={styles.routeArrowText}>→</Text>
                            </View>
                            <View style={styles.routeField}>
                                <Text style={styles.routeLabel}>📍 TO</Text>
                                <TouchableOpacity
                                    style={[styles.stationPicker, !destination && styles.stationPickerEmpty]}
                                    onPress={() => setShowDestPicker(true)}
                                >
                                    <Text style={[styles.stationPickerText, !destination && { color: '#94a3b8' }]}>
                                        {destination || 'Select...'}
                                    </Text>
                                    <Text style={styles.stationPickerArrow}>▼</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Fare */}
                        {!passenger.isEligibleFree && fare > 0 && (
                            <View style={styles.fareContainer}>
                                <Text style={styles.fareLabel}>Fare</Text>
                                <Text style={styles.fareAmount}>₹{fare}</Text>
                            </View>
                        )}

                        {/* Issue Button */}
                        <TouchableOpacity
                            style={[
                                styles.primaryButton,
                                passenger.isEligibleFree ? styles.freeButton : styles.paidButton,
                                (state === 'ISSUING' || !destination) && styles.buttonDisabled,
                            ]}
                            onPress={handleIssueTicket}
                            disabled={state === 'ISSUING' || !destination}
                        >
                            {state === 'ISSUING' ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.primaryButtonText}>
                                    🎫  {passenger.isEligibleFree ? 'Issue Free Ticket' : 'Issue Paid Ticket'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── ISSUED ── */}
                {state === 'ISSUED' && passenger && (
                    <View style={styles.card}>
                        <View style={styles.successIcon}>
                            <Text style={styles.successEmoji}>✅</Text>
                        </View>
                        <Text style={styles.successTitle}>Ticket Issued!</Text>

                        {/* Receipt */}
                        <View style={styles.receipt}>
                            <View style={styles.receiptHeader}>
                                <Text style={styles.receiptHeaderText}>APSRTC – BUS TICKET</Text>
                            </View>
                            <View style={styles.receiptBody}>
                                <View style={styles.receiptRow}>
                                    <Text style={styles.receiptLabel}>Ticket ID</Text>
                                    <Text style={styles.receiptValue}>{ticketId}</Text>
                                </View>
                                <View style={styles.receiptRow}>
                                    <Text style={styles.receiptLabel}>Passenger</Text>
                                    <Text style={styles.receiptValue}>{passenger.name}</Text>
                                </View>
                                <View style={styles.receiptRow}>
                                    <Text style={styles.receiptLabel}>Route</Text>
                                    <Text style={styles.receiptValue}>{source} → {destination}</Text>
                                </View>
                                <View style={styles.receiptRow}>
                                    <Text style={styles.receiptLabel}>Bus</Text>
                                    <Text style={styles.receiptValue}>AP07-1234</Text>
                                </View>
                                <View style={styles.receiptDivider} />
                                <View style={styles.receiptFare}>
                                    {passenger.isEligibleFree ? (
                                        <>
                                            <Text style={styles.freeFareText}>FREE</Text>
                                            <View style={styles.govtBadge}>
                                                <Text style={styles.govtBadgeText}>GOVT SCHEME</Text>
                                            </View>
                                        </>
                                    ) : (
                                        <Text style={styles.paidFareText}>₹{fare}</Text>
                                    )}
                                </View>
                                <Text style={styles.receiptTime}>
                                    {new Date().toLocaleString('en-IN')}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.nextButton} onPress={handleNextPassenger}>
                            <Text style={styles.nextButtonText}>Next Passenger →</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* ── Source Station Picker ── */}
            <Modal visible={showSourcePicker} transparent animationType="slide" onRequestClose={() => setShowSourcePicker(false)}>
                <View style={styles.pickerOverlay}>
                    <View style={styles.pickerContent}>
                        <Text style={styles.pickerTitle}>Select Source</Text>
                        {STATIONS.map(s => (
                            <TouchableOpacity key={s} style={styles.pickerItem} onPress={() => { setSource(s); setShowSourcePicker(false); }}>
                                <Text style={[styles.pickerItemText, source === s && styles.pickerItemSelected]}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setShowSourcePicker(false)}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── Destination Station Picker ── */}
            <Modal visible={showDestPicker} transparent animationType="slide" onRequestClose={() => setShowDestPicker(false)}>
                <View style={styles.pickerOverlay}>
                    <View style={styles.pickerContent}>
                        <Text style={styles.pickerTitle}>Select Destination</Text>
                        {STATIONS.filter(s => s !== source).map(s => (
                            <TouchableOpacity key={s} style={styles.pickerItem} onPress={() => { setDestination(s); setShowDestPicker(false); }}>
                                <Text style={[styles.pickerItemText, destination === s && styles.pickerItemSelected]}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setShowDestPicker(false)}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ea580c',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerLeft: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 1 },
    headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },

    headerRight: { flexDirection: 'row', alignItems: 'center' },
    userInfo: { alignItems: 'flex-end', marginHorizontal: 12 },
    cmPhotoContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    cmPhoto: { width: '100%', height: '100%' },

    conductorName: { fontSize: 13, fontWeight: '700', color: '#fff' },
    busNumber: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
    logoutBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    logoutText: { fontSize: 16, color: '#fff', fontWeight: 'bold' },

    content: { padding: 16 },

    // Card
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },

    // IDLE state
    nfcIconContainer: { alignItems: 'center', marginBottom: 16 },
    nfcBigIcon: { fontSize: 64 },
    cardTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b', textAlign: 'center', marginBottom: 8 },
    cardSubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    nfcVisual: {
        alignSelf: 'center',
        width: 100,
        height: 70,
        borderWidth: 2,
        borderColor: '#fdba74',
        borderStyle: 'dashed',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff7ed',
        marginBottom: 24,
    },
    nfcVisualIcon: { fontSize: 32 },

    // Verified state
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    verifiedIcon: { fontSize: 20, marginRight: 8 },
    verifiedText: { fontSize: 16, fontWeight: '700', color: '#16a34a' },
    passengerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
    photoContainer: {
        width: 64,
        height: 64,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    photo: { width: '100%', height: '100%' },
    photoPlaceholder: { fontSize: 32 },
    passengerInfo: { flex: 1 },
    passengerName: { fontSize: 17, fontWeight: '800', color: '#1e293b', marginBottom: 2 },
    passengerCard: { fontSize: 12, color: '#64748b', marginBottom: 6 },
    tagRow: { flexDirection: 'row', gap: 6 },
    tag: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    tagText: { fontSize: 11, color: '#475569', fontWeight: '600' },

    // Eligibility banners
    freeBanner: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 16 },
    freeBannerTitle: { fontSize: 14, fontWeight: '700', color: '#16a34a' },
    freeBannerScheme: { fontSize: 13, color: '#15803d', marginTop: 2 },
    paidBanner: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 10, alignItems: 'center', marginBottom: 16 },
    paidBannerText: { fontSize: 13, fontWeight: '600', color: '#64748b' },

    // Route selection
    routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    routeField: { flex: 1 },
    routeLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' },
    stationPicker: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 10,
        backgroundColor: '#f8fafc',
    },
    stationPickerEmpty: { borderColor: '#fdba74' },
    stationPickerText: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
    stationPickerArrow: { fontSize: 10, color: '#94a3b8' },
    routeArrow: { paddingTop: 20 },
    routeArrowText: { fontSize: 18, color: '#94a3b8' },

    // Fare
    fareContainer: { alignItems: 'center', paddingVertical: 8, marginBottom: 8 },
    fareLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
    fareAmount: { fontSize: 28, fontWeight: '900', color: '#1e293b' },

    // Buttons
    primaryButton: {
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
    freeButton: { backgroundColor: '#1e293b' },
    paidButton: { backgroundColor: '#ea580c' },
    buttonDisabled: { opacity: 0.5 },
    primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Issued state
    successIcon: { alignItems: 'center', marginBottom: 8 },
    successEmoji: { fontSize: 48 },
    successTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b', textAlign: 'center', marginBottom: 20 },
    receipt: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
    receiptHeader: { backgroundColor: '#f8fafc', padding: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    receiptHeaderText: { fontSize: 12, fontWeight: '800', color: '#475569', letterSpacing: 2 },
    receiptBody: { padding: 16 },
    receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    receiptLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
    receiptValue: { fontSize: 13, color: '#1e293b', fontWeight: '700' },
    receiptDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 12 },
    receiptFare: { alignItems: 'center', marginBottom: 8 },
    freeFareText: { fontSize: 28, fontWeight: '900', color: '#16a34a' },
    govtBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginTop: 4 },
    govtBadgeText: { fontSize: 10, fontWeight: '800', color: '#15803d', letterSpacing: 1 },
    paidFareText: { fontSize: 28, fontWeight: '900', color: '#1e293b' },
    receiptTime: { fontSize: 11, color: '#94a3b8', textAlign: 'center' },
    nextButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Station Picker Modal
    pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    pickerContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' },
    pickerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 16, textAlign: 'center' },
    pickerItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    pickerItemText: { fontSize: 16, color: '#1e293b', fontWeight: '500' },
    pickerItemSelected: { color: '#ea580c', fontWeight: '700' },
    cancelButton: { paddingVertical: 10, paddingHorizontal: 24, alignItems: 'center' },
    cancelText: { color: '#ea580c', fontSize: 16, fontWeight: '600' },
});
