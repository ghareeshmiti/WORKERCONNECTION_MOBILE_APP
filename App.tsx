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
import EmployeeLoginScreen from './src/screens/EmployeeLoginScreen';
import EstablishmentLoginScreen from './src/screens/EstablishmentLoginScreen';
import DepartmentLoginScreen from './src/screens/DepartmentLoginScreen';
import WorkerRegistrationScreen from './src/screens/WorkerRegistrationScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import EstablishmentDashboard from './src/screens/EstablishmentDashboard';
import DepartmentDashboard from './src/screens/DepartmentDashboard';
import ConductorDashboardScreen from './src/screens/ConductorDashboardScreen';
import HealthDashboard from './src/screens/HealthDashboard';
import HealthScanScreen from './src/screens/HealthScanScreen';
import DoctorSelectionScreen from './src/screens/DoctorSelectionScreen';

const Stack = createNativeStackNavigator();

function getDashboardComponent(role: string, email?: string) {
  if (email === 'employ@aphealth.com') return HealthScanScreen;
  switch (role) {
    case 'ESTABLISHMENT_ADMIN': return EstablishmentDashboard;
    case 'DEPARTMENT_ADMIN': return DepartmentDashboard;
    case 'EMPLOYEE': return ConductorDashboardScreen;
    default: return DashboardScreen;
  }
}

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
          // Authenticated: route by role
          userContext.email === 'employ@aphealth.com' ? (
            <>
              <Stack.Screen name="HealthScan" component={HealthScanScreen} />
              <Stack.Screen name="FamilySelection" component={require('./src/screens/FamilySelectionScreen').default} />
              <Stack.Screen name="DoctorSelection" component={DoctorSelectionScreen} />
              <Stack.Screen name="HealthDashboard" component={HealthDashboard} />
            </>
          ) : userContext.role === 'EMPLOYEE' ? (
            <Stack.Screen name="ConductorDashboard" component={ConductorDashboardScreen} />
          ) : (
            <Stack.Screen
              name="Dashboard"
              component={getDashboardComponent(userContext.role, userContext.email)}
            />
          )
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="WorkerLogin" component={LoginScreen} />
            <Stack.Screen name="EmployeeLogin" component={EmployeeLoginScreen} />
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
