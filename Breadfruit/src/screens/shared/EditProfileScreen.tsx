import { useAuth } from '@/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Appbar, Button, TextInput } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState(null); // Holds selected image URI or user's photoURL

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setProfileImageUri(user.photoURL || null);
    }
  }, [user]);

  // --- NEW: Function to clear the profile image URI ---
  const handleRemovePhoto = () => {
    setProfileImageUri(null);
    Alert.alert("Photo Removed", "The photo has been removed. Tap 'Save Changes' to confirm the update.");
  };

  // --- Updated: Function to handle the image selection logic ---
  const handleImagePick = () => {
    let options = [
      { text: "Take Photo", onPress: () => selectImage('camera') },
      { text: "Choose from Gallery", onPress: () => selectImage('gallery') },
    ];

    // Only show "Remove Photo" if there is an image to remove
    if (profileImageUri) {
      options.push({ text: "Remove Photo", onPress: handleRemovePhoto, style: "destructive" });
    }

    options.push({ text: "Cancel", style: "cancel" });

    Alert.alert(
      "Update Profile Picture",
      "Choose an option",
      options,
      { cancelable: true }
    );
  };

  const selectImage = async (type) => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
    };
    const action = type === 'camera' ? launchCamera : launchImageLibrary;

    try {
      const result = await action(options);
      if (result.didCancel || result.errorCode) {
        // Handle cancel/error
        return;
      }
      if (result.assets && result.assets.length > 0) {
        // Set the selected image URI to state
        setProfileImageUri(result.assets[0].uri);
      }
    } catch (error) {
        console.error("An error occurred", error);
        Alert.alert("Error", "An unexpected error occurred.");
    }
  };

  const handleSaveChanges = async () => {
    if (!name.trim()) {
      alert('Name cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      let newPhotoURL = user.photoURL;

      // 1. Logic for REMOVING the photo
      if (user.photoURL && profileImageUri === null) {
        newPhotoURL = null; // Tell the backend to clear the photo URL
        // Optionally, add logic here to delete the old photo from storage
        console.log("Photo marked for removal.");
      }
      // 2. Logic for UPLOADING a new photo
      else if (profileImageUri && profileImageUri.startsWith('file://')) {
        // --- YOUR IMAGE UPLOAD LOGIC GOES HERE ---
        // const uploadResponse = await uploadImageToFirebaseStorage(profileImageUri);
        // newPhotoURL = uploadResponse.downloadURL;
        console.log("Image needs to be uploaded. URI:", profileImageUri);
        // We assume newPhotoURL is set after a successful upload
      }
      // 3. Otherwise, newPhotoURL remains the old user.photoURL

      // Now, update the user's profile with the new name and new photo URL
      // await updateUserProfile({ name, photoURL: newPhotoURL });

      alert('Profile updated successfully! (Upload/Removal logic is a placeholder)');
      navigation.goBack();
    } catch (error) {
      alert('Failed to update profile. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getJoinDate = () => {
    if (user?.metadata?.creationTime) {
      return new Date(user.metadata.creationTime).toISOString();
    }
    return '2025-08-17T05:27:29.124Z';
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