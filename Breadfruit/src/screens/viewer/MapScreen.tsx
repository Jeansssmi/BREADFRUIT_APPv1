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
import { Snackbar } from 'react-native-paper';

// ✅ Initialize Geocoder
Geocoder.init("AIzaSyDkaDuJ4kRUpUJiXZrj7MHczYUFIcCIZNk", { language: "en" });

let lastRegion: any = null;

export default function MapScreen() {
  const route = useRoute();
  const navigation = useNavigation();
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
  const [previousCount, setPreviousCount] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // ✅ Pin colors for each status
const getPinColor = (status: string) => {
  switch (status) {
    case 'verified':
      return '#2ecc71';
    case 'harvest-ready':
      return '#f1c40f';
    case 'not-ready':
      return '#e67e22'; // new color for not ready
    default:
      return '#95a5a6';
  }
};

  // ✅ Save last viewed region
  useEffect(() => {
    lastRegion = region;
  }, [region]);

  // ✅ Restore last region on focus
  useFocusEffect(
    useCallback(() => {
      if (lastRegion) setRegion(lastRegion);
    }, [])
  );

  // ✅ Fetch all trees with verified, harvest-ready, or harvested
  useEffect(() => {
    setLoading(true);
    const unsubscribe = firestore()
      .collection('trees')
      .where('status', 'in', ['verified', 'harvest-ready', 'harvested','not-ready'])
      .onSnapshot(snapshot => {
        const treeData: any[] = [];
        snapshot.forEach(doc => treeData.push({ treeID: doc.id, ...doc.data() }));
        setTrees(treeData);
        setLoading(false);
      });
    return () => unsubscribe();
  }, [route.params?.refresh]);

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

  // ✅ Highlight newly added tree
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

  // ✅ My Location
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

  // ✅ Search location
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

  // ✅ Snackbar for tree approval/removal
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

      {/* 🌈 Legend */}
      <View style={styles.legendContainer}>
        {['verified', 'harvest-ready', 'not-ready'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.legendItem,
              selectedStatus === status && { backgroundColor: 'rgba(46,204,113,0.15)', borderRadius: 6, padding: 2 }
            ]}
            onPress={() => setSelectedStatus(selectedStatus === status ? null : status)}
          >
            <View style={[styles.legendColor, { backgroundColor: getPinColor(status) }]} />
            <Text style={styles.legendText}>
              {status === 'not-ready' ? 'unripe' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
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
        {trees
          .filter(tree => !selectedStatus || tree.status === selectedStatus)
          .map((tree) => {
            const isHighlighted = tree.treeID === highlightedTreeID;
            return (
              <Marker
                key={tree.treeID}
                coordinate={{
                  latitude: tree.coordinates?.latitude ?? 0,
                  longitude: tree.coordinates?.longitude ?? 0,
                }}
                pinColor={isHighlighted ? '#00FF00' : getPinColor(tree.status)}
                title={tree.treeName || 'Unnamed Tree'}
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

      {/* ✅ Snackbar */}
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

  // Legend
  legendContainer: {
    position: 'absolute',
    top: 90,
    left: 16,
    flexDirection: 'row',
    zIndex: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
