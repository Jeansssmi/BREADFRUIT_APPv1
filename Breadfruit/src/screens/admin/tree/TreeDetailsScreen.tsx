import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { LoadingAlert, NotificationAlert } from '@/components/NotificationModal';

export default function TreeDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { treeID } = route.params;

  const [tree, setTree] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('info');
  const [trackerName, setTrackerName] = useState('Loading...');

  // Fetch tree data
  useEffect(() => {
    const unsubscribe = firestore()
      .collection('trees')
      .doc(treeID)
      .onSnapshot((doc) => {
        if (doc.exists) {
          setTree({ id: doc.id, ...doc.data() });
        } else {
          setTree(null);
        }
        setLoading(false);
      }, (err) => {
        console.error('Tree fetch error:', err);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [treeID]);

  // Fetch tracker name after tree has loaded
  useEffect(() => {
    const fetchTrackerName = async () => {
      if (!tree?.trackedById) return;

      try {
        const userDoc = await firestore().collection('users').doc(tree.trackedById).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          setTrackerName(userData?.name || userData?.displayName || 'Unknown');
        } else {
          setTrackerName('Unknown');
        }
      } catch (err) {
        console.error('Error fetching tracker:', err);
        setTrackerName('Unknown');
      }
    };

    fetchTrackerName();
  }, [tree?.trackedById]);

  const handleDelete = () => {
    Alert.alert('Delete Tree', 'Are you sure you want to delete this tree?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            const docRef = firestore().collection('trees').doc(treeID);
            const doc = await docRef.get();

            if (doc.exists) {
              const treeData = doc.data();
              if (treeData?.image) {
                storage()
                  .refFromURL(treeData.image)
                  .delete()
                  .catch((err) => console.log('Image may not exist.', err));
              }
              await docRef.delete();
            }

            setNotificationMessage('Tree deleted successfully.');
            setNotificationType('success');
            setNotificationVisible(true);

            setTimeout(() => navigation.goBack(), 800);
          } catch (err) {
            console.error(err);
            setNotificationMessage('Failed to delete tree.');
            setNotificationType('error');
            setNotificationVisible(true);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

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

  const formattedDate =
    tree.dateTracked?.toDate?.() instanceof Function
      ? tree.dateTracked.toDate().toLocaleDateString()
      : new Date(tree.dateTracked).toLocaleDateString();

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <LoadingAlert visible={loading} message="Please wait..." />
        <NotificationAlert
          visible={notificationVisible}
          message={notificationMessage}
          type={notificationType}
          onClose={() => setNotificationVisible(false)}
        />

        {tree.image ? (
          <Image source={{ uri: tree.image }} style={styles.treeImage} resizeMode="cover" />
        ) : (
          <View style={[styles.treeImage, styles.imagePlaceholder]}>
            <MaterialIcons name="no-photography" size={40} color="#666" />
          </View>
        )}

        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.title}>
              {tree.treeID || 'N/A'}
            </Text>

            <View style={styles.detailRow}>
              <MaterialIcons name="location-on" size={20} color="#2ecc71" />
              <Text style={styles.detailText}>
                {tree.city ? `${tree.city}${tree.barangay ? `, ${tree.barangay}` : ''}` : 'N/A'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="account" size={20} color="#2ecc71" />
              <Text style={styles.detailText}>{trackerName}</Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Diameter</Text>
                <Text style={styles.statValue}>
                  {typeof tree.diameter === 'number' ? `${tree.diameter.toFixed(2)}m` : 'N/A'}
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Fruit Status</Text>
                <Text style={styles.statValue}>
                  {tree.fruitStatus && tree.fruitStatus.toLowerCase() !== 'none'
                    ? tree.fruitStatus
                    : 'N/A'}
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Tracked Date</Text>
                <Text style={styles.statValue}>{formattedDate || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.coordinateContainer}>
              <MaterialIcons name="map" size={20} color="#2ecc71" />
              <Text style={styles.coordinateText}>
                {typeof tree.coordinates?.latitude === 'number' &&
                typeof tree.coordinates?.longitude === 'number'
                  ? `${tree.coordinates.latitude.toFixed(6)}, ${tree.coordinates.longitude.toFixed(6)}`
                  : 'N/A'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.buttonGroup}>
          <Button
            mode="contained"
            style={styles.button}
            onPress={() => navigation.navigate('EditTree', { treeID: tree.id })}
          >
            Update Details
          </Button>

          <Button
            mode="contained"
            style={[styles.button, styles.deleteButton]}
            onPress={handleDelete}
          >
            Delete
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1, padding: 16, backgroundColor: '#ffffff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  treeImage: { height: 300, borderRadius: 12, marginBottom: 16 },
  imagePlaceholder: { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  detailsCard: { borderRadius: 12, marginBottom: 16, elevation: 2, backgroundColor: '#fff' },
  title: { marginBottom: 16, color: '#2ecc71', fontWeight: 'bold' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  detailText: { fontSize: 16, color: '#333' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 14, color: '#666' },
  statValue: { fontSize: 16, fontWeight: '600', color: '#333' },
  coordinateContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coordinateText: { fontSize: 16, color: '#333' },
  buttonGroup: { flexDirection: 'row', marginTop: 20, gap: 10 },
  button: { flex: 1, borderRadius: 25, backgroundColor: '#2ecc71' },
  deleteButton: { backgroundColor: '#e74c3c' },
});
