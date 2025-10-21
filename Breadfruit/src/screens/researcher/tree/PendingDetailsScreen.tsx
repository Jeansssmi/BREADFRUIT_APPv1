import React, { useState, useEffect } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { LoadingAlert, NotificationAlert } from '@/components/NotificationModal';

export default function PendingDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { treeID } = route.params;

  const [tree, setTree] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('info');

  const getTreeStatus = (fruitStatus: string) => {
    switch (fruitStatus?.toLowerCase()) {
      case 'ripe':
        return 'harvest-ready';
      case 'none':
        return 'verified';
      case 'unripe':
        return 'not-ready';
      default:
        return 'pending';
    }
  };

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('trees')
      .doc(treeID)
      .onSnapshot(async (doc) => {
        if (doc.exists) {
          const data = { id: doc.id, ...doc.data() };
          setTree(data);

          const correctStatus = getTreeStatus(data.fruitStatus);
          if (data.status !== correctStatus) {
            try {
              await firestore().collection('trees').doc(treeID).update({
                status: correctStatus,
              });
              console.log(`Tree status updated to ${correctStatus}`);
            } catch (err) {
              console.warn('Auto status update failed:', err);
            }
          }
        }
        setLoading(false);
      });

    return () => unsubscribe();
  }, [treeID]);

  const safeToFixed = (value: any, digits = 6) =>
    typeof value === 'number' ? value.toFixed(digits) : 'N/A';

  const formatTrackedDate = (dateTracked: any) => {
    if (!dateTracked) return 'N/A';
    if (dateTracked.toDate) {
      return dateTracked.toDate().toLocaleDateString();
    }
    if (typeof dateTracked === 'string') {
      const parsed = new Date(dateTracked);
      return isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString();
    }
    return 'N/A';
  };

 const notifyAdminsOnCancel = async (userName: string, treeID: string) => {
    try {
      const adminsSnap = await firestore()
        .collection('users')
        .where('role', '==', 'admin')
        .get();

      if (!adminsSnap.empty) {
        const batch = firestore().batch();
        const now = new Date().toISOString();

        adminsSnap.forEach((adminDoc) => {
          const notifRef = firestore().collection('notification').doc();
          batch.set(notifRef, {
            title: 'Tree Submission Cancelled ❗',
            message: `${userName} cancelled their tree submission (${treeID}).`,
            recipientID: adminDoc.id,
            recipientRole: 'Admin',
            relatedTreeID: treeID,
            timestamp: now,
            read: false,
          });
        });

        await batch.commit();
        console.log('✅ Admins notified of cancellation.');
      }
    } catch (error) {
      console.error('Error notifying admins:', error);
    }
  };

  const handleCancelSubmission = () => {
    Alert.alert('Cancel Submission', 'Are you sure you want to cancel this submission?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            const user = firestore().collection('users').doc(auth().currentUser.uid);
            const userDoc = await user.get();
            const userName = userDoc.exists ? userDoc.data().name || 'Unknown User' : 'Unknown User';

            await firestore().collection('trees').doc(treeID).update({
              status: 'cancelled',
            });

            await firestore().collection('activityLog').add({
              treeID,
              action: 'Cancelled Submission',
              description: `Tree submission was cancelled by ${userName}.`,
              userID: auth().currentUser.uid,
              userName,
              timestamp: firestore.FieldValue.serverTimestamp(),
            });

            setNotificationMessage('Submission cancelled successfully.');
            setNotificationType('success');
            setNotificationVisible(true);
          } catch (error) {
            console.error('Cancel submission error:', error);
            setNotificationMessage('Failed to cancel submission.');
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
        <Text>No tree data found.</Text>
      </View>
    );
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
            if (notificationType === 'success') navigation.goBack();
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
            <Text variant="titleLarge" style={styles.title}>
              {tree.treeID}
            </Text>

            <View style={styles.detailRow}>
              <MaterialIcons name="location-on" size={20} color="#2ecc71" />
              <Text style={styles.detailText}>
                {tree.city}, {tree.barangay}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="tag" size={20} color="#2ecc71" />
              <Text style={styles.detailText}>{tree.trackedBy || 'Unknown User'}</Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Diameter</Text>
                <Text style={styles.statValue}>
                  {tree.diameter?.toFixed(2) || 'N/A'} m
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Fruit Status</Text>
                <Text style={styles.statValue}>{tree.fruitStatus || 'N/A'}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Tracked Date</Text>
                <Text style={styles.statValue}>
                  {formatTrackedDate(tree.dateTracked)}
                </Text>
              </View>
            </View>

            <View style={styles.coordinateContainer}>
              <MaterialIcons name="map" size={20} color="#2ecc71" />
              <Text style={styles.coordinateText}>
                {safeToFixed(tree.coordinates?.latitude)},{' '}
                {safeToFixed(tree.coordinates?.longitude)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleCancelSubmission}
          style={[styles.button, { backgroundColor: '#e74c3c' }]}
        >
          Cancel Submission
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
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
  button: { borderRadius: 25, marginTop: 20 },
});
