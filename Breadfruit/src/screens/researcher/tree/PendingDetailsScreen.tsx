import { LoadingAlert, NotificationAlert } from '@/components/NotificationModal';
import { useTreeData } from '@/hooks/useTreeData';
import { useNavigation, useRoute } from '@react-navigation/native';
import { deleteDoc, doc, getFirestore } from "firebase/firestore";
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function PendingTreeDetailsScreen() { 
  const route = useRoute();
  const navigation = useNavigation();
  const { treeID } = route.params;

  const { trees, isLoading } = useTreeData({ mode: 'single', treeID: treeID.toString() }); 
  const tree = trees[0];

  const [loading, setLoading] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'info' | 'error'>('info');

  const handleCancel = async (currentTreeID: string) => {
    Alert.alert('Confirm Cancellation', 'Are you sure you want to cancel this pending tree?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            const db = getFirestore();
            await deleteDoc(doc(db, 'trees', currentTreeID));
            setNotificationMessage('Successfully cancelled.');
            setNotificationType('success');
            setNotificationVisible(true);
          } catch (error) {
            console.error(error);
            setNotificationMessage('Failed to cancel.');
            setNotificationType('error');
            setNotificationVisible(true);
          } finally {
            setLoading(false);
          };
        }
      },
    ]);
  }

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color='#2ecc71' /></View>;
  } 

  if (!tree) {
    return <View style={styles.center}><Text>Tree not found</Text></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <LoadingAlert visible={loading} message="Please wait..." />
        <NotificationAlert
          visible={notificationVisible}
          message={notificationMessage}
          type={notificationType}
          onClose={() => {
            setNotificationVisible(false);
            if (notificationType === 'success') {
              navigation.goBack();
            }
          }}
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
            <Text variant="titleLarge" style={styles.title}>{tree.treeID}</Text>
            <View style={styles.detailRow}>
              <MaterialIcons name="location-on" size={20} color="#2ecc71" />
              <Text style={styles.detailText}>{tree.city}, {tree.barangay}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="tag" size={20} color="#2ecc71" />
              <Text style={styles.detailText}>{tree.trackedBy}</Text>
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
                {tree.coordinates.latitude.toFixed(6)}, 
                {tree.coordinates.longitude.toFixed(6)}
              </Text>
            </View>
          </Card.Content>
        </Card>
        <View style={styles.buttonGroup}>
          <Button mode="contained" onPress={() => handleCancel(tree.treeID)} style={styles.button}>
            Cancel Submission
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  treeImage: {
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
  },
  imagePlaceholder: {
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsCard: {
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#fff',
  },
  title: {
    marginBottom: 20,
    color: '#2ecc71',
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  coordinateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  coordinateText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  button: {
    flex: 1,
    borderRadius: 25,
    backgroundColor: '#2ecc71',
  },
  updateButton: {
    backgroundColor: '#333', // Different color for update action
  },
  buttonLabel: {
    color: 'white',
    fontWeight: 'bold',
  },
});