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
} from 'react-native';
import Geocoder from 'react-native-geocoding';
import Geolocation from 'react-native-geolocation-service';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import { Snackbar } from 'react-native-paper';

// ✅ Initialize Geocoder
Geocoder.init("AIzaSyDkaDuJ4kRUpUJiXZrj7MHczYUFIcCIZNk", { language: "en" });

let lastRegion: any = null;

export default function MapScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);
  const { width, height } = Dimensions.get('window');

  const [region, setRegion] = useState({
    latitude: 9.8833,
    longitude: 123.6,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03 * (width / height),
  });

  const [trees, setTrees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedTreeID, setHighlightedTreeID] = useState<string | null>(null);
  const highlightAnim = useRef(new Animated.Value(1)).current;

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [previousCount, setPreviousCount] = useState(0); // ✅ FIX: Added this missing state

  // ✅ Save last viewed map region
  useEffect(() => {
    lastRegion = region;
  }, [region]);

  // ✅ Restore last region when coming back
  useFocusEffect(
    useCallback(() => {
      if (lastRegion) setRegion(lastRegion);
    }, [])
  );

  // ✅ Fetch only verified trees
  useEffect(() => {
    setLoading(true);
    const unsubscribe = firestore()
      .collection('trees')
      .where('status', '==', 'verified')
      .onSnapshot(
        (snapshot) => {
          const treeData: any[] = [];
          snapshot.forEach((doc) => treeData.push({ treeID: doc.id, ...doc.data() }));
          setTrees(treeData);
          setLoading(false);
        },
        (err) => {
          console.error(err);
          setLoading(false);
        }
      );
    return () => unsubscribe();
  }, []);

  // ✅ Highlight animation
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

  // ✅ Highlight newly added tree from route
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

  // ✅ My Location handler
  const handleMyLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Location access is required.');
      return;
    }

    Geolocation.getCurrentPosition(
      (position) => {
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
      (error) => {
        console.error('Location error:', error);
        Alert.alert('Error', 'Unable to get your location. Please check GPS.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  // ✅ Search handler
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const json = await Geocoder.from(searchQuery.trim());
      const location = json.results[0].geometry.location;
      const newRegion = {
        latitude: location.lat,
        longitude: location.lng,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015 * (width / height),
      };
      mapRef.current?.animateToRegion(newRegion, 1500);
      setRegion(newRegion);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Search failed', 'Could not find this location.');
    } finally {
      setSearchQuery('');
    }
  };

  // ✅ Detect tree approval or deletion and show snackbar
  useEffect(() => {
    if (previousCount === 0) {
      setPreviousCount(trees.length);
      return;
    }

    if (trees.length < previousCount) {
      setSnackbarMessage('Tree removed successfully.');
      setSnackbarVisible(true);
    } else if (trees.length > previousCount) {
      setSnackbarMessage('Tree approved successfully.');
      setSnackbarVisible(true);
    }

    setPreviousCount(trees.length);
  }, [trees]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🔍 Search Bar */}
      <View style={styles.searchBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }}>
          <MaterialIcons name="search" size={24} color="#2ecc71" />
          <TextInput
            placeholder="Search barangay, city, or location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            onSubmitEditing={handleSearch}
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
        {trees.map((tree) => {
          const isHighlighted = tree.treeID === highlightedTreeID;
          return (
            <Marker
              key={tree.treeID}
              coordinate={{
                latitude: tree.coordinates?.latitude ?? 0,
                longitude: tree.coordinates?.longitude ?? 0,
              }}
              pinColor={isHighlighted ? '#00FF00' : '#2ecc71'}
              title={tree.barangay || 'Unknown Barangay'}
              description={`Tracked by: ${tree.trackedBy || 'N/A'}`}
              onPress={() => navigation.navigate('TreeDetails', { treeID: tree.treeID })}
            >
              {isHighlighted && (
                <Animated.View
                  style={{
                    transform: [{ scale: highlightAnim }],
                    backgroundColor: 'rgba(46, 204, 113, 0.5)',
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    borderWidth: 2,
                    borderColor: '#2ecc71',
                  }}
                />
              )}
            </Marker>
          );
        })}
      </MapView>

      {/* ✅ Snackbar for success notifications */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2500}
        style={{ backgroundColor: '#2ecc71' }}
      >
        {snackbarMessage}
      </Snackbar>

      {/* 📍 My Location Button */}
      <TouchableOpacity style={styles.myLocationButton} onPress={handleMyLocation}>
        <MaterialIcons name="my-location" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ⏳ Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2ecc71" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  searchBar: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 1,
    elevation: 3,
    borderRadius: 25,
    backgroundColor: '#f8f8f8',
    shadowColor: '#000',
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
    backgroundColor: '#2ecc71',
    padding: 14,
    borderRadius: 50,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
