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
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(''); // Clear previous errors
    try {
      await login(email, password);
      // Success: RootNavigator switches to the app automatically
    } catch (e) {
      setError('Invalid email or password. Please try again.');
      console.error("Login Error:", e);
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