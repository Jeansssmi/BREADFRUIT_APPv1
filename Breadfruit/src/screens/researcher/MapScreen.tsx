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
  ScrollView,
  Text,
} from 'react-native';

import Geocoder from 'react-native-geocoding';
import Geolocation from 'react-native-geolocation-service';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import { Snackbar, useTheme , Appbar} from 'react-native-paper';
import barangayData from "@/constants/barangayData";
import { Keyboard } from 'react-native';




// ✅ Initialize Geocoder
Geocoder.init("AIzaSyDkaDuJ4kRUpUJiXZrj7MHczYUFIcCIZNk", { language: "en" });

let lastRegion = null;

export default function MapScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const mapRef = useRef<MapView>(null);
  const { width, height } = Dimensions.get('window');
  const theme = useTheme();

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
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchLocked, setIsSearchLocked] = useState(false);
  const [longPressLocation, setLongPressLocation] = useState(null);


  const getPinColor = (fruitStatus, status) => {
    if (status === 'harvested') return '#8e5b32';
    switch (fruitStatus) {
      case 'none':
        return '#00BFFF';
      case 'ripe':
        return '#FFD700';
      case 'unripe':
        return '#2ecc71';
      default:
        return '#95a5a6';
    }
  };

  useEffect(() => {
    lastRegion = region;
  }, [region]);

  useFocusEffect(
    useCallback(() => {
      if (lastRegion) setRegion(lastRegion);
      return () => {
        glowAnim.stopAnimation();
        setHighlightedTreeID(null);
      };
    }, [])
  );

  // ✅ Firestore listener
  useEffect(() => {
    setLoading(true);
    const unsubscribe = firestore()
      .collection('trees')
      .where('status', 'in', ['verified', 'harvest-ready', 'not-ready', 'harvested'])
      .onSnapshot(snapshot => {
        const data = [];
        snapshot.forEach(doc => data.push({ treeID: doc.id, ...doc.data() }));
        setTrees(data);
        setLoading(false);
      });
    return () => unsubscribe();
  }, [route.params?.refresh]);


  // ✅ Continuous blinking animation that restarts for each new tree
  const startHighlightAnimation = () => {
    glowAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };



const toggleTreeHighlight = (treeID) => {
  if (highlightedTreeID === treeID) {
    // ✅ Unhighlight: stop blinking and reset
    setHighlightedTreeID(null);
    glowAnim.stopAnimation();
    glowAnim.setValue(0);

    // Optional: zoom out to normal view
    const tree = trees.find((t) => t.treeID === treeID);
    if (tree && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: tree.coordinates.latitude,
          longitude: tree.coordinates.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        },
        800
      );
    }
  } else {
    // ✅ Highlight: start blinking and zoom in
    setHighlightedTreeID(treeID);
    startHighlightAnimation();

    const tree = trees.find((t) => t.treeID === treeID);
    if (tree && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: tree.coordinates.latitude,
          longitude: tree.coordinates.longitude,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        },
        800
      );
    }
  }
};


// ✅ Zooms in & highlights a tree, unzooms if pressed again
const focusAndZoomTree = (tree) => {
  if (!tree || !mapRef.current) return;

  if (highlightedTreeID === tree.treeID) {
    // Unhighlight → Zoom out to normal view
    mapRef.current.animateToRegion(
      {
        latitude: tree.coordinates.latitude,
        longitude: tree.coordinates.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03 * (width / height),
      },
      1000
    );
    setHighlightedTreeID(null);
    glowAnim.stopAnimation();
  } else {
    // Highlight → Zoom in to the tree
    setHighlightedTreeID(tree.treeID);
    startHighlightAnimation();
    mapRef.current.animateToRegion(
      {
        latitude: tree.coordinates.latitude,
        longitude: tree.coordinates.longitude,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      },
      1000
    );

    // Optional: Auto-show popup callout after zoom
    setTimeout(() => {
      setSnackbarMessage(`Focused on Tree: ${tree.treeID}`);
      setSnackbarVisible(true);
    }, 400);
  }
};



useEffect(() => {
  const focusTree = route.params?.focusTree;

  if (!focusTree || trees.length === 0) return;

  // ✔ Correct tree match
  const targetTree = trees.find(t => t.treeID === focusTree.treeID);
  if (!targetTree) return;

  // Delay to allow Map & Markers to fully render
  setTimeout(() => {
    // highlight the tree
    setHighlightedTreeID(targetTree.treeID);
    startHighlightAnimation();

    if (focusTree.zoomIn && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: targetTree.coordinates.latitude,
          longitude: targetTree.coordinates.longitude,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        },
        800
      );

      setSnackbarMessage(`Focused on Tree: ${targetTree.treeID}`);
      setSnackbarVisible(true);
    }
  }, 600); // 🔥 delay so zoom will ALWAYS work
}, [route.params?.focusTree, trees]);





  useEffect(() => {
    return () => {
      setHighlightedTreeID(null);
      glowAnim.stopAnimation();
    };
  }, []);

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

   setIsSearchLocked(false); // ✅ Resume GPS tracking
   setSnackbarMessage("Back to your location");
   setSnackbarVisible(true);

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

const handleSearch = async () => {
  const query = searchQuery.trim().toLowerCase();
  if (!query) {
    Alert.alert("Search", "Please enter a barangay, city, or place name.");
    return;
  }

  Keyboard.dismiss(); // ✅ hide keyboard when searching
  setIsSearching(true);
  setIsSearchLocked(true); // ⏸ stop GPS tracking while searching

  try {
    // Prefer barangayData lookup
    let locationString = query + ", Cebu, Philippines";
    for (const [city, barangays] of Object.entries(barangayData)) {
      if (city.toLowerCase() === query) {
        locationString = `${city}, Cebu, Philippines`;
        break;
      }
      if (barangays.some(b => b.toLowerCase() === query)) {
        locationString = `${query}, ${city}, Cebu, Philippines`;
        break;
      }
    }

    const geoResult = await Geocoder.from(locationString);
    if (geoResult.results.length > 0) {
      const { lat, lng } = geoResult.results[0].geometry.location;
      const newRegion = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008 * (width / height),
      };

      mapRef.current?.animateToRegion(newRegion, 1200);
      setRegion(newRegion);
      setSnackbarMessage(`Showing: ${searchQuery}`);
      setSnackbarVisible(true);
    } else {
      Alert.alert("Not Found", "Location not found. Try another name.");
      setIsSearchLocked(false);
    }
  } catch (error) {
    console.error("Geocoding error:", error);
    Alert.alert("Error", "Unable to locate that place.");
    setIsSearchLocked(false);
  } finally {
    setIsSearching(false);
  }
};

const handleClearSearch = async () => {
  Keyboard.dismiss();
  setSearchQuery('');
  setSnackbarMessage("Returning to your live location...");
  setSnackbarVisible(true);
  setIsSearchLocked(true);

  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    Alert.alert('Permission Denied', 'Location access required.');
    return;
  }

  Geolocation.getCurrentPosition(
    pos => {
      const newRegion = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01 * (width / height),
      };

      mapRef.current?.animateToRegion(newRegion, 1200);
      setRegion(newRegion);

      setTimeout(() => {
        setIsSearchLocked(false);
        setSnackbarMessage("Live tracking resumed");
        setSnackbarVisible(true);
      }, 2500);
    },
    () => Alert.alert('GPS Error', 'Enable GPS and try again.'),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
  );
};
useEffect(() => {
  if (isSearchLocked) return; // stop following during search

  let isMounted = true;
  const watchId = Geolocation.watchPosition(
    position => {
      if (!isMounted) return;
      const { latitude, longitude } = position.coords;

      // only move camera smoothly, not via region state
      mapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01 * (width / height),
        },
        1000
      );
    },
    error => console.warn("WatchPosition error:", error),
    {
      enableHighAccuracy: true,
      distanceFilter: 15,
      interval: 8000,
      fastestInterval: 4000,
    }
  );

  return () => {
    isMounted = false;
    Geolocation.clearWatch(watchId);
  };
}, [isSearchLocked]);


  // ✅ Filtered trees
  const filteredTrees = trees.filter(tree => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'verified') return tree.fruitStatus === 'none';
    if (selectedFilter === 'harvest-ready') return tree.fruitStatus === 'ripe';
    if (selectedFilter === 'unripe') return tree.fruitStatus === 'unripe';
    if (selectedFilter === 'harvested') return tree.status === 'harvested';
    return false;
  });



  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>



   <View
     style={[
       styles.searchBar,
       { backgroundColor: theme.dark ? '#2a2a2a' : '#f8f8f8', shadowColor: theme.dark ? '#000' : '#ccc' },
     ]}
   >
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }}>
      <MaterialIcons name="search" size={24} color={theme.colors.primary} />

      <TextInput
        placeholder="Search barangay or city..."
        placeholderTextColor={theme.dark ? '#aaa' : '#666'}
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={[styles.searchInput, { color: theme.colors.text }]}
        onSubmitEditing={() => handleSearch()} // ✅ wrap in arrow function for reliability
        returnKeyType="search"
        blurOnSubmit={true} // ✅ ensures keyboard hides and triggers onSubmitEditing
      />

      {searchQuery.length > 0 ? (
        <TouchableOpacity onPress={handleClearSearch}>
          <MaterialIcons name="close" size={24} color="#e74c3c" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={handleSearch}>
          <MaterialIcons name="arrow-forward" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      )}
    </View>
    </View>



      {/* 🌈 Legend */}
      <View style={styles.legendWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.legendContainer}>
          {['All', 'verified', 'harvest-ready', 'unripe', 'harvested'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.legendItem,
                selectedFilter === filter && {
                  backgroundColor: theme.dark ? 'rgba(46,204,113,0.3)' : 'rgba(46,204,113,0.15)',
                },
              ]}
              onPress={() => setSelectedFilter(filter)}
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
                        : filter === 'unripe'
                        ? '#2ecc71'
                        : '#8e5b32',
                  },
                ]}
              />
              <Text style={[styles.legendText, { color: theme.colors.text }]}>
                {filter === 'unripe'
                  ? 'Unripe'
                  : filter === 'harvest-ready'
                  ? 'Harvest-Ready'
                  : filter === 'verified'
                  ? 'Verified'
                  : filter === 'harvested'
                  ? 'Harvested'
                  : 'All'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

     {/* 🗺️ Map */}
     <MapView
       ref={mapRef}
       provider={PROVIDER_GOOGLE}
       style={styles.map}
       initialRegion={region}
       showsUserLocation
       onLongPress={(e) => {
         const { latitude, longitude } = e.nativeEvent.coordinate;
         setLongPressLocation({ latitude, longitude });
         setSnackbarMessage(`Coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
         setSnackbarVisible(true);
       }}
     >

       {filteredTrees.map((tree) => (
         <Marker
           key={tree.treeID}
           coordinate={{
             latitude: tree.coordinates?.latitude ?? 0,
             longitude: tree.coordinates?.longitude ?? 0,
           }}
           onPress={() => toggleTreeHighlight(tree.treeID)} // ✅ highlight toggle
           title={`Tree ID: ${tree.treeID}`}
           description="Tap to view details"
           onCalloutPress={() =>
             navigation.navigate("TreeDetails", { treeID: tree.treeID })
           }
         >

          <Animated.View
            style={{
              opacity:
                highlightedTreeID === tree.treeID
                  ? glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1], // blink between 30% and 100% opacity
                    })
                  : 1,
              transform: [
                { scale: highlightedTreeID === tree.treeID ? 1.2 : 1 }, // slightly enlarge while highlighted
              ],
            }}
          >
            <MaterialIcons
              name="place"
              size={highlightedTreeID === tree.treeID ? 50 : 40}
              color={
                highlightedTreeID === tree.treeID
                  ? "#FF4500" // 🔥 blinking orange
                  : getPinColor(tree.fruitStatus, tree.status)
              }
            />
          </Animated.View>



           {/* 🟩 Keep your existing Callout popup (works the same) */}
           <Callout>
             <View
               style={{
                 backgroundColor: "white",
                 paddingVertical: 6,
                 paddingHorizontal: 10,
                 borderRadius: 8,
                 alignItems: "center",
                 justifyContent: "center",
                 width: 120,
               }}
             >
               <Text
                 style={{
                   fontSize: 13,
                   fontWeight: "bold",
                   color: "#000",
                   textAlign: "center",
                 }}
               >
                 {`Tree ID:\n${tree.treeID}`}
               </Text>
               <Text
                 style={{
                   color: "#2e7d32",
                   fontSize: 11,
                   marginTop: 2,
                   textAlign: "center",
                 }}
               >
                 Tap to view
               </Text>
             </View>
           </Callout>
         </Marker>
       ))}


       {/* 📍 Long Press Marker */}
       {longPressLocation && (
         <Marker
           coordinate={longPressLocation}
           pinColor="red"
           title="New Tree Location"
           description="Tap to add this tree"
           onCalloutPress={() => {
             Alert.alert(
               "Add Tree",
               `Do you want to add a new tree here?\n\nLat: ${longPressLocation.latitude.toFixed(5)}\nLng: ${longPressLocation.longitude.toFixed(5)}`,
               [
                 { text: "Cancel", style: "cancel" },
                 {
                   text: "Yes",
                   onPress: () =>
                     navigation.navigate("AddTree", { coordinates: longPressLocation }),
                 },
               ]
             );
           }}
         >
           <MaterialIcons name="add-location" size={40} color="red" />
           <Callout>
             <View
               style={{
                 backgroundColor: 'white',
                 paddingVertical: 6,
                 paddingHorizontal: 10,
                 borderRadius: 8,
                 alignItems: 'center',
                 justifyContent: 'center',
                 width: 120,
                 minHeight: 50,
               }}
             >
               <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#000', textAlign: 'center' }}>
                 Add Tree Here?
               </Text>
               <Text style={{ fontSize: 11, color: '#2e7d32', marginTop: 2, textAlign: 'center' }}>
                 Tap to confirm
               </Text>
             </View>
           </Callout>

         </Marker>
       )}
     </MapView>



      {/* 📍 My Location */}
      <TouchableOpacity
        style={[styles.myLocationButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleMyLocation}
      >
        <MaterialIcons name="my-location" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ✅ Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2500}
        style={{
          backgroundColor: theme.colors.primary,
        }}
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
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  legendContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 6,
  },
  legendColor: { width: 16, height: 16, borderRadius: 4, marginRight: 4 },
  legendText: { fontSize: 14, fontWeight: '500' },
  legendWrapper: { position: 'absolute', top: 90, left: 0, right: 0, zIndex: 1 },
});
