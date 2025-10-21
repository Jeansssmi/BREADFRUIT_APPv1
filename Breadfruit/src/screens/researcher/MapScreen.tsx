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
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'verified' | 'harvest-ready' | 'unripe'>('All');

  // ✅ Pin colors per fruit status
  const getPinColor = (fruitStatus: string) => {
    switch (fruitStatus) {
      case 'none':
        return '#00BFFF'; // Sky blue for verified
      case 'ripe':
        return '#FFD700'; // Yellow for harvest-ready
      case 'unripe':
        return '#2ecc71'; // Green for unripe
      default:
        return '#95a5a6'; // Gray fallback
    }
  };

  // ✅ Save last region
  useEffect(() => {
    lastRegion = region;
  }, [region]);

  useFocusEffect(
    useCallback(() => {
      if (lastRegion) setRegion(lastRegion);
    }, [])
  );

  // ✅ Fetch trees (listen in real time)
  useEffect(() => {
    setLoading(true);
    const unsubscribe = firestore()
      .collection('trees')
      .where('status', 'in', ['verified', 'harvest-ready', 'not-ready'])
      .onSnapshot(snapshot => {
        const data: any[] = [];
        snapshot.forEach(doc => data.push({ treeID: doc.id, ...doc.data() }));
        setTrees(data);
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

  // ✅ New tree highlight
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

  // ✅ Location permission
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

  // ✅ Filter trees by fruit status
  const filteredTrees = trees.filter(tree => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'verified') return tree.fruitStatus === 'none';
    if (selectedFilter === 'harvest-ready') return tree.fruitStatus === 'ripe';
    if (selectedFilter === 'unripe') return tree.fruitStatus === 'unripe';
    return false;
  });

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
            onSubmitEditing={() => {}}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* 🌈 Legend (Filter Buttons) */}
      <View style={styles.legendContainer}>
        {['All', 'verified', 'harvest-ready', 'unripe'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.legendItem,
              selectedFilter === filter && { backgroundColor: 'rgba(46,204,113,0.15)', borderRadius: 6, padding: 2 },
            ]}
            onPress={() => setSelectedFilter(filter as any)}
          >
            <View
              style={[
                styles.legendColor,
                {
                  backgroundColor:
                    filter === 'All'
                      ? '#555'
                      : filter === 'verified'
                      ? '#00BFFF'
                      : filter === 'harvest-ready'
                      ? '#FFD700'
                      : '#2ecc71',
                },
              ]}
            />
            <Text style={styles.legendText}>
              {filter === 'unripe'
                ? 'Unripe'
                : filter === 'harvest-ready'
                ? 'Harvest-Ready'
                : filter === 'verified'
                ? 'Verified'
                : 'All'}
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
        {filteredTrees.map((tree) => (
          <Marker
            key={tree.treeID}
            coordinate={{
              latitude: tree.coordinates?.latitude ?? 0,
              longitude: tree.coordinates?.longitude ?? 0,
            }}
            pinColor={getPinColor(tree.fruitStatus)}
            title={tree.treeID || 'Tree'}
            description={`Tracked by: ${tree.trackedBy || 'N/A'}`}
          />
        ))}
      </MapView>

      {/* 📍 My Location */}
      <TouchableOpacity style={styles.myLocationButton} onPress={handleMyLocation}>
        <MaterialIcons name="my-location" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ✅ Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2500}
        style={{ backgroundColor: '#2ecc71' }}
      >
        {snackbarMessage}
      </Snackbar>
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
    paddingHorizontal: 2,
    paddingVertical: 4,
    marginHorizontal: 2,
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
