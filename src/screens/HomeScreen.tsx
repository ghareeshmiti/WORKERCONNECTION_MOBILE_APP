import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    StatusBar,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen({ navigation }: any) {
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#FF6600" />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Orange Header Band */}
                <View style={styles.headerBand}>
                    <View style={styles.headerContent}>
                        {/* Left: AP Logo */}
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../assets/ap-logo.png')}
                                style={styles.apLogo}
                                resizeMode="contain"
                            />
                        </View>

                        {/* Center: Text */}
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerSubtitle}>GOVERNMENT OF ANDHRA PRADESH</Text>
                            <Text style={styles.headerTitle}>One State – One Card</Text>
                            <Text style={styles.headerTagline}>Official Identity & Access Portal</Text>
                        </View>

                        {/* Right: CM Photo */}
                        <View style={styles.cmPhotoContainer}>
                            <Image
                                source={require('../assets/cm.jpg')}
                                style={styles.cmPhoto}
                                resizeMode="cover"
                            />
                        </View>
                    </View>

                    {/* Stats Bar (Visual enhancement based on design) */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>50L+</Text>
                            <Text style={styles.statLabel}>Cards Issued</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>26</Text>
                            <Text style={styles.statLabel}>Districts</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>100+</Text>
                            <Text style={styles.statLabel}>Services</Text>
                        </View>
                    </View>
                </View>

                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.digitalIdentityBadge}>
                        <Text style={styles.digitalIdentityText}>🏛 DIGITAL IDENTITY INITIATIVE</Text>
                    </View>
                    <Text style={styles.heroTitle}>
                        One Card for All Your <Text style={{ color: '#ea580c' }}>Government Services</Text>
                    </Text>
                    <Text style={styles.heroDescription}>
                        Access benefits, verify identity, and connect with government
                        services seamlessly through a single unified card.
                    </Text>
                </View>

                {/* Role Access Section */}
                <View style={styles.roleSection}>
                    <Text style={styles.roleSectionLabel}>SELECT YOUR ROLE</Text>

                    {/* Worker Access Card */}
                    <View style={styles.roleCard}>
                        <View style={styles.roleCardHeader}>
                            <View style={styles.iconContainer}>
                                <Text style={styles.roleIcon}>👷</Text>
                            </View>
                            <View>
                                <Text style={styles.roleCardTitle}>Worker Access</Text>
                                <Text style={styles.roleCardSubtitle}>For registered workers & laborers</Text>
                            </View>
                            <View style={styles.arrowContainer}>
                                <Text style={styles.arrowIcon}>›</Text>
                            </View>
                        </View>
                        <View style={styles.roleButtonRow}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => navigation.navigate('WorkerLogin')}
                            >
                                <Text style={styles.primaryButtonText}>Login</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => navigation.navigate('WorkerRegistration')}
                            >
                                <Text style={styles.secondaryButtonText}>Register</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Establishment Access Card */}
                    <View style={styles.roleCard}>
                        <View style={styles.roleCardHeader}>
                            <View style={styles.iconContainer}>
                                <Text style={styles.roleIcon}>🏢</Text>
                            </View>
                            <View>
                                <Text style={styles.roleCardTitle}>Establishment Access</Text>
                                <Text style={styles.roleCardSubtitle}>For businesses & organizations</Text>
                            </View>
                            <View style={styles.arrowContainer}>
                                <Text style={styles.arrowIcon}>›</Text>
                            </View>
                        </View>
                        <View style={styles.roleButtonRow}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => navigation.navigate('EstablishmentLogin')}
                            >
                                <Text style={styles.primaryButtonText}>Login</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => navigation.navigate('EstablishmentRegistration')}
                            >
                                <Text style={styles.secondaryButtonText}>Register</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Department Access Card */}
                    <View style={styles.roleCard}>
                        <View style={styles.roleCardHeader}>
                            <View style={styles.iconContainer}>
                                <Text style={styles.roleIcon}>🏛️</Text>
                            </View>
                            <View>
                                <Text style={styles.roleCardTitle}>Department Access</Text>
                                <Text style={styles.roleCardSubtitle}>For government officials</Text>
                            </View>
                            <View style={styles.arrowContainer}>
                                <Text style={styles.arrowIcon}>›</Text>
                            </View>
                        </View>
                        <View style={styles.roleButtonRow}>
                            <TouchableOpacity
                                style={[styles.primaryButton, { flex: 1 }]}
                                onPress={() => navigation.navigate('DepartmentLogin')}
                            >
                                <Text style={styles.primaryButtonText}>Login</Text>
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
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
    },
    // Header Band
    headerBand: {
        backgroundColor: '#FF6600', // Orange color from image
        paddingTop: 10,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    logoContainer: {
        width: 60,
        height: 60,
        backgroundColor: '#fff',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    apLogo: {
        width: 40,
        height: 40,
    },
    headerTextContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    headerSubtitle: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '600',
        textTransform: 'uppercase',
        opacity: 0.9,
        textAlign: 'center',
        marginBottom: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        lineHeight: 22,
    },
    headerTagline: {
        fontSize: 10,
        color: '#fff',
        opacity: 0.8,
        textAlign: 'center',
    },
    cmPhotoContainer: {
        width: 54,
        height: 54,
        borderRadius: 27,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    cmPhoto: {
        width: '100%',
        height: '100%',
    },
    // Stats Bar
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.15)',
        marginHorizontal: 16,
        borderRadius: 12,
        paddingVertical: 12,
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    statLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 20,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    // Hero
    heroSection: {
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 10,
    },
    digitalIdentityBadge: {
        backgroundColor: '#fef3c7',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 16,
    },
    digitalIdentityText: {
        fontSize: 10,
        color: '#d97706',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 12,
        lineHeight: 32,
    },
    heroDescription: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 22,
    },
    // Role Section
    roleSection: {
        paddingHorizontal: 20,
        paddingVertical: 24,
    },
    roleSectionLabel: {
        fontSize: 12,
        color: '#d97706',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 20,
        textAlign: 'center',
    },
    // Role Cards
    roleCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#ea580c', // Orange shadow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#fff7ed', // Very light orange/white border
    },
    roleCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        backgroundColor: '#f97316', // Orange background for icon
        elevation: 2,
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    roleIcon: {
        fontSize: 24,
        color: '#fff',
    },
    roleCardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
    },
    roleCardSubtitle: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 2,
        fontWeight: '500',
    },
    arrowContainer: {
        marginLeft: 'auto',
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#fff7ed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrowIcon: {
        fontSize: 18,
        color: '#f97316',
        fontWeight: '700',
        lineHeight: 20,
    },
    roleButtonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    primaryButton: {
        flex: 1,
        backgroundColor: '#ea580c', // Orange
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#fdba74', // Light orange border
        paddingVertical: 12.5, // slightly less to account for border
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        color: '#ea580c',
        fontSize: 15,
        fontWeight: '700',
    },
    // Footer
    footerBand: {
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginTop: 'auto',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    footerText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    },
    footerSubtext: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 4,
    },
});
