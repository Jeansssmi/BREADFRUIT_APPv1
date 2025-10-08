import { LoadingAlert, NotificationAlert } from '@/components/NotificationModal';
import { functions, storage } from '@/firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { httpsCallable } from 'firebase/functions';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Button, Menu, Text, TextInput } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function AddUserScreen() {
  const navigation = useNavigation();
  const [image, setImage] = useState<string | null>(null);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'info' | 'error'>('info');

  const pickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.didCancel || !result.assets) return;
    setImage(result.assets[0].uri || null);
  };

  const handleSubmit = async () => {
    if (!name || !email || !password || !role) {
      setNotificationMessage('All fields are required.');
      setNotificationVisible(true);
      return;
    }

    const createNewUser = httpsCallable(functions, 'createNewUser');
    setLoading(true);

    try {
      let downloadURL = '';
      if (image) {
        const fileName = image.split('/').pop() || `image_${Date.now()}.jpeg`;
        const res = await fetch(image);
        const blob = await res.blob();
        const storageRef = ref(storage, `images/user-profile/${fileName}`);
        await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
        downloadURL = await getDownloadURL(storageRef);
      }

      const userData = {
        name, email, password, role,
        image: downloadURL,
        status: 'verified',
        joined: new Date().toISOString(),
      };
      await createNewUser(userData);
      setNotificationMessage('User created successfully.');
      setNotificationType('success');
      setNotificationVisible(true);
    } catch (error: any) {
      console.error('User creation error:', error);

      let errorMessage = 'User creation failed: Internal server error.';
      let errorType: 'success' | 'info' | 'error' = 'error';

      // FIX: Improved error handling for HttpsError
      if (error.code === 'already-exists') {
          errorMessage = 'An account with this email already exists.';
          errorType = 'info';
      } else if (error.message) {
          // Fallback to the message if it's more specific
          errorMessage = error.message;
      }

      setNotificationMessage(errorMessage);
      setNotificationType(errorType);
      setNotificationVisible(true);

    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <LoadingAlert visible={loading} message="Creating user..." />
          <NotificationAlert
            visible={notificationVisible} message={notificationMessage} type={notificationType}
            onClose={() => {
              setNotificationVisible(false);
              if (notificationType === 'success') navigation.goBack();
            }}
          />
          <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
            {image ? <Image source={{ uri: image }} style={styles.image} /> : (
              <View style={styles.imagePlaceholder}>
                <MaterialIcons name="add-a-photo" size={40} color="#2ecc71" />
                <Text style={styles.imageLabel}>Add Profile Picture</Text>
              </View>
            )}
          </TouchableOpacity>
          <TextInput label="Full Name" value={name} onChangeText={setName} style={styles.input} />
          <TextInput label="Email Address" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" />
          <TextInput label="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
          <Menu
            visible={showRoleMenu} onDismiss={() => setShowRoleMenu(false)}
            anchor={
              <Button mode="outlined" onPress={() => setShowRoleMenu(true)} style={styles.roleButton}>
                {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Select Role'}
              </Button>
            }
          >
            <Menu.Item title="Admin" onPress={() => { setRole('admin'); setShowRoleMenu(false); }} />
            <Menu.Item title="Researcher" onPress={() => { setRole('researcher'); setShowRoleMenu(false); }} />
            <Menu.Item title="Viewer" onPress={() => { setRole('viewer'); setShowRoleMenu(false); }} />
          </Menu>
          <Button mode="contained" onPress={handleSubmit} style={styles.primaryButton}>Create User</Button>
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
  imageContainer: { height: 200, borderRadius: 12, marginBottom: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#eee', backgroundColor: '#f8f8f8' },
  image: { width: '100%', height: '100%', borderRadius: 10 },
  imagePlaceholder: { gap: 12, borderStyle: 'dashed', borderColor: '#2ecc71' },
  imageLabel: { color: '#2ecc71', fontSize: 16, fontWeight: '500' },
  roleButton: { width: '100%', borderRadius: 25, paddingVertical: 8, borderColor: '#333', marginBottom: 10 }
});