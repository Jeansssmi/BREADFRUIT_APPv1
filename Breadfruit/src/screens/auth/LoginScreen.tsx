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
  const { dark, toggleTheme } = useTheme();
  const [pendingModalVisible, setPendingModalVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [savedPassword, setSavedPassword] = useState('');


  const opacityAnim = useRef(new Animated.Value(0)).current;

  // ✅ Load remembered email
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem("rememberedEmail");
        const savedPass = await AsyncStorage.getItem("rememberedPassword");

        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        }

        if (savedPass) {
          setPassword(savedPass);
          setRememberMe(true);
        }

      } catch (e) {
        console.error("Failed to load saved credentials:", e);
      }
    };

    loadSavedCredentials();
  }, []);




  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);

    // Reset animation values
    slideAnim.setValue(30);
    opacityAnim.setValue(0);

    // Slide + fade in
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide after 3 seconds
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 30,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setSnackbarVisible(false));
    }, 3000);
  };

const handleLogin = async () => {
  setError('');

  if (!email || !password) {
    setError('Email and password are required.');
    return;
  }

  setLoading(true);

  try {
    // Temporary login
    const temp = await auth().signInWithEmailAndPassword(email, password);
    const uid = temp.user.uid;

    // Get user data
    const userDoc = await firestore().collection("users").doc(uid).get();
    const userData = userDoc.data();

    // Block pending accounts
    if (userData?.role === "researcher" && userData?.status === "pending") {
      showSnackbar("Your account is awaiting admin approval.");
      await auth().signOut();
      setLoading(false);
      return;
    }

    // Real login
    await login(email, password);

    // ---------------------------------------
    //  ✅ FIX REMEMBER ME LOGIC
    // ---------------------------------------
    if (rememberMe) {
      await AsyncStorage.setItem("rememberedEmail", email);
      await AsyncStorage.setItem("rememberedPassword", password);
    } else {
      await AsyncStorage.removeItem("rememberedEmail");
      await AsyncStorage.removeItem("rememberedPassword");
    }

  } catch (err) {
    let errorMessage = "Login failed. Please check your credentials.";

    if (
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
      colors={dark ? ['#121212', '#000'] : ['#e6ffe6', '#f7fdf7']}
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
            <MaterialCommunityIcons name="menu" size={30} color={dark ? '#fff' : '#333'} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.loginTitle, { color: dark ? '#fff' : '#333' }]}>Login</Text>

        <View style={styles.formSection}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

         <TextInput
           label="Email"
           value={email}
           onChangeText={setEmail}
           style={styles.input}
           mode="flat"
           autoCapitalize="none"
           keyboardType="email-address"
           underlineColor={dark ? "#444" : "#e0e0e0"}
           activeUnderlineColor="#00c853"

           left={
             <TextInput.Icon
               icon="email-outline"
               color={dark ? "#FFFFFF" : "#00C853"}   // Icon color
             />
           }

           // 🔥 DIFFERENT TYPING COLOR BASED ON THEME
           textColor={dark ? "#FFFFFF" : "#333"}

           theme={{
             colors: {
               primary: "#00c853",
               placeholder: dark ? "#AAAAAA" : "#00C853",
               background: "transparent",
             },
           }}

           selectionColor="#00c853"
         />


            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              style={styles.input}
              mode="flat"
              underlineColor={dark ? "#444" : "#e0e0e0"}
              activeUnderlineColor="#00c853"
              left={
                <TextInput.Icon
                  icon="lock-outline"
                  color={dark ? "#FFFFFF" : "#00C853"}
                />
              }
              right={
                <TextInput.Icon
                  icon={passwordVisible ? "eye-outline" : "eye-off-outline"}
                  onPress={() => setPasswordVisible(!passwordVisible)}
                  color={dark ? "#FFFFFF" : "#00C853"}
                />
              }

              // 🔥 DIFFERENT TEXT COLOR BASED ON THEME
              textColor={dark ? "#FFFFFF" : "#333"}

              theme={{
                colors: {
                  primary: "#00c853",
                  placeholder: dark ? "#AAAAAA" : "#00C853",
                  background: "transparent",
                },
              }}

              selectionColor="#00c853"
            />


          <View style={styles.optionsContainer}>
            <View style={styles.rememberMe}>
              <Switch value={rememberMe} onValueChange={setRememberMe} color="#00c853" />
              <Text style={[styles.optionText, { color: dark ? '#fff' : '#666' }]}>Remember me</Text>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} >
              <Text style={[styles.forgotPasswordText, { color: dark ? '#80ff80' : '#00c853' }]}>Forgot Password?</Text>
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
            <Text style={[styles.registerText, { color: dark ? '#ccc' : '#666' }]}>Don't have an account? </Text>
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
          style={[styles.drawerContainer, { backgroundColor: dark ? '#111' : '#fff', transform: [{ translateX: slideAnim }] }]}
        >
          <Text style={[styles.drawerTitle, { color: dark ? '#FFFFFF' : '#333' }]}>Menu</Text>

          <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.navigate('AboutHelp')}>
            <MaterialCommunityIcons name="information-outline" size={22} color={dark ? '#Fff' : '#F7F7F7'} />
            <Text style={[styles.drawerText, { color: dark ? '#fff' : '#333' }]}>About App</Text>

          </TouchableOpacity>



          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => Alert.alert('Contact Us', 'Email: support@breadfruit.com')}
          >
            <MaterialCommunityIcons name="email-outline" size={22} color={dark ? '#FFFFFF' : '#333'} />
            <Text style={[styles.drawerText, { color: dark ? '#FFFFFF' : '#333' }]}>Contact Support</Text>
          </TouchableOpacity>

          <View style={styles.themeContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons
                name={dark ? 'weather-night' : 'white-balance-sunny'}
                size={22}
                color={dark ? '#FFD700' : '#333'}
              />
              <Text style={[styles.drawerText, { color: dark ? '#fff' : '#333' }]}>
                {dark ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </View>
            <Switch
              value={dark}
              onValueChange={toggleTheme}
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

      {snackbarVisible && snackbarMessage ? (
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 40,
            left: 20,
            right: 20,
            borderRadius: 10,
            backgroundColor: '#2ecc71',
            padding: 12,
            elevation: 5,
            opacity: opacityAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={22}
              color="#fff"
              style={{ marginRight: 10 }}
            />
            <Text style={{ color: 'white', fontSize: 15 }}>
              {snackbarMessage}
            </Text>
          </View>
        </Animated.View>
      ) : null}

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
