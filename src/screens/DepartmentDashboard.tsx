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
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

type TabKey = 'home' | 'establishments' | 'workers' | 'profile';
type WorkerSubTab = 'mapped' | 'pending';

const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'home', label: 'Home', icon: '🏠' },
    { key: 'establishments', label: 'Sites', icon: '🏗️' },
    { key: 'workers', label: 'Workers', icon: '👷' },
    { key: 'profile', label: 'Profile', icon: '🏛️' },
];

const getTodayDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
};

export default function DepartmentDashboard() {
    const { userContext, signOut } = useAuth();
    const [activeTab, setActiveTab] = useState<TabKey>('home');
    const [workerSubTab, setWorkerSubTab] = useState<WorkerSubTab>('mapped');
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Data states
    const [department, setDepartment] = useState<any>(null);
    const [establishments, setEstablishments] = useState<any[]>([]);
    const [stats, setStats] = useState({ establishments: 0, totalWorkers: 0, presentToday: 0, attendanceRate: 0 });
    const [mappedWorkers, setMappedWorkers] = useState<any[]>([]);
    const [pendingWorkers, setPendingWorkers] = useState<any[]>([]);

    const deptId = userContext?.departmentId;

    const fetchData = useCallback(async () => {
        if (!deptId) return;
        const today = getTodayDate();

        try {
            // Fetch department profile
            const { data: deptData } = await supabase
                .from('departments')
                .select('*')
                .eq('id', deptId)
                .maybeSingle();
            setDepartment(deptData);

            // Fetch establishments with worker counts
            const { data: estList } = await supabase
                .from('establishments')
                .select('*')
                .eq('department_id', deptId)
                .order('name');

            const estIds = estList?.map(e => e.id) || [];

            // Enrich establishments with stats
            const enriched = await Promise.all((estList || []).map(async (est) => {
                const { count: workerCount } = await supabase
                    .from('worker_mappings')
                    .select('*', { count: 'exact', head: true })
                    .eq('establishment_id', est.id)
                    .eq('is_active', true);

                const { data: attData } = await supabase
                    .from('attendance_daily_rollups')
                    .select('status')
                    .eq('establishment_id', est.id)
                    .eq('attendance_date', today);

                const present = attData?.filter(a => a.status === 'PRESENT').length || 0;
                const total = workerCount || 0;

                return {
                    ...est,
                    workerCount: total,
                    presentToday: present,
                    attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
                };
            }));
            setEstablishments(enriched);

            // Calculate overall stats
            if (estIds.length > 0) {
                const { count: totalWorkerCount } = await supabase
                    .from('worker_mappings')
                    .select('*', { count: 'exact', head: true })
                    .in('establishment_id', estIds)
                    .eq('is_active', true);

                const { data: allAttendance } = await supabase
                    .from('attendance_daily_rollups')
                    .select('status')
                    .in('establishment_id', estIds)
                    .eq('attendance_date', today);

                const presentCount = allAttendance?.filter(a => a.status === 'PRESENT').length || 0;
                const total = totalWorkerCount || 0;

                setStats({
                    establishments: estList?.length || 0,
                    totalWorkers: total,
                    presentToday: presentCount,
                    attendanceRate: total > 0 ? Math.round((presentCount / total) * 100) : 0,
                });
            } else {
                setStats({ establishments: estList?.length || 0, totalWorkers: 0, presentToday: 0, attendanceRate: 0 });
            }

            // Fetch mapped workers
            if (estIds.length > 0) {
                const { data: mapped } = await supabase
                    .from('worker_mappings')
                    .select(`
                        id,
                        establishment_id,
                        establishments (name, code),
                        workers (*)
                    `)
                    .in('establishment_id', estIds)
                    .eq('is_active', true);
                setMappedWorkers(mapped || []);
            }

            // Fetch pending workers (status = 'new')
            const { data: pending } = await supabase
                .from('workers')
                .select('*')
                .eq('status', 'new')
                .order('created_at', { ascending: false });
            setPendingWorkers(pending || []);

        } catch (error) {
            console.error('Error fetching department data:', error);
        } finally {
            setLoading(false);
        }
    }, [deptId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const handleApproveWorker = async (workerId: string) => {
        try {
            const { error } = await supabase
                .from('workers')
                .update({ status: 'active', is_active: true })
                .eq('id', workerId);
            if (error) throw error;
            Alert.alert('Success', 'Worker approved successfully');
            fetchData();
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to approve worker');
        }
    };

    const handleRejectWorker = async (workerId: string) => {
        Alert.alert('Confirm', 'Are you sure you want to reject this worker?', [
            { text: 'Cancel' },
            {
                text: 'Reject', style: 'destructive', onPress: async () => {
                    try {
                        const { error } = await supabase
                            .from('workers')
                            .update({ status: 'rejected', is_active: false })
                            .eq('id', workerId);
                        if (error) throw error;
                        Alert.alert('Done', 'Worker rejected');
                        fetchData();
                    } catch (e: any) {
                        Alert.alert('Error', e.message || 'Failed to reject worker');
                    }
                }
            },
        ]);
    };

    // KPI Card
    const KPICard = ({ title, value, color, icon }: { title: string; value: number | string; color: string; icon: string }) => (
        <View style={[styles.kpiCard, { borderLeftColor: color }]}>
            <Text style={styles.kpiIcon}>{icon}</Text>
            <Text style={[styles.kpiValue, { color }]}>{value}</Text>
            <Text style={styles.kpiTitle}>{title}</Text>
        </View>
    );

    const renderHome = () => (
        <View>
            <Text style={styles.sectionTitle}>Department Overview</Text>
            <View style={styles.kpiRow}>
                <KPICard title="Establishments" value={stats.establishments} color="#3b82f6" icon="🏗️" />
                <KPICard title="Active Workers" value={stats.totalWorkers} color="#8b5cf6" icon="👥" />
            </View>
            <View style={styles.kpiRow}>
                <KPICard title="Present Today" value={stats.presentToday} color="#16a34a" icon="✅" />
                <KPICard title="Attendance %" value={`${stats.attendanceRate}%`} color="#ea580c" icon="📊" />
            </View>

            {/* Pending Approvals */}
            {pendingWorkers.length > 0 && (
                <View style={styles.alertBanner}>
                    <Text style={styles.alertText}>
                        🔔 {pendingWorkers.length} worker{pendingWorkers.length > 1 ? 's' : ''} pending approval
                    </Text>
                    <TouchableOpacity onPress={() => { setActiveTab('workers'); setWorkerSubTab('pending'); }}>
                        <Text style={styles.alertLink}>Review →</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Top Establishments */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Establishments</Text>
            {establishments.slice(0, 5).map((est, idx) => (
                <View key={est.id || idx} style={styles.estQuickCard}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.estQuickName}>{est.name}</Text>
                        <Text style={styles.estQuickInfo}>{est.workerCount} workers</Text>
                    </View>
                    <View style={styles.estQuickRate}>
                        <Text style={styles.estQuickRateText}>{est.attendanceRate}%</Text>
                    </View>
                </View>
            ))}
            {establishments.length === 0 && (
                <Text style={styles.emptyText}>No establishments registered</Text>
            )}
        </View>
    );

    const renderEstablishments = () => (
        <View>
            <Text style={styles.sectionTitle}>All Establishments ({establishments.length})</Text>
            {establishments.map((est, idx) => (
                <View key={est.id || idx} style={styles.estCard}>
                    <View style={styles.estCardHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.estCardName}>{est.name}</Text>
                            <Text style={styles.estCardCode}>Code: {est.code}</Text>
                        </View>
                        <View style={[
                            styles.approvalBadge,
                            { backgroundColor: est.is_approved ? '#dcfce7' : '#fef3c7' }
                        ]}>
                            <Text style={{
                                fontSize: 10, fontWeight: '600',
                                color: est.is_approved ? '#16a34a' : '#f59e0b',
                            }}>{est.is_approved ? 'Approved' : 'Pending'}</Text>
                        </View>
                    </View>
                    <View style={styles.estCardStats}>
                        <View style={styles.estStat}>
                            <Text style={styles.estStatValue}>{est.workerCount}</Text>
                            <Text style={styles.estStatLabel}>Workers</Text>
                        </View>
                        <View style={styles.estStat}>
                            <Text style={[styles.estStatValue, { color: '#16a34a' }]}>{est.presentToday}</Text>
                            <Text style={styles.estStatLabel}>Present</Text>
                        </View>
                        <View style={styles.estStat}>
                            <Text style={[styles.estStatValue, { color: '#ea580c' }]}>{est.attendanceRate}%</Text>
                            <Text style={styles.estStatLabel}>Rate</Text>
                        </View>
                    </View>
                    {est.district && (
                        <Text style={styles.estCardLocation}>📍 {est.district}{est.mandal ? `, ${est.mandal}` : ''}</Text>
                    )}
                </View>
            ))}
            {establishments.length === 0 && (
                <Text style={styles.emptyText}>No establishments under this department</Text>
            )}
        </View>
    );

    const renderWorkers = () => {
        const filteredMapped = mappedWorkers.filter(m => {
            if (!searchQuery) return true;
            const w = m.workers;
            const q = searchQuery.toLowerCase();
            return (
                w?.first_name?.toLowerCase().includes(q) ||
                w?.last_name?.toLowerCase().includes(q) ||
                w?.worker_id?.toLowerCase().includes(q)
            );
        });

        const filteredPending = pendingWorkers.filter(w => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (
                w?.first_name?.toLowerCase().includes(q) ||
                w?.last_name?.toLowerCase().includes(q) ||
                w?.worker_id?.toLowerCase().includes(q)
            );
        });

        return (
            <View>
                {/* Sub-tabs */}
                <View style={styles.subTabs}>
                    <TouchableOpacity
                        style={[styles.subTab, workerSubTab === 'mapped' && styles.subTabActive]}
                        onPress={() => setWorkerSubTab('mapped')}
                    >
                        <Text style={[styles.subTabText, workerSubTab === 'mapped' && styles.subTabTextActive]}>
                            Mapped ({mappedWorkers.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.subTab, workerSubTab === 'pending' && styles.subTabActive]}
                        onPress={() => setWorkerSubTab('pending')}
                    >
                        <Text style={[styles.subTabText, workerSubTab === 'pending' && styles.subTabTextActive]}>
                            Pending ({pendingWorkers.length})
                        </Text>
                    </TouchableOpacity>
                </View>

                <TextInput
                    style={styles.searchInput}
                    placeholder="Search workers..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />

                {workerSubTab === 'mapped' && (
                    <>
                        {filteredMapped.map((mapping, idx) => {
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
                                        <Text style={styles.workerInfo}>
                                            Site: {(mapping.establishments as any)?.name || 'N/A'}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                        {filteredMapped.length === 0 && (
                            <Text style={styles.emptyText}>No mapped workers found</Text>
                        )}
                    </>
                )}

                {workerSubTab === 'pending' && (
                    <>
                        {filteredPending.map((w, idx) => (
                            <View key={w.id || idx} style={styles.pendingCard}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.workerName}>{w.first_name} {w.last_name}</Text>
                                    <Text style={styles.workerInfo}>ID: {w.worker_id || 'N/A'}</Text>
                                    <Text style={styles.workerInfo}>Phone: {w.phone || 'N/A'}</Text>
                                    <Text style={styles.workerInfo}>District: {w.district || 'N/A'}</Text>
                                </View>
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={styles.approveButton}
                                        onPress={() => handleApproveWorker(w.id)}
                                    >
                                        <Text style={styles.approveButtonText}>✓</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.rejectButton}
                                        onPress={() => handleRejectWorker(w.id)}
                                    >
                                        <Text style={styles.rejectButtonText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                        {filteredPending.length === 0 && (
                            <Text style={styles.emptyText}>No pending workers</Text>
                        )}
                    </>
                )}
            </View>
        );
    };

    const renderProfile = () => (
        <View>
            <Text style={styles.sectionTitle}>Department Profile</Text>
            {department ? (
                <View style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                        <View style={styles.profileAvatar}>
                            <Text style={styles.profileAvatarText}>🏛️</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.profileName}>{department.name}</Text>
                            <Text style={styles.profileCode}>Code: {department.code}</Text>
                        </View>
                    </View>

                    <View style={styles.profileDivider} />

                    <ProfileRow label="State" value={department.state || '-'} />
                    <ProfileRow label="District" value={department.district || '-'} />
                    <ProfileRow label="Mandal" value={department.mandal || '-'} />
                    <ProfileRow label="Phone" value={department.phone || '-'} />
                    <ProfileRow label="Email" value={department.email || '-'} />
                    <ProfileRow label="Description" value={department.description || '-'} />

                    <View style={styles.profileDivider} />

                    <ProfileRow label="Total Establishments" value={String(stats.establishments)} />
                    <ProfileRow label="Total Workers" value={String(stats.totalWorkers)} />
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
                    <ActivityIndicator size="large" color="#16a34a" />
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
                    <Text style={styles.headerTitle}>{userContext?.fullName || 'Department'}</Text>
                    <Text style={styles.headerSubtitle}>Department Dashboard</Text>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16a34a']} />}
            >
                {activeTab === 'home' && renderHome()}
                {activeTab === 'establishments' && renderEstablishments()}
                {activeTab === 'workers' && renderWorkers()}
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
        paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#16a34a',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    headerSubtitle: { fontSize: 12, color: '#bbf7d0', marginTop: 2 },
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

    // Alert Banner
    alertBanner: {
        backgroundColor: '#eff6ff', borderRadius: 8, padding: 12, marginTop: 12,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderLeftWidth: 4, borderLeftColor: '#3b82f6',
    },
    alertText: { fontSize: 13, color: '#1e40af', flex: 1 },
    alertLink: { fontSize: 13, fontWeight: '700', color: '#3b82f6' },

    // Establishment Quick Card
    estQuickCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 8, padding: 12, marginBottom: 8, elevation: 1,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
    },
    estQuickName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
    estQuickInfo: { fontSize: 12, color: '#64748b', marginTop: 2 },
    estQuickRate: {
        width: 48, height: 48, borderRadius: 24, backgroundColor: '#f0fdf4',
        justifyContent: 'center', alignItems: 'center',
    },
    estQuickRateText: { fontSize: 13, fontWeight: '800', color: '#16a34a' },

    // Establishment Card
    estCard: {
        backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
    },
    estCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    estCardName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
    estCardCode: { fontSize: 12, color: '#64748b', marginTop: 2 },
    estCardStats: { flexDirection: 'row', marginTop: 12, gap: 16 },
    estStat: { alignItems: 'center' },
    estStatValue: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
    estStatLabel: { fontSize: 10, color: '#64748b', marginTop: 2 },
    estCardLocation: { fontSize: 12, color: '#64748b', marginTop: 10 },

    // Approval Badge
    approvalBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },

    // Sub-tabs
    subTabs: { flexDirection: 'row', marginBottom: 12, gap: 8 },
    subTab: {
        flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#fff',
        alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0',
    },
    subTabActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
    subTabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    subTabTextActive: { color: '#fff' },

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
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#16a34a',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    workerAvatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    workerName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
    workerInfo: { fontSize: 12, color: '#64748b', marginTop: 1 },

    // Pending Card
    pendingCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 10, padding: 14, marginBottom: 8, elevation: 1,
        borderLeftWidth: 4, borderLeftColor: '#f59e0b',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
    },
    actionButtons: { flexDirection: 'row', gap: 8 },
    approveButton: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: '#dcfce7',
        justifyContent: 'center', alignItems: 'center',
    },
    approveButtonText: { fontSize: 16, fontWeight: '700', color: '#16a34a' },
    rejectButton: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: '#fee2e2',
        justifyContent: 'center', alignItems: 'center',
    },
    rejectButtonText: { fontSize: 16, fontWeight: '700', color: '#ef4444' },

    // Profile
    profileCard: {
        backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
    },
    profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    profileAvatar: {
        width: 50, height: 50, borderRadius: 12, backgroundColor: '#16a34a',
        justifyContent: 'center', alignItems: 'center',
    },
    profileAvatarText: { fontSize: 24 },
    profileName: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    profileCode: { fontSize: 13, color: '#64748b', marginTop: 2 },
    profileDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 12 },
    profileRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    profileLabel: { fontSize: 13, color: '#64748b' },
    profileValue: { fontSize: 13, fontWeight: '600', color: '#1e293b', flex: 1, textAlign: 'right' },

    // Empty
    emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 14, padding: 20 },

    // Tab Bar
    tabBar: {
        flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0',
        paddingBottom: 4,
    },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
    tabActive: { borderTopWidth: 2, borderTopColor: '#16a34a' },
    tabIcon: { fontSize: 18, marginBottom: 2 },
    tabLabel: { fontSize: 10, color: '#94a3b8' },
    tabLabelActive: { color: '#16a34a', fontWeight: '600' },
});
