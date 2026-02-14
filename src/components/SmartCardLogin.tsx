import React, { useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, Alert, Platform } from 'react-native';
import { authenticateUser } from '../services/FidoService';
import { useAuth } from '../lib/AuthContext';

interface SmartCardLoginProps {
    onLoadingChange?: (loading: boolean) => void;
}

export const SmartCardLogin: React.FC<SmartCardLoginProps> = ({ onLoadingChange }) => {
    const [loading, setLoading] = useState(false);
    const { setSession } = useAuth();

    const handleLogin = async () => {
        setLoading(true);
        onLoadingChange?.(true);
        try {
            // Usernameless flow (empty username)
            // This triggers the platform authenticator (Android Credential Manager)
            // User will be prompted to "Use your security key" or similar.
            const result = await authenticateUser('');

            if (result.verified) {
                if (result.session) {
                    await setSession(result.session);
                    // Navigation handled by AuthContext listener
                } else {
                    Alert.alert('Success', `Welcome ${result.username}!`);
                }
            } else {
                Alert.alert('Authentication Failed', 'Could not verify smart card.');
            }
        } catch (error: any) {
            console.error('Smart Card Login Error:', error);
            // Don't alert if user cancelled to avoid annoyance
            if (!error.message?.includes('cancelled')) {
                Alert.alert('Error', error.message || 'Smart card login failed.');
            }
        } finally {
            setLoading(false);
            onLoadingChange?.(false);
        }
    };

    return (
        <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator color="#ea580c" />
            ) : (
                <>
                    <Text style={styles.icon}>💳</Text>
                    <Text style={styles.buttonText}>Login with Smart Card</Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#ea580c',
        borderRadius: 8,
        padding: 16,
        marginTop: 16,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    icon: {
        fontSize: 20,
        marginRight: 8,
    },
    buttonText: {
        color: '#ea580c',
        fontSize: 16,
        fontWeight: '600',
    },
});
