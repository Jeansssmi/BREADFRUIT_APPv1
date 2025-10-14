import { useTreeData } from '@/hooks/useTreeData';
import { useNavigation, useRoute , useFocusEffect} from '@react-navigation/native';
import { useEffect, useState , useCallback,useRef} from 'react';
import { Alert, Dimensions, StyleSheet, TextInput, View } from 'react-native';
import Geocoder from 'react-native-geocoding';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

let lastRegion: any = null;
export default function MapScreen() {
  const { trees } = useTreeData();
  const route = useRoute();
  const navigation = useNavigation();
  const { width, height } = Dimensions.get('window');
  const mapRef = useRef<MapView>(null);


  const [region, setRegion] = useState({
     latitude: 9.8833, // 📍 Argao, Cebu center
         longitude: 123.6000,
         latitudeDelta: 0.03, // smaller number = closer zoom
         longitudeDelta: 0.03 * (width / height),
  });
  const [searchQuery, setSearchQuery] = useState('');

   // ✅ Remember last map region when user leaves
    useEffect(() => {
      lastRegion = region;
    }, [region]);

    // ✅ When the screen refocuses, restore last region
    useFocusEffect(
      useCallback(() => {
        if (lastRegion) setRegion(lastRegion);
      }, [])
    );

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


  // ✅ Handle search (Geocode + smooth zoom)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const json = await Geocoder.from(searchQuery.trim());
      const location = json.results[0].geometry.location;

      const newRegion = {
        latitude: location.lat,
        longitude: location.lng,
        latitudeDelta: 0.015, // 🔍 Closer zoom
        longitudeDelta: 0.015 * (width / height),
      };

      // Animate instead of snap
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
      ref={mapRef}
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