/**
 * FIDO-Miti Mobile App
 * One State - One Card
 * Government of Andhra Pradesh
 *
 * @format
 */

import React from 'react';
import { StatusBar, StyleSheet, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/lib/AuthContext';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import EstablishmentLoginScreen from './src/screens/EstablishmentLoginScreen';
import DepartmentLoginScreen from './src/screens/DepartmentLoginScreen';
import WorkerRegistrationScreen from './src/screens/WorkerRegistrationScreen';
import DashboardScreen from './src/screens/DashboardScreen';

const Stack = createNativeStackNavigator();

function AppContent() {
  const { userContext, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userContext ? (
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="WorkerLogin" component={LoginScreen} />
            <Stack.Screen name="EstablishmentLogin" component={EstablishmentLoginScreen} />
            <Stack.Screen name="DepartmentLogin" component={DepartmentLoginScreen} />
            <Stack.Screen name="WorkerRegistration" component={WorkerRegistrationScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#ffcb05" />
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
});

export default App;
