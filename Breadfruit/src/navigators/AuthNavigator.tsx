import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

// Import all the screens for the authentication flow
import WelcomeScreen from '../screens/auth/WelcomeScreen'; // 🟢 NEW: Import Welcome Screen
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterFormScreen from '../screens/auth/Register/RegisterFormScreen';
import UserTypeSelectionScreen from '../screens/auth/Register/UserTypeSelectionScreen';
import AboutHelpScreen from '../screens/auth/AboutHelpScreen';
import SendOtpScreen from '../screens/auth/SendOtpScreen';
import VerifyOtpScreen from '../screens/auth/VerifyOtpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

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

      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="AboutHelp" component={AboutHelpScreen}options={{ headerShown: false }} />
      <Stack.Screen name="SendOtp" component={SendOtpScreen} options={{ title: 'Email Verification' }} />
      <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} options={{ title: 'Enter OTP' }} />
      <Stack.Screen name="ForgotPassword"  component={ForgotPasswordScreen} options={{ headerShown: false }} />

    </Stack.Navigator>
  );
}