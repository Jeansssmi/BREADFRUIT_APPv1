import { useAuth } from '@/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Appbar, Button, TextInput } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

// ✅ Correct imports for react-native-firebase
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, fetchUserData } = useAuth(); // Assuming fetchUserData is exposed by your context to refresh it

  const [name, setName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [profileImageUri, setProfileImageUri] = React.useState(null);

  React.useEffect(() => {
    if (user) {
      setName(user.name || '');
      setProfileImageUri(user.image || null);
    }
  }, [user]);

  const handleRemovePhoto = () => setProfileImageUri(null);

  const handleImagePick = () => {
    let options = [
      { text: "Take Photo", onPress: () => selectImage('camera') },
      { text: "Choose from Gallery", onPress: () => selectImage('gallery') },
    ];
    if (profileImageUri) {
      options.push({ text: "Remove Photo", onPress: handleRemovePhoto, style: "destructive" });
    }
    options.push({ text: "Cancel", style: "cancel" });
    Alert.alert("Update Profile Picture", "Choose an option", options, { cancelable: true });
  };

  const selectImage = async (type) => {
    const options = { mediaType: 'photo' as const, quality: 0.8 };
    const action = type === 'camera' ? launchCamera : launchImageLibrary;

    try {
      const result = await action(options);
      if (result.didCancel || !result.assets) return;
      setProfileImageUri(result.assets[0].uri);
    } catch (error) {
      console.error("An error occurred", error);
      Alert.alert("Error", "An unexpected error occurred.");
    }
  };

  const handleSaveChanges = async () => {
    if (!name.trim() || !user) {
      Alert.alert('Name cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      let newPhotoURL = user.image;

      // Case 1: Photo was removed
      if (user.image && profileImageUri === null) {
        newPhotoURL = null;
        const oldImageRef = storage().refFromURL(user.image);
        await oldImageRef.delete();
      }
      // Case 2: A new photo was selected
      else if (profileImageUri && profileImageUri.startsWith('file://')) {
        if (user.image) {
          const oldImageRef = storage().refFromURL(user.image);
          await oldImageRef.delete().catch(e => console.log("Old image deletion failed, may not exist.", e));
        }
        const fileName = `images/user-profile/${user.uid}/${Date.now()}.jpg`;
        const reference = storage().ref(fileName);
        await reference.putFile(profileImageUri.replace('file://', ''));
        newPhotoURL = await reference.getDownloadURL();
      }

      // Update Firebase Auth profile
      await auth().currentUser.updateProfile({
        displayName: name,
        photoURL: newPhotoURL,
      });

      // Update Firestore document
      await firestore().collection('users').doc(user.uid).update({
        name: name,
        image: newPhotoURL,
      });

      // Optional: Refresh user data in your AuthContext if you have a function for it
      if (fetchUserData) {
        await fetchUserData(auth().currentUser);
      }

      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getJoinDate = () => {
    // Assuming 'joined' field is a Firestore Timestamp or ISO string
    if (user?.joined?.toDate) return user.joined.toDate().toLocaleDateString();
    if (user?.joined) return new Date(user.joined).toLocaleDateString();
    return 'N/A';
  };
  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbarHeader}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#333" />
        <Appbar.Content title="Edit User" titleStyle={styles.appbarTitle} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.formContainer}>
        <TouchableOpacity style={styles.imagePicker} onPress={handleImagePick}>
            {/* --- Display image or placeholder --- */}
            {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
            ) : (
                <>
                    <MaterialIcons name="person" size={50} color="#666" />
                    <Text style={styles.imagePickerText}>Add Profile Picture</Text>
                </>
            )}
        </TouchableOpacity>

        <TextInput label="User ID" value={user?.uid || 'XJnOS5YCVNWNTUbaUHdt79kV6IW2'} editable={false} style={styles.inputDisabled} />
        <TextInput label="Full Name" value={name} onChangeText={setName} style={styles.input} />
        <TextInput label="Email Address" value={user?.email || 'brendaline@gmail.com'} editable={false} style={styles.inputDisabled} />
        <TextInput label="Role" value={user?.role || 'viewer'} editable={false} style={styles.inputDisabled} />
        <TextInput label="Date Joined" value={getJoinDate()} editable={false} style={styles.inputDisabled} />
      </ScrollView>
      <View style={styles.buttonContainer}>
        <Button mode="contained" onPress={handleSaveChanges} style={styles.button} labelStyle={styles.buttonLabel} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : 'Save Changes'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fa' },
  appbarHeader: { backgroundColor: '#f7f8fa', elevation: 0 },
  appbarTitle: { color: '#333', fontWeight: 'bold' },
  formContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  imagePicker: {
    height: 150,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  imagePickerText: { marginTop: 10, color: '#2ecc71', fontSize: 16, fontWeight: '500' },
  input: { marginBottom: 15, backgroundColor: '#ffffff' },
  inputDisabled: { marginBottom: 15, backgroundColor: '#f0f0f0' },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#f7f8fa',
  },
  button: { backgroundColor: '#2ecc71', borderRadius: 25, paddingVertical: 8 },
  buttonLabel: { fontSize: 16, fontWeight: 'bold' },
});