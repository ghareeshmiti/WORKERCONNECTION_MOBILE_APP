import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    SafeAreaView,
    StatusBar,
    Alert,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { SmartCardVerify } from '../components/SmartCardVerify';

export default function HealthScanScreen({ navigation }: any) {
    const { userContext, signOut } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => signOut() },
        ]);
    };

    const handleCardVerified = async (username: string) => {
        console.log('Verified Worker ID:', username);
        setLoading(true);

        try {
            // Step 1: Look up worker from Supabase
            const { data: worker, error } = await supabase
                .from('workers')
                .select('id, worker_id, first_name, last_name, date_of_birth, gender, photo_url, card_uid')
                .eq('worker_id', username)
                .maybeSingle();

            if (error) throw error;

            if (!worker) {
                setLoading(false);
                Alert.alert('Error', 'Worker profile not found in database.');
                return;
            }

            // Step 2: Look up family by worker's UUID (head_worker_id)
            const { data: family, error: familyError } = await supabase
                .from('families')
                .select('id, family_name, address, district, phone')
                .eq('head_worker_id', worker.id)
                .maybeSingle();

            if (familyError) {
                console.warn('Family lookup error:', familyError);
            }

            if (family) {
                // Step 3: Get family members
                const { data: members, error: membersError } = await supabase
                    .from('family_members')
                    .select('id, family_id, name, relation, gender, date_of_birth, blood_group, allergies, chronic_conditions, phone, photo_url, is_active')
                    .eq('family_id', family.id)
                    .eq('is_active', true)
                    .order('created_at', { ascending: true });

                if (membersError) {
                    console.warn('Members lookup error:', membersError);
                }

                const familyMembers = members || [];

                setLoading(false);
                // Go directly to family member selection — no popup
                navigation.replace('FamilySelection', {
                    family,
                    familyMembers,
                    scannedWorker: worker,
                    establishmentId: userContext?.establishmentId,
                });
                return;
            }

            // No family found — fallback to direct patient view
            setLoading(false);
            Alert.alert('Scan Success', `Patient Verified: ${worker.first_name} ${worker.last_name}`, [
                { text: 'View Records', onPress: () => navigation.replace('HealthDashboard', { patient: worker }) }
            ]);

        } catch (err: any) {
            console.error('Error fetching worker:', err);
            setLoading(false);
            Alert.alert('Error', 'Failed to fetch patient details.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#fff" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Image
                        source={require('../assets/ap-logo.png')}
                        style={styles.apLogo}
                        resizeMode="contain"
                    />
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.hospitalName} numberOfLines={1}>Guntur General Hospital</Text>
                        <Text style={styles.deptName} numberOfLines={1}>AP HEALTH DEPARTMENT</Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>Health Emp.</Text>
                    </View>
                    <View style={styles.profilePicContainer}>
                        <Text style={styles.profilePicText}>&#x1F464;</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <Text style={styles.logoutText}>&#x23FB;</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.contentContainer}>
                <View style={styles.scanCard}>
                    {/* Icon */}
                    <View style={styles.iconCircle}>
                        <Text style={styles.cardIcon}>&#x1F4B3;</Text>
                    </View>

                    <Text style={styles.scanTitle}>Patient Smart Card</Text>
                    <Text style={styles.scanSubtitle}>Tap the NFC card on the back of the device</Text>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#ea580c" />
                            <Text style={styles.loadingText}>Looking up patient...</Text>
                        </View>
                    ) : (
                        <SmartCardVerify
                            onVerified={handleCardVerified}
                            buttonLabel="&#x1F4E1;  Scan NFC Card"
                            buttonStyle={styles.scanButton}
                            buttonTextStyle={styles.scanButtonText}
                        />
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    apLogo: {
        width: 36,
        height: 36,
        marginRight: 10,
    },
    headerTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    hospitalName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ea580c',
        marginBottom: 2,
    },
    deptName: {
        fontSize: 10,
        fontWeight: '600',
        color: '#64748b',
        letterSpacing: 0.5,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userInfo: {
        alignItems: 'flex-end',
        marginRight: 8,
        display: 'none',
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
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    profilePicText: {
        fontSize: 16,
    },
    logoutButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fee2e2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutText: {
        fontSize: 18,
        color: '#ef4444',
        fontWeight: 'bold',
        marginTop: -2,
    },
    contentContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 16,
    },
    scanCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 24,
        paddingVertical: 40,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        marginBottom: 20,
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardIcon: {
        fontSize: 32,
    },
    scanTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
        textAlign: 'center',
    },
    scanSubtitle: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 32,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    scanButton: {
        backgroundColor: '#ea580c',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        elevation: 4,
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        width: '100%',
        justifyContent: 'center',
    },
    scanButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748b',
    },
});
