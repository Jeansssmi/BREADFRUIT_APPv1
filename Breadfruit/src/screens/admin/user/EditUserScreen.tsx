import { LoadingAlert, NotificationAlert } from '@/components/NotificationModal';
import { storage } from '@/firebaseConfig';
import { useUserData } from '@/hooks/useUserData';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, getFirestore, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image as ReactImage, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Button, Menu, Text, TextInput } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function EditUserScreen() {
  const navigation = useNavigation();
  const route = useRoute();
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
      { text: 'Save',
        onPress: async () => {
          setLoading(true);
          try {
            const db = getFirestore();
            const docRef = doc(db, 'users', uid);
            let newImageURL = user.image; 

            if (image && image.startsWith('file://')) {
              if (user.image) {
                try {
                  const prevRef = ref(storage, user.image);
                  await deleteObject(prevRef);
                } catch (deleteError) {
                  console.warn('Failed to delete previous image:', deleteError);
                }
              }
              const fileName = image.split('/').pop() || `image_${Date.now()}.jpeg`;
              const res = await fetch(image);
              const blob = await res.blob();
              const storageRef = ref(storage, `images/user-profile/${fileName}`);
              await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
              newImageURL = await getDownloadURL(storageRef);
            }

            const userData = { name, role, image: newImageURL };
            await updateDoc(docRef, userData);

            setNotificationMessage('Successfully saved.');
            setNotificationType('success');
            setNotificationVisible(true);
          } catch(error) {
            console.error("Update failed:", error);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color='#2ecc71' /></View>;
  }
  if (!user) {
    return <View style={styles.center}><Text>User not found.</Text></View>;
  }
  
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps='handled'>
            <LoadingAlert visible={loading} message="Please wait..." />
            <NotificationAlert
              visible={notificationVisible} message={notificationMessage} type={notificationType}
              onClose={() => {
                setNotificationVisible(false);
                if (notificationType === 'success') navigation.goBack();
              }}
            />
            <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
              {image ? <ReactImage source={{ uri: image }} style={styles.image} /> : (
                <View style={styles.imagePlaceholder}>
                  <MaterialIcons name="add-a-photo" size={40} color="#2ecc71" />
                  <Text style={styles.imageLabel}>Update Profile Picture</Text>
                </View>
              )}
            </TouchableOpacity>
            <TextInput label="User ID" value={user?.uid} style={styles.input} editable={false} />
            <TextInput label="Full Name" value={name} onChangeText={setName} style={styles.input} />
            <TextInput label="Email Address" value={user?.email} style={styles.input} editable={false} />
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
            <Button mode="contained" onPress={() => handleSubmit(userID.toString())} style={styles.primaryButton}>Save Changes</Button>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#ffffff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  input: { backgroundColor: '#f8f8f8', marginBottom: 16 },
  primaryButton: { backgroundColor: '#2ecc71', borderRadius: 25, marginTop: 15 },
  imageContainer: { height: 200, borderRadius: 12, marginBottom: 24, overflow: 'hidden', borderWidth: 2, borderColor: '#eee', backgroundColor: '#f8f8f8' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  imageLabel: { color: '#2ecc71', fontSize: 16, fontWeight: '500' },
  roleButton: { width: '100%', borderRadius: 25, paddingVertical: 8, borderColor: '#333' }
});