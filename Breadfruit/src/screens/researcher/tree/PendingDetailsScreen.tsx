import React, { useState, useEffect } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import { LoadingAlert, NotificationAlert } from '@/components/NotificationModal';
import { useTreeData } from '@/hooks/useTreeData';
// ✅ 1. Import the useAuth hook to get the current user
import { useAuth } from '@/context/AuthContext';

export default function PendingDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const treeID = route.params?.treeID;

  // ✅ 2. Get the current user from your authentication context
  const { user: currentUser } = useAuth();

  const { trees, isLoading, error } = useTreeData({ mode: 'single', treeID });
  const tree = trees[0];

  const [loading, setLoading] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<
    'success' | 'info' | 'error'
  >('info');

  // This function will now work correctly because `currentUser` is defined.
const handleCancel = () => {
  const isOwner = currentUser?.uid === tree?.trackedBy;
  const alertTitle = isOwner ? 'Confirm Cancellation' : 'Confirm Rejection';
  const alertMessage = isOwner
    ? 'Are you sure you want to cancel this submission?'
    : 'Are you sure you want to reject this tree? This cannot be undone.';
  const buttonText = isOwner ? 'Yes, Cancel' : 'Yes, Reject';

  Alert.alert(alertTitle, alertMessage, [
    { text: 'No', style: 'cancel' },
    {
      text: buttonText,
      style: 'destructive',
      onPress: async () => {
        setLoading(true);
        try {
          // 🔥 Delete the tree document
          await firestore().collection('trees').doc(treeID).delete();

          // ✅ Show success notification
          setNotificationMessage('Tree submission canceled successfully.');
          setNotificationType('success');
          setNotificationVisible(true);

          // Wait for the notification to display before navigation
          setTimeout(() => {
            setNotificationVisible(false);
            navigation.navigate('PendingTrees', { refresh: true });
          }, 1200);
        } catch (e) {
          console.error(e);
          setNotificationMessage('Operation failed.');
          setNotificationType('error');
          setNotificationVisible(true);
        } finally {
          setLoading(false);
        }
      },
    },
  ]);
};


  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  if (error || !tree) {
    return (
      <View style={styles.center}>
        <Text>Tree not found.</Text>
      </View>
    );
  }

  // --- The rest of your JSX and styles remain unchanged ---
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
          <Image
            source={{ uri: tree.image }}
            style={styles.treeImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.treeImage, styles.imagePlaceholder]}>
            <MaterialIcons name="no-photography" size={40} color="#666" />
          </View>
        )}
        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.title}>
              {tree.treeID}
            </Text>
            <View style={styles.detailRow}>
              <MaterialIcons name="location-on" size={20} color="#2ecc71" />
              <Text style={styles.detailText}>
                {tree.city || 'Unknown City'}, {tree.barangay || 'Unknown Barangay'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="tag" size={20} color="#2ecc71" />
              <Text style={styles.detailText}>{tree.trackedBy || 'Unknown'}</Text>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Diameter</Text>
                <Text style={styles.statValue}>
                  {tree.diameter ? `${Number(tree.diameter).toFixed(2)} m` : 'N/A'}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Tracked Date</Text>
                <Text style={styles.statValue}>
                  {tree.dateTracked?.toDate ? tree.dateTracked.toDate().toLocaleDateString() : 'N/A'}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Fruit Status</Text>
                <Text style={styles.statValue}>
                  {tree.fruitStatus || 'Unknown'}
                </Text>
              </View>
            </View>
            <View style={styles.coordinateContainer}>
              <MaterialIcons name="map" size={20} color="#2ecc71" />
              <Text style={styles.coordinateText}>
                {tree.coordinates?.latitude?.toFixed
                  ? `${tree.coordinates.latitude.toFixed(6)}, ${tree.coordinates.longitude.toFixed(6)}`
                  : 'No coordinates'}
              </Text>
            </View>
          </Card.Content>
        </Card>
        <View style={styles.buttonGroup}>
          <Button
            mode="contained"
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            Cancel Submission
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
  title: { marginBottom: 20, color: '#2ecc71', fontWeight: 'bold' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  detailText: { fontSize: 16, color: '#333' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 16, gap: 12 },
  statItem: { flex: 1, alignItems: 'center', padding: 12, backgroundColor: '#f9f9f9', borderRadius: 8 },
  statLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '600', color: '#333' },
  coordinateContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  coordinateText: { fontSize: 14, color: '#666', fontFamily: 'monospace' },
  buttonGroup: { flexDirection: 'row', marginTop: 20 },
  cancelButton: { flex: 1, borderRadius: 25, backgroundColor: '#e74c3c' },
});