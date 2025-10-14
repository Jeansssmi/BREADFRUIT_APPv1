import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  ActivityIndicator,
  Modal,
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from "../../context/ThemeContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [pendingModalVisible, setPendingModalVisible] = useState(false);

  // ✅ Load remembered email
  useEffect(() => {
    const loadRememberedEmail = async () => {
      try {
        const rememberedEmail = await AsyncStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
          setEmail(rememberedEmail);
          setRememberMe(true);
        }
      } catch (e) {
        console.error('Failed to load remembered email.', e);
      }
    };
    loadRememberedEmail();
  }, []);

  // 🌙 Load saved theme mode on startup
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themeMode');
        if (savedTheme) setIsDarkMode(savedTheme === 'dark');
      } catch (e) {
        console.error('Failed to load theme mode.', e);
      }
    };
    loadTheme();
  }, []);

  // ✅ Handle Login
 const handleLogin = async () => {
   // 🧹 Clear old error message before new login
   setError('');

   if (!email || !password) {
     setError('Email and password are required.');
     return;
   }

   setLoading(true);
   try {
     await login(email, password);
     // If login succeeds, everything else is handled by RootNavigator
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

  // ✅ Drawer Menu Animation
  const toggleMenu = (show: boolean) => {
    if (show) {
      setMenuVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    }
  };

  // ✅ Handle password reset
  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert(
        'Enter Email',
        'Please enter your email address to receive a password reset link.'
      );
      return;
    }
    try {
      await auth().sendPasswordResetEmail(email);
      Alert.alert('Check Your Email', `A reset link was sent to ${email}.`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <LinearGradient
      colors={isDarkMode ? ['#121212', '#000'] : ['#e6ffe6', '#f7fdf7']}
      style={styles.gradientContainer}
    >
      {/* Background Blobs */}
      <View style={styles.topBlob1} />
      <View style={styles.topBlob2} />
      <View style={styles.topBlob3} />

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.topHeader}>
          <MaterialCommunityIcons name="leaf" size={40} color="#006400" style={styles.logoIcon} />
          <TouchableOpacity onPress={() => toggleMenu(true)} style={styles.menuIconContainer}>
            <MaterialCommunityIcons name="menu" size={30} color={isDarkMode ? '#fff' : '#333'} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.loginTitle, { color: isDarkMode ? '#fff' : '#333' }]}>Login</Text>

        <View style={styles.formSection}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

         <TextInput
           label="Email"
           value={email}
           onChangeText={setEmail}
           style={[styles.input, { color: isDarkMode ? '#fff' : '#333' }]}
           autoCapitalize="none"
           keyboardType="email-address"
           mode="flat"
           underlineColor={isDarkMode ? '#444' : '#e0e0e0'}
           activeUnderlineColor="#00c853"
           left={<TextInput.Icon icon="email-outline" color={isDarkMode ? '#fff' : '#333'} />}
           theme={{
             colors: {
               text: isDarkMode ? '#fff' : '#333',
               placeholder: isDarkMode ? '#ccc' : '#666',
               primary: '#00c853',
               background: 'transparent',
             },
           }}
           selectionColor="#00c853"
         />

         <TextInput
           label="Password"
           value={password}
           onChangeText={setPassword}
           secureTextEntry={!passwordVisible}
           style={[styles.input, { color: isDarkMode ? '#fff' : '#333' }]}
           mode="flat"
           underlineColor={isDarkMode ? '#444' : '#e0e0e0'}
           activeUnderlineColor="#00c853"
           left={<TextInput.Icon icon="lock-outline" color={isDarkMode ? '#fff' : '#333'} />}
           right={
             <TextInput.Icon
               icon={passwordVisible ? 'eye-outline' : 'eye-off-outline'}
               onPress={() => setPasswordVisible(!passwordVisible)}
               color={isDarkMode ? '#ccc' : '#666'}
             />
           }
           theme={{
             colors: {
               text: isDarkMode ? '#fff' : '#333',
               placeholder: isDarkMode ? '#ccc' : '#666',
               primary: '#00c853',
               background: 'transparent',
             },
           }}
           selectionColor="#00c853"
         />


          <View style={styles.optionsContainer}>
            <View style={styles.rememberMe}>
              <Switch value={rememberMe} onValueChange={setRememberMe} color="#00c853" />
              <Text style={[styles.optionText, { color: isDarkMode ? '#fff' : '#666' }]}>Remember me</Text>
            </View>

            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={[styles.forgotPasswordText, { color: isDarkMode ? '#80ff80' : '#00c853' }]}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.loginButton}
            labelStyle={styles.loginButtonLabel}
            disabled={loading}
          >
            {loading ? <ActivityIndicator size="small" color="white" /> : 'LOGIN'}
          </Button>

          <View style={styles.registerContainer}>
            <Text style={[styles.registerText, { color: isDarkMode ? '#ccc' : '#666' }]}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 🌿 Drawer Menu */}
      <Modal transparent visible={menuVisible} animationType="none">
        <TouchableOpacity activeOpacity={1} onPress={() => toggleMenu(false)} style={styles.overlay} />

        <Animated.View
          style={[styles.drawerContainer, { backgroundColor: isDarkMode ? '#111' : '#fff', transform: [{ translateX: slideAnim }] }]}
        >
          <Text style={[styles.drawerTitle, { color: isDarkMode ? '#fff' : '#333' }]}>Menu</Text>

          <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.navigate('AboutHelp')}>
            <MaterialCommunityIcons name="information-outline" size={22} color={isDarkMode ? '#fff' : '#333'} />
            <Text style={[styles.drawerText, { color: isDarkMode ? '#fff' : '#333' }]}>About App</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.navigate('NotificationPreferences')}>
            <MaterialCommunityIcons name="bell-outline" size={22} color={isDarkMode ? '#fff' : '#333'} />
            <Text style={[styles.drawerText, { color: isDarkMode ? '#fff' : '#333' }]}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => Alert.alert('Contact Us', 'Email: support@breadfruit.com')}
          >
            <MaterialCommunityIcons name="email-outline" size={22} color={isDarkMode ? '#fff' : '#333'} />
            <Text style={[styles.drawerText, { color: isDarkMode ? '#fff' : '#333' }]}>Contact Support</Text>
          </TouchableOpacity>

          <View style={styles.themeContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons
                name={isDarkMode ? 'weather-night' : 'white-balance-sunny'}
                size={22}
                color={isDarkMode ? '#FFD700' : '#333'}
              />
              <Text style={[styles.drawerText, { color: isDarkMode ? '#fff' : '#333' }]}>
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={async (value) => {
                try {
                  setIsDarkMode(value);
                  await AsyncStorage.setItem('themeMode', value ? 'dark' : 'light');
                } catch (e) {
                  console.error('Failed to save theme mode.', e);
                }
              }}
              thumbColor={isDarkMode ? '#2ecc71' : '#f4f3f4'}
              trackColor={{ false: '#767577', true: '#a5d6a7' }}
            />
          </View>

          <TouchableOpacity
            style={[styles.drawerItem, { borderTopWidth: 1, borderTopColor: '#444', marginTop: 10 }]}
            onPress={() => toggleMenu(false)}
          >
            <MaterialCommunityIcons name="close" size={22} color="#D32F2F" />
            <Text style={[styles.drawerText, { color: '#D32F2F' }]}>Close</Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>

      {/* 🚫 Pending Approval Modal */}
      <Modal transparent visible={pendingModalVisible} animationType="fade">

      <View style={[styles.pendingBox, { backgroundColor: isDarkMode ? '#222' : '#fff' }]}>
        <MaterialCommunityIcons name="clock-outline" size={48} color="#2ecc71" />
        <Text style={[styles.pendingTitle, { color: isDarkMode ? '#fff' : '#2ecc71' }]}>Pending Approval</Text>
        <Text style={[styles.pendingText, { color: isDarkMode ? '#ddd' : '#333' }]}>
          Your account is awaiting admin approval. Please try again later.
        </Text>
        <Button
          mode="contained"
          onPress={() => setPendingModalVisible(false)}
          style={[styles.pendingButton, { backgroundColor: '#2ecc71' }]}
        >
          OK
        </Button>

        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 25, justifyContent: 'center' },
  topBlob1: {
    position: 'absolute', top: -150, left: -100, width: 300, height: 300,
    borderRadius: 150, backgroundColor: 'rgba(0, 100, 0, 0.1)',
  },
  topBlob2: {
    position: 'absolute', top: -50, left: -20, width: 250, height: 250,
    borderRadius: 125, backgroundColor: 'rgba(0, 100, 0, 0.08)',
  },
  topBlob3: {
    position: 'absolute', top: 20, left: -80, width: 180, height: 180,
    borderRadius: 90, backgroundColor: 'rgba(0, 100, 0, 0.05)',
  },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 50 },
  logoIcon: { marginTop: 20, marginLeft: 10 },
  menuIconContainer: { marginTop: 20, marginRight: 10, padding: 5 },
  loginTitle: { fontSize: 40, fontWeight: 'bold', marginBottom: 40, marginLeft: 20 },
  formSection: { width: '100%', alignSelf: 'center', maxWidth: 400, paddingHorizontal: 20 },
  input: { marginBottom: 20, backgroundColor: 'transparent' },
  optionsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  rememberMe: { flexDirection: 'row', alignItems: 'center' },
  optionText: { fontSize: 14, color: '#666', marginLeft: 5 },
  forgotPasswordText: { fontSize: 14, color: '#00c853', fontWeight: '600' },
  loginButton: { marginTop: 20, borderRadius: 50, backgroundColor: '#00c853', minHeight: 55 },
  loginButtonLabel: { fontSize: 18, fontWeight: 'bold', color: 'white' ,paddingVertical: 10, },
  registerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  registerText: { fontSize: 16, color: '#666' },
  signUpText: { fontSize: 16, color: '#00c853', fontWeight: 'bold' },
  errorText: { color: 'red', marginBottom: 15, textAlign: 'center' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' },
  drawerContainer: {
    position: 'absolute', top: 0, bottom: 0, right: 0, width: '70%',
    padding: 20, elevation: 10, borderTopLeftRadius: 20, borderBottomLeftRadius: 20,
  },
  drawerTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  drawerText: { fontSize: 16, marginLeft: 10 },
  themeContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#444', marginTop: 20,
  },
  pendingOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  pendingBox: {
    backgroundColor: '#fff', borderRadius: 20, padding: 25, width: '80%',
    alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  pendingTitle: { fontSize: 22, fontWeight: 'bold', color: '#2ecc71', marginVertical: 10 },
  pendingText: { fontSize: 16, textAlign: 'center', color: '#333', marginBottom: 20 },
  pendingButton: { backgroundColor: '#2ecc71', borderRadius: 25, paddingHorizontal: 20 },
});
