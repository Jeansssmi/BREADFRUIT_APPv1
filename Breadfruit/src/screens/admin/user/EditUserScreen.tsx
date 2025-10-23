import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Menu, Text, TextInput, useTheme } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { LoadingAlert, NotificationAlert } from '@/components/NotificationModal';
import { useUserData } from '@/hooks/useUserData';

export default function EditUserScreen() {
  const theme = useTheme(); // ✅ Theme hook
  const navigation = useNavigation();
  const route = useRoute();
  // @ts-ignore
  const { userID } = route.params;

  const { users, isLoading } = useUserData({ mode: 'single', uid: userID.toString() });
  const user = users[0];

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'info' | 'error'>('info');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setRole(user.role);
      setImage(user.image || '');
    }
  }, [user]);

  const pickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.didCancel || !result.assets) return;
    setImage(result.assets[0].uri || '');
  };

  const handleSubmit = (uid: string) => {
    Alert.alert('Confirm Changes', 'Save changes for this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Save',
        onPress: async () => {
          setLoading(true);
          try {
            const docRef = firestore().collection('users').doc(uid);
            let newImageURL = user.image;

            if (image && image.startsWith('file://')) {
              if (user.image) {
                try {
                  const prevRef = storage().refFromURL(user.image);
                  await prevRef.delete();
                } catch (deleteError) {
                  console.warn('Failed to delete previous image:', deleteError);
                }
              }

              const fileName = `images/user-profile/${Date.now()}_${image.split('/').pop()}`;
              const reference = storage().ref(fileName);
              await reference.putFile(image.replace('file://', ''));
              newImageURL = await reference.getDownloadURL();
            }

            const userData = { name, role, image: newImageURL };
            await docRef.update(userData);

            setNotificationMessage('Successfully saved.');
            setNotificationType('success');
            setNotificationVisible(true);
          } catch (error) {
            console.error('Update failed:', error);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>User not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView
          contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
          keyboardShouldPersistTaps="handled"
        >
          <LoadingAlert visible={loading} message="Please wait..." />
          <NotificationAlert
            visible={notificationVisible}
            message={notificationMessage}
            type={notificationType}
            onClose={() => {
              setNotificationVisible(false);
              if (notificationType === 'success') navigation.goBack();
            }}
          />

          {/* 🖼️ Profile Image */}
          <TouchableOpacity onPress={pickImage} style={[styles.imageContainer, { backgroundColor: theme.colors.surface, borderColor: theme.dark ? '#333' : '#ddd' }]}>
            {image ? (
              <Image source={{ uri: image }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialIcons name="add-a-photo" size={40} color={theme.colors.primary} />
                <Text style={[styles.imageLabel, { color: theme.colors.primary }]}>Update Profile Picture</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* 🧾 Input Fields */}
          <TextInput
            label="User ID"
            value={user?.uid}
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            editable={false}
          />
          <TextInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
          />
          <TextInput
            label="Email Address"
            value={user?.email}
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            editable={false}
          />

          {/* 🧩 Role Selector */}
          <Menu
            visible={showRoleMenu}
            onDismiss={() => setShowRoleMenu(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setShowRoleMenu(true)}
                style={[
                  styles.roleButton,
                  { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface },
                ]}
                textColor={theme.colors.text}
              >
                {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Select Role'}
              </Button>
            }
          >
            <Menu.Item title="Admin" onPress={() => { setRole('admin'); setShowRoleMenu(false); }} />
            <Menu.Item title="Researcher" onPress={() => { setRole('researcher'); setShowRoleMenu(false); }} />
            <Menu.Item title="Viewer" onPress={() => { setRole('viewer'); setShowRoleMenu(false); }} />
          </Menu>

          {/* 💾 Save Button */}
          <Button
            mode="contained"
            onPress={() => handleSubmit(userID.toString())}
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
          >
            Save Changes
          </Button>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  input: { marginBottom: 16 },
  primaryButton: { borderRadius: 25, marginTop: 15 },
  imageContainer: {
    height: 200,
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 2,
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  imageLabel: { fontSize: 16, fontWeight: '500' },
  roleButton: { width: '100%', borderRadius: 25, paddingVertical: 8 },
});
