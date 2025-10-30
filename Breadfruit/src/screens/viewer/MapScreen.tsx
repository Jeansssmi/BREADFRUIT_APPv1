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
import auth from '@react-native-firebase/auth';
import { Snackbar, useTheme } from 'react-native-paper';

// keep geocoder if you use it elsewhere (safe to keep)
Geocoder.init('YOUR_GOOGLE_GEOCODING_API_KEY', { language: 'en' });

let lastRegion: any = null;

export default function MapScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);
  const theme = useTheme();

  const { width, height } = Dimensions.get('window');

  const [region, setRegion] = useState({
    latitude: 9.8833,
    longitude: 123.6,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03 * (width / height),
  });

  // official tracked trees
  const [trees, setTrees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ui
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [reporting, setReporting] = useState(false);

  // keep your highlight for tree flows
  const [highlightedTreeID, setHighlightedTreeID] = useState<string | null>(null);
  const highlightAnim = useRef(new Animated.Value(1)).current;

  // NEW: yellow pins for unseen viewer reports (admin side)
  const [pendingPins, setPendingPins] = useState<{ lat: number; lng: number }[]>([]);

  // NEW: pulsing marker when coming from “View on map”
  const [notifyLocation, setNotifyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const pinColor = theme.colors.primary;

  // persist last map region
  useEffect(() => {
    lastRegion = region;
  }, [region]);

  useFocusEffect(
    useCallback(() => {
      if (lastRegion) setRegion(lastRegion);
    }, [])
  );

  // fetch official trees + unseen notifications (yellow pins)
  useEffect(() => {
    setLoading(true);

    const unsubTrees = firestore()
      .collection('trees')
      .where('status', 'in', ['verified', 'harvest-ready', 'not-ready'])
      .onSnapshot(
        snap => {
          const data: any[] = [];
          snap?.forEach?.(doc => data.push({ treeID: doc.id, ...doc.data() }));
          setTrees(data);
          setLoading(false);
        },
        () => setLoading(false)
      );

    // show yellow pins for unseen admin notifications created by viewers
    const unsubNotifs = firestore()
      .collection('notification')
      .where('recipientRole', '==', 'Admin')
      .where('seen', '==', false)
      .onSnapshot(snap => {
        if (!snap || snap.empty) {
          setPendingPins([]);
          return;
        }
        const pins: { lat: number; lng: number }[] = [];
        snap.docs.forEach(d => {
          const v = d.data() as any;
          if (typeof v.lat === 'number' && typeof v.lng === 'number') {
            pins.push({ lat: v.lat, lng: v.lng });
          }
        });
        setPendingPins(pins);
      });

    return () => {
      unsubTrees && unsubTrees();
      unsubNotifs && unsubNotifs();
    };
  }, [route.params?.refresh]);

  // tree highlight animation (kept)
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

  // pulsing animation for notification focus
  const startPulseAnimation = () => {
    pulseAnim.setValue(1);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.8, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    setTimeout(() => {
      pulseAnim.stopAnimation();
      setNotifyLocation(null);
    }, 5000);
  };

  // center when opened via notification (or tree flow)
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

      // pulsing for notifs
      setNotifyLocation({ lat: Number(route.params.lat), lng: Number(route.params.lng) });
      startPulseAnimation();

      // keep tree flow highlight if provided
      if (route.params?.treeID) {
        setHighlightedTreeID(route.params.treeID);
        startHighlightAnimation();
      }
    }
  }, [route.params?.lat, route.params?.lng, route.params?.treeID]);

  // location permission (android)
  const requestLocationPermission = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app requires access to your location.',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  };

  // REPORT: save to treeReports + create linked admin notification (no approval workflow)
  const handleReportAtMyLocation = async () => {
    const user = auth().currentUser;
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to report a tree.');
      return;
    }

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Location access required.');
      return;
    }

    setReporting(true);

    Geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude, longitude } = pos.coords;

          // 1) save viewer report
          const reportRef = await firestore().collection('treeReports').add({
            reporterID: user.uid,
            reporterRole: 'viewer',
            coordinates: new firestore.GeoPoint(latitude, longitude),
            status: 'pending', // informational
            createdAt: firestore.FieldValue.serverTimestamp(),
          });

          // 2) notify admin (must match rules)
          await firestore().collection('notification').add({
            type: 'tree-report',
            message: 'Viewer submitted a tree location.',
            reportID: reportRef.id,
            lat: latitude,
            lng: longitude,
            recipientRole: 'Admin',
            seen: false,
            timestamp: firestore.FieldValue.serverTimestamp(),
            reporterID: user.uid,
            reporterName: user.displayName ?? 'Viewer',
          });

         // ✅ NEW - log activity
         await firestore().collection('activityLog').add({
           type: 'report',
           description: `Viewer submitted a tree report`,
           reportID: reportRef.id,
           reporterID: user.uid,
           timestamp: firestore.FieldValue.serverTimestamp(),
         });

          setSnackbarMessage('Thanks! Your report was sent to admins.');
          setSnackbarVisible(true);
        } catch (e: any) {
          console.log('Report error', e);
          Alert.alert('Error', e?.message ?? 'Could not send the report. Try again.');
        } finally {
          setReporting(false);
        }
      },
      err => {
        console.log('Location error:', err);
        setReporting(false);
        Alert.alert('GPS Error', 'Enable GPS and try again.');
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
      {/* search bar (kept) */}
      <View style={[styles.searchBar, { backgroundColor: theme.dark ? '#2a2a2a' : '#f8f8f8' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }}>
          <MaterialIcons name="search" size={24} color={theme.colors.primary} />
          <TextInput
            placeholder="Search barangay, city, or location..."
            placeholderTextColor={theme.dark ? '#aaa' : '#666'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.colors.text }]}
          />
        </View>
      </View>

      {/* map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
      >
        {/* official trees */}
        {trees.map(tree => (
          <Marker
            key={tree.treeID}
            coordinate={{
              latitude: tree.coordinates?.latitude ?? 0,
              longitude: tree.coordinates?.longitude ?? 0,
            }}
            pinColor={pinColor}
            onPress={() => navigation.navigate('TreeDetails', { treeID: tree.treeID })}
          />
        ))}

        {/* yellow pins for unseen admin notifications */}
        {pendingPins.map((p, idx) => (
          <Marker
            key={`pending_${idx}`}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            pinColor="yellow"
            title="Reported location"
            description="Unseen notification"
          />
        ))}

        {/* pulsing focus marker when opened from notification */}
        {notifyLocation && (
          <Marker coordinate={{ latitude: notifyLocation.lat, longitude: notifyLocation.lng }}>
            <Animated.View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: 'rgba(255,0,0,0.9)',
                transform: [{ scale: pulseAnim }],
              }}
            />
          </Marker>
        )}
      </MapView>

      {/* my location */}
      <TouchableOpacity
        style={[styles.myLocationButton, { backgroundColor: theme.colors.primary }]}
        onPress={async () => {
          const ok = await requestLocationPermission();
          if (!ok) return;
          Geolocation.getCurrentPosition(
            pos => {
              const newRegion = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01 * (width / height),
              };
              mapRef.current?.animateToRegion(newRegion, 1500);
              setRegion(newRegion);
            },
            () => Alert.alert('GPS Error', 'Enable GPS.')
          );
        }}
      >
        <MaterialIcons name="my-location" size={28} color="#fff" />
      </TouchableOpacity>

      {/* report button */}
      <TouchableOpacity
        style={[styles.reportButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleReportAtMyLocation}
        disabled={reporting}
      >
        <MaterialIcons name="add-location-alt" size={26} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 8 }}>
          {reporting ? 'Reporting…' : 'Report tree (my location)'}
        </Text>
      </TouchableOpacity>

      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={2600}>
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
    borderRadius: 25,
    marginTop: 25,
    elevation: 3,
  },
  searchInput: { backgroundColor: 'transparent', height: 48, fontSize: 16, flex: 1, marginLeft: 10 },
  map: { width: '100%', height: '100%' },
  myLocationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    padding: 12,
    borderRadius: 50,
    elevation: 5,
  },
  reportButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 30,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
