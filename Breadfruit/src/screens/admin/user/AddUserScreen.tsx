import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Menu, Text, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// ✅ Correct imports for react-native-firebase
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

import { LoadingAlert, NotificationAlert } from '@/components/NotificationModal';

export default function AddUserScreen() {
  const navigation = useNavigation();

  const [image, setImage] = useState<string | null>(null);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'info' | 'error'>('info');

  const pickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.didCancel || !result.assets || result.assets.length === 0) return;
    setImage(result.assets[0].uri || null);
  };

  const handleSubmit = async () => {
    if (!name || !email || !password || !confirmPassword || !role) {
      setNotificationMessage('All fields are required.');
      setNotificationType('error');
      setNotificationVisible(true);
      return;
    }
    if (password !== confirmPassword) {
      setNotificationMessage('Passwords do not match.');
      setNotificationType('error');
      setNotificationVisible(true);
      return;
    }

    setLoading(true);

    try {
      // ✅ Correct syntax for react-native-firebase
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      let downloadURL = '';
      if (image) {
        const fileName = `images/user-profile/${Date.now()}_${image.split('/').pop()}`;
        // ✅ Correct syntax for react-native-firebase
        const reference = storage().ref(fileName);
        await reference.putFile(image.replace('file://', ''));
        downloadURL = await reference.getDownloadURL();
      }

      // ✅ Correct syntax for react-native-firebase
      await user.updateProfile({
        displayName: name,
        photoURL: downloadURL || null,
      });

      // ✅ Correct syntax for react-native-firebase (using .set with UID)
      await firestore().collection('users').doc(user.uid).set({
        uid: user.uid,
        name,
        email,
        role,
        image: downloadURL,
        status: 'verified',
        joined: firestore.FieldValue.serverTimestamp(),
      });

      setNotificationMessage('User created successfully.');
      setNotificationType('success');
      setNotificationVisible(true);
    } catch (error: any) {
      setNotificationMessage('Registration failed: ' + error.message);
      setNotificationType('error');
      setNotificationVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <LoadingAlert visible={loading} message="Creating user..." />

          <NotificationAlert
            visible={notificationVisible}
            message={notificationMessage}
            type={notificationType}
            onClose={() => {
              setNotificationVisible(false);
              if (notificationType === 'success') navigation.goBack();
            }}
          />

          {/* Profile picture */}
          <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
            {image ? (
              <Image source={{ uri: image }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialIcons name="add-a-photo" size={40} color="#2ecc71" />
                <Text style={styles.imageLabel}>Add Profile Picture</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Inputs */}
          <TextInput label="Full Name" value={name} onChangeText={setName} style={styles.input} />
          <TextInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />
          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
            secureTextEntry
          />

          {/* Role selection */}
          <Menu
            visible={showRoleMenu}
            onDismiss={() => setShowRoleMenu(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setShowRoleMenu(true)}
                style={styles.roleButton}>
                {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Select Role'}
              </Button>
            }>
            <Menu.Item
              title="Admin"
              onPress={() => {
                setRole('admin');
                setShowRoleMenu(false);
              }}
            />
            <Menu.Item
              title="Researcher"
              onPress={() => {
                setRole('researcher');
                setShowRoleMenu(false);
              }}
            />
            <Menu.Item
              title="Viewer"
              onPress={() => {
                setRole('viewer');
                setShowRoleMenu(false);
              }}
            />
          </Menu>

          {/* Submit button */}
          <Button mode="contained" onPress={handleSubmit} style={styles.primaryButton}>
            Create User
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#ffffff' },
  scrollContent: { flexGrow: 1 },
  input: { backgroundColor: '#f8f8f8', marginBottom: 15 },
  primaryButton: { marginTop: 15, backgroundColor: '#2ecc71', borderRadius: 25 },
  imageContainer: {
    height: 200,
    borderRadius: 12,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#eee',
    backgroundColor: '#f8f8f8',
  },
  image: { width: '100%', height: '100%', borderRadius: 10 },
  imagePlaceholder: {
    gap: 12,
    borderStyle: 'dashed',
    borderColor: '#2ecc71',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLabel: { color: '#2ecc71', fontSize: 16, fontWeight: '500' },
  roleButton: {
    width: '100%',
    borderRadius: 25,
    paddingVertical: 8,
    borderColor: '#333',
    marginBottom: 10,
  },
});
