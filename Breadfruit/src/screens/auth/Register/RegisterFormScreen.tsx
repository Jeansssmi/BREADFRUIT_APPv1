import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

  // 🌙 THEME MODE
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themeMode');
        setIsDarkMode(savedTheme === 'dark');
      } catch (e) {
        console.error('Failed to load theme mode', e);
      }
    };
    loadTheme();
  }, []);

  const toTitleCase = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  const handleRegister = async () => {
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

      if (
        error.code === 'auth/email-already-in-use' ||
        error.code === 'functions/already-exists' ||
        error.message?.toLowerCase().includes('already registered') ||
        error.message?.toLowerCase().includes('already exists')
      ) {
        errorMessage =
          'This email is already registered. Please log in or use another email address.';
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

  // 🌓 Dynamic theme styles
  const backgroundColor = isDarkMode ? '#121212' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#333333';
  const inputBackground = isDarkMode ? '#1e1e1e' : '#f8f8f8';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.container, { backgroundColor }]}>
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

          <Text variant="headlineMedium" style={[styles.title, { color: textColor }]}>
            {toTitleCase(type)} Registration
          </Text>

          <TextInput
            label="Name"
            value={name}
            onChangeText={setName}
            style={[styles.input, { backgroundColor: inputBackground }]}
            left={<TextInput.Icon icon="account" />}
          />
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            style={[styles.input, { backgroundColor: inputBackground }]}
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email" />}
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={[styles.input, { backgroundColor: inputBackground }]}
            left={<TextInput.Icon icon="lock" />}
          />
          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={[styles.input, { backgroundColor: inputBackground }]}
            left={<TextInput.Icon icon="lock-check" />}
          />

          <Button
            mode="contained"
            onPress={handleRegister}
            style={styles.button}
            disabled={loading}
          >
            Create Account
          </Button>

          <Button
            mode="text"
            textColor={isDarkMode ? '#ccc' : '#666'}
            onPress={() => navigation.navigate('Login')}
          >
            Already have an account? Login
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  iconContainer: { alignItems: 'center', marginBottom: 20 },
  title: { marginBottom: 30, textAlign: 'center' },
  input: { marginBottom: 15 },
  button: { marginVertical: 10, borderRadius: 25, backgroundColor: '#2ecc71' },
});
