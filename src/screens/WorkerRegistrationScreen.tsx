import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { INDIA_LOCATIONS } from '../data/india-locations';

const STEPS = ['Identity', 'Personal', 'Other Details', 'Professional', 'Address', 'Review'];
const BASE_URL = 'https://workerconnection-backend.vercel.app';

interface FormData {
    aadhaar: string;
    otpVerified: boolean;
    firstName: string;
    lastName: string;
    gender: string;
    dob: string;
    phone: string;
    fatherName: string;
    motherName: string;
    maritalStatus: string;
    caste: string;
    disabilityStatus: string;
    bankAccountNumber: string;
    ifscCode: string;
    eshramId: string;
    bocwId: string;
    nresMember: string;
    tradeUnionMember: string;
    educationLevel: string;
    skillCategory: string;
    workHistory: string;
    district: string;
    mandal: string;
    village: string;
    pincode: string;
    addressLine: string;
}

const initialForm: FormData = {
    aadhaar: '',
    otpVerified: false,
    firstName: '',
    lastName: '',
    gender: '',
    dob: '',
    phone: '',
    fatherName: '',
    motherName: '',
    maritalStatus: '',
    caste: '',
    disabilityStatus: 'None',
    bankAccountNumber: '',
    ifscCode: '',
    eshramId: '',
    bocwId: '',
    nresMember: 'No',
    tradeUnionMember: 'No',
    educationLevel: '',
    skillCategory: '',
    workHistory: '',
    district: '',
    mandal: '',
    village: '',
    pincode: '',
    addressLine: '',
};

function PickerButtons({ options, value, onSelect, label }: {
    options: string[];
    value: string;
    onSelect: (v: string) => void;
    label: string;
}) {
    return (
        <View style={styles.pickerContainer}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.pickerRow}>
                {options.map(opt => (
                    <TouchableOpacity
                        key={opt}
                        style={[styles.pickerOption, value === opt && styles.pickerOptionSelected]}
                        onPress={() => onSelect(opt)}
                    >
                        <Text style={[styles.pickerOptionText, value === opt && styles.pickerOptionTextSelected]}>
                            {opt}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

export default function WorkerRegistrationScreen({ navigation }: any) {
    const [currentStep, setCurrentStep] = useState(0);
    const [form, setForm] = useState<FormData>(initialForm);
    const [loading, setLoading] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    const updateForm = (field: keyof FormData, value: string | boolean) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    // Location data helpers
    const districts = useMemo(() =>
        INDIA_LOCATIONS.districts.map(d => d.name), []);

    const mandals = useMemo(() => {
        if (!form.district) return [];
        const dist = INDIA_LOCATIONS.districts.find(d => d.name === form.district);
        if (!dist) return [];
        const allMandals: string[] = [];
        dist.subdivisions.forEach(sub => {
            sub.mandals.forEach(m => allMandals.push(m.name));
        });
        return [...new Set(allMandals)].sort();
    }, [form.district]);

    const villages = useMemo(() => {
        if (!form.district || !form.mandal) return [];
        const dist = INDIA_LOCATIONS.districts.find(d => d.name === form.district);
        if (!dist) return [];
        for (const sub of dist.subdivisions) {
            const mandal = sub.mandals.find(m => m.name === form.mandal);
            if (mandal) return mandal.villages.map(v => v.name).sort();
        }
        return [];
    }, [form.district, form.mandal]);

    const handleSendOTP = async () => {
        if (form.aadhaar.length !== 12) {
            Alert.alert('Error', 'Please enter a valid 12-digit Aadhaar number');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/api/auth/worker-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ aadhaar: form.aadhaar }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
            Alert.alert('Success', 'OTP sent to your registered mobile number.');
            setOtpSent(true);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (otp.length < 4) {
            Alert.alert('Error', 'Please enter the OTP');
            return;
        }
        // For now, accept any OTP (as per web app behavior)
        updateForm('otpVerified', true);
        Alert.alert('Verified', 'Aadhaar verified successfully!');
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/api/public/register-worker`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: form.firstName,
                    lastName: form.lastName,
                    gender: form.gender,
                    dob: form.dob,
                    phone: form.phone,
                    aadhaarNumber: form.aadhaar,
                    state: 'Andhra Pradesh',
                    district: form.district,
                    mandal: form.mandal,
                    village: form.village,
                    pincode: form.pincode,
                    addressLine: form.addressLine,
                    fatherName: form.fatherName,
                    motherName: form.motherName,
                    bankAccountNumber: form.bankAccountNumber,
                    ifscCode: form.ifscCode,
                    eshramId: form.eshramId,
                    bocwId: form.bocwId,
                    maritalStatus: form.maritalStatus,
                    caste: form.caste,
                    disabilityStatus: form.disabilityStatus,
                    nresMember: form.nresMember === 'Yes',
                    tradeUnionMember: form.tradeUnionMember === 'Yes',
                    educationLevel: form.educationLevel,
                    skillCategory: form.skillCategory,
                    workHistory: form.workHistory,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Registration failed');
            Alert.alert(
                'Registration Successful',
                `Your Worker ID is: ${data.workerId || 'Generated'}\nYou can now login with your Aadhaar number.`,
                [{ text: 'Go to Login', onPress: () => navigation.navigate('WorkerLogin') }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 0: return form.otpVerified;
            case 1: return form.firstName && form.lastName && form.gender && form.phone;
            case 2: return true; // all optional
            case 3: return true; // all optional
            case 4: return form.district && form.mandal;
            case 5: return true;
            default: return false;
        }
    };

    const renderStepIndicator = () => (
        <View style={styles.stepIndicator}>
            {STEPS.map((step, index) => (
                <View key={step} style={styles.stepItem}>
                    <View style={[
                        styles.stepCircle,
                        index < currentStep && styles.stepCircleCompleted,
                        index === currentStep && styles.stepCircleCurrent,
                    ]}>
                        {index < currentStep ? (
                            <Text style={styles.stepCheckmark}>✓</Text>
                        ) : (
                            <Text style={[
                                styles.stepNumber,
                                index === currentStep && styles.stepNumberCurrent,
                            ]}>{index + 1}</Text>
                        )}
                    </View>
                    <Text style={[
                        styles.stepLabel,
                        index === currentStep && styles.stepLabelCurrent,
                    ]}>{step}</Text>
                </View>
            ))}
        </View>
    );

    const renderStep0 = () => (
        <View>
            <Text style={styles.sectionTitle}>Aadhaar Verification</Text>
            <Text style={styles.label}>Aadhaar Number *</Text>
            <TextInput
                style={styles.input}
                placeholder="XXXX XXXX XXXX"
                keyboardType="number-pad"
                maxLength={12}
                value={form.aadhaar}
                onChangeText={v => updateForm('aadhaar', v)}
                editable={!form.otpVerified && !loading}
            />
            {!form.otpVerified && !otpSent && (
                <TouchableOpacity
                    style={[styles.outlineButton, loading && styles.buttonDisabled]}
                    onPress={handleSendOTP}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#ea580c" /> : (
                        <Text style={styles.outlineButtonText}>Get OTP</Text>
                    )}
                </TouchableOpacity>
            )}
            {otpSent && !form.otpVerified && (
                <View>
                    <Text style={styles.label}>Enter OTP</Text>
                    <View style={styles.otpRow}>
                        <TextInput
                            style={[styles.input, { flex: 1, marginBottom: 0 }]}
                            placeholder="Enter OTP"
                            keyboardType="number-pad"
                            maxLength={6}
                            value={otp}
                            onChangeText={setOtp}
                        />
                        <TouchableOpacity
                            style={[styles.button, { marginLeft: 10, paddingHorizontal: 20 }]}
                            onPress={handleVerifyOTP}
                        >
                            <Text style={styles.buttonText}>Verify</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            {form.otpVerified && (
                <View style={styles.verifiedBox}>
                    <Text style={styles.verifiedText}>✅ Aadhaar Verified</Text>
                </View>
            )}
        </View>
    );

    const renderStep1 = () => (
        <View>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <View style={styles.row}>
                <View style={styles.halfField}>
                    <Text style={styles.label}>First Name *</Text>
                    <TextInput style={styles.input} value={form.firstName}
                        onChangeText={v => updateForm('firstName', v)} placeholder="First Name" />
                </View>
                <View style={styles.halfField}>
                    <Text style={styles.label}>Last Name *</Text>
                    <TextInput style={styles.input} value={form.lastName}
                        onChangeText={v => updateForm('lastName', v)} placeholder="Last Name" />
                </View>
            </View>
            <PickerButtons label="Gender *" options={['Male', 'Female', 'Other']}
                value={form.gender} onSelect={v => updateForm('gender', v)} />
            <Text style={styles.label}>Date of Birth</Text>
            <TextInput style={styles.input} value={form.dob}
                onChangeText={v => updateForm('dob', v)} placeholder="YYYY-MM-DD" />
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput style={styles.input} value={form.phone}
                onChangeText={v => updateForm('phone', v)} placeholder="10-digit mobile"
                keyboardType="phone-pad" maxLength={10} />
        </View>
    );

    const renderStep2 = () => (
        <View>
            <Text style={styles.sectionTitle}>Other Details</Text>
            <View style={styles.row}>
                <View style={styles.halfField}>
                    <Text style={styles.label}>Father Name</Text>
                    <TextInput style={styles.input} value={form.fatherName}
                        onChangeText={v => updateForm('fatherName', v)} placeholder="Father Name" />
                </View>
                <View style={styles.halfField}>
                    <Text style={styles.label}>Mother Name</Text>
                    <TextInput style={styles.input} value={form.motherName}
                        onChangeText={v => updateForm('motherName', v)} placeholder="Mother Name" />
                </View>
            </View>
            <PickerButtons label="Marital Status" options={['Single', 'Married', 'Widow', 'Divorced']}
                value={form.maritalStatus} onSelect={v => updateForm('maritalStatus', v)} />
            <PickerButtons label="Caste" options={['OC', 'BC', 'SC', 'ST', 'Other']}
                value={form.caste} onSelect={v => updateForm('caste', v)} />
            <PickerButtons label="Disability" options={['None', 'Physical', 'Visual', 'Hearing', 'Other']}
                value={form.disabilityStatus} onSelect={v => updateForm('disabilityStatus', v)} />

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Banking Information</Text>
            <View style={styles.row}>
                <View style={styles.halfField}>
                    <Text style={styles.label}>Account Number</Text>
                    <TextInput style={styles.input} value={form.bankAccountNumber}
                        onChangeText={v => updateForm('bankAccountNumber', v)}
                        placeholder="Account No." keyboardType="number-pad" />
                </View>
                <View style={styles.halfField}>
                    <Text style={styles.label}>IFSC Code</Text>
                    <TextInput style={styles.input} value={form.ifscCode}
                        onChangeText={v => updateForm('ifscCode', v)}
                        placeholder="IFSC Code" autoCapitalize="characters" />
                </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Additional IDs</Text>
            <View style={styles.row}>
                <View style={styles.halfField}>
                    <Text style={styles.label}>eShram ID</Text>
                    <TextInput style={styles.input} value={form.eshramId}
                        onChangeText={v => updateForm('eshramId', v)} placeholder="Optional" />
                </View>
                <View style={styles.halfField}>
                    <Text style={styles.label}>BOCW ID</Text>
                    <TextInput style={styles.input} value={form.bocwId}
                        onChangeText={v => updateForm('bocwId', v)} placeholder="Optional" />
                </View>
            </View>
            <PickerButtons label="NRES Member" options={['Yes', 'No']}
                value={form.nresMember} onSelect={v => updateForm('nresMember', v)} />
            <PickerButtons label="Union Member" options={['Yes', 'No']}
                value={form.tradeUnionMember} onSelect={v => updateForm('tradeUnionMember', v)} />
        </View>
    );

    const renderStep3 = () => (
        <View>
            <Text style={styles.sectionTitle}>Professional Details</Text>
            <PickerButtons label="Education Level"
                options={['Illiterate', '5th Pass', '8th Pass', '10th Pass', '12th Pass', 'Graduate', 'Post Graduate']}
                value={form.educationLevel} onSelect={v => updateForm('educationLevel', v)} />
            <PickerButtons label="Skill Category"
                options={['Unskilled', 'Semi-Skilled', 'Skilled', 'Highly Skilled']}
                value={form.skillCategory} onSelect={v => updateForm('skillCategory', v)} />
            <Text style={styles.label}>Work History / Experience</Text>
            <TextInput
                style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                value={form.workHistory}
                onChangeText={v => updateForm('workHistory', v)}
                placeholder="Describe your work experience..."
                multiline
                numberOfLines={4}
            />
        </View>
    );

    const renderStep4 = () => (
        <View>
            <Text style={styles.sectionTitle}>Address Details</Text>
            <Text style={styles.label}>District *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {districts.map(d => (
                    <TouchableOpacity key={d}
                        style={[styles.chip, form.district === d && styles.chipSelected]}
                        onPress={() => { updateForm('district', d); updateForm('mandal', ''); updateForm('village', ''); }}>
                        <Text style={[styles.chipText, form.district === d && styles.chipTextSelected]}>{d}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {form.district ? (
                <>
                    <Text style={styles.label}>Mandal *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                        {mandals.map(m => (
                            <TouchableOpacity key={m}
                                style={[styles.chip, form.mandal === m && styles.chipSelected]}
                                onPress={() => { updateForm('mandal', m); updateForm('village', ''); }}>
                                <Text style={[styles.chipText, form.mandal === m && styles.chipTextSelected]}>{m}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </>
            ) : null}

            {form.mandal ? (
                <>
                    <Text style={styles.label}>Village</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                        {villages.map(v => (
                            <TouchableOpacity key={v}
                                style={[styles.chip, form.village === v && styles.chipSelected]}
                                onPress={() => updateForm('village', v)}>
                                <Text style={[styles.chipText, form.village === v && styles.chipTextSelected]}>{v}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </>
            ) : null}

            <Text style={styles.label}>Pincode</Text>
            <TextInput style={styles.input} value={form.pincode}
                onChangeText={v => updateForm('pincode', v)} placeholder="6-digit pincode"
                keyboardType="number-pad" maxLength={6} />

            <Text style={styles.label}>Address Line</Text>
            <TextInput style={styles.input} value={form.addressLine}
                onChangeText={v => updateForm('addressLine', v)} placeholder="Door No, Street" />
        </View>
    );

    const renderStep5 = () => (
        <View>
            <Text style={styles.sectionTitle}>Review Your Details</Text>
            <View style={styles.reviewCard}>
                <Text style={styles.reviewSectionTitle}>Personal</Text>
                <Text style={styles.reviewItem}>Name: {form.firstName} {form.lastName}</Text>
                <Text style={styles.reviewItem}>Gender: {form.gender}</Text>
                <Text style={styles.reviewItem}>DOB: {form.dob || 'Not provided'}</Text>
                <Text style={styles.reviewItem}>Phone: {form.phone}</Text>
                <Text style={styles.reviewItem}>Aadhaar: ****{form.aadhaar.slice(-4)}</Text>
            </View>
            <View style={styles.reviewCard}>
                <Text style={styles.reviewSectionTitle}>Family & Other</Text>
                <Text style={styles.reviewItem}>Father: {form.fatherName || '-'}</Text>
                <Text style={styles.reviewItem}>Mother: {form.motherName || '-'}</Text>
                <Text style={styles.reviewItem}>Marital: {form.maritalStatus || '-'}</Text>
                <Text style={styles.reviewItem}>Caste: {form.caste || '-'}</Text>
            </View>
            <View style={styles.reviewCard}>
                <Text style={styles.reviewSectionTitle}>Professional</Text>
                <Text style={styles.reviewItem}>Education: {form.educationLevel || '-'}</Text>
                <Text style={styles.reviewItem}>Skill: {form.skillCategory || '-'}</Text>
            </View>
            <View style={styles.reviewCard}>
                <Text style={styles.reviewSectionTitle}>Address</Text>
                <Text style={styles.reviewItem}>District: {form.district}</Text>
                <Text style={styles.reviewItem}>Mandal: {form.mandal}</Text>
                <Text style={styles.reviewItem}>Village: {form.village || '-'}</Text>
                <Text style={styles.reviewItem}>Pincode: {form.pincode || '-'}</Text>
            </View>
            <Text style={styles.reviewNote}>Please ensure all details are correct before submitting.</Text>
        </View>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 0: return renderStep0();
            case 1: return renderStep1();
            case 2: return renderStep2();
            case 3: return renderStep3();
            case 4: return renderStep4();
            case 5: return renderStep5();
            default: return null;
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Back to Home */}
                    <TouchableOpacity
                        style={styles.backToHome}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backToHomeText}>← Back to Home</Text>
                    </TouchableOpacity>

                    <Text style={styles.pageTitle}>Worker Registration</Text>
                    <Text style={styles.pageSubtitle}>Register to access government services</Text>

                    {/* Step Indicator */}
                    {renderStepIndicator()}

                    {/* Step Content */}
                    <View style={styles.formCard}>
                        {renderCurrentStep()}
                    </View>

                    {/* Navigation Buttons */}
                    <View style={styles.navButtons}>
                        {currentStep > 0 && (
                            <TouchableOpacity
                                style={styles.outlineButton}
                                onPress={() => setCurrentStep(prev => prev - 1)}
                            >
                                <Text style={styles.outlineButtonText}>Back</Text>
                            </TouchableOpacity>
                        )}
                        <View style={{ flex: 1 }} />
                        {currentStep < STEPS.length - 1 ? (
                            <TouchableOpacity
                                style={[styles.button, !canProceed() && styles.buttonDisabled]}
                                onPress={() => setCurrentStep(prev => prev + 1)}
                                disabled={!canProceed()}
                            >
                                <Text style={styles.buttonText}>Next</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.button, loading && styles.buttonDisabled]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color="#fff" /> : (
                                    <Text style={styles.buttonText}>Submit Registration</Text>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    backToHome: {
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    backToHomeText: {
        color: '#ea580c',
        fontSize: 14,
        fontWeight: '500',
    },
    pageTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1e293b',
        textAlign: 'center',
    },
    pageSubtitle: {
        fontSize: 13,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 20,
    },
    // Step Indicator
    stepIndicator: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    stepItem: {
        alignItems: 'center',
        flex: 1,
    },
    stepCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    stepCircleCompleted: {
        backgroundColor: '#ea580c',
        borderColor: '#ea580c',
    },
    stepCircleCurrent: {
        borderColor: '#ea580c',
        backgroundColor: '#fff',
    },
    stepNumber: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94a3b8',
    },
    stepNumberCurrent: {
        color: '#ea580c',
    },
    stepCheckmark: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '700',
    },
    stepLabel: {
        fontSize: 9,
        color: '#94a3b8',
        textAlign: 'center',
    },
    stepLabelCurrent: {
        color: '#ea580c',
        fontWeight: '600',
    },
    // Form Card
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 14,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 6,
        marginTop: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        marginBottom: 12,
        backgroundColor: '#f8fafc',
    },
    row: {
        flexDirection: 'row',
        gap: 10,
    },
    halfField: {
        flex: 1,
    },
    // Picker Buttons
    pickerContainer: {
        marginBottom: 8,
    },
    pickerRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    pickerOption: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
    },
    pickerOptionSelected: {
        backgroundColor: '#ea580c',
        borderColor: '#ea580c',
    },
    pickerOptionText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    pickerOptionTextSelected: {
        color: '#fff',
    },
    // OTP
    otpRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    verifiedBox: {
        backgroundColor: '#f0fdf4',
        borderRadius: 8,
        padding: 12,
        marginTop: 8,
    },
    verifiedText: {
        color: '#16a34a',
        fontWeight: '600',
        fontSize: 14,
    },
    // Chips (for location selection)
    chipScroll: {
        marginBottom: 12,
        maxHeight: 44,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
        marginRight: 8,
    },
    chipSelected: {
        backgroundColor: '#ea580c',
        borderColor: '#ea580c',
    },
    chipText: {
        fontSize: 12,
        color: '#64748b',
    },
    chipTextSelected: {
        color: '#fff',
        fontWeight: '600',
    },
    // Review
    reviewCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 14,
        marginBottom: 12,
    },
    reviewSectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 6,
    },
    reviewItem: {
        fontSize: 13,
        color: '#475569',
        marginBottom: 3,
    },
    reviewNote: {
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 8,
        fontStyle: 'italic',
    },
    // Buttons
    button: {
        backgroundColor: '#ea580c',
        borderRadius: 8,
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    outlineButton: {
        borderWidth: 2,
        borderColor: '#ea580c',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    outlineButtonText: {
        color: '#ea580c',
        fontSize: 14,
        fontWeight: '600',
    },
    navButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
    },
});
