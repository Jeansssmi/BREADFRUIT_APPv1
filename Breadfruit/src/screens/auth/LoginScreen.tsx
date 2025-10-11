import { useAuth } from '@/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View, ScrollView } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function LoginScreen() {
  const { login } = useAuth();
  // @ts-ignore
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

   const handleLogin = async () => {
      if (!email || !password) {
        setNotificationMessage('Email and password are required.');
        setNotificationType('error');
        setNotificationVisible(true);
        return;
      }
      setLoading(true);
      try {
        await login(email, password);
        // If login is successful, the RootNavigator will handle the redirection automatically.
      } catch (error: any) {
        let errorMessage = 'Login failed. Please check your credentials.';

          // ✅ FIX: Catch the specific error for pending approval
              if (error.message === 'auth/pending-approval') {
                errorMessage = 'Your account is pending approval by an administrator.';
              } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'Invalid email or password.';
              }
     // ✅ FIX: Changed from setting notification state to console.log and setting the local error state
          console.log('Login Error:', errorMessage);
          console.log('Raw Error:', err); // Log the full error object for debugging
          setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <MaterialCommunityIcons name="tree-outline" size={80} color="#2ecc71" />
        <Text style={styles.title}>Breadfruit Tracker</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
      </View>

      <View style={styles.formSection}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          mode="outlined"
          left={<TextInput.Icon icon="email-outline" />}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!passwordVisible}
          style={styles.input}
          mode="outlined"
          left={<TextInput.Icon icon="lock-outline" />}
          right={
            <TextInput.Icon
              icon={passwordVisible ? "eye-off-outline" : "eye-outline"}
              onPress={() => setPasswordVisible(!passwordVisible)}
            />
          }
        />

        <Button
          mode="contained"
          onPress={handleLogin}
          style={styles.button}
          // ✅ Updated style for button text size/weight
          labelStyle={styles.buttonLabel}
          disabled={loading}
        >
          {loading ? <ActivityIndicator size="small" color="white" /> : 'Sign In'}
        </Button>

        <Button
          mode="text"
          textColor="#2ecc71"
          onPress={() => navigation.navigate('Register')}
          style={styles.registerButton}
        >
          Don't have an account? Register
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 25,
    backgroundColor: '#ffffff'
  },
  header: {
    alignItems: 'center',
    marginBottom: 40
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formSection: {
    width: '100%',
    alignSelf: 'center',
    maxWidth: 400,
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  // ✅ Updated Button Styles to match WelcomeScreen
  button: {
    marginTop: 15,
    borderRadius: 30, // Highly rounded corners
    backgroundColor: '#2ecc71',
    paddingVertical: 5, // Adds vertical height
    minHeight: 50, // Ensures a consistent large touch target
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  registerButton: {
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
});