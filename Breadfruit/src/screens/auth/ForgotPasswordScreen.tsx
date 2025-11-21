import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import auth from "@react-native-firebase/auth";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);

    slideAnim.setValue(30);
    opacityAnim.setValue(0);

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

  const handleResetPassword = async () => {
    if (!email) {
      setError("Enter your email to receive a reset link.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await auth().sendPasswordResetEmail(email);
      showSnackbar(`Reset link sent to ${email}`);
    } catch (err: any) {
      setError("Unable to send reset email. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#e6ffe6", "#f7fdf7"]}
      style={styles.gradientContainer}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {/* BACK BUTTON */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={30}
              color="#006400"
            />
          </TouchableOpacity>

          {/* Page Title */}
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your email and we’ll send you a reset link.
          </Text>

          {/* Error */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Email Input */}
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="flat"
            keyboardType="email-address"
            style={styles.input}
            left={<TextInput.Icon icon="email-outline" />}
            underlineColor="#ccc"
            activeUnderlineColor="#2ecc71"
          />

          {/* Reset Button */}
          <Button
            mode="contained"
            onPress={handleResetPassword}
            style={styles.resetButton}
            labelStyle={styles.resetLabel}
            loading={loading}
            disabled={loading}
          >
            SEND RESET LINK
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Snackbar */}
      {snackbarVisible && (
        <Animated.View
          style={[
            styles.snackbar,
            {
              opacity: opacityAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="check-circle-outline"
            size={22}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={{ color: "#fff", fontSize: 15 }}>
            {snackbarMessage}
          </Text>
        </Animated.View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 25,
    paddingTop: 80,
  },
  backBtn: {
    position: "absolute",
    top: 40,
    left: 20,
    padding: 5,
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#006400",
  },
  subtitle: {
    fontSize: 16,
    color: "#444",
    marginBottom: 30,
    maxWidth: 300,
  },
  input: {
    marginBottom: 25,
    backgroundColor: "transparent",
  },
  resetButton: {
    backgroundColor: "#2ecc71",
    borderRadius: 50,
    paddingVertical: 10,
  },
  resetLabel: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    marginBottom: 12,
    fontSize: 14,
  },
  snackbar: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "#2ecc71",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 5,
  },
});
