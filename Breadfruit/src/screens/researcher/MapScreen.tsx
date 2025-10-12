import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { TextInput } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Geocoder from 'react-native-geocoding';
import { useTreeData } from '@/hooks/useTreeData';

export default function MapScreen() {
  const { trees } = useTreeData();
  const navigation = useNavigation();
  const route = useRoute();
  const { width, height } = Dimensions.get('window');

  const [region, setRegion] = useState({
    latitude: 10.3157,
    longitude: 123.8854,
    latitudeDelta: 1.5,
    longitudeDelta: 1.5 * (width / height),
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTrees, setFilteredTrees] = useState(trees);

  useEffect(() => {
    Geocoder.init('YOUR_API_KEY'); // Replace with your Google Maps API key
  }, []);

  // Zoom to coordinates passed from another screen
  useEffect(() => {
    if (route.params?.lat && route.params?.lng) {
      setRegion({
        latitude: Number(route.params.lat),
        longitude: Number(route.params.lng),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01 * (width / height),
      });
    }
  }, [route.params?.lat, route.params?.lng]);

  // Filter markers as user types
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTrees(trees);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredTrees(
        trees.filter(
          tree =>
            tree.name?.toLowerCase().includes(query) &&
            tree.coordinates?.latitude &&
            tree.coordinates?.longitude
        )
      );
    }
  }, [searchQuery, trees]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim().toLowerCase();

    // First, try to find a tree with this name
    const matchedTree = trees.find(
      tree =>
        tree.name?.toLowerCase() === query &&
        tree.coordinates?.latitude &&
        tree.coordinates?.longitude
    );

    if (matchedTree) {
      // Zoom directly to the tree
      setRegion({
        latitude: matchedTree.coordinates.latitude,
        longitude: matchedTree.coordinates.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01 * (width / height),
      });
      return; // Stop, don't do Geocoding
    }

    // If no tree matched, use Geocoder for location search
    try {
      const json = await Geocoder.from(searchQuery);
      if (json.results.length === 0) {
        Alert.alert('Not found', 'Could not locate this place.');
        return;
      }

      const location = json.results[0].geometry.location;
      setRegion({
        latitude: location.lat,
        longitude: location.lng,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      });
    } catch (error) {
      Alert.alert('Search failed', 'Could not find this location.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          placeholder="Search for trees or locations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          left={
            <TextInput.Icon
              icon={() => <MaterialIcons name="location-on" size={24} color="#D32F2F" />}
            />
          }
          right={
            <TextInput.Icon icon="search" onPress={handleSearch} forceTextInputFocus={false} />
          }
          onSubmitEditing={handleSearch}
          mode="outlined"
          outlineColor="transparent"
          activeOutlineColor="transparent"
        />
      </View>

      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
      >
        {filteredTrees.map(tree => (
          <Marker
            key={tree.treeID}
            coordinate={{
              latitude: tree.coordinates.latitude,
              longitude: tree.coordinates.longitude,
            }}
            onPress={() => navigation.navigate('TreeDetails', { treeID: tree.treeID })}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    zIndex: 1,
    elevation: 3,
    borderRadius: 25,
    backgroundColor: '#f8f8f8',
  },
  searchInput: {
    backgroundColor: 'transparent',
    height: 48,
    fontSize: 16,
    borderRadius: 25,
  },
  map: { flex: 1 },
});
