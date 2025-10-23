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
import { Button, TextInput, useTheme } from 'react-native-paper'; // ✅ useTheme added
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, fetchUserData, updateLocalUser } = useAuth();
  const theme = useTheme(); // ✅ theme from React Native Paper

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setProfileImageUri(user.image || null);
    }
  }, [user]);

  const handleRemovePhoto = () => setProfileImageUri(null);

  const handleImagePick = () => {
    let options = [
      { text: 'Take Photo', onPress: () => selectImage('camera') },
      { text: 'Choose from Gallery', onPress: () => selectImage('gallery') },
    ];
    if (profileImageUri) {
      options.push({ text: 'Remove Photo', onPress: handleRemovePhoto, style: 'destructive' });
    }
    options.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Update Profile Picture', 'Choose an option', options, { cancelable: true });
  };

  const selectImage = async (type: 'camera' | 'gallery') => {
    const options = { mediaType: 'photo' as const, quality: 0.8 };
    const action = type === 'camera' ? launchCamera : launchImageLibrary;

    try {
      const result = await action({
        mediaType: 'photo',
        quality: 0.7,
        maxWidth: 1024,
        maxHeight: 1024,
      });
      if (result.didCancel || !result.assets) return;
      setProfileImageUri(result.assets[0].uri || null);
    } catch (error) {
      console.error('Image selection error', error);
      Alert.alert('Error', 'Could not select image.');
    }
  };

  const syncChangesToFirebase = async (newName: string, localImageUri: string | null) => {
    if (!user || !user.uid) {
      console.warn('⚠️ Cannot sync: no authenticated user found.');
      return;
    }

    let finalImageURL = user.image;
    const imageChanged = localImageUri !== user.image;

    try {
      if (imageChanged) {
        if (user.image && !localImageUri) {
          finalImageURL = null;
          storage().refFromURL(user.image).delete().catch((e) => console.warn(e));
        } else if (localImageUri && localImageUri.startsWith('file://')) {
          if (user.image) {
            storage().refFromURL(user.image).delete().catch((e) => console.warn(e));
          }
          const fileName = `images/user-profile/${user.uid}/${Date.now()}.jpg`;
          const reference = storage().ref(fileName);
          await reference.putFile(localImageUri.replace('file://', ''));
          finalImageURL = await reference.getDownloadURL();
        }
      }

      await auth().currentUser?.updateProfile({ displayName: newName, photoURL: finalImageURL });
      await firestore().collection('users').doc(user.uid).update({
        name: newName,
        image: finalImageURL,
      });

      await fetchUserData(auth().currentUser);
      console.log('✅ Profile synced to Firebase.');
    } catch (error) {
      console.error('❌ Firebase sync failed:', error);
    }
  };

  const handleSaveChanges = async () => {
    if (!user || !name.trim()) {
      Alert.alert('Error', 'User not found or name is empty.');
      return;
    }

    updateLocalUser({
      name: name,
      image: profileImageUri,
    });

    navigation.goBack();
    syncChangesToFirebase(name, profileImageUri);
  };

  const getJoinDate = () => {
    if (user?.joined?.toDate) return user.joined.toDate().toLocaleDateString();
    if (user?.joined) return new Date(user.joined).toLocaleDateString();
    return 'N/A';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.formContainer}>
        <TouchableOpacity
          style={[
            styles.imageBox,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.dark ? '#444' : '#e0e0e0',
            },
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
          {profileImageUri && (
            <TouchableOpacity style={styles.changeButton} onPress={handleImagePick}>
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <TextInput
          label="User ID"
          value={user?.uid || ''}
          editable={false}
          style={[
            styles.inputDisabled,
            {
              backgroundColor: theme.dark ? '#1f1f1f' : '#f0f0f0',
              color: theme.colors.text,
            },
          ]}
        />
        <TextInput
          label="Full Name"
          value={name}
          onChangeText={setName}
          style={[
            styles.input,
            { backgroundColor: theme.dark ? '#1f1f1f' : '#ffffff', color: theme.colors.text },
          ]}
        />
        <TextInput
          label="Email Address"
          value={user?.email || ''}
          editable={false}
          style={[
            styles.inputDisabled,
            { backgroundColor: theme.dark ? '#1f1f1f' : '#f0f0f0', color: theme.colors.text },
          ]}
        />
        <TextInput
          label="Role"
          value={user?.role || ''}
          editable={false}
          style={[
            styles.inputDisabled,
            { backgroundColor: theme.dark ? '#1f1f1f' : '#f0f0f0', color: theme.colors.text },
          ]}
        />
        <TextInput
          label="Date Joined"
          value={getJoinDate()}
          editable={false}
          style={[
            styles.inputDisabled,
            { backgroundColor: theme.dark ? '#1f1f1f' : '#f0f0f0', color: theme.colors.text },
          ]}
        />
      </ScrollView>

      <View
        style={[
          styles.buttonContainer,
          { backgroundColor: theme.dark ? '#1e1e1e' : '#f7f8fa' },
        ]}
      >
        <Button
          mode="contained"
          onPress={handleSaveChanges}
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          labelStyle={styles.buttonLabel}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="white" /> : 'Save Changes'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  formContainer: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 20 },
  imageBox: {
    height: 200,
    borderRadius: 12,
    marginBottom: 30,
    borderWidth: 1.5,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  profileImage: { width: '100%', height: '100%' },
  placeholderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  imageLabel: { fontSize: 16, fontWeight: '500' },
  changeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  changeButtonText: { color: '#fff', fontWeight: '500', fontSize: 12 },
  input: { marginBottom: 15 },
  inputDisabled: { marginBottom: 15 },
  buttonContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 25 },
  button: { borderRadius: 30, paddingVertical: 2 },
  buttonLabel: { fontSize: 17, fontWeight: 'bold' },
});
