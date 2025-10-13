import { useTreeData } from '@/hooks/useTreeData';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, StyleSheet, TextInput, View } from 'react-native';
import Geocoder from 'react-native-geocoding';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function MapScreen() {
  const { trees } = useTreeData();
  const route = useRoute();
  const navigation = useNavigation();
  const { width, height } = Dimensions.get('window');

  const [region, setRegion] = useState({
    latitude: 10.3157,
    longitude: 123.8854,
    latitudeDelta: 1.5,
    longitudeDelta: 1.5 * (width / height),
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (route.params?.lat && route.params?.lng) {
      setRegion({
        latitude: Number(route.params.lat),
        longitude: Number(route.params.lng),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [route.params?.lat, route.params?.lng]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const json = await Geocoder.from(searchQuery.trim());
      const location = json.results[0].geometry.location;
      setRegion({
        latitude: location.lat,
        longitude: location.lng,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Search failed', 'Could not find this location.');
    } finally {
      setSearchQuery('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }}>
          <MaterialIcons name="location-on" size={24} color="#D32F2F" />
          <TextInput
            placeholder="Search for locations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            onSubmitEditing={handleSearch}
          />
        </View>
      </View>

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
      >
        {trees
          .filter(tree =>
            tree.coordinates &&
            typeof tree.coordinates.latitude === 'number' &&
            typeof tree.coordinates.longitude === 'number' &&
            !isNaN(tree.coordinates.latitude) &&
            !isNaN(tree.coordinates.longitude)
          )
          .map((tree) => (
            <Marker
              key={tree.treeID}
              coordinate={{
                latitude: tree.coordinates.latitude,
                longitude: tree.coordinates.longitude,
              }}
              onPress={() =>
                navigation.navigate('TreeDetails', { treeID: tree.treeID })
              }
            />
        ))}


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
    height: '100%'
  },
});