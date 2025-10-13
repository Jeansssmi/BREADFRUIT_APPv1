import { LoadingAlert, NotificationAlert } from '@/components/NotificationModal';
import barangayData from "@/constants/barangayData";
import { useTreeData } from '@/hooks/useTreeData';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image as ReactImage, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { launchImageLibrary } from 'react-native-image-picker';
import { Button, Menu, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

const FRUIT_STATUS_OPTIONS = ['none', 'unripe', 'ripe', 'overripe'];

function EditTreeForm({ treeID }) {
  const navigation = useNavigation();
  const route = useRoute();

  const { trees, isLoading } = useTreeData({ mode: 'single', treeID: treeID.toString() });
  const tree = trees[0];

  const [city, setCity] = useState('');
  const [barangay, setBarangay] = useState('');
  const [diameter, setDiameter] = useState('');
  const [latitudeInput, setLatitudeInput] = useState('');
  const [longitudeInput, setLongitudeInput] = useState('');
  const [fruitStatus, setFruitStatus] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [cityOptionsMenuVisible, setCityOptionsMenuVisible] = useState(false);
  const [barangayOptionsMenuVisible, setBarangayOptionsMenuVisible] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'info' | 'error'>('info');

  const CITY_OPTIONS = Object.keys(barangayData);
  const BARANGAY_OPTIONS = barangayData[city] || [];

  useEffect(() => {
    if (tree) {
      setCity(tree.city || '');
      setBarangay(tree.barangay || '');
      setFruitStatus(tree.fruitStatus || '');
      setDiameter(tree.diameter?.toString() || '');
      setLatitudeInput(tree.coordinates?.latitude?.toString() || '');
      setLongitudeInput(tree.coordinates?.longitude?.toString() || '');
      setImage(tree.image || '');
    }
  }, [tree]);

  useEffect(() => {
    if (route.params?.diameter) {
      setDiameter(route.params.diameter.toString());
    }
  }, [route.params?.diameter]);

  const pickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.didCancel || !result.assets) return;
    setImage(result.assets[0].uri || '');
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLatitudeInput(latitude.toString());
        setLongitudeInput(longitude.toString());
      },
      (error) => {
        setNotificationMessage('Failed to get location. Please enable location services.');
        setNotificationType('error');
        setNotificationVisible(true);
        console.error('Location Error:', error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleCitySelect = (selectedCity: string) => {
    setCity(selectedCity);
    setBarangay('');
    setCityOptionsMenuVisible(false);
  };

  const handleBarangaySelect = (selectedBarangay: string) => {
    setBarangay(selectedBarangay);
    setBarangayOptionsMenuVisible(false);
  };

  // ✅ FIXED: Require image before navigating + pass treeID
  const handleNavigateToScanner = () => {
    if (!image) {
      Alert.alert(
        "No Image Selected",
        "Please select or upload an image before scanning the diameter.",
        [{ text: "OK", style: "default" }]
      );
      return;
    }
    navigation.navigate("EditDiameterScanner", { imageUri: image, treeID: treeID });
  };

 const handleSubmit = (currentTreeID: string) => {
   Alert.alert('Confirm Changes', 'Save changes made for this tree?', [
     { text: 'Cancel', style: 'cancel' },
     {
       text: 'Save',
       style: 'destructive',
       onPress: async () => {
         setLoading(true);
         try {
           const docRef = firestore().collection('trees').doc(currentTreeID);
           let newImageURL = tree.image;

           if (image && image.startsWith('file://')) {
             if (tree.image) {
               try {
                 const prevRef = storage().refFromURL(tree.image);
                 await prevRef.delete();
               } catch (deleteError) {
                 console.warn('Failed to delete previous image:', deleteError);
               }
             }

             const fileName = `images/${Date.now()}_${image.split('/').pop()}`;
             const reference = storage().ref(fileName);
             await reference.putFile(image.replace('file://', ''));
             newImageURL = await reference.getDownloadURL();
           }

           // ✅ SAFER latitude/longitude handling
           const lat = parseFloat(latitudeInput);
           const lon = parseFloat(longitudeInput);

           const treeData = {
             city,
             barangay,
             fruitStatus,
             diameter: parseFloat(diameter) || 0,
             coordinates: new firestore.GeoPoint(
               isNaN(lat) ? 0 : lat,
               isNaN(lon) ? 0 : lon
             ),
             image: newImageURL,
           };

           await docRef.update(treeData);

           setNotificationMessage('Successfully saved.');
           setNotificationType('success');
           setNotificationVisible(true);
         } catch (error) {
           setNotificationMessage('Failed to save changes. Check your network and permissions.');
           setNotificationType('error');
           setNotificationVisible(true);
           console.error(error);
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
  if (!tree) {
    return <View style={styles.errorContainer}><Text>Tree could not be loaded.</Text></View>;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps='handled'>
          <View style={styles.container}>
            <LoadingAlert visible={loading} message="Please wait..." />
            <NotificationAlert
              visible={notificationVisible} message={notificationMessage} type={notificationType}
              onClose={() => {
                setNotificationVisible(false);
                if (notificationType === 'success') {
                  navigation.goBack();
                }
              }}
            />
            <View style={styles.imageContainer}>
              {image ? (
                <View>
                  <ReactImage source={{ uri: image }} style={styles.imagePreview} resizeMode="cover" />
                  <TouchableOpacity style={styles.changeButton} onPress={pickImage}>
                    <Text style={styles.changeButtonText}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                  <MaterialIcons name="add-a-photo" size={40} color="#2ecc71" />
                  <Text style={styles.addImageText}>Add Tree Picture</Text>
                </TouchableOpacity>
              )}
            </View>

            <TextInput label="Breadfruit ID" value={tree?.treeID} style={styles.input} editable={false} />
            <View style={styles.menuContainer}>
              <Menu
                visible={cityOptionsMenuVisible} onDismiss={() => setCityOptionsMenuVisible(false)}
                anchor={<TouchableOpacity onPress={() => setCityOptionsMenuVisible(true)}><TextInput label="City/Municipality" value={city} editable={false} right={<TextInput.Icon icon="menu-down" />} style={styles.menuInput} /></TouchableOpacity>}
              >
                {CITY_OPTIONS.map(option => <Menu.Item key={option} onPress={() => handleCitySelect(option)} title={option.charAt(0).toUpperCase() + option.slice(1)} />)}
              </Menu>
            </View>
            <View style={styles.menuContainer}>
              <Menu
                visible={barangayOptionsMenuVisible} onDismiss={() => setBarangayOptionsMenuVisible(false)}
                anchor={<TouchableOpacity onPress={() => setBarangayOptionsMenuVisible(true)} disabled={!city}><TextInput label="Barangay" value={barangay} editable={false} right={<TextInput.Icon icon="menu-down" />} style={styles.menuInput} disabled={!city} /></TouchableOpacity>}
              >
                {BARANGAY_OPTIONS.map(option => <Menu.Item key={option} onPress={() => handleBarangaySelect(option)} title={option.charAt(0).toUpperCase() + option.slice(1)} />)}
              </Menu>
            </View>
            <View style={styles.menuContainer}>
              <Menu
                visible={showStatusMenu} onDismiss={() => setShowStatusMenu(false)}
                anchor={<TouchableOpacity onPress={() => setShowStatusMenu(true)}><TextInput label="Fruit Status" value={fruitStatus} editable={false} right={<TextInput.Icon icon="menu-down" />} style={styles.menuInput} /></TouchableOpacity>}
              >
                {FRUIT_STATUS_OPTIONS.map(option => <Menu.Item key={option} onPress={() => { setFruitStatus(option); setShowStatusMenu(false); }} title={option.charAt(0).toUpperCase() + option.slice(1)} />)}
              </Menu>
            </View>
            <TextInput
              label="Diameter (meters)"
              value={diameter}
              style={styles.input}
              keyboardType="decimal-pad"
              onChangeText={setDiameter}
            />
            <View style={styles.coordinateGroup}>
              <View style={styles.coordinateLegend}><Text style={styles.legendText}>Coordinates</Text></View>
              <View style={styles.rowLegend}>
                <TextInput label="Latitude" value={latitudeInput} onChangeText={setLatitudeInput} style={[styles.input, styles.halfWidth, styles.coordinateInput]} keyboardType="decimal-pad" />
                <TextInput label="Longitude" value={longitudeInput} onChangeText={setLongitudeInput} style={[styles.input, styles.halfWidth, styles.coordinateInput]} keyboardType="decimal-pad" />
              </View>
              <TouchableOpacity onPress={getCurrentLocation}><Text style={styles.useLocationText}>Use Location</Text></TouchableOpacity>
            </View>
            <TextInput label="Date Tracked" value={new Date(tree?.dateTracked).toLocaleDateString()} style={styles.input} editable={false} />
            <View style={styles.buttonGroup}>
              <Button mode="contained" onPress={() => handleSubmit(treeID.toString())} style={styles.primaryButton}>Save Changes</Button>
              <Button
                mode="contained"
                onPress={handleNavigateToScanner}
                style={[
                  styles.primaryButton,
                  !image && { backgroundColor: '#ccc' }, // gray when disabled
                ]}
                disabled={!image} // 🔒 disables button if no image
              >
                Scan Diameter
              </Button>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

export default function EditTreeScreen() {
  const route = useRoute();
  const treeID = route.params?.treeID;

  if (!treeID) {
    return (
      <View style={styles.errorContainer}>
        <Text style={{ color: '#d32f2f', fontWeight: 'bold' }}>Error: Tree ID is missing.</Text>
        <Text>Please go back and try again.</Text>
      </View>
    );
  }

  return <EditTreeForm treeID={treeID} />;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: { flexGrow: 1, backgroundColor: '#ffffff' },
  container: { flex: 1, padding: 20, backgroundColor: '#ffffff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  halfWidth: { flex: 1 },
  input: { backgroundColor: '#f8f8f8', marginBottom: 16, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  menuContainer: { marginBottom: 16 },
  menuInput: { backgroundColor: '#f8f8f8', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  coordinateGroup: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 16, marginBottom: 16, backgroundColor: '#f8f8f8', position: 'relative' },
  coordinateLegend: { position: 'absolute', top: -10, left: 12, backgroundColor: '#ffffff', paddingHorizontal: 8 },
  rowLegend: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  legendText: { color: '#2ecc71', fontSize: 12, fontWeight: 'bold' },
  coordinateInput: { backgroundColor: '#ffffff', borderWidth: 0, borderBottomWidth: 1, borderBottomColor: '#eee' },
  useLocationText: { color: '#2ecc71', fontSize: 14, fontWeight: '600', marginTop: 12 },
  imageContainer: { height: 200, borderRadius: 12, marginBottom: 24, overflow: 'hidden', borderWidth: 2, borderColor: '#eee', backgroundColor: '#f8f8f8' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, borderStyle: 'dashed', borderColor: '#2ecc71' },
  imageLabel: { color: '#2ecc71', fontSize: 16, fontWeight: '500' },
  buttonGroup: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 10 },
  primaryButton: { flex: 1, borderRadius: 25, backgroundColor: '#2ecc71' },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },

  changeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
  },

  changeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },

  addImageButton: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#ccc',
    backgroundColor: '#fafafa',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addImageText: {
    fontSize: 15,
    color: '#2ecc71',
    fontWeight: '500',
    marginTop: 8,
  },

});
