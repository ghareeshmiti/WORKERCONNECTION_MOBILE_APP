import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Image,
    RefreshControl,
    Platform,
    SafeAreaView,
    Alert,
    Modal,
    Dimensions,
    TextInput,
} from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { WorkerProfile, AttendanceRecord } from '../types';
import DigitalCard from '../components/DigitalCard';

// Mock Data for Schemes
const SCHEMES_DATA = [
    {
        id: '1',
        title: 'Pradhan Mantri Shram Yogi Maandhan (PM-SYM)',
        category: 'Central',
        description: 'Pension scheme for unorganized workers providing ₹3,000 per month after age 60.',
        benefit: 'Pension: ₹3,000/mo',
        eligible: true,
        availed: false,
    },
    {
        id: '2',
        title: 'BOCW Workers Welfare Fund',
        category: 'Welfare Board',
        description: 'Financial assistance for construction workers including education support for children.',
        benefit: 'Cash: ₹25,000',
        eligible: true,
        availed: false,
    },
    {
        id: '3',
        title: 'ESI Medical Benefits',
        category: 'Central',
        description: 'Comprehensive medical care for workers and dependents through ESI hospitals.',
        benefit: 'Insurance coverage',
        eligible: true,
        availed: false,
    },
    {
        id: '4',
        title: 'Aadabidda Nidhi',
        category: 'State',
        description: 'Monthly financial assistance of ₹1,500 for women (18-59 years).',
        benefit: 'Cash: ₹1,500/mo',
        eligible: true,
        availed: false,
    },
    {
        id: '5',
        title: 'Yuva Galam',
        category: 'State',
        description: 'A monthly unemployment allowance of ₹3,000 for youth.',
        benefit: 'Cash: ₹3,000/mo',
        eligible: true,
        availed: false,
    },
    {
        id: '6',
        title: 'Annadata Sukhibhava',
        category: 'State',
        description: 'Direct financial aid of ₹20,000 annually to farmers.',
        benefit: 'Cash: ₹20,000/yr',
        eligible: true,
        availed: false,
    },
    {
        id: '7',
        title: 'YSR Cheyutha',
        category: 'State',
        description: 'Financial assistance for women aged 45-60.',
        benefit: 'Financial Aid',
        eligible: true,
        availed: true,
    },
];



export default function DashboardScreen() {
    const { userContext, signOut } = useAuth();
    const [profile, setProfile] = useState<WorkerProfile | null>(null);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'home' | 'attendance' | 'schemes' | 'profile' | 'health' | 'more' | 'grievances' | 'help'>('home');
    const [showDigitalCard, setShowDigitalCard] = useState(false);

    // Date Filter State
    const [filterType, setFilterType] = useState<'this_month' | 'last_month' | 'last_7_days' | 'last_30_days'>('this_month');
    const [showFilterModal, setShowFilterModal] = useState(false);

    // Health Tab State
    const [selectedFamilyMember, setSelectedFamilyMember] = useState('All Family Members');
    const [selectedHospital, setSelectedHospital] = useState('All Hospitals');
    const [showFamilyModal, setShowFamilyModal] = useState(false);
    const [showHospitalModal, setShowHospitalModal] = useState(false);

    const FAMILY_MEMBERS = ['All Family Members', 'Self', 'Spouse', 'Child 1', 'Child 2', 'Father', 'Mother'];
    const HOSPITALS = ['All Hospitals', 'ESI Hospital, Vijayawada', 'Govt General Hospital, Krishna', 'Apollo Clinic', 'Sunrise Hospital'];

    // Schemes State
    const [activeSchemeTab, setActiveSchemeTab] = useState<'eligible' | 'availed'>('eligible');
    const [activeSchemeFilter, setActiveSchemeFilter] = useState<'All' | 'State' | 'Central' | 'Welfare Board'>('All');

    // Grievances State
    const [activeGrievanceTab, setActiveGrievanceTab] = useState<'list' | 'raise'>('list');
    const [grievanceFilter, setGrievanceFilter] = useState<'All' | 'Submitted' | 'In Progress' | 'Resolved'>('All');
    const [grievanceCategory, setGrievanceCategory] = useState('');
    const [grievanceDescription, setGrievanceDescription] = useState('');

    // Help State
    // (No specific complex state needed yet, just activeTab switch)

    const GRIEVANCES_DATA = [
        {
            id: 'GRV-2026-00045',
            category: 'Attendance & Wages',
            title: 'Attendance & Wages',
            description: 'My attendance for 25th December 2025 was not recorded even though I was present at the site. I have my site entry register proof.',
            status: 'In Progress',
            date: '10 Jan 2026',
            sla: '25 Jan 2026',
            badgeColor: '#fff7ed',
            badgeTextColor: '#c2410c'
        },
        {
            id: 'GRV-2025-00892',
            category: 'Schemes & Benefits',
            title: 'Schemes & Benefits',
            description: 'I have not received the quarterly benefit amount for BOCW scheme for Q3 2025.',
            status: 'Resolved',
            date: '05 Nov 2025',
            sla: '20 Nov 2025',
            badgeColor: '#f0fdf4',
            badgeTextColor: '#16a34a'
        },
        {
            id: 'GRV-2026-00102',
            category: 'Workplace Safety',
            title: 'Workplace Safety',
            description: 'Safety helmets and gloves are not being provided at the new construction site B.',
            status: 'Submitted',
            date: '12 Feb 2026',
            sla: '19 Feb 2026',
            badgeColor: '#eff6ff',
            badgeTextColor: '#3b82f6'
        },
        {
            id: 'GRV-2026-00105',
            category: 'Harassment',
            title: 'Harassment',
            description: 'Supervisor at Site A is using abusive language.',
            status: 'Submitted',
            date: '13 Feb 2026',
            sla: '20 Feb 2026',
            badgeColor: '#eff6ff',
            badgeTextColor: '#3b82f6'
        },
        {
            id: 'GRV-2025-00750',
            category: 'Facilities',
            title: 'Facilities',
            description: 'No clean drinking water facility available at the labor camp.',
            status: 'Resolved',
            date: '01 Oct 2025',
            sla: '05 Oct 2025',
            badgeColor: '#f0fdf4',
            badgeTextColor: '#16a34a'
        }
    ];

    const FAQS_DATA = [
        { q: 'How do I change my mobile number?', a: 'You can update your mobile number by visiting the nearest MeeSeva center with your Aadhaar card.' },
        { q: 'I don\'t see my schemes – what should I do?', a: 'Ensure your worker registration is active. If issues persist, raise a grievance under "Schemes & Benefits".' },
        { q: 'How do I reset my PIN?', a: 'Go to Profile > Settings > Change PIN to update your security PIN.' },
        { q: 'My attendance is not showing correctly.', a: 'Please contact your site supervisor immediately or raise a grievance.' },
        { q: 'How can I add a family member for health benefits?', a: 'You can add family members through the Profile section or by submitting a request at the welfare board office.' },
        { q: 'When will I receive my scheme benefits?', a: 'Benefits are typically processed within 30-45 days of application approval.' }
    ];

    useEffect(() => {
        if (userContext?.workerId) {
            fetchData();
        }
    }, [userContext?.workerId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch worker profile
            const { data: profileData } = await supabase
                .from('workers')
                .select('*')
                .eq('id', userContext?.workerId)
                .single();

            if (profileData) {
                setProfile(profileData);
            }

            // Fetch recent attendance
            const { data: attendanceData } = await supabase
                .from('attendance_daily_rollups')
                .select('*')
                .eq('worker_id', userContext?.workerId)
                .order('attendance_date', { ascending: false })
                .limit(30);

            if (attendanceData) {
                // Add 4 dummy records for demonstration as per user request
                const dummyRecords: any[] = [
                    {
                        id: 'dummy-1',
                        attendance_date: new Date().toISOString().split('T')[0],
                        status: 'PRESENT',
                        total_hours: 8.5,
                        worker_id: userContext?.workerId || 'demo',
                        first_checkin_at: new Date().toISOString(),
                        last_checkout_at: new Date(Date.now() + 8.5 * 3600000).toISOString(),
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 'dummy-2',
                        attendance_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                        status: 'PRESENT',
                        total_hours: 8.0,
                        worker_id: userContext?.workerId || 'demo',
                        first_checkin_at: new Date(Date.now() - 86400000 + 9 * 3600000).toISOString(),
                        last_checkout_at: new Date(Date.now() - 86400000 + 17 * 3600000).toISOString(),
                        created_at: new Date(Date.now() - 86400000).toISOString()
                    },
                    {
                        id: 'dummy-3',
                        attendance_date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
                        status: 'ABSENT',
                        total_hours: 0,
                        worker_id: userContext?.workerId || 'demo',
                        first_checkin_at: null,
                        last_checkout_at: null,
                        created_at: new Date(Date.now() - 172800000).toISOString()
                    },
                    {
                        id: 'dummy-4',
                        attendance_date: new Date(Date.now() - 259200000).toISOString().split('T')[0],
                        status: 'PRESENT',
                        total_hours: 7.5,
                        worker_id: userContext?.workerId || 'demo',
                        first_checkin_at: new Date(Date.now() - 259200000 + 9.5 * 3600000).toISOString(),
                        last_checkout_at: new Date(Date.now() - 259200000 + 17 * 3600000).toISOString(),
                        created_at: new Date(Date.now() - 259200000).toISOString()
                    },
                ];
                setAttendance([...attendanceData, ...dummyRecords]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            // Fallback data for demo
            setProfile({
                id: userContext?.workerId || 'demo-id',
                worker_id: userContext?.workerId || 'WKR12345',
                first_name: 'Hareesh',
                last_name: 'Kumar',
                aadhaar_last_four: '1234',
                phone: '9876543210',
                email: 'demo@example.com',
                district: 'Visakhapatnam',
                status: 'Active',
                job_role: 'NREGA Worker',
            } as any);

            setAttendance([
                { id: '1', attendance_date: '2023-10-25', status: 'Present', total_hours: 8.5, worker_id: 'WKR12345' },
                { id: '2', attendance_date: '2023-10-24', status: 'Present', total_hours: 8.0, worker_id: 'WKR12345' },
                { id: '3', attendance_date: '2023-10-23', status: 'Absent', total_hours: 0, worker_id: 'WKR12345' },
            ] as any);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', onPress: () => signOut(), style: 'destructive' },
            ]
        );
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View>
                <Text style={styles.headerTitle}>Hi, {profile?.first_name || 'Worker'} 👋</Text>
                <Text style={styles.headerSubtitle}>Welcome to your dashboard</Text>
            </View>
            <TouchableOpacity onPress={() => setActiveTab('profile')} style={styles.headerProfileButton}>
                {profile?.photo_url && typeof profile.photo_url === 'string' && profile.photo_url.trim() !== '' ? (
                    <Image source={{ uri: profile.photo_url }} style={styles.headerProfilePhoto} />
                ) : (
                    <View style={styles.headerProfilePlaceholder}>
                        <Text style={styles.headerProfileInitial}>
                            {profile?.first_name?.charAt(0) || 'W'}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );

    const renderHome = () => (
        <ScrollView
            style={styles.content}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
            contentContainerStyle={styles.scrollContent}
        >
            {/* Quick Stats */}
            <View style={styles.statsGrid}>
                <TouchableOpacity
                    style={styles.statCard}
                    onPress={() => setActiveTab('attendance')}
                >
                    <Text style={styles.statValue}>22</Text>
                    <Text style={styles.statLabel}>Days Present</Text>
                </TouchableOpacity>
                {/* Highlight Card - Earnings */}
                <View style={[styles.statCard, styles.highlightCard, styles.earningsCard]}>
                    <View>
                        <Text style={[styles.earningValueSmall, styles.highlightText]}>₹2,500</Text>
                        <Text style={[styles.earningLabelSmall, styles.highlightText]}>This Month</Text>
                    </View>
                    <View style={styles.earningDivider} />
                    <View>
                        <Text style={[styles.earningValueSmall, styles.highlightText]}>₹9,500</Text>
                        <Text style={[styles.earningLabelSmall, styles.highlightText]}>This Year</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.statCard}
                    onPress={() => setActiveTab('schemes')}
                >
                    <Text style={styles.statValue}>3</Text>
                    <Text style={styles.statLabel}>Active Schemes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.statCard}
                    onPress={() => setActiveTab('more')}
                >
                    <Text style={styles.statValue}>1</Text>
                    <Text style={styles.statLabel}>Grievances</Text>
                </TouchableOpacity>
            </View>

            {/* Recent Attendance Preview */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Logic</Text>
                    <TouchableOpacity onPress={() => setActiveTab('attendance')}>
                        <Text style={styles.seeAllText}>See All</Text>
                    </TouchableOpacity>
                </View>

                {attendance.length > 0 ? (
                    attendance.slice(0, 3).map((record) => (
                        <View key={record.id} style={styles.attendanceRow}>
                            <View style={styles.attendanceBadges}>
                                <Text style={record.status === 'PRESENT' ? styles.badgePresent : styles.badgeAbsent}>
                                    {record.status}
                                </Text>
                            </View>
                            <Text style={styles.attendanceDate}>{record.attendance_date}</Text>
                            <Text style={styles.attendanceHours}>
                                {record.total_hours ? `${record.total_hours.toFixed(1)} hrs` : '-'}
                            </Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>No recent records</Text>
                )}
            </View>

            {/* Notifications Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notifications</Text>
                <View style={styles.notificationCard}>
                    <View style={styles.notificationIconContainer}>
                        <Text style={styles.notificationIcon}>💰</Text>
                    </View>
                    <View style={styles.notificationContent}>
                        <Text style={styles.notificationTitle}>Payment Credited</Text>
                        <Text style={styles.notificationText}>₹2,500 credited to your bank account ending in **89.</Text>
                        <Text style={styles.notificationTime}>2 hours ago</Text>
                    </View>
                </View>
                <View style={styles.notificationCard}>
                    <View style={[styles.notificationIconContainer, styles.bgBlue]}>
                        <Text style={styles.notificationIcon}>🎁</Text>
                    </View>
                    <View style={styles.notificationContent}>
                        <Text style={styles.notificationTitle}>New Scheme Available</Text>
                        <Text style={styles.notificationText}>You are eligible for 'YSR Rythu Bharosa'. Check details now.</Text>
                        <Text style={styles.notificationTime}>Yesterday</Text>
                    </View>
                </View>
                <View style={styles.notificationCard}>
                    <View style={[styles.notificationIconContainer, styles.bgGreen]}>
                        <Text style={styles.notificationIcon}>✅</Text>
                    </View>
                    <View style={styles.notificationContent}>
                        <Text style={styles.notificationTitle}>Profile Verified</Text>
                        <Text style={styles.notificationText}>Your worker profile has been successfully verified by the MDO.</Text>
                        <Text style={styles.notificationTime}>2 days ago</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );

    const renderAttendance = () => {
        // Calculate Summary Data
        const today = new Date().toISOString().split('T')[0];
        const statusToday = attendance.find(r => r.attendance_date === today);
        const currentMonth = new Date().getMonth();
        const daysPresent = attendance.filter(r => {
            const date = new Date(r.attendance_date);
            return date.getMonth() === currentMonth && r.status === 'PRESENT';
        }).length;
        const partialDays = 0;

        // Filter Logic
        const getFilteredAttendance = () => {
            const now = new Date();
            let filtered = [...attendance];
            const today = new Date(); // Reset time part if needed for precise day comparison, but simplistic approach below

            switch (filterType) {
                case 'this_month':
                    filtered = attendance.filter(r => {
                        const d = new Date(r.attendance_date);
                        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    });
                    break;
                case 'last_month':
                    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    filtered = attendance.filter(r => {
                        const d = new Date(r.attendance_date);
                        return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
                    });
                    break;
                case 'last_7_days':
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(now.getDate() - 7);
                    filtered = attendance.filter(r => new Date(r.attendance_date) >= sevenDaysAgo);
                    break;
                case 'last_30_days':
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(now.getDate() - 30);
                    filtered = attendance.filter(r => new Date(r.attendance_date) >= thirtyDaysAgo);
                    break;
            }
            return filtered;
        };

        const filteredRecords = getFilteredAttendance();

        // Helper to get display text for Date Picker Button
        const getFilterDisplayText = () => {
            switch (filterType) {
                case 'this_month': return 'This Month';
                case 'last_month': return 'Last Month';
                case 'last_7_days': return 'Last 7 Days';
                case 'last_30_days': return 'Last 30 Days';
                default: return 'Select Date Range';
            }
        };

        return (
            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Attendance Summary Cards */}
                <View style={styles.statsGrid}>
                    {/* Today's Status */}
                    <View style={styles.statCard}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.cardTitle}>Today's Status</Text>
                            <Text style={styles.infoIcon}>🕒</Text>
                        </View>

                        <View style={statusToday?.status === 'PRESENT' ? styles.statusBadgePresent : styles.statusBadgeAbsent}>
                            <Text style={statusToday?.status === 'PRESENT' ? styles.statusTextPresent : styles.statusTextAbsent}>
                                {statusToday?.status || 'Absent'}
                            </Text>
                        </View>

                        <Text style={styles.tinyText}>
                            In: {statusToday?.first_checkin_at ? new Date(statusToday.first_checkin_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'} | Out: {statusToday?.last_checkout_at ? new Date(statusToday.last_checkout_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </Text>
                    </View>

                    {/* This Month */}
                    <View style={styles.statCard}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.cardTitle}>This Month</Text>
                            <Text style={styles.infoIcon}>📅</Text>
                        </View>
                        <View style={styles.rowAlignEnd}>
                            <Text style={styles.largeValue}>{daysPresent}</Text>
                            <Text style={styles.valueSubtext}>/30</Text>
                        </View>
                        <Text style={styles.tinyText}>Days present</Text>
                    </View>

                    {/* Partial Days */}
                    <View style={styles.statCard}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.cardTitle}>Partial Days</Text>
                            <Text style={styles.infoIcon}>⚠️</Text>
                        </View>
                        <Text style={[styles.largeValue, { color: '#f97316' }]}>{partialDays}</Text>
                        <Text style={styles.tinyText}>Incomplete attendance</Text>
                    </View>

                    {/* Worker ID */}
                    <View style={styles.statCard}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.cardTitle}>Worker ID</Text>
                            <Text style={styles.infoIcon}>👤</Text>
                        </View>
                        <Text style={styles.workerIdText} numberOfLines={1} ellipsizeMode='middle'>
                            {profile?.worker_id || 'WKR-XXX-YYY'}
                        </Text>
                        <Text style={styles.tinyText}>Use for remote check-in</Text>
                    </View>
                </View>

                {/* Attendance Report List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Attendance Report</Text>
                    {/* Date Filter Mock */}
                    <View style={styles.filterRow}>
                        <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => setShowFilterModal(true)}
                        >
                            <Text style={styles.datePickerText}>{getFilterDisplayText()} ▼</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.exportButton}>
                            <Text style={styles.exportButtonText}>⬇ CSV</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderText, { flex: 2 }]}>Date</Text>
                        <Text style={[styles.tableHeaderText, { flex: 2 }]}>In - Out</Text>
                        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Hrs</Text>
                        <Text style={[styles.tableHeaderText, { flex: 2, textAlign: 'right' }]}>Status</Text>
                    </View>

                    {filteredRecords.length > 0 ? (
                        filteredRecords.map((record, index) => (
                            <View key={record.id || index} style={styles.tableRow}>
                                <Text style={[styles.tableCell, { flex: 2 }]}>{record.attendance_date}</Text>
                                <Text style={[styles.tableCell, { flex: 2 }]}>
                                    {record.first_checkin_at ? new Date(record.first_checkin_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'} - {record.last_checkout_at ? new Date(record.last_checkout_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                                </Text>
                                <Text style={[styles.tableCell, { flex: 1 }]}>
                                    {record.total_hours ? record.total_hours.toFixed(1) + 'h' : '-'}
                                </Text>
                                <View style={{ flex: 2, alignItems: 'flex-end' }}>
                                    <View style={record.status === 'PRESENT' ? styles.pillPresent : styles.pillAbsent}>
                                        <Text style={styles.pillText}>{record.status}</Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No records found for this period.</Text>
                    )}
                </View>

                {/* Static Charts Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Attendance Analysis</Text>
                    <View style={styles.chartContainer}>
                        <Text style={styles.chartTitle}>Attendance Distribution</Text>
                        <View style={styles.donutChartContainer}>
                            <View style={styles.donutChart} />
                            <View style={styles.donutLegend}>
                                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} /><Text style={styles.legendText}>Present</Text></View>
                                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} /><Text style={styles.legendText}>Absent</Text></View>
                                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#f97316' }]} /><Text style={styles.legendText}>Partial</Text></View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.chartContainer}>
                        <Text style={styles.chartTitle}>Weekly Hours Trend</Text>
                        <View style={styles.barChartContainer}>
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                                <View key={day} style={styles.barColumn}>
                                    <View style={[styles.barFill, { height: ([60, 50, 70, 40, 65, 20, 0][i] + '%') as any }]} />
                                    <Text style={styles.barLabel}>{day}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>
        );
    };

    const renderSchemes = () => {
        // Filter Logic
        const filteredSchemes = SCHEMES_DATA.filter(scheme => {
            const matchesTab = activeSchemeTab === 'eligible' ? scheme.eligible && !scheme.availed : scheme.availed;
            const matchesCategory = activeSchemeFilter === 'All' || scheme.category === activeSchemeFilter;
            return matchesTab && matchesCategory;
        });

        return (
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
            >
                <Text style={styles.pageTitle}>Schemes</Text>

                {/* Tab Switcher */}
                <View style={styles.schemeTabContainer}>
                    <TouchableOpacity
                        style={[styles.schemeTabButton, activeSchemeTab === 'eligible' && styles.schemeTabActive]}
                        onPress={() => setActiveSchemeTab('eligible')}
                    >
                        <Text style={[styles.schemeTabText, activeSchemeTab === 'eligible' && styles.schemeTabTextActive]}>Eligible for you</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.schemeTabButton, activeSchemeTab === 'availed' && styles.schemeTabActive]}
                        onPress={() => setActiveSchemeTab('availed')}
                    >
                        <Text style={[styles.schemeTabText, activeSchemeTab === 'availed' && styles.schemeTabTextActive]}>Availed by you</Text>
                    </TouchableOpacity>
                </View>

                {/* Category Filters */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
                    {['All', 'State', 'Central', 'Welfare Board'].map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            style={[styles.filterPill, activeSchemeFilter === filter && styles.filterPillActive]}
                            onPress={() => setActiveSchemeFilter(filter as any)}
                        >
                            <Text style={[styles.filterPillText, activeSchemeFilter === filter && styles.filterPillTextActive]}>{filter}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Scheme List */}
                {filteredSchemes.length > 0 ? (
                    filteredSchemes.map((scheme) => (
                        <View key={scheme.id} style={styles.schemeCardNew}>
                            <View style={styles.schemeHeaderRow}>
                                <View style={styles.schemeTagContainer}>
                                    <Text style={styles.schemeTagText}>{scheme.category}</Text>
                                    <View style={styles.schemeTagCheck}><Text style={styles.checkIcon}>✓</Text></View>
                                    <Text style={styles.schemeTagLabel}>Eligible</Text>
                                </View>
                                {activeSchemeTab === 'eligible' && (
                                    <TouchableOpacity style={styles.applyButton}>
                                        <Text style={styles.applyButtonText}>Apply Now</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <Text style={styles.schemeTitleNew}>{scheme.title}</Text>
                            <Text style={styles.schemeDescNew}>{scheme.description}</Text>

                            <View style={styles.schemeFooterRow}>
                                <View style={styles.schemeBenefitBadge}>
                                    <Text style={styles.schemeBenefitText}>{scheme.benefit}</Text>
                                </View>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No schemes found.</Text>
                    </View>
                )}
            </ScrollView>
        );
    };

    const renderHealth = () => {
        const HEALTH_RECORDS = [
            {
                id: '1',
                title: 'General Checkup',
                status: 'Completed',
                familyMember: 'Self',
                patientName: 'Ramesh Kumar',
                hospital: 'ESI Hospital, Vijayawada',
                type: 'OP',
                department: 'ESI - Gen',
                date: '12 Jan 2026',
                cost: '₹0',
                subCost: 'ESI Covered',
                icon: '👤',
                badgeColor: '#eff6ff',
                badgeTextColor: '#3b82f6'
            },
            {
                id: '2',
                title: 'Full Body Checkup',
                status: 'Completed',
                familyMember: 'Spouse',
                patientName: 'Lakshmi',
                hospital: 'Govt General Hospital, Krishna',
                type: 'Diagnostics',
                department: 'Govt Scheme',
                date: '20 Dec 2025',
                cost: '₹0',
                subCost: 'Aarogyasri',
                icon: '👩',
                badgeColor: '#f0fdf4',
                badgeTextColor: '#16a34a'
            },
            {
                id: '3',
                title: 'Vaccination (Polio)',
                status: 'Completed',
                familyMember: 'Child 1',
                patientName: 'Raju',
                hospital: 'Apollo Clinic',
                type: 'Pediatrics',
                department: 'Private',
                date: '05 Feb 2026',
                cost: '₹500',
                subCost: 'Paid',
                icon: '👶',
                badgeColor: '#fff7ed',
                badgeTextColor: '#c2410c'
            },
            {
                id: '4',
                title: 'Dental Checkup',
                status: 'Scheduled',
                familyMember: 'Child 2',
                patientName: 'Sita',
                hospital: 'Sunrise Hospital',
                type: 'Dental',
                department: 'Private',
                date: '15 Feb 2026',
                cost: '₹800',
                subCost: 'Consultation',
                icon: '🦷',
                badgeColor: '#fef2f2',
                badgeTextColor: '#b91c1c'
            },
            {
                id: '5',
                title: 'Eye Checkup',
                status: 'Completed',
                familyMember: 'Father',
                patientName: 'Venkatesh',
                hospital: 'ESI Hospital, Vijayawada',
                type: 'Ophthalmology',
                department: 'ESI',
                date: '10 Jan 2026',
                cost: '₹0',
                subCost: 'ESI Covered',
                icon: '👓',
                badgeColor: '#eff6ff',
                badgeTextColor: '#3b82f6'
            },
            {
                id: '6',
                title: 'Diabetes Checkup',
                status: 'Pending',
                familyMember: 'Mother',
                patientName: 'Savitri',
                hospital: 'Govt General Hospital, Krishna',
                type: 'General',
                department: 'Govt',
                date: '28 Feb 2026',
                cost: 'FREE',
                subCost: 'Govt Aid',
                icon: '💊',
                badgeColor: '#f0fdf4',
                badgeTextColor: '#16a34a'
            },
            {
                id: '7',
                title: 'Viral Fever',
                status: 'Treated',
                familyMember: 'Self',
                patientName: 'Ramesh Kumar',
                hospital: 'Apollo Clinic',
                type: 'Emergency',
                department: 'Private',
                date: '01 Nov 2025',
                cost: '₹1,200',
                subCost: 'Paid',
                icon: '🌡️',
                badgeColor: '#fff7ed',
                badgeTextColor: '#c2410c'
            },
            {
                id: '8',
                title: 'Maternity Checkup',
                status: 'Completed',
                familyMember: 'Spouse',
                patientName: 'Lakshmi',
                hospital: 'Sunrise Hospital',
                type: 'Gynecology',
                department: 'Private',
                date: '15 Oct 2025',
                cost: '₹2,500',
                subCost: 'Insurance',
                icon: '🤰',
                badgeColor: '#fef2f2',
                badgeTextColor: '#b91c1c'
            }
        ];

        const filteredRecords = HEALTH_RECORDS.filter(record => {
            const matchFamily = selectedFamilyMember === 'All Family Members' || record.familyMember === selectedFamilyMember;
            const matchHospital = selectedHospital === 'All Hospitals' || record.hospital === selectedHospital;
            return matchFamily && matchHospital;
        });

        return (
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
            >
                <Text style={styles.pageTitle}>Health Records</Text>

                {/* Vitals Grid */}
                <View style={styles.vitalsGrid}>
                    <View style={styles.vitalCard}>
                        <View style={styles.vitalIconContainer}><Text style={styles.vitalIcon}>❤️</Text></View>
                        <Text style={styles.vitalLabel}>Blood Group</Text>
                        <Text style={styles.vitalValue}>B+</Text>
                    </View>
                    <View style={styles.vitalCard}>
                        <View style={[styles.vitalIconContainer, { backgroundColor: '#e0f2fe' }]}><Text style={styles.vitalIcon}>⚖️</Text></View>
                        <Text style={styles.vitalLabel}>Weight</Text>
                        <Text style={styles.vitalValue}>68 kg</Text>
                    </View>
                    <View style={styles.vitalCard}>
                        <View style={[styles.vitalIconContainer, { backgroundColor: '#dcfce7' }]}><Text style={styles.vitalIcon}>🕒</Text></View>
                        <Text style={styles.vitalLabel}>Blood Pressure</Text>
                        <Text style={styles.vitalValue}>120/80</Text>
                    </View>
                    <View style={styles.vitalCard}>
                        <View style={[styles.vitalIconContainer, { backgroundColor: '#ffedd5' }]}><Text style={styles.vitalIcon}>📅</Text></View>
                        <Text style={styles.vitalLabel}>Next Checkup</Text>
                        <Text style={styles.vitalValue}>12 Apr 2026</Text>
                    </View>
                </View>

                {/* Checkup History */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Checkup History</Text>
                    <TouchableOpacity><Text style={styles.seeAllText}>View All</Text></TouchableOpacity>
                </View>

                {/* Filters */}
                <View style={styles.filterRow}>
                    <TouchableOpacity
                        style={[styles.datePickerButton, { flex: 1.5 }]}
                        onPress={() => setShowFamilyModal(true)}
                    >
                        <Text style={styles.datePickerText}>{selectedFamilyMember} ▼</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.datePickerButton, { flex: 1 }]}
                        onPress={() => setShowHospitalModal(true)}
                    >
                        <Text style={styles.datePickerText}>{selectedHospital} ▼</Text>
                    </TouchableOpacity>
                </View>

                {/* Dynamic List */}
                {filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => (
                        <View key={record.id} style={styles.checkupCard}>
                            <View style={styles.checkupHeader}>
                                <Text style={styles.checkupTitle}>{record.title}</Text>
                                <View style={styles.checkupBadge}><Text style={styles.checkupBadgeText}>{record.status}</Text></View>
                            </View>
                            <View style={styles.checkupRow}>
                                <Text style={styles.checkupDetailIcon}>{record.icon}</Text>
                                <Text style={styles.checkupDetailText}>{record.patientName} <Text style={styles.checkupTag}>{record.familyMember}</Text></Text>
                            </View>
                            <View style={styles.checkupRow}>
                                <Text style={styles.checkupDetailIcon}>🏥</Text>
                                <Text style={styles.checkupDetailText}>{record.hospital}</Text>
                            </View>
                            <View style={styles.tagRow}>
                                <View style={styles.miniTag}><Text style={styles.miniTagText}>{record.type}</Text></View>
                                <View style={[styles.miniTag, { backgroundColor: record.badgeColor }]}><Text style={[styles.miniTagText, { color: record.badgeTextColor }]}>{record.department}</Text></View>
                            </View>
                            <View style={styles.checkupFooter}>
                                <Text style={styles.checkupDate}>{record.date}</Text>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.checkupCost}>{record.cost}</Text>
                                    <Text style={styles.checkupSubCost}>{record.subCost}</Text>
                                </View>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={[styles.emptyState, { marginTop: 20 }]}>
                        <Text style={styles.emptyText}>No records found matching filters.</Text>
                    </View>
                )}
            </ScrollView>
        );
    };
    const renderProfile = () => {
        // Enriched mock data matching the design (since data might not be in backend yet)
        const displayProfile = {
            ...profile,
            designation: 'Site Supervisor',
            email: profile?.email || 'ramesh.kumar@email.com',
            address_line: '123, Andhrapradesh, vijayawada, ayodhya nagger pin code 5000032, NTR DT',
            identifiers: [
                { type: 'WID', label: 'WORKER ID', value: profile?.worker_id || 'WKR-AP-2026-7107308093' },
                { type: 'ES', label: 'E-SHRAM NUMBER', value: '455222736053' },
                { type: 'BO', label: 'BOCW REGISTRATION', value: 'ABOCWWB/32/2025/1/55069988' },
                { type: 'ESI', label: 'ESI NUMBER', value: '5222736053' },
                { type: 'PF', label: 'PF NUMBER', value: 'AP/MAS/0054055/000/0000250' },
                { type: 'MG', label: 'MGNREGS', value: 'AP-03-033-035-034/060016' },
                { type: 'TU', label: 'TRADE UNION NUMBER', value: 'H-165' },
            ],
            family_members: [
                { name: `${profile?.first_name} ${profile?.last_name}`, relation: 'Self • Family', is_health_covered: true },
                { name: 'Ramesh Kumar', relation: 'Self • Family', is_health_covered: true }, // Duplicate in design? keeping as per mockup
                { name: 'Lakshmi Kumar', relation: 'Spouse • Family', is_health_covered: true },
                { name: 'Sanjay Kumar', relation: 'Child • Family', is_health_covered: true },
                { name: 'Venkata Rao', relation: 'Parent • Family', is_health_covered: true },
            ],
            documents: [
                { title: 'Aadhaar Card', type: 'ID Proof', uploaded_on: '10 Mar 2022', url: '#' },
                { title: 'Voter ID', type: 'ID Proof', uploaded_on: '10 Mar 2022', url: '#' },
                { title: 'Ration Card', type: 'Address Proof', uploaded_on: '10 Mar 2022', url: '#' },
                { title: 'BOCW Registration', type: 'Registration Certificate', uploaded_on: '20 Aug 2021', url: '#' },
                { title: 'e-Shram Card', type: 'Registration Certificate', uploaded_on: '15 May 2022', url: '#' },
            ]
        };

        return (
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.pageTitle}>Profile & Documents</Text>

                {/* Personal Details Section */}
                <View style={styles.profileSection}>
                    <View style={styles.profileSectionHeader}>
                        <Text style={styles.profileSectionTitleIcon}>👤</Text>
                        <Text style={styles.profileSectionTitle}>Personal Details</Text>
                        <TouchableOpacity style={styles.editButton}>
                            <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.profileCardContent}>
                        <View style={styles.profileHeaderRow}>
                            {profile?.photo_url && typeof profile.photo_url === 'string' && profile.photo_url.trim() !== '' ? (
                                <Image source={{ uri: profile.photo_url }} style={styles.profilePhotoLarge} />
                            ) : (
                                <View style={styles.profilePhotoPlaceholderLarge}>
                                    <Text style={styles.profileInitialLarge}>{profile?.first_name?.charAt(0) || 'W'}</Text>
                                </View>
                            )}
                            <View style={styles.profileBasicInfo}>
                                <View style={styles.infoGrid}>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabelSmall}>FULL NAME</Text>
                                        <Text style={styles.infoValueDark}>{displayProfile.first_name} {displayProfile.last_name}</Text>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabelSmall}>GENDER</Text>
                                        <Text style={styles.infoValueDark}>{displayProfile.gender || 'Male'}</Text>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabelSmall}>DESIGNATION</Text>
                                        <Text style={styles.infoValueDark}>{displayProfile.designation}</Text>
                                    </View>
                                </View>
                                <View style={[styles.infoGrid, { marginTop: 16 }]}>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabelSmall}>DATE OF BIRTH</Text>
                                        <Text style={styles.infoValueDark}>{displayProfile.date_of_birth || '22 Jan 1976'}</Text>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabelSmall}>MOBILE</Text>
                                        <Text style={styles.infoValueDark}>{displayProfile.phone || '9884704849'}</Text>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabelSmall}>EMAIL</Text>
                                        <Text style={styles.infoValueDark}>{displayProfile.email}</Text>
                                    </View>
                                </View>
                                <View style={[styles.infoItem, { marginTop: 16 }]}>
                                    <Text style={styles.infoLabelSmall}>ADDRESS</Text>
                                    <Text style={styles.infoValueDark}>{displayProfile.address_line}</Text>
                                </View>
                                <TouchableOpacity style={styles.editPhotoButton}>
                                    <Text style={styles.editPhotoText}>Edit Photo</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Worker Identifiers Section */}
                <View style={styles.profileSection}>
                    <View style={styles.profileSectionHeader}>
                        <Text style={styles.profileSectionTitleIcon}>🪪</Text>
                        <Text style={styles.profileSectionTitle}>Worker Identifiers</Text>
                    </View>
                    <View style={styles.identifiersGrid}>
                        {displayProfile.identifiers.map((id, index) => (
                            <View key={index} style={styles.identifierCard}>
                                <View style={[styles.idBadge, getBadgeStyle(id.type)]}>
                                    <Text style={[styles.idBadgeText, getBadgeTextStyle(id.type)]}>{id.type}</Text>
                                </View>
                                <View>
                                    <Text style={styles.idLabel}>{id.label}</Text>
                                    <Text style={styles.idValue}>{id.value}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Family Members Section */}
                <View style={styles.profileSection}>
                    <View style={styles.profileSectionHeader}>
                        <Text style={styles.profileSectionTitleIcon}>👥</Text>
                        <Text style={styles.profileSectionTitle}>Family Members</Text>
                    </View>
                    <View style={styles.familyList}>
                        {displayProfile.family_members.map((member, index) => (
                            <View key={index} style={styles.familyCard}>
                                <View style={styles.familyIconPlaceholder}>
                                    <Text style={styles.familyIconText}>👤</Text>
                                </View>
                                <View style={styles.familyInfo}>
                                    <Text style={styles.familyName}>{member.name}</Text>
                                    <Text style={styles.familyRelation}>{member.relation}</Text>
                                </View>
                                {member.is_health_covered && (
                                    <View style={styles.healthBadge}>
                                        <Text style={styles.healthBadgeText}>Health Covered</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Documents Section */}
                <View style={[styles.profileSection, { marginBottom: 20 }]}>
                    <View style={styles.profileSectionHeader}>
                        <Text style={styles.profileSectionTitleIcon}>📍</Text>
                        <Text style={styles.profileSectionTitle}>Documents</Text>
                    </View>
                    <View style={styles.documentsGrid}>
                        {displayProfile.documents.map((doc, index) => (
                            <View key={index} style={styles.documentCard}>
                                <View>
                                    <Text style={styles.docTitle}>{doc.title}</Text>
                                    <Text style={styles.docType}>{doc.type}</Text>
                                    <Text style={styles.docDate}>Uploaded: {doc.uploaded_on}</Text>
                                </View>
                                <TouchableOpacity>
                                    <Text style={styles.viewLink}>View</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>

            </ScrollView>
        );
    };

    // Helper functions for badges
    const getBadgeStyle = (type: string) => {
        switch (type) {
            case 'WID': return { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1 };
            case 'ES': return { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: 1 };
            case 'BO': return { backgroundColor: '#fff7ed', borderColor: '#fed7aa', borderWidth: 1 };
            default: return { backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1 };
        }
    };

    const getBadgeTextStyle = (type: string) => {
        switch (type) {
            case 'WID': return { color: '#1d4ed8' };
            case 'ES': return { color: '#15803d' };
            case 'BO': return { color: '#c2410c' };
            default: return { color: '#64748b' };
        }
    };

    const renderGrievances = () => {
        const filteredGrievances = grievanceFilter === 'All'
            ? GRIEVANCES_DATA
            : GRIEVANCES_DATA.filter(g => g.status === grievanceFilter);

        return (
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.pageTitle}>Grievances</Text>

                {/* Tab Switcher */}
                <View style={styles.tabSwitcher}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeGrievanceTab === 'list' && styles.tabButtonActive]}
                        onPress={() => setActiveGrievanceTab('list')}
                    >
                        <Text style={[styles.tabButtonText, activeGrievanceTab === 'list' && styles.tabButtonTextActive]}>My Grievances</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeGrievanceTab === 'raise' && styles.tabButtonActive]}
                        onPress={() => setActiveGrievanceTab('raise')}
                    >
                        <Text style={[styles.tabButtonText, activeGrievanceTab === 'raise' && styles.tabButtonTextActive]}>Raise New</Text>
                    </TouchableOpacity>
                </View>

                {activeGrievanceTab === 'list' ? (
                    <>
                        {/* Filter Pills */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                            {['All', 'Submitted', 'In Progress', 'Resolved'].map((filter) => (
                                <TouchableOpacity
                                    key={filter}
                                    style={[styles.filterPill, grievanceFilter === filter && styles.filterPillActive]}
                                    onPress={() => setGrievanceFilter(filter as any)}
                                >
                                    <Text style={[styles.filterPillText, grievanceFilter === filter && styles.filterPillTextActive]}>{filter}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* List */}
                        {filteredGrievances.map((item) => (
                            <View key={item.id} style={styles.checkupCard}>
                                <View style={styles.checkupHeader}>
                                    <Text style={styles.checkupTitle}>{item.id}</Text>
                                    <View style={[styles.checkupBadge, { backgroundColor: item.badgeColor }]}>
                                        <Text style={[styles.checkupBadgeText, { color: item.badgeTextColor }]}>{item.status}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.vitalLabel, { marginTop: 4, marginBottom: 4, fontSize: 16, color: '#1e293b' }]}>{item.title}</Text>
                                <Text style={[styles.vitalValue, { fontSize: 13, fontWeight: '400', marginBottom: 8, color: '#64748b' }]}>{item.description}</Text>

                                <View style={styles.attendanceDivider} />

                                <View style={styles.attendanceFooter}>
                                    <Text style={styles.attendanceLabel}>Created: {item.date}</Text>
                                    <Text style={styles.attendanceLabel}>SLA: {item.sla}</Text>
                                </View>
                            </View>
                        ))}
                        <TouchableOpacity
                            style={styles.floatingActionButton}
                            onPress={() => setActiveGrievanceTab('raise')}
                        >
                            <Text style={styles.floatingActionText}>+ Raise New</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <View style={styles.formContainer}>
                        <Text style={styles.formLabel}>Service Category</Text>
                        <View style={styles.pickerContainer}>
                            <Text style={styles.pickerText}>Select a service...</Text>
                        </View>

                        <Text style={styles.formLabel}>Description</Text>
                        <TextInput
                            style={styles.textArea}
                            placeholder="Please describe your issue in detail..."
                            multiline
                            numberOfLines={4}
                            value={grievanceDescription}
                            onChangeText={setGrievanceDescription}
                            textAlignVertical="top"
                        />

                        <View style={styles.formActions}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => setActiveGrievanceTab('list')}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.button}>
                                <Text style={styles.buttonText}>Submit Grievance</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        );
    };

    const renderHelp = () => (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.pageTitle}>Help & Support</Text>

            <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Frequently Asked Questions</Text>
                {FAQS_DATA.map((faq, index) => (
                    <View key={index} style={styles.faqItem}>
                        <Text style={styles.faqQuestion}>{faq.q}</Text>
                        <Text style={styles.faqAnswer}>{faq.a}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Contact Support</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Head Office</Text>
                    <Text style={styles.infoValue}>Vijayawada</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Toll Free</Text>
                    <Text style={styles.infoValue}>155214</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>support@worker.ap.gov.in</Text>
                </View>
            </View>

            <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Give Feedback</Text>
                <TextInput
                    style={styles.textArea}
                    placeholder="Share your suggestions..."
                    multiline
                    numberOfLines={3}
                />
                <TouchableOpacity style={[styles.button, { marginTop: 12 }]}>
                    <Text style={styles.buttonText}>Submit Feedback</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    const renderMore = () => (
        <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
        >
            <Text style={styles.pageTitle}>More Options</Text>

            <View style={styles.gridContainer}>
                <TouchableOpacity
                    style={styles.gridButton}
                    onPress={() => {
                        setActiveTab('grievances');
                        setActiveGrievanceTab('list');
                    }}
                >
                    <Text style={styles.gridIcon}>📝</Text>
                    <Text style={styles.gridLabel}>Grievances</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.gridButton}
                    onPress={() => setActiveTab('health')}
                >
                    <Text style={styles.gridIcon}>🏥</Text>
                    <Text style={styles.gridLabel}>Health Records</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.gridButton}
                    onPress={() => setActiveTab('help')}
                >
                    <Text style={styles.gridIcon}>❓</Text>
                    <Text style={styles.gridLabel}>Help & Support</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.gridButton, styles.logoutGridButton]} onPress={handleLogout}>
                    <Text style={styles.gridIcon}>🚪</Text>
                    <Text style={[styles.gridLabel, styles.logoutText]}>Logout</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header (Only on Home tab usually, but good to keep consistent or hide on profile) */}
            {activeTab === 'home' && renderHeader()}

            {/* Main Content Area */}
            <View style={styles.mainContainer}>
                {activeTab === 'home' && renderHome()}
                {activeTab === 'attendance' && renderAttendance()}
                {activeTab === 'schemes' && renderSchemes()}
                {activeTab === 'profile' && renderProfile()}
                {activeTab === 'health' && renderHealth()}
                {activeTab === 'grievances' && renderGrievances()}
                {activeTab === 'help' && renderHelp()}
                {activeTab === 'more' && renderMore()}
            </View>

            {/* Bottom Navigation Bar */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}>
                    <TabIcon name="🏠" label="Home" active={activeTab === 'home'} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('attendance')}>
                    <TabIcon name="📅" label="Attendance" active={activeTab === 'attendance'} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('schemes')}>
                    <TabIcon name="🎁" label="Schemes" active={activeTab === 'schemes'} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('profile')}>
                    <TabIcon name="👤" label="Profile" active={activeTab === 'profile'} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('more')}>
                    <TabIcon name="⚙️" label="More" active={activeTab === 'more'} />
                </TouchableOpacity>
            </View>

            {/* Digital Card Modal */}
            {profile && (
                <DigitalCard
                    visible={showDigitalCard}
                    onClose={() => setShowDigitalCard(false)}
                    workerData={{
                        worker_id: profile.worker_id,
                        first_name: profile.first_name,
                        last_name: profile.last_name,
                        aadhaar_last_four: profile.aadhaar_last_four,
                        phone: profile.phone,
                    }}
                />
            )}

            {/* Date Filter Modal */}
            <Modal
                transparent={true}
                visible={showFilterModal}
                animationType="fade"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowFilterModal(false)}
                >
                    <View style={styles.filterModalContent}>
                        <Text style={styles.filterModalTitle}>Select Time Period</Text>

                        <TouchableOpacity
                            style={[styles.filterOption, filterType === 'last_7_days' && styles.filterOptionActive]}
                            onPress={() => { setFilterType('last_7_days'); setShowFilterModal(false); }}
                        >
                            <Text style={[styles.filterOptionText, filterType === 'last_7_days' && styles.filterOptionTextActive]}>Last 7 Days</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.filterOption, filterType === 'last_30_days' && styles.filterOptionActive]}
                            onPress={() => { setFilterType('last_30_days'); setShowFilterModal(false); }}
                        >
                            <Text style={[styles.filterOptionText, filterType === 'last_30_days' && styles.filterOptionTextActive]}>Last 30 Days</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.filterOption, filterType === 'this_month' && styles.filterOptionActive]}
                            onPress={() => { setFilterType('this_month'); setShowFilterModal(false); }}
                        >
                            <Text style={[styles.filterOptionText, filterType === 'this_month' && styles.filterOptionTextActive]}>This Month</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.filterOption, filterType === 'last_month' && styles.filterOptionActive]}
                            onPress={() => { setFilterType('last_month'); setShowFilterModal(false); }}
                        >
                            <Text style={[styles.filterOptionText, filterType === 'last_month' && styles.filterOptionTextActive]}>Last Month</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.filterCloseButton}
                            onPress={() => setShowFilterModal(false)}
                        >
                            <Text style={styles.filterCloseText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Family Member Modal */}
            <Modal
                transparent={true}
                visible={showFamilyModal}
                animationType="fade"
                onRequestClose={() => setShowFamilyModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowFamilyModal(false)}
                >
                    <View style={styles.filterModalContent}>
                        <Text style={styles.filterModalTitle}>Select Family Member</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {FAMILY_MEMBERS.map((member) => (
                                <TouchableOpacity
                                    key={member}
                                    style={[styles.filterOption, selectedFamilyMember === member && styles.filterOptionActive]}
                                    onPress={() => { setSelectedFamilyMember(member); setShowFamilyModal(false); }}
                                >
                                    <Text style={[styles.filterOptionText, selectedFamilyMember === member && styles.filterOptionTextActive]}>{member}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.filterCloseButton}
                            onPress={() => setShowFamilyModal(false)}
                        >
                            <Text style={styles.filterCloseText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Hospital Modal */}
            <Modal
                transparent={true}
                visible={showHospitalModal}
                animationType="fade"
                onRequestClose={() => setShowHospitalModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowHospitalModal(false)}
                >
                    <View style={styles.filterModalContent}>
                        <Text style={styles.filterModalTitle}>Select Hospital</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {HOSPITALS.map((hospital) => (
                                <TouchableOpacity
                                    key={hospital}
                                    style={[styles.filterOption, selectedHospital === hospital && styles.filterOptionActive]}
                                    onPress={() => { setSelectedHospital(hospital); setShowHospitalModal(false); }}
                                >
                                    <Text style={[styles.filterOptionText, selectedHospital === hospital && styles.filterOptionTextActive]}>{hospital}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.filterCloseButton}
                            onPress={() => setShowHospitalModal(false)}
                        >
                            <Text style={styles.filterCloseText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    mainContainer: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 80, // Extra padding for bottom nav
    },
    // Header
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#64748b',
    },
    headerProfileButton: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    headerProfilePhoto: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    headerProfilePlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ea580c',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerProfileInitial: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },

    // Bottom Nav
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
        height: Platform.OS === 'ios' ? 80 : 60,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    navItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabIcon: {
        fontSize: 20,
        marginBottom: 2,
        opacity: 0.5,
    },
    tabIconActive: {
        opacity: 1,
        transform: [{ scale: 1.1 }],
    },
    tabLabel: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '500',
    },
    tabLabelActive: {
        color: '#ea580c',
        fontWeight: '700',
    },

    // Dashboard Home
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        width: '48%',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    highlightCard: {
        backgroundColor: '#fff7ed', // Light Orange
        borderColor: '#fdba74',
    },

    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    highlightText: {
        color: '#ea580c',
    },
    // Earnings Card
    earningsCard: {
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    earningValueSmall: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
    },
    earningLabelSmall: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: '500',
    },
    earningDivider: {
        height: 1,
        backgroundColor: '#fdba74',
        marginVertical: 4,
        opacity: 0.5,
    },

    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 8,
    },
    seeAllText: {
        fontSize: 12,
        color: '#ea580c',
        fontWeight: '600',
    },
    primaryButton: {
        backgroundColor: '#ea580c',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },

    // Recent Attendance List
    attendanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    attendanceBadges: {
        width: 80,
    },
    badgePresent: {
        backgroundColor: '#dcfce7',
        color: '#166534',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        fontSize: 10,
        fontWeight: '700',
        textAlign: 'center',
        overflow: 'hidden',
    },
    badgeAbsent: {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        fontSize: 10,
        fontWeight: '700',
        textAlign: 'center',
        overflow: 'hidden',
    },
    attendanceDate: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#334155',
        fontWeight: '500',
    },
    attendanceHours: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },

    // Attendance Tab
    pageTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 16,
    },
    attendanceCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#ea580c',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    attendanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    attendanceDateLarge: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    statusPresent: {
        color: '#16a34a',
        fontWeight: '700',
    },
    statusAbsent: {
        color: '#dc2626',
        fontWeight: '700',
    },
    attendanceDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginBottom: 12,
    },
    attendanceFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    attendanceLabel: {
        color: '#64748b',
        fontSize: 12,
    },
    attendanceValue: {
        color: '#1e293b',
        fontWeight: '600',
    },

    // Attendance Tab
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    infoIcon: {
        fontSize: 16,
    },
    statusBadgePresent: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 4,
    },
    statusBadgeAbsent: {
        backgroundColor: '#fee2e2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 4,
    },
    statusTextPresent: {
        color: '#166534',
        fontWeight: '700',
        fontSize: 12,
    },
    statusTextAbsent: {
        color: '#991b1b',
        fontWeight: '700',
        fontSize: 12,
    },
    tinyText: {
        fontSize: 10,
        color: '#94a3b8',
    },
    rowAlignEnd: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    largeValue: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1e293b',
        lineHeight: 38,
    },
    valueSubtext: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
        marginBottom: 6,
    },
    workerIdText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    datePickerButton: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 10,
        justifyContent: 'center',
    },
    datePickerText: {
        fontSize: 13,
        color: '#334155',
        fontWeight: '500',
    },
    exportButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ea580c',
        borderRadius: 8,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    exportButtonText: {
        fontSize: 13,
        color: '#ea580c',
        fontWeight: '600',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    tableHeaderText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        alignItems: 'center',
    },
    tableCell: {
        fontSize: 13,
        color: '#334155',
    },
    pillPresent: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    pillAbsent: {
        backgroundColor: '#fee2e2',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    pillText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#1e293b', // Generic color, specific color handled by parent/context if needed, or adjust
    },

    // Charts
    chartContainer: {
        marginBottom: 24,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 16,
    },
    donutChartContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
    },
    donutChart: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 16,
        borderColor: '#e2e8f0',
        borderLeftColor: '#22c55e', // Mock segment
        borderTopColor: '#22c55e',
        transform: [{ rotate: '45deg' }],
    },
    donutLegend: {
        justifyContent: 'center',
        gap: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    barChartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 150,
        paddingTop: 20,
    },
    barColumn: {
        alignItems: 'center',
        width: 24,
        height: '100%',
        justifyContent: 'flex-end',
        gap: 8,
    },
    barFill: {
        width: '100%',
        backgroundColor: '#ea580c',
        borderRadius: 4,
        opacity: 0.8,
    },
    barLabel: {
        fontSize: 10,
        color: '#94a3b8',
    },

    // Profile Tab
    profileHeaderCenter: {
        alignItems: 'center',
        marginVertical: 24,
    },
    profilePhotoLarge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#fff',
        marginBottom: 12,
    },
    profilePhotoPlaceholderLarge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#ea580c',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
        marginBottom: 12,
        shadowColor: '#ea580c',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    profileInitialLarge: {
        fontSize: 40,
        color: '#fff',
        fontWeight: 'bold',
    },
    profileName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1e293b',
    },
    profileIdBadge: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 8,
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
        overflow: 'hidden',
    },
    infoSection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
    },
    infoSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    infoLabel: {
        color: '#64748b',
        fontSize: 14,
    },
    infoValue: {
        color: '#1e293b',
        fontWeight: '500',
        fontSize: 14,
    },

    // More Tab / Grid
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    gridButton: {
        width: '48%',
        aspectRatio: 1, // Square
        backgroundColor: '#fff',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    gridIcon: {
        fontSize: 32,
        marginBottom: 12,
    },
    gridLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
    },
    logoutGridButton: {
        borderColor: '#fee2e2',
        backgroundColor: '#fef2f2',
    },
    logoutText: {
        color: '#ef4444',
    },

    // Schemes New Styles
    schemeTabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
    },
    schemeTabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    schemeTabActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    schemeTabText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748b',
    },
    schemeTabTextActive: {
        color: '#1e293b',
        fontWeight: '700',
    },

    // Health Tab Styles
    vitalsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    vitalCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    vitalIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fee2e2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    vitalIcon: {
        fontSize: 18,
    },
    vitalLabel: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 4,
    },
    vitalValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    checkupCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    checkupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    checkupTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
    },
    checkupBadge: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    checkupBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#166534',
    },
    checkupRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    checkupDetailIcon: {
        fontSize: 12,
        width: 16,
        color: '#94a3b8',
    },
    checkupDetailText: {
        fontSize: 13,
        color: '#64748b',
    },
    checkupTag: {
        color: '#94a3b8',
        fontSize: 11,
        marginLeft: 4,
    },
    tagRow: {
        flexDirection: 'row',
        gap: 8,
        marginVertical: 8,
    },
    miniTag: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    miniTagText: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: '600',
    },
    checkupFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 4,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    checkupDate: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
    },
    checkupCost: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
    },
    checkupSubCost: {
        fontSize: 10,
        color: '#22c55e',
    },


    filterContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        paddingBottom: 4,
    },
    filterPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginRight: 8,
    },
    filterPillActive: {
        backgroundColor: '#1e293b',
        borderColor: '#1e293b',
    },
    filterPillText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748b',
    },
    filterPillTextActive: {
        color: '#fff',
    },
    schemeCardNew: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    schemeHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    schemeTagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ecfdf5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 6,
    },
    schemeTagText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#059669',
        textTransform: 'uppercase',
        backgroundColor: '#d1fae5',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 4,
    },
    schemeTagCheck: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#059669',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkIcon: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
    },
    schemeTagLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#059669',
    },
    applyButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ea580c',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    applyButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#ea580c',
    },
    schemeTitleNew: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 6,
    },
    schemeDescNew: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 20,
        marginBottom: 12,
    },
    schemeFooterRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    schemeBenefitBadge: {
        backgroundColor: '#f8fafc',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    schemeBenefitText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#475569',
    },

    // Empty States 
    emptyText: {
        textAlign: 'center',
        color: '#94a3b8',
        fontStyle: 'italic',
        marginTop: 12,
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
    },
    emptyStateText: {
        color: '#94a3b8',
        fontSize: 16,
    },

    // Notifications
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    notificationIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff7ed',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    bgBlue: {
        backgroundColor: '#eff6ff',
    },
    bgGreen: {
        backgroundColor: '#f0fdf4',
    },
    notificationIcon: {
        fontSize: 24,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    notificationText: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 18,
        marginBottom: 6,
    },
    notificationTime: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '500',
    },

    // Filter Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterModalContent: {
        width: Dimensions.get('window').width * 0.85,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'stretch',
    },
    filterModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 16,
        textAlign: 'center',
    },
    filterOption: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#f8fafc',
    },
    filterOptionActive: {
        backgroundColor: '#fff7ed',
        borderWidth: 1,
        borderColor: '#ea580c',
    },
    filterOptionText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    filterOptionTextActive: {
        color: '#ea580c',
        fontWeight: '700',
    },
    filterCloseButton: {
        marginTop: 12,
        alignItems: 'center',
        paddingVertical: 12,
    },
    filterCloseText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '600',
    },

    // New Profile Styles
    viewLink: {
        fontSize: 11,
        color: '#2563eb',
        fontWeight: '600',
    },

    // Start of new profile styles
    profileSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    profileSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    profileSectionTitleIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    profileSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
    },
    editButton: {
        marginLeft: 'auto',
    },
    editButtonText: {
        color: '#ea580c',
        fontWeight: '600',
        fontSize: 13,
    },
    profileCardContent: {
        // padding: 16,
    },
    profileHeaderRow: {
        // flexDirection: 'row',
        // alignItems: 'flex-start',
    },
    profileBasicInfo: {
        flex: 1,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    infoItem: {
        flex: 1,
        minWidth: '30%',
    },
    infoLabelSmall: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '700',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    infoValueDark: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
    },
    editPhotoButton: {
        marginTop: 12,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    editPhotoText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },

    // Identifiers
    identifiersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    identifierCard: {
        width: '48%', // Approx 2 columns
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    idBadge: {
        width: 32,
        height: 32,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    idBadgeText: {
        fontSize: 10,
        fontWeight: '800',
    },
    idLabel: {
        fontSize: 9,
        color: '#94a3b8',
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    idValue: {
        fontSize: 11,
        fontWeight: '700',
        color: '#334155',
    },

    // Family
    familyList: {
        gap: 12,
    },
    familyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderRadius: 8,
        padding: 12,
    },
    familyIconPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    familyIconText: {
        fontSize: 16,
        opacity: 0.5,
    },
    familyInfo: {
        flex: 1,
    },
    familyName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    familyRelation: {
        fontSize: 12,
        color: '#64748b',
    },
    healthBadge: {
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    healthBadgeText: {
        color: '#16a34a',
        fontSize: 10,
        fontWeight: '600',
    },

    // Documents
    documentsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    documentCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    docTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 2,
    },
    docType: {
        fontSize: 10,
        color: '#94a3b8',
        marginBottom: 4,
    },
    docDate: {
        fontSize: 9,
        color: '#cbd5e1',
    },

    // Grievances & Help Styles
    tabSwitcher: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    tabButtonActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabButtonText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748b',
    },
    tabButtonTextActive: {
        color: '#1e293b',
        fontWeight: '700',
    },
    filterScroll: {
        marginBottom: 16,
    },
    floatingActionButton: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: '#ea580c',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    floatingActionText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    formLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 8,
        marginTop: 16,
    },
    pickerContainer: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 8,
        padding: 12,
    },
    pickerText: {
        color: '#64748b',
        fontSize: 14,
    },
    textArea: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 8,
        padding: 12,
        height: 100,
        textAlignVertical: 'top',
        color: '#1e293b',
    },
    formActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 24,
    },
    button: {
        backgroundColor: '#ea580c',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#cbd5e1',
    },
    cancelButtonText: {
        color: '#64748b',
        fontWeight: '600',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
    },
    faqItem: {
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 16,
    },
    faqQuestion: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    faqAnswer: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
    },
});

// For now, using text emojis as placeholders for icons to avoid extra dependencies if not installed
const TabIcon = ({ name, active, label }: { name: string; active: boolean; label: string }) => (
    <View style={styles.tabItem}>
        <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{name}</Text>
        <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </View>
);
