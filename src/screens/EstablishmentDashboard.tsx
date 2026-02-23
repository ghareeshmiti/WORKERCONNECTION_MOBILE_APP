import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { AttendanceCheckIn } from '../components/AttendanceCheckIn';

type TabKey = 'home' | 'checkin' | 'workers' | 'attendance' | 'profile';

const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'home', label: 'Home', icon: '🏠' },
    { key: 'checkin', label: 'Check In/Out', icon: '📳' },
    { key: 'workers', label: 'Workers', icon: '👷' },
    { key: 'attendance', label: 'Attendance', icon: '📋' },
    { key: 'profile', label: 'Profile', icon: '🏢' },
];

const getTodayDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
};

export default function EstablishmentDashboard() {
    const { userContext, signOut } = useAuth();
    const [activeTab, setActiveTab] = useState<TabKey>('home');
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Data states
    const [establishment, setEstablishment] = useState<any>(null);
    const [workers, setWorkers] = useState<any[]>([]);
    const [todayStats, setTodayStats] = useState({ present: 0, partial: 0, absent: 0, total: 0 });
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

    const estId = userContext?.establishmentId;

    const fetchData = useCallback(async () => {
        if (!estId) return;
        try {
            // Fetch establishment profile
            const { data: estData } = await supabase
                .from('establishments')
                .select('*')
                .eq('id', estId)
                .maybeSingle();
            setEstablishment(estData);

            // Fetch mapped workers
            const { data: mappings } = await supabase
                .from('worker_mappings')
                .select(`
                    id,
                    worker_id,
                    mapped_at,
                    is_active,
                    workers (
                        id, worker_id, first_name, last_name, phone, status, district, is_active
                    )
                `)
                .eq('establishment_id', estId)
                .eq('is_active', true);
            setWorkers(mappings || []);

            // Fetch today's attendance
            const today = getTodayDate();
            const { data: attendanceData } = await supabase
                .from('attendance_daily_rollups')
                .select('*')
                .eq('establishment_id', estId)
                .eq('attendance_date', today);

            const totalWorkers = mappings?.length || 0;
            const present = attendanceData?.filter(a => a.status === 'PRESENT').length || 0;
            const partial = attendanceData?.filter(a => a.status === 'PARTIAL').length || 0;
            const absent = totalWorkers - present - partial;
            setTodayStats({ present, partial, absent, total: totalWorkers });

            // Fetch recent attendance (last 7 days)
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const { data: recentAttendance } = await supabase
                .from('attendance_daily_rollups')
                .select(`
                    *,
                    workers (first_name, last_name, worker_id)
                `)
                .eq('establishment_id', estId)
                .gte('attendance_date', weekAgo.toISOString().split('T')[0])
                .order('attendance_date', { ascending: false });
            setAttendanceRecords(recentAttendance || []);

        } catch (error) {
            console.error('Error fetching establishment data:', error);
        } finally {
            setLoading(false);
        }
    }, [estId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const filteredWorkers = workers.filter(m => {
        if (!searchQuery) return true;
        const w = m.workers;
        const q = searchQuery.toLowerCase();
        return (
            w?.first_name?.toLowerCase().includes(q) ||
            w?.last_name?.toLowerCase().includes(q) ||
            w?.worker_id?.toLowerCase().includes(q) ||
            w?.phone?.includes(q)
        );
    });

    // KPI Card component
    const KPICard = ({ title, value, color, icon }: { title: string; value: number; color: string; icon: string }) => (
        <View style={[styles.kpiCard, { borderLeftColor: color }]}>
            <Text style={styles.kpiIcon}>{icon}</Text>
            <Text style={[styles.kpiValue, { color }]}>{value}</Text>
            <Text style={styles.kpiTitle}>{title}</Text>
        </View>
    );

    const renderHome = () => (
        <View>
            <Text style={styles.sectionTitle}>Today's Overview</Text>
            <View style={styles.kpiRow}>
                <KPICard title="Total Workers" value={todayStats.total} color="#3b82f6" icon="👥" />
                <KPICard title="Present" value={todayStats.present} color="#16a34a" icon="✅" />
            </View>
            <View style={styles.kpiRow}>
                <KPICard title="Partial" value={todayStats.partial} color="#f59e0b" icon="⏰" />
                <KPICard title="Absent" value={todayStats.absent} color="#ef4444" icon="❌" />
            </View>

            {/* Attendance Rate */}
            <View style={styles.rateCard}>
                <Text style={styles.rateLabel}>Attendance Rate</Text>
                <Text style={styles.rateValue}>
                    {todayStats.total > 0 ? Math.round((todayStats.present / todayStats.total) * 100) : 0}%
                </Text>
            </View>

            {/* Quick Info */}
            {establishment && !establishment.is_approved && (
                <View style={styles.warningBanner}>
                    <Text style={styles.warningText}>⚠️ Your establishment is pending department approval</Text>
                </View>
            )}

            {/* Recent Activity */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Recent Attendance</Text>
            {attendanceRecords.slice(0, 5).map((record, idx) => (
                <View key={record.id || idx} style={styles.activityItem}>
                    <View style={styles.activityDot(record.status)} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.activityName}>
                            {record.workers?.first_name} {record.workers?.last_name}
                        </Text>
                        <Text style={styles.activityDate}>{record.attendance_date}</Text>
                    </View>
                    <View style={[styles.statusBadge, styles[`status${record.status}`]]}>
                        <Text style={styles.statusBadgeText}>{record.status}</Text>
                    </View>
                </View>
            ))}
            {attendanceRecords.length === 0 && (
                <Text style={styles.emptyText}>No attendance records yet</Text>
            )}
        </View>
    );

    const renderWorkers = () => (
        <View>
            <Text style={styles.sectionTitle}>Mapped Workers ({workers.length})</Text>
            <TextInput
                style={styles.searchInput}
                placeholder="Search workers..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            {filteredWorkers.map((mapping, idx) => {
                const w = mapping.workers;
                if (!w) return null;
                return (
                    <View key={mapping.id || idx} style={styles.workerCard}>
                        <View style={styles.workerAvatar}>
                            <Text style={styles.workerAvatarText}>
                                {(w.first_name?.[0] || '').toUpperCase()}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.workerName}>{w.first_name} {w.last_name}</Text>
                            <Text style={styles.workerInfo}>ID: {w.worker_id || 'N/A'}</Text>
                            <Text style={styles.workerInfo}>Phone: {w.phone || 'N/A'}</Text>
                        </View>
                        <View style={[
                            styles.workerStatusBadge,
                            { backgroundColor: w.status === 'active' ? '#dcfce7' : '#fef3c7' }
                        ]}>
                            <Text style={{
                                fontSize: 11,
                                color: w.status === 'active' ? '#16a34a' : '#f59e0b',
                                fontWeight: '600',
                            }}>{w.status || 'new'}</Text>
                        </View>
                    </View>
                );
            })}
            {filteredWorkers.length === 0 && (
                <Text style={styles.emptyText}>No workers found</Text>
            )}
        </View>
    );

    const renderAttendance = () => (
        <View>
            <Text style={styles.sectionTitle}>Attendance Report (Last 7 Days)</Text>
            {attendanceRecords.map((record, idx) => (
                <View key={record.id || idx} style={styles.attendanceRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.attendanceName}>
                            {record.workers?.first_name} {record.workers?.last_name}
                        </Text>
                        <Text style={styles.attendanceDate}>{record.attendance_date}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <View style={[styles.statusBadge, styles[`status${record.status}`]]}>
                            <Text style={styles.statusBadgeText}>{record.status}</Text>
                        </View>
                        {record.total_hours && (
                            <Text style={styles.hoursText}>{Number(record.total_hours).toFixed(1)}h</Text>
                        )}
                    </View>
                </View>
            ))}
            {attendanceRecords.length === 0 && (
                <Text style={styles.emptyText}>No attendance records in the last 7 days</Text>
            )}
        </View>
    );

    const renderProfile = () => (
        <View>
            <Text style={styles.sectionTitle}>Establishment Profile</Text>
            {establishment ? (
                <View style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                        <View style={styles.profileAvatar}>
                            <Text style={styles.profileAvatarText}>🏢</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.profileName}>{establishment.name}</Text>
                            <Text style={styles.profileCode}>Code: {establishment.code}</Text>
                        </View>
                    </View>

                    <View style={styles.profileDivider} />

                    <ProfileRow label="Type" value={establishment.establishment_type || '-'} />
                    <ProfileRow label="Construction" value={establishment.construction_type || '-'} />
                    <ProfileRow label="District" value={establishment.district || '-'} />
                    <ProfileRow label="State" value={establishment.state || '-'} />
                    <ProfileRow label="Mandal" value={establishment.mandal || '-'} />
                    <ProfileRow label="Phone" value={establishment.phone || '-'} />
                    <ProfileRow label="Email" value={establishment.email || '-'} />
                    <ProfileRow label="Contractor" value={establishment.contractor_name || '-'} />
                    <ProfileRow label="Expected Workers" value={String(establishment.estimated_workers || '-')} />

                    <View style={styles.profileDivider} />

                    <View style={styles.approvalRow}>
                        <Text style={styles.profileLabel}>Status</Text>
                        <View style={[
                            styles.approvalBadge,
                            { backgroundColor: establishment.is_approved ? '#dcfce7' : '#fef3c7' }
                        ]}>
                            <Text style={{
                                fontSize: 12,
                                fontWeight: '600',
                                color: establishment.is_approved ? '#16a34a' : '#f59e0b',
                            }}>
                                {establishment.is_approved ? 'Approved' : 'Pending Approval'}
                            </Text>
                        </View>
                    </View>
                </View>
            ) : (
                <Text style={styles.emptyText}>Profile not available</Text>
            )}
        </View>
    );

    const ProfileRow = ({ label, value }: { label: string; value: string }) => (
        <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>{label}</Text>
            <Text style={styles.profileValue}>{value}</Text>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ea580c" />
                    <Text style={styles.loadingText}>Loading dashboard...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>{userContext?.fullName || 'Establishment'}</Text>
                    <Text style={styles.headerSubtitle}>Establishment Dashboard</Text>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ea580c']} />}
            >
                {activeTab === 'home' && renderHome()}
                {activeTab === 'checkin' && (
                    <AttendanceCheckIn
                        establishmentName={establishment?.name || userContext?.fullName || 'Unknown'}
                        onCheckComplete={fetchData}
                    />
                )}
                {activeTab === 'workers' && renderWorkers()}
                {activeTab === 'attendance' && renderAttendance()}
                {activeTab === 'profile' && renderProfile()}
            </ScrollView>

            {/* Bottom Tabs */}
            <View style={styles.tabBar}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text style={styles.tabIcon}>{tab.icon}</Text>
                        <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: '#64748b', fontSize: 14 },

    // Header
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#ea580c',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    headerSubtitle: { fontSize: 12, color: '#fed7aa', marginTop: 2 },
    logoutButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
    logoutText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    // Content
    content: { flex: 1 },
    contentContainer: { padding: 16, paddingBottom: 20 },

    // Section
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },

    // KPI Cards
    kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    kpiCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14,
        borderLeftWidth: 4, elevation: 2,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
    },
    kpiIcon: { fontSize: 20, marginBottom: 4 },
    kpiValue: { fontSize: 24, fontWeight: '800' },
    kpiTitle: { fontSize: 11, color: '#64748b', marginTop: 2 },

    // Rate Card
    rateCard: {
        backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 6,
        alignItems: 'center', elevation: 2,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
    },
    rateLabel: { fontSize: 13, color: '#64748b' },
    rateValue: { fontSize: 36, fontWeight: '800', color: '#16a34a', marginTop: 4 },

    // Warning banner
    warningBanner: {
        backgroundColor: '#fef3c7', borderRadius: 8, padding: 12, marginTop: 12,
        borderLeftWidth: 4, borderLeftColor: '#f59e0b',
    },
    warningText: { fontSize: 13, color: '#92400e' },

    // Activity items
    activityItem: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 8, padding: 12, marginBottom: 8,
    },
    activityDot: (status: string) => ({
        width: 8, height: 8, borderRadius: 4, marginRight: 12,
        backgroundColor: status === 'PRESENT' ? '#16a34a' : status === 'PARTIAL' ? '#f59e0b' : '#ef4444',
    }),
    activityName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
    activityDate: { fontSize: 12, color: '#64748b', marginTop: 2 },

    // Status badge
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
    statusBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    statusPRESENT: { backgroundColor: '#16a34a' },
    statusPARTIAL: { backgroundColor: '#f59e0b' },
    statusABSENT: { backgroundColor: '#ef4444' },

    // Search
    searchInput: {
        borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8,
        padding: 10, fontSize: 14, backgroundColor: '#fff', marginBottom: 12,
    },

    // Worker Card
    workerCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 10, padding: 14, marginBottom: 8, elevation: 1,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
    },
    workerAvatar: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#ea580c',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    workerAvatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    workerName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
    workerInfo: { fontSize: 12, color: '#64748b', marginTop: 1 },
    workerStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },

    // Attendance Row
    attendanceRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 8, padding: 12, marginBottom: 8,
    },
    attendanceName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
    attendanceDate: { fontSize: 12, color: '#64748b', marginTop: 2 },
    hoursText: { fontSize: 11, color: '#64748b', marginTop: 4 },

    // Profile
    profileCard: {
        backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
    },
    profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    profileAvatar: {
        width: 50, height: 50, borderRadius: 12, backgroundColor: '#ea580c',
        justifyContent: 'center', alignItems: 'center',
    },
    profileAvatarText: { fontSize: 24 },
    profileName: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    profileCode: { fontSize: 13, color: '#64748b', marginTop: 2 },
    profileDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 12 },
    profileRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    profileLabel: { fontSize: 13, color: '#64748b' },
    profileValue: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
    approvalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    approvalBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },

    // Empty
    emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 14, padding: 20 },

    // Tab Bar
    tabBar: {
        flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0',
        paddingBottom: 4,
    },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
    tabActive: { borderTopWidth: 2, borderTopColor: '#ea580c' },
    tabIcon: { fontSize: 18, marginBottom: 2 },
    tabLabel: { fontSize: 10, color: '#94a3b8' },
    tabLabelActive: { color: '#ea580c', fontWeight: '600' },
} as any);
