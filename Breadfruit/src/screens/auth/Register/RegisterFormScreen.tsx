import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// ✅ Correct import for react-native-firebase
import functions from '@react-native-firebase/functions';

import { LoadingAlert, NotificationAlert } from '@/components/NotificationModal';

export default function RegisterFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  // @ts-ignore
  const { type } = route.params as { type: string };

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'info' | 'error'>('info');

  const toTitleCase = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

    // ✅ Realtime email validation
    const handleEmailChange = (text: string) => {
      setEmail(text);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (text.length === 0) {
        setEmailError(null);
      } else if (!emailRegex.test(text)) {
        setEmailError('Invalid email format.');
      } else {
        setEmailError(null);
      }
    };


  const handleRegister = async () => {
    // Validations remain the same
    if (!name || !email || !password || !confirmPassword) {
      setNotificationMessage('All fields are required.');
      setNotificationType('error');
      setNotificationVisible(true);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setNotificationMessage('Please enter a valid email address.');
      setNotificationType('error');
      setNotificationVisible(true);
      return;
    }
    if (password !== confirmPassword) {
      setNotificationMessage('Passwords do not match.');
      setNotificationType('error');
      setNotificationVisible(true);
      return;
    }

    setLoading(true);

    try {
      // ✅ Correct and simpler syntax for calling Cloud Functions
      const createNewUser = functions().httpsCallable('createNewUser');

      const userData = {
        name,
        email,
        password,
        role: type,
        status: type === 'viewer' ? 'verified' : 'pending',
        image: null,
        joined: new Date().toISOString(),
      };

      const result = await createNewUser(userData);

      if (result?.data?.success) {
        setNotificationMessage(
          type === 'viewer'
            ? 'Registration successful! You can now log in.'
            : 'Your registration was successful. Please wait for admin approval.'
        );
        setNotificationType('success');
        setNotificationVisible(true);
      } else {
        throw new Error('Registration failed.');
      }
    } catch (error: any) {
      console.error('❌ Registration error:', error);

      let errorMessage = 'Registration failed. Please try again later.';
      let errorType: 'error' | 'info' = 'error';

      // The react-native-firebase library returns a 'code' property on the error
      if (error.code === 'functions/already-exists') {
        errorMessage =
          'An account with this email already exists. Please use another email or log in.';
        errorType = 'info';
      } else if (error.code === 'functions/invalid-argument') {
        errorMessage = 'Invalid data submitted. Please check your inputs.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setNotificationMessage(errorMessage);
      setNotificationType(errorType);
      setNotificationVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <LoadingAlert visible={loading} message="Please wait..." />
          <NotificationAlert
            visible={notificationVisible}
            message={notificationMessage}
            type={notificationType}
            onClose={() => {
              setNotificationVisible(false);
              if (notificationType === 'success') {
                navigation.navigate('Login');
              }
            }}
          />

          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="account-plus" size={80} color="#2ecc71" />
          </View>

          <Text variant="headlineMedium" style={styles.title}>
            {toTitleCase(type)} Registration
          </Text>

          <TextInput label="Name" value={name} onChangeText={setName} style={styles.input} left={<TextInput.Icon icon="account" />} />
          <TextInput label="Email" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" left={<TextInput.Icon icon="email" />} />
          <TextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} left={<TextInput.Icon icon="lock" />} />
          <TextInput label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry style={styles.input} left={<TextInput.Icon icon="lock-check" />} />

          <Button mode="contained" onPress={handleRegister} style={styles.button} disabled={loading}>Create Account</Button>
          <Button mode="text" textColor="#666" onPress={() => navigation.navigate('Login')}>Already have an account? Login</Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#ffffff' },
  iconContainer: { alignItems: 'center', marginBottom: 20 },
  title: { marginBottom: 30, textAlign: 'center', color: '#333' },
  input: { marginBottom: 15, backgroundColor: '#f8f8f8' },
  button: { marginVertical: 10, borderRadius: 25, backgroundColor: '#2ecc71' },
});
