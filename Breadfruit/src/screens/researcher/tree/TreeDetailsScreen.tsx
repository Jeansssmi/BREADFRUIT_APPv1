import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { LoadingAlert, NotificationAlert } from '@/components/NotificationModal';
import { useTreeData } from '@/hooks/useTreeData';
export default function TreeDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { treeID } = route.params;


  const [loading, setLoading] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('info');
  const [trackerName, setTrackerName] = useState('Loading...');

 // Use your standard hook for data fetching
   const { trees, isLoading, error } = useTreeData({ mode: 'single', treeID });
   const tree = trees[0];

if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  if (!tree) {
    return (
      <View style={styles.center}>
        <Text>Tree not found.</Text>
      </View>
    );
  }
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          {tree.image ? (
            <Image source={{ uri: tree.image }} style={styles.treeImage} resizeMode="cover" />
          ) : (
            <View style={[styles.treeImage, styles.imagePlaceholder]}>
              <MaterialIcons name="no-photography" size={40} color="#666" />
            </View>
          )}

          <Card style={styles.detailsCard}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.title}>{tree.treeID}</Text>
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
            </Card.Content>
          </Card>

          {/* ✅ Buttons */}
          <View style={styles.buttonGroup}>

            <Button
              mode="contained"
              style={[styles.button, styles.closeButton]}
              onPress={() => navigation.goBack()}
            >
              Close Details
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1, padding: 16, backgroundColor: '#ffffff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  treeImage: { height: 300, borderRadius: 12, marginBottom: 16 },
  imagePlaceholder: { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  detailsCard: { borderRadius: 12, marginBottom: 16, elevation: 2, backgroundColor: '#fff' },
  title: { marginBottom: 20, color: '#2ecc71', fontWeight: 'bold' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  detailText: { fontSize: 16, color: '#333' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 16, gap: 12 },
  statItem: { flex: 1, alignItems: 'center', padding: 12, backgroundColor: '#eee', borderRadius: 8 },
  statLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '600', color: '#333' },
  coordinateContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  coordinateText: { fontSize: 14, color: '#666', fontFamily: 'monospace' },
  buttonGroup: { flexDirection: 'row', gap: 10, marginTop: 20 },
  button: { flex: 1, borderRadius: 25 },
  updateButton: { backgroundColor: '#2ecc71' }, // green
  closeButton: { backgroundColor: '#333' },      // black
});
