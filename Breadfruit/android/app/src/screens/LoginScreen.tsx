import { useAuth } from '@/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'; // Updated import

export default function LoginScreen() {
  const { login } = useAuth();
  const navigation = useNavigation<any>(); // Added type for navigation

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // NOTE: No navigation.reset() is needed here.
      // The state change in AuthContext will automatically switch the navigator in your App.tsx.
    } catch (e) {
      alert('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="account-circle" size={80} color="#2ecc71" />
      </View>
      <Text variant="headlineMedium" style={styles.title}>Breadfruit Tracker</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TextInput
        label="Email" value={email} onChangeText={setEmail}
        style={styles.input} autoCapitalize="none"
        left={<TextInput.Icon icon="email" />}
      />
      <TextInput
        label="Password" value={password} onChangeText={setPassword}
        secureTextEntry style={styles.input}
        left={<TextInput.Icon icon="lock" />}
      />
      <Button
        mode="contained" onPress={handleLogin} style={styles.button}
        labelStyle={{ color: 'white' }} disabled={loading}
      >
        {loading ? <ActivityIndicator size="small" color="white" /> : 'Sign In'}
      </Button>
      <Button mode="text" textColor="#666" onPress={() => navigation.navigate('Register')}>
        Don't have an account? Register
      </Button>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#ffffff' },
  iconContainer: { alignItems: 'center', marginBottom: 20 },
  title: { marginBottom: 30, textAlign: 'center', color: '#333' },
  input: { marginBottom: 15, backgroundColor: '#f8f8f8' },
  button: { marginVertical: 10, borderRadius: 25, backgroundColor: '#2ecc71' },
  errorText: { color: 'red', marginBottom: 12, textAlign: 'center' },
});