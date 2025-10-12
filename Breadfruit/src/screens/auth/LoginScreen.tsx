import { useAuth } from '@/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { Button, Text, TextInput,Switch } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient'; // You'll need to install this library
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import auth from '@react-native-firebase/auth';

export default function LoginScreen() {
  const { login } = useAuth();
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false); // To toggle password visibility
  // ✅ 4. Add state for "Remember me"
    const [rememberMe, setRememberMe] = useState(false);

// Load remembered email on component mount
  useEffect(() => {
    const loadRememberedEmail = async () => {
      try {
        const rememberedEmail = await AsyncStorage.getItem('rememberedEmail');
        if (rememberedEmail !== null) {
          setEmail(rememberedEmail);
          setRememberMe(true);
        }
      } catch (e) {
        console.error("Failed to load remembered email.", e);
      }
    };
    loadRememberedEmail();
  }, []);
  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // Successful login is handled by RootNavigator
    } catch (err: any) {
      let errorMessage = 'Login failed. Please check your credentials.';
      if (err.code === 'auth/pending-approval') {
        errorMessage = 'Your account is pending approval by an administrator.';
      } else if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        errorMessage = 'Invalid email or password.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Function to handle password reset
  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Enter Email', 'Please enter your email address in the email field to receive a password reset link.');
      return;
    }
    try {
      await auth().sendPasswordResetEmail(email);
      Alert.alert('Check Your Email', `A password reset link has been sent to ${email}.`);
    } catch (err: any) {
      setError(err.message);
    }
  };
  return (
    <LinearGradient
      colors={['#e6ffe6', '#f7fdf7']} // Light green to lighter green gradient for the main background
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientContainer}
    >
      {/* Top Left Green Blob */}
      <View style={styles.topBlob1} />
      <View style={styles.topBlob2} />
      <View style={styles.topBlob3} />


      {/* Main Content ScrollView */}
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Header Icons and Text */}
        <View style={styles.topHeader}>
          {/* Logo (Flame-like icon, changed to green) */}
          <MaterialCommunityIcons name="leaf" size={40} color="#006400" style={styles.logoIcon} />
          {/* Hamburger Menu (top right) */}
          <TouchableOpacity onPress={() => console.log('Menu pressed')} style={styles.menuIconContainer}>
            <MaterialCommunityIcons name="menu" size={30} color="#333" />
          </TouchableOpacity>
        </View>

        <Text style={styles.loginTitle}>Login</Text>

        <View style={styles.formSection}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Email Input */}
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            mode="flat"
            underlineColor="#e0e0e0"
            activeUnderlineColor="#00c853" // Darker green for active underline
            left={<TextInput.Icon icon="email-outline" color="#333" />} // Darker icons
            theme={{ colors: { text: '#333', placeholder: '#666', primary: '#00c853' } }}
            selectionColor="#00c853"
          />

          {/* Password Input */}
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!passwordVisible}
            style={styles.input}
            mode="flat"
            underlineColor="#e0e0e0"
            activeUnderlineColor="#00c853" // Darker green for active underline
            left={<TextInput.Icon icon="lock-outline" color="#333" />} // Darker icons
            right={
              <TextInput.Icon
                icon={passwordVisible ? "eye-outline" : "eye-off-outline"}
                onPress={() => setPasswordVisible(!passwordVisible)}
                color="#666"
              />
            }
            theme={{ colors: { text: '#333', placeholder: '#666', primary: '#00c853' } }}
            selectionColor="#00c853"
          />

          {/* Remember me and Forgot Password */}
          <View style={styles.optionsContainer}>
                      <View style={styles.rememberMe}>
                        {/* ✅ 6. Use a functional Switch component */}
                        <Switch
                          value={rememberMe}
                          onValueChange={setRememberMe}
                          color="#00c853"
                        />
                        <Text style={styles.optionText}>Remember me</Text>
                      </View>
                      {/* ✅ 7. Call the correct function on press */}
                      <TouchableOpacity onPress={handleForgotPassword}>
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                      </TouchableOpacity>
                    </View>
          {/* Login Button */}
          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.loginButton}
            labelStyle={styles.loginButtonLabel}
            disabled={loading}
          >
            {loading ? <ActivityIndicator size="small" color="white" /> : 'LOGIN'}
          </Button>

          {/* Don't have an account? Register */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 25,
    justifyContent: 'center',
  },
  topBlob1: {
    position: 'absolute',
    top: -150,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0, 100, 0, 0.1)', // Dark green with opacity
    transform: [{ rotate: '-30deg' }],
  },
  topBlob2: {
    position: 'absolute',
    top: -50,
    left: -20,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(0, 100, 0, 0.08)', // Slightly lighter green with opacity
    transform: [{ rotate: '10deg' }],
  },
  topBlob3: {
    position: 'absolute',
    top: 20,
    left: -80,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(0, 100, 0, 0.05)', // Even lighter green with opacity
    transform: [{ rotate: '45deg' }],
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 50,
    marginTop: Platform.OS === 'ios' ? 40 : 10, // Adjust for notch
  },
  logoIcon: {
    marginTop: 20,
    marginLeft: 10,
    color: '#006400', // Darker green for the leaf logo
  },
  menuIconContainer: {
    marginTop: 20,
    marginRight: 10,
    padding: 5,
  },
  loginTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 40,
    marginLeft: 20, // Align with inputs
  },
  formSection: {
    width: '100%',
    alignSelf: 'center',
    maxWidth: 400,
    paddingHorizontal: 20, // Add horizontal padding for inputs
  },
  input: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 5,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  optionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#00c853', // Green for forgot password
    fontWeight: '600',
    paddingLeft: 10,
  },
  loginButton: {
    marginTop: 10,
    borderRadius: 50,
    backgroundColor: '#00c853', // Green login button
    paddingVertical: 10,
    minHeight: 55,
    justifyContent: 'center',
  },
  loginButtonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  registerText: {
    fontSize: 16,
    color: '#666',
  },
  signUpText: {
    fontSize: 16,
    color: '#00c853', // Green for Sign Up link
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
});