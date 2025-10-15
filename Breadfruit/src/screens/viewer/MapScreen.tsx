import { useTreeData } from '@/hooks/useTreeData';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, StyleSheet, TextInput, View, Animated } from 'react-native';
import Geocoder from 'react-native-geocoding';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

let lastRegion: any = null;

export default function MapScreen() {
  const { trees } = useTreeData();
  const route = useRoute();
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);
  const { width, height } = Dimensions.get('window');

  const [region, setRegion] = useState({
    latitude: 9.8833,
    longitude: 123.6000,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03 * (width / height),
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedTreeID, setHighlightedTreeID] = useState<string | null>(null);
  const highlightAnim = useRef(new Animated.Value(1)).current;

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

  // ✅ When navigated from AddTreeScreen with new coordinates
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

  // ✅ Pulsing animation for highlighted marker
  const startHighlightAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(highlightAnim, { toValue: 1.8, duration: 500, useNativeDriver: true }),
        Animated.timing(highlightAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();

    // Stop animation after 5 seconds
    setTimeout(() => {
      highlightAnim.stopAnimation();
      setHighlightedTreeID(null);
    }, 5000);
  };

  // ✅ Handle search
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
      console.error(error);
      Alert.alert('Search failed', 'Could not find this location.');
    } finally {
      setSearchQuery('');
    }
  };

  return (
    <View style={styles.container}>
      {/* 🔍 Search Bar */}
      <View style={styles.searchBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }}>
          <MaterialIcons name="location-on" size={24} color="#2ecc71" />
          <TextInput
            placeholder="Search for locations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* 🗺️ Google Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {trees
          .filter(
            (tree) =>
              tree.coordinates &&
              typeof tree.coordinates.latitude === 'number' &&
              typeof tree.coordinates.longitude === 'number' &&
              !isNaN(tree.coordinates.latitude) &&
              !isNaN(tree.coordinates.longitude)
          )
          .map((tree) => {
            const isHighlighted = tree.treeID === highlightedTreeID;
            return (
              <Marker
                key={tree.treeID}
                coordinate={{
                  latitude: tree.coordinates.latitude,
                  longitude: tree.coordinates.longitude,
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
  map: {
    width: '100%',
    height: '100%',
  },
});
