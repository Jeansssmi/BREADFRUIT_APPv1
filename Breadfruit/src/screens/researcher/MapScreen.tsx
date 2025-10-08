import TreeDetailsModal from '../../components/TreeDetailsModal';
import { useTreeData } from '@/hooks/useTreeData';
import { Tree } from '@/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, StyleSheet, View } from 'react-native';
import Geocoder from 'react-native-geocoding';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Button, Text, TextInput } from 'react-native-paper';
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
  const [droppedPin, setDroppedPin] = useState<{ coordinate: { latitude: number; longitude: number }; title?: string } | null>(null);
  const [selectedTree, setSelectedTree] = useState<Tree | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // ✅ store last added tree in state
  const [lastAddedTreeID, setLastAddedTreeID] = useState<string | null>(null);

  useEffect(() => {
    if (route.params?.treeID && route.params?.lat && route.params?.lng) {
      const { treeID, lat, lng } = route.params;

      // zoom into the new tree
      setRegion({
        latitude: Number(lat),
        longitude: Number(lng),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      // keep track of the last added tree
      setLastAddedTreeID(treeID);
    }
  }, [route.params]);

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
    } catch {
      Alert.alert('Search failed', 'Could not find this location.');
    } finally {
      setSearchQuery('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          placeholder="Search for locations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          left={<TextInput.Icon icon={() => <MaterialIcons name="location-on" size={24} color="#D32F2F" />} />}
          onSubmitEditing={handleSearch}
          mode="outlined"
          outlineColor="transparent"
          activeOutlineColor="transparent"
        />
      </View>

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onLongPress={(e) => setDroppedPin({ coordinate: e.nativeEvent.coordinate, title: 'New Tree' })}
        onRegionChangeComplete={setRegion}
      >
        {trees.map((tree) => (
          <Marker
            key={tree.treeID}
            coordinate={tree.coordinates}
            // ✅ if last added → red, else → green
            pinColor={tree.treeID === lastAddedTreeID ? "red" : "green"}
            onPress={() => {
              setSelectedTree(tree);
              setRegion({ ...tree.coordinates, latitudeDelta: 0.01, longitudeDelta: 0.01 });
              setModalVisible(true);
            }}
          />
        ))}

        {droppedPin && (
          <Marker coordinate={droppedPin.coordinate} title={droppedPin.title} />
        )}
      </MapView>

      {droppedPin && (
        <View style={styles.pinConfirmation}>
          <Text>Add New Tree at this location?</Text>
          <View style={styles.pinButtons}>
            <Button
              mode="contained"
              style={styles.confirmButton}
              onPress={() => {
                navigation.navigate('Trees', {
                  screen: 'AddTree',
                  params: {
                    latitude: droppedPin.coordinate.latitude,
                    longitude: droppedPin.coordinate.longitude,
                  },
                });
                setDroppedPin(null);
              }}
            >
              Confirm
            </Button>
            <Button mode="outlined" style={styles.cancelButton} onPress={() => setDroppedPin(null)}>
              Cancel
            </Button>
          </View>
        </View>
      )}

      <TreeDetailsModal visible={modalVisible} tree={selectedTree} onClose={() => setModalVisible(false)} />
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
  pinConfirmation: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  pinButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  confirmButton: { flex: 1, marginRight: 10, backgroundColor: '#2ecc71' },
  cancelButton: { flex: 1 },
});
