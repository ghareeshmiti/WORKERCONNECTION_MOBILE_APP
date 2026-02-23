import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    StatusBar,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function calculateAge(dateOfBirth: string | null | undefined): string {
    if (!dateOfBirth) return '—';
    const dob = new Date(dateOfBirth);
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970).toString();
}

export default function FamilySelectionScreen({ route, navigation }: any) {
    const { family, familyMembers, scannedWorker, establishmentId } = route.params;

    // Find the SELF member (head of family)
    const headMember = familyMembers.find((m: any) =>
        m.relation === 'SELF' || m.relation?.toLowerCase().includes('self') || m.relation?.toLowerCase().includes('head')
    );

    // Other members (exclude head)
    const otherMembers = familyMembers.filter((m: any) => m.id !== headMember?.id);

    const handleSelectMember = (member: any) => {
        navigation.replace('DoctorSelection', {
            selectedMember: member,
            family,
            familyMembers,
            scannedWorker,
            establishmentId,
        });
    };

    const renderMember = (item: any) => {
        const age = calculateAge(item.date_of_birth);
        const initials = item.name ? item.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2) : '?';

        return (
            <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => handleSelectMember(item)}
            >
                <View style={styles.cardContent}>
                    <View style={styles.avatarContainer}>
                        {item.photo_url ? (
                            <Image source={{ uri: item.photo_url }} style={styles.avatar} />
                        ) : (
                            <Text style={styles.avatarText}>{initials}</Text>
                        )}
                    </View>
                    <View style={styles.infoContainer}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.relation}>{item.relation || 'Family Member'}</Text>
                        <View style={styles.detailsRow}>
                            <Text style={styles.detailText}>
                                {item.gender === 'Male' ? '👨' : '👩'} {age} Yrs
                            </Text>
                            {item.blood_group && (
                                <Text style={styles.detailText}>{' • '}{item.blood_group}</Text>
                            )}
                        </View>
                        {item.chronic_conditions && item.chronic_conditions !== 'None' && (
                            <Text style={styles.conditionText} numberOfLines={1}>
                                {'⚡ '}{item.chronic_conditions}
                            </Text>
                        )}
                    </View>
                    <View style={styles.arrowContainer}>
                        <Text style={styles.arrow}>{'›'}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#f97316" barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Who is visiting today?</Text>
                <Text style={styles.headerSubtitle}>Select family member for OPD consultation</Text>
            </View>

            <ScrollView contentContainerStyle={styles.listContent}>
                <View style={styles.familyTag}>
                    <Text style={styles.familyTagText}>
                        HOUSEHOLD OF {family?.family_name?.toUpperCase() || scannedWorker?.last_name?.toUpperCase() || 'FAMILY'}
                    </Text>
                </View>

                {/* Primary Card Holder */}
                {headMember && (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>PRIMARY CARD HOLDER</Text>
                        {renderMember(headMember)}
                    </View>
                )}

                {/* Other Members */}
                {otherMembers.length > 0 && (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>FAMILY MEMBERS</Text>
                        {otherMembers.map((member: any) => renderMember(member))}
                    </View>
                )}
            </ScrollView>

            <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.replace('HealthScan')}
            >
                <Text style={styles.cancelText}>Cancel / New Scan</Text>
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
        zIndex: 10,
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
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    familyTag: {
        alignSelf: 'center',
        backgroundColor: '#ffedd5',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#fdba74',
    },
    familyTagText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#ea580c',
        letterSpacing: 1,
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94a3b8',
        marginBottom: 12,
        marginLeft: 4,
        letterSpacing: 1,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#e0f2fe',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 2,
        borderColor: '#fff',
        elevation: 2,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0284c7',
    },
    infoContainer: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    relation: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
        marginBottom: 4,
        backgroundColor: '#f1f5f9',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        fontSize: 12,
        color: '#94a3b8',
    },
    conditionText: {
        fontSize: 11,
        color: '#ef4444',
        marginTop: 4,
    },
    arrowContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff7ed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrow: {
        fontSize: 18,
        color: '#ea580c',
        fontWeight: 'bold',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cancelText: {
        color: '#64748b',
        fontWeight: '600',
    },
});
