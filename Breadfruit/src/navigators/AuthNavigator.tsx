import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

// Import all the screens for the authentication flow
import WelcomeScreen from '../screens/auth/WelcomeScreen'; // 🟢 NEW: Import Welcome Screen
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterFormScreen from '../screens/auth/Register/RegisterFormScreen';
import UserTypeSelectionScreen from '../screens/auth/Register/UserTypeSelectionScreen';
import AboutHelpScreen from '../screens/auth/AboutHelpScreen';
// --- Type Definitions for Navigation ---
// This defines the screens in the nested registration stack
export type RegisterStackParamList = {
  UserTypeSelection: undefined;
  RegisterForm: { type: 'viewer' | 'researcher' | 'admin' }; // Expects a 'type' parameter
};

// 🟢 UPDATED: AuthStackParamList now includes 'Welcome'
export type AuthStackParamList = {
  Welcome: undefined; // 🟢 NEW
  Login: undefined;
  Register: undefined; // This will be our nested stack
};


const Stack = createNativeStackNavigator<AuthStackParamList>();
const RegisterStack = createNativeStackNavigator<RegisterStackParamList>();

// --- Nested Registration Navigator ---
// This component handles the multi-step registration process
function RegisterNavigator() {
  return (
    <RegisterStack.Navigator screenOptions={{ headerShown: false }}>
      <RegisterStack.Screen name="UserTypeSelection" component={UserTypeSelectionScreen} />
      <RegisterStack.Screen name="RegisterForm" component={RegisterFormScreen} />
    </RegisterStack.Navigator>
  );
}

// --- Main Auth Navigator ---
export default function AuthNavigator() {
  return (
    <Stack.Navigator initialRouteName="Welcome">
      {/* 🟢 NEW: The Welcome screen is the entry point */}
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />

      {/* Login Screen */}
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />

      {/* Register Stack */}
      <Stack.Screen name="Register" component={RegisterNavigator} options={{ headerShown: false }} />
<Stack.Screen name="AboutHelp" component={AboutHelpScreen} />

    </Stack.Navigator>
  );
}