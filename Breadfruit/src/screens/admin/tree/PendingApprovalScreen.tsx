import React, { useState, useEffect } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { LoadingAlert, NotificationAlert } from '@/components/NotificationModal';

export default function PendingApprovalScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { treeID } = route.params;

  const [tree, setTree] = useState<any>(null);
  const [trackedByName, setTrackedByName] = useState<string>('Unknown User');
  const [loading, setLoading] = useState(true);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] =
    useState<'success' | 'error' | 'info'>('info');

  // ✅ Real-time fetch of tree data
  useEffect(() => {
    const unsubscribe = firestore()
      .collection('trees')
      .doc(treeID)
      .onSnapshot(async (doc) => {
        if (doc.exists) {
          const treeData = { id: doc.id, ...doc.data() };
          setTree(treeData);

          // Fetch researcher name
          if (treeData.trackedById) {
            try {
              const userDoc = await firestore()
                .collection('users')
                .doc(treeData.trackedById)
                .get();
              if (userDoc.exists) {
                const userData = userDoc.data();
                setTrackedByName(userData?.name || 'Unknown User');
              } else {
                setTrackedByName('Unknown User');
              }
            } catch (err) {
              console.error('Error fetching user:', err);
              setTrackedByName('Unknown User');
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
    if (dateTracked.toDate) return dateTracked.toDate().toLocaleDateString();
    if (typeof dateTracked === 'string') {
      const parsed = new Date(dateTracked);
      return isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString();
    }
    return 'N/A';
  };

   // 🔔 Send notification to researcher (with type)
   const sendNotification = async (title: string, message: string, status?: string) => {
     try {
       if (!tree?.trackedById) return;

       // Automatically assign type based on status or title
       let notifType = "info";
       if (status === "rejected" || title.toLowerCase().includes("rejected")) {
         notifType = "rejected";
       } else if (status?.includes("approved") || title.toLowerCase().includes("approved")) {
         notifType = "approval";
       } else if (status === "harvest-ready") {
         notifType = "approval";
       }

       await firestore().collection("notification").add({
         type: notifType, // ✅ consistent type field
         title,
         message,
         recipientID: tree.trackedById,
         recipientRole: "Researcher",
         relatedTreeID: tree.treeID,
         read: false,
         seen: false,
         timestamp: firestore.FieldValue.serverTimestamp(),
       });
     } catch (error) {
       console.error("Error sending notification:", error);
     }
   };



  // ✅ Approve Tree
  const handleApprove = async () => {
    Alert.alert('Approve Tree', 'Are you sure you want to approve this tree?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          setLoading(true);
          try {
            const admin = auth().currentUser;
            const newStatus =
              tree.fruitStatus === 'ripe'
                ? 'harvest-ready'
                : tree.fruitStatus === 'unripe'
                ? 'not-ready'
                : 'verified';

            await firestore().collection('trees').doc(treeID).update({
              status: newStatus,
              approvedBy: admin?.displayName || 'Admin',
              approvedAt: firestore.FieldValue.serverTimestamp(),
            });

            // Log activity
            await firestore().collection('activityLog').add({
              treeID,
              action: 'Tree Approved',
              description: `${admin?.displayName || 'Admin'} approved tree ${tree.treeID} as "${newStatus}"`,
              userID: admin?.uid,
              timestamp: firestore.FieldValue.serverTimestamp(),
            });

        // ✅ Add to treeApproval collection before notification
                  await firestore().collection('treeApproval').add({
                    treeID: tree.treeID,
                    adminID: admin?.uid,
                    researcherID: tree.trackedById,
                    status: 'approved',
                    approvedStatus: newStatus,
                    timestamp: firestore.FieldValue.serverTimestamp(),
                  });

            // Send notification to researcher
            await sendNotification(
              'Tree Approved ✅',
              `Your tree ${tree.treeID || ''} has been approved as "${newStatus}".`,
              newStatus
            );

            setNotificationMessage('Tree approved successfully.');
            setNotificationType('success');
            setNotificationVisible(true);
          } catch (error) {
            console.error('Approval Error:', error);
            setNotificationMessage('Approval failed.');
            setNotificationType('error');
            setNotificationVisible(true);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // ❌ Reject Tree
  const handleReject = async () => {
    Alert.alert('Reject Tree', 'Are you sure you want to reject this tree?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            const admin = auth().currentUser;
            await firestore().collection('trees').doc(treeID).update({
              status: 'rejected',
              rejectedBy: admin?.displayName || 'Admin',
              rejectedAt: firestore.FieldValue.serverTimestamp(),
            });

            // Log activity
            await firestore().collection('activityLog').add({
              treeID,
              action: 'Tree Rejected',
              description: `${admin?.displayName || 'Admin'} rejected tree ${tree.treeID}.`,
              userID: admin?.uid,
              timestamp: firestore.FieldValue.serverTimestamp(),
            });

            // ✅ Add to treeRejected collection before sending notification
                  await firestore().collection('treeRejected').add({
                    treeID: tree.treeID,
                    adminID: admin?.uid,
                    researcherID: tree.trackedById,
                    status: 'rejected',
                    timestamp: firestore.FieldValue.serverTimestamp(),
                  });

            // Send notification to researcher
            await sendNotification(
              'Tree Rejected ',
              `Your submitted tree ${tree.treeID || ''} was rejected by the admin.`
            );

            setNotificationMessage('Tree rejected successfully.');
            setNotificationType('success');
            setNotificationVisible(true);
          } catch (error) {
            console.error('Rejection Error:', error);
            setNotificationMessage('Failed to reject tree.');
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
                {tree.city}, {tree.barangay}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="account" size={20} color="#2ecc71" />
              <Text style={styles.detailText}>{trackedByName}</Text>
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
                <Text style={styles.statValue}>{tree.fruitStatus}</Text>
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
                {safeToFixed(tree.coordinates?.latitude)}, {safeToFixed(tree.coordinates?.longitude)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.buttonGroup}>
          <Button
            mode="contained"
            style={[styles.button, { backgroundColor: '#2ecc71' }]}
            onPress={handleApprove}
          >
            Approve
          </Button>
          <Button
            mode="contained"
            style={[styles.button, { backgroundColor: '#e74c3c' }]}
            onPress={handleReject}
          >
            Reject
          </Button>
        </View>
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
  buttonGroup: { flexDirection: 'row', gap: 10, marginTop: 20 },
  button: { flex: 1, borderRadius: 25 },
});
