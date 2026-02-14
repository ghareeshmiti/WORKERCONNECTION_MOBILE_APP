import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen({ navigation }: any) {
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffcb05" />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Yellow Header Band */}
                <View style={styles.headerBand}>
                    <View style={styles.headerLeft}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoText}>AP</Text>
                        </View>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerSubtitle}>Government of Andhra Pradesh</Text>
                            <Text style={styles.headerTitle}>One State - One Card</Text>
                            <Text style={styles.headerTagline}>Official Identity & Access Portal</Text>
                        </View>
                    </View>
                </View>

                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <Text style={styles.heroTitle}>
                        One State - One Card for Identity and Access
                    </Text>
                    <Text style={styles.heroDescription}>
                        A unified government system to issue and manage a single official identity
                        card for each individual, enabling secure verification and access across
                        establishments and departments.
                    </Text>
                </View>

                {/* Role Access Section */}
                <View style={styles.roleSection}>
                    <Text style={styles.roleSectionLabel}>Role Access Section</Text>
                    <Text style={styles.roleSectionTitle}>Select Your Role for Access</Text>

                    {/* Worker Access Card */}
                    <View style={styles.roleCard}>
                        <View style={styles.roleCardHeader}>
                            <Text style={styles.roleIcon}>👷</Text>
                            <View>
                                <Text style={styles.roleCardTitle}>Worker Access</Text>
                                <Text style={styles.roleCardSubtitle}>Login / Register</Text>
                            </View>
                        </View>
                        <View style={styles.roleButtonRow}>
                            <TouchableOpacity
                                style={styles.roleButton}
                                onPress={() => navigation.navigate('WorkerLogin')}
                            >
                                <Text style={styles.roleButtonText}>Login</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.roleButton}
                                onPress={() => navigation.navigate('WorkerRegistration')}
                            >
                                <Text style={styles.roleButtonText}>Register</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Establishment Access Card */}
                    <View style={styles.roleCard}>
                        <View style={styles.roleCardHeader}>
                            <Text style={styles.roleIcon}>🏢</Text>
                            <View>
                                <Text style={styles.roleCardTitle}>Establishment Access</Text>
                                <Text style={styles.roleCardSubtitle}>Login / Register</Text>
                            </View>
                        </View>
                        <View style={styles.roleButtonRow}>
                            <TouchableOpacity
                                style={styles.roleButton}
                                onPress={() => navigation.navigate('EstablishmentLogin')}
                            >
                                <Text style={styles.roleButtonText}>Login</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.roleButton, styles.roleButtonDisabled]}
                                disabled
                            >
                                <Text style={[styles.roleButtonText, { opacity: 0.5 }]}>Register</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Department Access Card */}
                    <View style={styles.roleCard}>
                        <View style={styles.roleCardHeader}>
                            <Text style={styles.roleIcon}>🏛️</Text>
                            <View>
                                <Text style={styles.roleCardTitle}>Department Access</Text>
                                <Text style={styles.roleCardSubtitle}>Login</Text>
                            </View>
                        </View>
                        <View style={styles.roleButtonRow}>
                            <TouchableOpacity
                                style={[styles.roleButton, { flex: 1 }]}
                                onPress={() => navigation.navigate('DepartmentLogin')}
                            >
                                <Text style={styles.roleButtonText}>Login</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footerBand}>
                    <Text style={styles.footerText}>
                        Government of Andhra Pradesh
                    </Text>
                    <Text style={styles.footerSubtext}>
                        Secure login powered by FIDO2
                    </Text>
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
    scrollContent: {
        flexGrow: 1,
    },
    // Header Band
    headerBand: {
        backgroundColor: '#ffcb05',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    logoText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    headerTextContainer: {
        flex: 1,
    },
    headerSubtitle: {
        fontSize: 11,
        color: '#1e293b',
        opacity: 0.7,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1e293b',
    },
    headerTagline: {
        fontSize: 10,
        color: '#1e293b',
        opacity: 0.6,
    },
    // Hero
    heroSection: {
        paddingHorizontal: 20,
        paddingVertical: 28,
        backgroundColor: '#f0f4f8',
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 12,
        lineHeight: 30,
    },
    heroDescription: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 20,
    },
    // Role Section
    roleSection: {
        paddingHorizontal: 20,
        paddingVertical: 24,
    },
    roleSectionLabel: {
        fontSize: 11,
        color: '#ea580c',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    roleSectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 20,
    },
    // Role Cards
    roleCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    roleCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    roleIcon: {
        fontSize: 28,
        marginRight: 12,
    },
    roleCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    roleCardSubtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    roleButtonRow: {
        flexDirection: 'row',
        gap: 10,
    },
    roleButton: {
        flex: 1,
        backgroundColor: '#ea580c',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    roleButtonDisabled: {
        opacity: 0.4,
    },
    roleButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    // Footer
    footerBand: {
        backgroundColor: '#ffcb05',
        paddingVertical: 16,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginTop: 'auto',
    },
    footerText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1e293b',
    },
    footerSubtext: {
        fontSize: 10,
        color: '#1e293b',
        opacity: 0.6,
        marginTop: 4,
    },
});
