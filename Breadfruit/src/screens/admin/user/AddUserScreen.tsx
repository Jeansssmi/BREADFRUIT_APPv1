import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Menu, Text, TextInput } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

export default function AddUserScreen() {
  const navigation = useNavigation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("researcher");
  const [password, setPassword] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);

const pickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.didCancel || !result.assets || result.assets.length === 0) return;
    setImage(result.assets[0].uri || null);
  };

  // ✅ Password strength logic (invisible)
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "Weak",
  });

  const evaluatePasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 6) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    let label = "Weak";
    if (score === 2) label = "Medium";
    else if (score >= 3) label = "Strong";
    setPasswordStrength({ score, label });
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    evaluatePasswordStrength(text);
  };

  const resetFields = () => {
    setEmail("");
    setPassword("");
    setName("");
    setRole("researcher");
    setPasswordStrength({ score: 0, label: "Weak" });
  };

  const handleCreateUser = async () => {
    if (!email || !password || !name) {
      Alert.alert("Missing Fields", "Please fill out all required fields.");
      return;
    }

    if (password.trim().length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }

    // 🚫 Enforce strong password only for admin accounts
    if (role === "admin" && passwordStrength.label === "Weak") {
      Alert.alert(
        "Weak Password",
        "Admin passwords must be stronger. Please include uppercase, numbers, or symbols."
      );
      return;
    }

    setLoading(true);

    try {
      // ✅ Create the user in Firebase Authentication
      const newUser = await auth().createUserWithEmailAndPassword(
        email,
        password
      );

      // ✅ Save the user to Firestore
      await firestore().collection("users").doc(newUser.user.uid).set({
        uid: newUser.user.uid,
        name,
        email,
        role,
        status: "verified",
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert("Success", `${name} (${role}) has been added successfully!`, [
        {
          text: "OK",
          onPress: () => navigation.navigate("UserListScreen"), // ✅ Back to UserList
        },
      ]);

      resetFields();
    } catch (error: any) {
      console.error("Error creating user:", error);

      if (error.code === "auth/email-already-in-use") {
        Alert.alert("Error", "This email is already in use.");
      } else if (error.code === "auth/invalid-email") {
        Alert.alert("Error", "Invalid email format.");
      } else if (error.code === "auth/weak-password") {
        Alert.alert("Error", "Password is too weak (min 6 chars).");
      } else {
        Alert.alert("Error", "Failed to create user. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Create User" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          mode="outlined"
          placeholder="Enter full name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          mode="outlined"
          placeholder="Enter email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          mode="outlined"
          placeholder="Enter password"
          value={password}
          onChangeText={handlePasswordChange}
          secureTextEntry
          style={styles.input}
        />

        <Text style={styles.label}>Role</Text>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setMenuVisible(true)}
              style={styles.dropdown}
            >
              {role === "admin" ? "Admin" : "Researcher"}
            </Button>
          }
        >
          <Menu.Item
            onPress={() => {
              setRole("admin");
              setMenuVisible(false);
            }}
            title="Admin"
          />
          <Menu.Item
            onPress={() => {
              setRole("researcher");
              setMenuVisible(false);
            }}
            title="Researcher"
          />
        </Menu>

        <Button
          mode="contained"
          onPress={handleCreateUser}
          style={styles.createButton}
          loading={loading}
          disabled={loading}
        >
          Create User
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: { color: "#2ecc71", fontWeight: "bold", fontSize: 20 },
  scroll: { padding: 16 },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 12,
    color: "#2ecc71",
  },
  input: { marginBottom: 8 },
  dropdown: { marginBottom: 16 },
  createButton: {
    backgroundColor: "#2ecc71",
    marginTop: 16,
    paddingVertical: 6,
    borderRadius: 25,
  },
});
