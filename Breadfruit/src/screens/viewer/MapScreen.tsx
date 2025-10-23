import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  StyleSheet,
  TextInput,
  View,
  Animated,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  Text,
} from 'react-native';
import Geocoder from 'react-native-geocoding';
import Geolocation from 'react-native-geolocation-service';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import { Snackbar, useTheme } from 'react-native-paper'; // ✅ useTheme added

// ✅ Initialize Geocoder
Geocoder.init('AIzaSyDkaDuJ4kRUpUJiXZrj7MHczYUFIcCIZNk', { language: 'en' });

let lastRegion = null;

export default function MapScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const mapRef = useRef<MapView>(null);
  const theme = useTheme(); // ✅ access theme (dark/light)

  const { width, height } = Dimensions.get('window');

  const [region, setRegion] = useState({
    latitude: 9.8833,
    longitude: 123.6,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03 * (width / height),
  });

  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedTreeID, setHighlightedTreeID] = useState(null);
  const highlightAnim = useRef(new Animated.Value(1)).current;
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const pinColor = theme.colors.primary; // ✅ color follows theme

  // ✅ Save last region
  useEffect(() => {
    lastRegion = region;
  }, [region]);

  useFocusEffect(
    useCallback(() => {
      if (lastRegion) setRegion(lastRegion);
    }, [])
  );

  // ✅ Fetch verified and visible trees
  useEffect(() => {
    setLoading(true);
    const unsubscribe = firestore()
      .collection('trees')
      .where('status', 'in', ['verified', 'harvest-ready', 'not-ready'])
      .onSnapshot(snapshot => {
        const data = [];
        snapshot.forEach(doc => data.push({ treeID: doc.id, ...doc.data() }));
        setTrees(data);
        setLoading(false);
      });
    return () => unsubscribe();
  }, [route.params?.refresh]);

  // ✅ Highlight animation for new marker
  const startHighlightAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(highlightAnim, { toValue: 1.8, duration: 500, useNativeDriver: true }),
        Animated.timing(highlightAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();

    setTimeout(() => {
      highlightAnim.stopAnimation();
      setHighlightedTreeID(null);
    }, 5000);
  };

  // ✅ If user just added/selected a tree
  useEffect(() => {
    if (route.params?.lat && route.params?.lng) {
      const newRegion = {
        latitude: Number(route.params.lat),
        longitude: Number(route.params.lng),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01 * (width / height),
      };
      mapRef.current?.animateToRegion(newRegion, 1500);
      setRegion(newRegion);

      if (route.params?.treeID) {
        setHighlightedTreeID(route.params.treeID);
        startHighlightAnimation();
      }
    }
  }, [route.params?.lat, route.params?.lng]);

  // ✅ Request location permission
  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app requires access to your location.',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const handleMyLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Location access is required.');
      return;
    }

    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015 * (width / height),
        };
        mapRef.current?.animateToRegion(newRegion, 1500);
        setRegion(newRegion);
      },
      error => {
        console.error('Location error:', error);
        Alert.alert('Error', 'Unable to get your location. Please check GPS.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 🔍 Search Bar */}
      <View
        style={[
          styles.searchBar,
          { backgroundColor: theme.dark ? '#2a2a2a' : '#f8f8f8', shadowColor: theme.dark ? '#000' : '#ccc' },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }}>
          <MaterialIcons name="search" size={24} color={theme.colors.primary} />
          <TextInput
            placeholder="Search barangay, city, or location..."
            placeholderTextColor={theme.dark ? '#aaa' : '#666'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.colors.text }]}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* 🗺️ Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
      >
        {trees.map(tree => (
          <Marker
            key={tree.treeID}
            coordinate={{
              latitude: tree.coordinates?.latitude ?? 0,
              longitude: tree.coordinates?.longitude ?? 0,
            }}
            pinColor={pinColor}
            title={tree.treeID || 'Tree'}
            description={`Tracked by: ${tree.trackedBy || 'N/A'}`}
            onPress={() =>
              navigation.navigate('TreeDetails', {
                treeID: tree.treeID,
              })
            }
          />
        ))}
      </MapView>

      {/* 📍 My Location Button */}
      <TouchableOpacity
        style={[
          styles.myLocationButton,
          { backgroundColor: theme.colors.primary, shadowColor: theme.dark ? '#000' : '#222' },
        ]}
        onPress={handleMyLocation}
      >
        <MaterialIcons name="my-location" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ✅ Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2500}
        style={{ backgroundColor: theme.colors.primary }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 1,
    elevation: 3,
    borderRadius: 25,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginTop: 25,
  },
  searchInput: {
    backgroundColor: 'transparent',
    height: 48,
    fontSize: 16,
    flex: 1,
    marginLeft: 10,
  },
  map: { width: '100%', height: '100%' },
  myLocationButton: {
    position: 'absolute',
    bottom: 25,
    right: 20,
    padding: 14,
    borderRadius: 50,
    elevation: 4,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
