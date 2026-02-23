import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

export default function EmployeeLoginScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { signIn, signInHealthDemo } = useAuth();

    const handleSignIn = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setLoading(true);

        /* 
        // NOTE: Demo bypass removed to allow real database access for Health module integration.
        // User 'employ@aphealth.com' should be a valid Supabase user now.
        if (email.trim() === 'employ@aphealth.com' && password === 'Test@1234') {
             // ...
        } 
        */

        try {
            // Sign in with supabase — AuthContext will handle routing via userContext
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) throw error;
            // Navigation is handled automatically by App.tsx based on userContext
            // No manual navigation.replace needed
        } catch (error: any) {
            Alert.alert('Login Failed', error.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Back to Home */}
                <TouchableOpacity
                    style={styles.backToHome}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backToHomeText}>← Back to Home</Text>
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoPlaceholder}>
                        <Text style={styles.logoText}>🚌</Text>
                    </View>
                    <Text style={styles.title}>Employee Login</Text>
                    <Text style={styles.subtitle}>APSRTC Conductor / Staff Portal</Text>
                </View>

                {/* Login Form */}
                <View style={styles.formContainer}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="conductor@apsrtc.gov.in"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={email}
                        onChangeText={setEmail}
                        editable={!loading}
                    />

                    <Text style={styles.label}>Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="........"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                            editable={!loading}
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSignIn}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        APSRTC – Government of Andhra Pradesh
                    </Text>
                    <Text style={styles.footerSubtext}>Secure Employee Portal</Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    backToHome: {
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    backToHomeText: {
        color: '#ea580c',
        fontSize: 14,
        fontWeight: '500',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoPlaceholder: {
        width: 72,
        height: 72,
        borderRadius: 20,
        backgroundColor: '#ea580c',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    logoText: {
        fontSize: 36,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ea580c',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#64748b',
        textAlign: 'center',
        fontWeight: '500',
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 14,
        fontSize: 15,
        marginBottom: 16,
        backgroundColor: '#f8fafc',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        backgroundColor: '#f8fafc',
        marginBottom: 20,
    },
    passwordInput: {
        flex: 1,
        padding: 14,
        fontSize: 15,
        color: '#ea580c',
    },
    eyeButton: {
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    eyeText: {
        fontSize: 18,
    },
    button: {
        backgroundColor: '#ea580c',
        borderRadius: 10,
        padding: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    footer: {
        marginTop: 32,
        alignItems: 'center',
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
