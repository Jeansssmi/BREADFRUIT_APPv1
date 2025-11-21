import React, { useState, useEffect, useRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, Text as RNText } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import functions from '@react-native-firebase/functions';
import { LoadingAlert, NotificationAlert } from '@/components/NotificationModal';
import { Animated, TouchableWithoutFeedback, Easing, Vibration, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';

// ⭐ FULL DARK MODE HOOK
import { useTheme } from "../../../context/ThemeContext";

export default function RegisterFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  // @ts-ignore
  const { type } = route.params as { type: string };
  const { dark } = useTheme();

  // ⭐ FULL THEME COLORS
  const bgColor = dark ? "#000" : "#fff";
  const cardColor = dark ? "#111" : "#f5f5f5";
  const inputBg = dark ? "#1e1e1e" : "#fff";
  const textColor = dark ? "#fff" : "#222";
  const placeholderColor = dark ? "#888" : "#777";
  const borderColor = dark ? "#333" : "#ddd";

  // STATE
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<number | null>(null);

  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'info' | 'error'>('info');

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [snackbarType] = useState<'success' | 'info' | 'error'>('info');

  const [emailError, setEmailError] = useState<string | null>(null);

  const toTitleCase = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
  const isPasswordMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const buttonBg = dark ? "#ffffff" : "#2ecc71";
  const buttonText = dark ? "#000000" : "#ffffff";
  // EMAIL VALIDATION
  const handleEmailChange = (text: string) => {
    setEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (text.length === 0) setEmailError(null);
    else if (!emailRegex.test(text)) setEmailError('Invalid email format.');
    else setEmailError(null);
  };

  // COUNTDOWN
  useEffect(() => {
    if (resendTimer === 0 && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [resendTimer]);

  const startResendCountdown = (seconds = 60) => {
    setResendTimer(seconds);
    if (timerRef.current) clearInterval(timerRef.current);

    Animated.timing(fadeAnim, {
      toValue: 0.3,
      duration: 500,
      useNativeDriver: true,
    }).start();

    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;

          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();

          return 0;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;
  };

  // SEND OTP
  const handleSendOtp = async () => {
    if (!email || emailError) {
      setNotificationMessage("Please enter a valid email before requesting OTP.");
      setNotificationType("error");
      setNotificationVisible(true);
      return;
    }

    try {
      setLoading(true);
      const sendOtpFunc = functions().httpsCallable("sendEmailOtp");
      await sendOtpFunc({ email });

      setOtpSent(true);
      startResendCountdown(60);

      setNotificationMessage("OTP sent! Please check your inbox.");
      setNotificationType("success");
      setNotificationVisible(true);

    } catch (err: any) {
      setNotificationMessage(err.message || "Failed to send OTP.");
      setNotificationType("error");
      setNotificationVisible(true);
    } finally {
      setLoading(false);
    }
  };

    const resendOtp = async () => {
      if (resendTimer > 0) return;
      await handleSendOtp();
    };


  // VERIFY OTP + REGISTER
  const handleVerifyAndRegister = async () => {
    if (!otp || otp.length !== 6) {
      setNotificationMessage("Please enter the 6-digit OTP.");
      setNotificationType("error");
      setNotificationVisible(true);
      return;
    }

    if (!name || !email || !password || !confirmPassword) {
      setNotificationMessage("All fields are required.");
      setNotificationType("error");
      setNotificationVisible(true);
      return;
    }

    if (password !== confirmPassword) {
      setNotificationMessage("Passwords do not match.");
      setNotificationType("error");
      setNotificationVisible(true);
      return;
    }

    try {
      setLoading(true);

      const verifyOtpFunc = functions().httpsCallable("verifyEmailOtp");
      await verifyOtpFunc({ email, otp });

      const createUserFunc = functions().httpsCallable("createNewUser");
      const result = await createUserFunc({
        name,
        email,
        password,
        role: type,
        status: type === "viewer" ? "verified" : "pending",
        image: null,
        joined: new Date().toISOString(),
        emailVerified: true,
      });

      if (result?.data?.success) {
        if (type === "researcher") {
          await firestore().collection("notification").add({
            type: "researcher-registered",
            message: `${name} has registered and is waiting for approval.`,
            recipientRole: "Admin",
            read: false,
            seen: false,
            system: true,
            timestamp: firestore.FieldValue.serverTimestamp(),
          });

          Alert.alert("Registration Successful", "Please wait for admin approval.", [
            { text: "OK", onPress: () => navigation.navigate("Login") }
          ]);
          return;
        }

        setNotificationMessage("Registration successful!");
        setNotificationType("success");
        setNotificationVisible(true);

        setTimeout(() => navigation.navigate("Login"), 1200);
      }

    } catch (error: any) {
      let msg = error.message || "Registration failed.";

      if (msg.toLowerCase().includes("already"))
        msg = "This email is already registered.";

      setNotificationMessage(msg);
      setNotificationType("error");
      setNotificationVisible(true);

    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={[styles.container, { backgroundColor: bgColor }]}>

            {/* Loading + Notification */}
            <LoadingAlert visible={loading} message="Please wait..." />
            <NotificationAlert visible={notificationVisible} message={notificationMessage} type={notificationType} onClose={() => setNotificationVisible(false)} />

            {/* ICON */}
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="account-plus" size={80} color="#2ecc71" />
            </View>

            {/* TITLE */}
            <Text variant="headlineMedium" style={[styles.title, { color: textColor }]}>
              {toTitleCase(type)} Registration
            </Text>

            {/* NAME */}
            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              left={
                <TextInput.Icon
                  icon="account"
                  color={dark ? "#FFFFFF" : "#555"}
                />
              }
              style={[styles.input, { backgroundColor: inputBg }]}
              textColor={dark ? "#FFFFFF" : "#333"}
              theme={{
                colors: {
                  text: dark ? "#FFA500" : "#000000",
                  placeholder: placeholderColor,
                  primary: "#2ecc71",
                  background: "transparent",
                }
              }}
            />


            {/* EMAIL */}
            <TextInput
              label="Email"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              left={
                <TextInput.Icon
                  icon="email"
                  color={dark ? "#FFFFFF" : "#555"}
                />
              }
              style={[styles.input, { backgroundColor: inputBg }]}
              textColor={dark ? "#FFFFFF" : "#333"}
              theme={{
                colors: {
                  text: dark ? "#FFA500" : "#000000",
                  placeholder: placeholderColor,
                  primary: "#2ecc71",
                  background: "transparent",
                }
              }}
            />


            {/* PASSWORD */}
            <TextInput
              label="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              left={
                <TextInput.Icon
                  icon="lock"
                  color={dark ? "#FFFFFF" : "#555"}
                />
              }
              style={[styles.input, { backgroundColor: inputBg }]}
              textColor={dark ? "#FFFFFF" : "#333"}
              theme={{
                colors: {
                  text: dark ? "#FFA500" : "#000000",
                  placeholder: placeholderColor,
                  primary: "#2ecc71",
                  background: "transparent",
                }
              }}
            />



            {/* CONFIRM PASSWORD */}
            <TextInput
              label="Confirm Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              left={
                <TextInput.Icon
                  icon="lock-check"
                  color={dark ? "#FFFFFF" : "#555"}
                />
              }
              right={
                confirmPassword.length > 0 ? (
                  <TextInput.Icon
                    icon={isPasswordMatch ? "check-circle" : "close-circle"}
                    color={isPasswordMatch ? "#2ecc71" : "#e74c3c"}
                  />
                ) : null
              }
              style={[styles.input, { backgroundColor: inputBg }]}
              textColor={dark ? "#FFFFFF" : "#333"}
              theme={{
                colors: {
                  text: dark ? "#FFA500" : "#000000",
                  placeholder: placeholderColor,
                  primary: "#2ecc71",
                  background: "transparent",
                }
              }}
            />


            {/* BEFORE OTP */}
            {!otpSent ? (
              <>
                <Button
                  mode="contained"
                  onPress={handleSendOtp}
                  style={[styles.button]}
                  disabled={loading || !!emailError || !email}
                >
                  <Text style={{ color: buttonText }}>Send OTP to Email</Text>
                </Button>

                <Button mode="text" onPress={() => navigation.navigate("Login")}>
                  <Text style={{ color: textColor }}>Already have an account? Login</Text>
                </Button>
              </>
            ) : (
              <>
                {/* OTP INPUT */}
                <TextInput
                  label="Enter OTP"
                  value={otp}
                  keyboardType="number-pad"
                  onChangeText={t => setOtp(t.replace(/[^0-9]/g, "").slice(0, 6))}
                  style={[styles.input, { backgroundColor: inputBg }]}
                  textColor={dark ? "#FFA500" : "#000000"}
                  theme={{
                    colors: {
                      text: dark ? "#FFFFFF" : "#333",
                      placeholder: placeholderColor,
                      primary: "#2ecc71",
                      background: "transparent",
                    }
                  }}
                />

                <Button
                  mode="contained"
                  onPress={handleVerifyAndRegister}
                  style={[styles.button]}
                >
                  <Text style={{ color: buttonText }}>Verify OTP & Register</Text>
                </Button>

                {/* RESEND OTP */}
                <View style={{ flexDirection: "row", marginTop: 10, justifyContent: "center" }}>
                  <Animated.View style={{ opacity: fadeAnim }}>
                    <Button
                      mode="text"
                      onPress={resendOtp}
                      disabled={resendTimer > 0}
                    >
                      <Text style={{ color: resendTimer > 0 ? "#888" : "#2ecc71" }}>
                        {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
                      </Text>
                    </Button>
                  </Animated.View>

                  <Button mode="text" onPress={() => setOtpSent(false)}>
                    <Text style={{ color: textColor }}>Edit Details</Text>
                  </Button>
                </View>
              </>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center"
  },
  input: {
    marginBottom: 12,
    backgroundColor: "transparent"
  },
  button: {
    marginTop: 10,
    backgroundColor: "#2ecc71",
    borderRadius: 8
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 20
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold"
  }
});
