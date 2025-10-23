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
import { Button, Menu, Text, TextInput, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import storage from '@react-native-firebase/storage';
import functions from '@react-native-firebase/functions';

import { LoadingAlert, NotificationAlert } from '@/components/NotificationModal';

export default function AddUserScreen() {
  const navigation = useNavigation();
  const theme = useTheme(); // ✅ use global theme

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
      let downloadURL: string | null = null;

      if (image) {
        try {
          const fileName = `images/user-profile/${Date.now()}_${image.split('/').pop()}`;
          const reference = storage().ref(fileName);
          await reference.putFile(image.replace('file://', ''));
          downloadURL = await reference.getDownloadURL();
        } catch (uploadError: any) {
          console.warn('⚠️ Image upload failed, continuing without image:', uploadError.code);
        }
      }

      const createUser = functions().httpsCallable('createNewUser');
      const result = await createUser({
        name,
        email,
        password,
        role,
        status: 'verified',
        image: downloadURL,
      });

      if (result.data?.success) {
        setNotificationMessage(`✅ ${role} account created successfully!`);
        setNotificationType('success');
        setNotificationVisible(true);
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setRole('');
        setImage(null);
      } else {
        throw new Error('User creation failed.');
      }
    } catch (error: any) {
      console.error('❌ Error creating user:', error);
      let message = 'Failed to create user. Please try again.';
      if (error.message?.includes('already registered')) message = 'This email is already in use.';
      if (error.message?.includes('invalid')) message = 'Invalid email or password.';
      setNotificationMessage(message);
      setNotificationType('error');
      setNotificationVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { backgroundColor: theme.colors.background },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
          <TouchableOpacity onPress={pickImage} style={[
            styles.imageContainer,
            { borderColor: theme.dark ? '#333' : '#eee', backgroundColor: theme.dark ? '#1e1e1e' : '#f8f8f8' },
          ]}>
            {image ? (
              <Image source={{ uri: image }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialIcons name="add-a-photo" size={40} color={theme.colors.primary} />
                <Text style={[styles.imageLabel, { color: theme.colors.primary }]}>
                  Add Profile Picture
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Inputs */}
          <TextInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            style={[
              styles.input,
              { backgroundColor: theme.dark ? '#1f1f1f' : '#f8f8f8', color: theme.colors.text },
            ]}
          />
          <TextInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            style={[
              styles.input,
              { backgroundColor: theme.dark ? '#1f1f1f' : '#f8f8f8', color: theme.colors.text },
            ]}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            style={[
              styles.input,
              { backgroundColor: theme.dark ? '#1f1f1f' : '#f8f8f8', color: theme.colors.text },
            ]}
            secureTextEntry
          />
          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={[
              styles.input,
              { backgroundColor: theme.dark ? '#1f1f1f' : '#f8f8f8', color: theme.colors.text },
            ]}
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
                style={[styles.roleButton, { borderColor: theme.colors.primary }]}
              >
                {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Select Role'}
              </Button>
            }
          >
            <Menu.Item title="Admin" onPress={() => { setRole('admin'); setShowRoleMenu(false); }} />
            <Menu.Item title="Researcher" onPress={() => { setRole('researcher'); setShowRoleMenu(false); }} />
            <Menu.Item title="Viewer" onPress={() => { setRole('viewer'); setShowRoleMenu(false); }} />
          </Menu>

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
          >
            Create User
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ✅ Styles (no layout change)
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  scrollContent: { flexGrow: 1 },
  input: { marginBottom: 15 },
  primaryButton: { marginTop: 15, borderRadius: 25 },
  imageContainer: {
    height: 200,
    borderRadius: 12,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  image: { width: '100%', height: '100%', borderRadius: 10 },
  imagePlaceholder: {
    gap: 12,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLabel: { fontSize: 16, fontWeight: '500' },
  roleButton: {
    width: '100%',
    borderRadius: 25,
    paddingVertical: 8,
    marginBottom: 10,
  },
});
