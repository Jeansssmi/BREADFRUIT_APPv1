import { useAuth } from '@/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, TextInput, useTheme } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const theme = useTheme();
  const { user, fetchUserData, updateLocalUser } = useAuth();

  const [name, setName] = useState('');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserInfo = async () => {
      if (!user) return;
      await fetchUserData(user);
      setName(user.name || '');
      setProfileImageUri(user.image || null);
      setLoading(false);
    };

    loadUserInfo();
  }, []);

  const handleRemovePhoto = () => setProfileImageUri(null);

  const handleImagePick = () => {
    const options = [
      { text: 'Take Photo', onPress: () => selectImage('camera') },
      { text: 'Choose from Gallery', onPress: () => selectImage('gallery') },
    ];
    if (profileImageUri)
      options.push({ text: 'Remove Photo', onPress: handleRemovePhoto, style: 'destructive' });
    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Update Profile Picture', 'Choose an option', options, { cancelable: true });
  };

  const selectImage = async (type: 'camera' | 'gallery') => {
    try {
      const action = type === 'camera' ? launchCamera : launchImageLibrary;
      const result = await action({
        mediaType: 'photo',
        quality: 0.7,
        maxWidth: 1024,
        maxHeight: 1024,
      });
      if (!result.didCancel && result.assets) {
        setProfileImageUri(result.assets[0].uri || null);
      }
    } catch {
      Alert.alert('Error', 'Could not select image.');
    }
  };

  const syncChangesToFirebase = async () => {
    if (!user) return;

    setLoading(true);
    let finalImageURL = user.image;

    try {
      const imageChanged = profileImageUri !== user.image;

      if (imageChanged) {
        if (!profileImageUri && user.image) {
          finalImageURL = null;
          if (user.image.startsWith('https')) {
            try {
              await storage().refFromURL(user.image).delete();
            } catch {}
          }
        } else if (profileImageUri?.startsWith('file://')) {
          if (user.image?.startsWith('https')) {
            try {
              await storage().refFromURL(user.image).delete();
            } catch {}
          }
          const filePath = `images/user-profile/${user.uid}/${Date.now()}.jpg`;
          const ref = storage().ref(filePath);
          await ref.putFile(profileImageUri.replace('file://', ''));
          finalImageURL = await ref.getDownloadURL();
        }
      }

      await auth().currentUser?.updateProfile({
        displayName: name,
        photoURL: finalImageURL || null,
      });

      await firestore().collection('users').doc(user.uid).update({
        name,
        image: finalImageURL || null,
      });

      await fetchUserData(auth().currentUser);
      updateLocalUser({ name, image: finalImageURL });

      setLoading(false);
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Profile update failed');
      setLoading(false);
    }
  };

  const getJoinDate = () => {
    if (user?.joined?.toDate) return user.joined.toDate().toLocaleDateString();
    if (user?.joined) return new Date(user.joined).toLocaleDateString();
    return 'N/A';
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.formContainer}>
        <TouchableOpacity
          style={[
            styles.imageBox,
            { backgroundColor: theme.colors.card, borderColor: theme.dark ? '#333' : '#e0e0e0' },
          ]}
          onPress={handleImagePick}
        >
          {profileImageUri ? (
            <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderContainer}>
              <MaterialIcons name="person" size={60} color={theme.dark ? '#aaa' : '#777'} />
              <Text style={[styles.imageLabel, { color: theme.colors.primary }]}>
                Add Profile Picture
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TextInput label="User ID" value={user?.uid || ''} editable={false} style={styles.inputDisabled} />
        <TextInput label="Full Name" value={name} onChangeText={setName} style={styles.input} />
        <TextInput label="Email Address" value={user?.email || ''} editable={false} style={styles.inputDisabled} />
        <TextInput label="Role" value={user?.role || ''} editable={false} style={styles.inputDisabled} />
        <TextInput label="Date Joined" value={getJoinDate()} editable={false} style={styles.inputDisabled} />
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button mode="contained" onPress={syncChangesToFirebase} style={styles.button}>
          Save Changes
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  formContainer: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 20 },
  imageBox: {
    height: 200, borderRadius: 12, marginBottom: 30, borderWidth: 1.5, overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center', position: 'relative', elevation: 2,
  },
  profileImage: { width: '100%', height: '100%' },
  placeholderContainer: { justifyContent: 'center', alignItems: 'center', flex: 1, gap: 10 },
  imageLabel: { fontSize: 16, fontWeight: '500' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  input: { marginBottom: 15 },
  inputDisabled: { marginBottom: 15, opacity: 0.7 },
  buttonContainer: { padding: 25, position: 'absolute', bottom: 0, left: 0, right: 0 },
  button: { borderRadius: 30 },
});
