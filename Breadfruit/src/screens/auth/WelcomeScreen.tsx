import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // 🟢 Import useNavigation
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function WelcomeScreen() {
  const navigation = useNavigation(); // 🟢 Initialize navigation

  const handleSignIn = () => {
    // ✅ FIX: Navigate to 'Login' (the name of the LoginScreen in AuthNavigator)
    navigation.navigate('Login');
  };

  const handleSignUp = () => {
    // Navigate to the Register Stack
    navigation.navigate('Register');
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoSection}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="tree-outline" size={60} color="#fff" />
        </View>
        <Text style={styles.logoTextGreen}>Breadfruit</Text>
        <Text style={styles.logoTextGreen}>Tracker</Text>
      </View>

      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome!</Text>
        <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
          <Text style={styles.signInButtonText}>Sign in</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
          <Text style={styles.signUpButtonText}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 80,
  },
  logoSection: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2ecc71', // Green color
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoTextGreen: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2ecc71', // Green color
    lineHeight: 32,
  },
  welcomeSection: {
    width: '80%',
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 24,
    color: '#333',
    marginBottom: 30,
  },
  signInButton: {
    width: '100%',
    backgroundColor: '#2ecc71', // Green background for Sign In
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 15,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signUpButton: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2ecc71',
  },
  signUpButtonText: {
    color: '#2ecc71', // Green text for Sign Up
    fontSize: 18,
    fontWeight: 'bold',
  },
});