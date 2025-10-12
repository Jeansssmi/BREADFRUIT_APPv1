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
  const { user, fetchUserData , updateLocalUser } = useAuth(); // Assuming fetchUserData is exposed by your context to refresh it

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
      const result: ImagePickerResponse = await action({
              mediaType: 'photo',
              // ✅ Add image compression for much faster uploads
              quality: 0.7,
              maxWidth: 1024,
              maxHeight: 1024,
            });
            if (result.didCancel || !result.assets) return;
            setProfileImageUri(result.assets[0].uri || null);
    } catch (error) {
      console.error("Image selection error", error);
      Alert.alert("Error", "Could nor select image.");
    }
  };

  /**
     * ✅ NEW: This function runs in the background to sync changes with Firebase.
     */
    const syncChangesToFirebase = async (newName: string, localImageUri: string | null) => {
      if (!user) return;

      let finalImageURL = user.image; // Start with the original image URL

      const imageHasBeenLocallyChanged = localImageUri !== user.image;

      if (imageHasBeenLocallyChanged) {
          // Case 1: Photo was removed
          if (user.image && !localImageUri) {
              finalImageURL = null;
              storage().refFromURL(user.image).delete().catch(e => console.warn(e));
          }
          // Case 2: A new photo was selected
          else if (localImageUri && localImageUri.startsWith('file://')) {
              if (user.image) {
                  storage().refFromURL(user.image).delete().catch(e => console.warn(e));
              }
              const fileName = `images/user-profile/${user.uid}/${Date.now()}.jpg`;
              const reference = storage().ref(fileName);
              await reference.putFile(localImageUri.replace('file://', ''));
              finalImageURL = await reference.getDownloadURL();
          }
      }

      // Now update Firestore and Auth with the final data
      try {
        await auth().currentUser?.updateProfile({ displayName: newName, photoURL: finalImageURL });
        await firestore().collection('users').doc(user.uid).update({ name: newName, image: finalImageURL });

        // Refresh the context with the final, permanent data from Firebase
        if (fetchUserData) {
          await fetchUserData();
        }
        console.log("✅ Profile successfully synced to Firebase.");
      } catch (error) {
          console.error("❌ Firebase sync failed:", error);
          // Optional: Implement logic to notify the user that the background sync failed.
      }
    };

 /**
   * ✅ EDITED: This function now updates the UI instantly.
   */
  const handleSaveChanges = async () => {
    if (!name.trim() || !user) return;

    // Step 1: Perform the optimistic update on the device
    updateLocalUser({
      name: name,
      image: profileImageUri,
    });

    // Step 2: Navigate back immediately. The ProfileScreen will show the local image.
    navigation.goBack();

    // Step 3: Start the real upload in the background. We don't `await` it.
    syncChangesToFirebase(name, profileImageUri);
  };

  const getJoinDate = () => {
    // Assuming 'joined' field is a Firestore Timestamp or ISO string
    if (user?.joined?.toDate) return user.joined.toDate().toLocaleDateString();
    if (user?.joined) return new Date(user.joined).toLocaleDateString();
    return 'N/A';
  };
  return (
    <View style={styles.container}>

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