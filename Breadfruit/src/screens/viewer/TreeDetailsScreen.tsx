import { useTreeData } from '@/hooks/useTreeData';
import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// This is a helper component to contain the main logic
// It ensures hooks are only called when treeID is valid.
function TreeDetails({ treeID }) {
  const navigation = useNavigation();
  const { trees, isLoading } = useTreeData({ mode: 'single', treeID: treeID.toString() });
  const tree = trees[0];

  const handleSendNotification = () => {
    navigation.navigate("FruitScanner", { treeID: treeID, skipImagePrompt: true });
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2ecc71" /></View>;
  }

  if (!tree) {
    return <View style={styles.center}><Text>Tree not found.</Text></View>;
  }

  // The UI below is identical to your original code
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {tree.image ? (
          <Image source={{ uri: tree.image }} style={styles.treeImage} resizeMode="cover" />
        ) : (
          <View style={[styles.treeImage, styles.imagePlaceholder]}>
            <MaterialIcons name="no-photography" size={40} color="#666" />
          </View>
        )}
        <View style={styles.detailsCard}>
          <Text style={styles.title}>Breadfruit Tree #{tree.treeID}</Text>
          <View style={styles.detailRow}>
            <MaterialIcons name="location-on" size={20} color="#2ecc71" />
            <Text style={styles.detailText}>{tree.city}</Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Diameter</Text>
              <Text style={styles.statValue}>{tree.diameter.toFixed(2)}m</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Tracked Date</Text>
              <Text style={styles.statValue}>{new Date(tree.dateTracked).toLocaleDateString()}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Fruit Status</Text>
              <Text style={styles.statValue}>{tree.fruitStatus}</Text>
            </View>
          </View>
          <View style={styles.coordinateContainer}>
            <MaterialIcons name="map" size={20} color="#2ecc71" />
            <Text style={styles.coordinateText}>
              {tree.coordinates.latitude.toFixed(6)}, {tree.coordinates.longitude.toFixed(6)}
            </Text>
          </View>
        </View>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, styles.sendButton]}
            onPress={handleSendNotification}
          >
            <Text style={styles.buttonText}>Send Notification</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.updateButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Close Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}


export default function TreeDetailsScreen() {
  const route = useRoute();

  // ✅ FIX: Safely access treeID using optional chaining (`?.`).
  // This prevents the app from crashing if 'params' is undefined.
  const treeID = route.params?.treeID;

  // If treeID is missing, show an error message instead of crashing.
  if (!treeID) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: Tree ID is missing.</Text>
        <Text>Please go back and try again.</Text>
      </View>
    );
  }

  // If treeID exists, render the component that contains the data-fetching logic.
  return <TreeDetails treeID={treeID} />;
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1, padding: 16, backgroundColor: '#ffffff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 18, fontWeight: 'bold', color: '#c0392b', marginBottom: 8 },
  treeImage: { height: 300, borderRadius: 12, marginBottom: 16 },
  imagePlaceholder: { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  detailsCard: { borderRadius: 12, marginBottom: 16, elevation: 2, backgroundColor: '#fff', padding: 16 },
  title: { marginBottom: 20, color: '#2ecc71', fontWeight: 'bold', fontSize: 18 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  detailText: { fontSize: 16, color: '#333' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 16, gap: 12 },
  statItem: { flex: 1, alignItems: 'center', padding: 12, backgroundColor: '#f0f0f0', borderRadius: 8 },
  statLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '600', color: '#333' },
  coordinateContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  coordinateText: { fontSize: 14, color: '#666', fontFamily: 'monospace' },
  buttonGroup: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  button: {
    flex: 1,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 5
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  sendButton: { backgroundColor: '#2ecc71' },
  updateButton: { backgroundColor: '#333' },
});