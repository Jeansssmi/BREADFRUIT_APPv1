import { LoadingAlert, NotificationAlert } from '@/components/NotificationModal';

import barangayData from "@/constants/barangayData";
import { storage } from '@/firebaseConfig';
import { useTreeData } from '@/hooks/useTreeData';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, getFirestore, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image as ReactImage, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { launchImageLibrary } from 'react-native-image-picker';
import { Button, Menu, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const FRUIT_STATUS_OPTIONS = ['none', 'unripe', 'ripe'];
const CITY_OPTIONS = Object.keys(barangayData);

export default function EditTreeScreen() {
  const navigation = useNavigation();
  // @ts-ignore
  const route = useRoute();
  // @ts-ignore
  const { treeID } = route.params;

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
      // Safely initialize data
      setDiameter(tree.diameter?.toString() || '');
      setLatitudeInput(tree.coordinates?.latitude?.toString() || '');
      setLongitudeInput(tree.coordinates?.longitude?.toString() || '');
      setImage(tree.image || '');
    }
  }, [tree]);

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
    setBarangay(''); // Reset barangay when city changes
    setCityOptionsMenuVisible(false);
  };

  const handleBarangaySelect = (selectedBarangay: string) => {
    setBarangay(selectedBarangay);
    setBarangayOptionsMenuVisible(false);
  };

  const handleSubmit = (currentTreeID: string) => {
    Alert.alert('Confirm Changes', 'Save changes made for this tree?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Save', style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            const db = getFirestore();
            const docRef = doc(db, 'trees', currentTreeID);
            let newImageURL = tree.image;

            if (image && image.startsWith('file://')) {
              // Delete old image logic
              if (tree.image) {
                try {
                  const prevRef = ref(storage, tree.image);
                  await deleteObject(prevRef);
                } catch (deleteError) {
                  console.warn('Failed to delete previous image:', deleteError);
                }
              }

              // Upload new image
              const fileName = image.split('/').pop() || `image_${Date.now()}.jpeg`;
              const res = await fetch(image);
              const blob = await res.blob();
              const storageRef = ref(storage, `images/${fileName}`);
              await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
              newImageURL = await getDownloadURL(storageRef);
            }

            // Prepare data for Firestore update
            const treeData = {
              city, barangay, fruitStatus,
              diameter: parseFloat(diameter) || 0,
              coordinates: {
                latitude: parseFloat(latitudeInput) || 0,
                longitude: parseFloat(longitudeInput) || 0,
              },
              image: newImageURL,
            };

            // Update Firestore document
            await updateDoc(docRef, treeData);

            setNotificationMessage('Successfully saved.');
            setNotificationType('success');
            setNotificationVisible(true);
          } catch(error) {
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
    return <View style={styles.errorContainer}><Text>Tree not found.</Text></View>;
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
              <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
                {image ? <ReactImage source={{ uri: image }} style={styles.image} /> : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialIcons name="add-a-photo" size={40} color="#2ecc71" />
                    <Text style={styles.imageLabel}>Update Tree Picture</Text>
                  </View>
                )}
              </TouchableOpacity>
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
              {/* ✅ FIX: Diameter is non-editable */}
              <TextInput
                label="Diameter (meters)"
                value={diameter}
                style={styles.input}
                keyboardType="decimal-pad"
                editable={false}
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
              </View>
            </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
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
  buttonGroup: { marginTop: 25 },
  primaryButton: { backgroundColor: '#2ecc71', borderRadius: 25 },
  imageContainer: { height: 200, borderRadius: 12, marginBottom: 24, overflow: 'hidden', borderWidth: 2, borderColor: '#eee', backgroundColor: '#f8f8f8' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, borderStyle: 'dashed', borderColor: '#2ecc71' },
  imageLabel: { color: '#2ecc71', fontSize: 16, fontWeight: '500' },
});