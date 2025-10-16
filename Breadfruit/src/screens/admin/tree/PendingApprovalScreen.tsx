import { LoadingAlert, NotificationAlert } from '@/components/NotificationModal';
import { useTreeData } from '@/hooks/useTreeData';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '@/context/AuthContext'; // Import useAuth to check user role

export default function PendingDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user: currentUser } = useAuth(); // Get current user
  const { treeID } = route.params;

  const { trees, isLoading, error } = useTreeData({ mode: 'single', treeID });
  const tree = trees[0];

  const [loading, setLoading] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'info' | 'error'>('info');
  const [trackerName, setTrackerName] = useState('Loading...');

  useEffect(() => {
    if (tree?.trackedBy) {
      const fetchTrackerName = async () => {
        try {
          const userDoc = await firestore().collection('users').doc(tree.trackedBy).get();
          setTrackerName(userDoc.exists ? userDoc.data()?.name : 'Unknown User');
        } catch (e) {
          setTrackerName('N/A');
        }
      };
      fetchTrackerName();
    } else if (tree) {
      setTrackerName('N/A');
    }
  }, [tree]);

const handleApprove = async () => {
  Alert.alert("Approve Tree", "Are you sure you want to approve this tree submission?", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Approve",
      onPress: async () => {
        setLoading(true);
        try {
          await firestore().collection("trees").doc(treeID).update({
            status: "verified",
            verifiedAt: firestore.FieldValue.serverTimestamp(),
          });

          // ✅ Show success message, then navigate to Map
          setNotificationMessage("Tree approved successfully!");
          setNotificationType("success");
          setNotificationVisible(true);

          setTimeout(() => {
            navigation.navigate("Map"); // ✅ go to Map screen after success
          }, 1000);
        } catch (error) {
          console.error("Approve error:", error);
          setNotificationMessage("Failed to approve tree.");
          setNotificationType("error");
          setNotificationVisible(true);
        } finally {
          setLoading(false);
        }
      },
    },
  ]);
};


  const handleCancelOrReject = async () => {
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
            await firestore().collection('trees').doc(treeID).delete();
            // In a full app, you might add a notification for the researcher here.
            setNotificationMessage('Submission removed successfully.');
            setNotificationType('success');
            setNotificationVisible(true);
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
    return <View style={styles.center}><ActivityIndicator size="large" color="#2ecc71" /></View>;
  }

  if (error || !tree) {
    return <View style={styles.center}><Text>Tree not found.</Text></View>;
  }

  const isAdmin = currentUser?.role === 'admin';
  const isOwner = currentUser?.uid === tree.trackedBy;

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
          <Image source={{ uri: tree.image }} style={styles.treeImage} />
        ) : (
          <View style={[styles.treeImage, styles.imagePlaceholder]}>
            <MaterialIcons name="no-photography" size={40} color="#666" />
          </View>
        )}

        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.title}>{tree.treeID || 'N/A'}</Text>
            <View style={styles.detailRow}>
              <MaterialIcons name="location-on" size={20} color="#2ecc71" />
              <Text style={styles.detailText}>{tree.city ? `${tree.city}${tree.barangay ? `, ${tree.barangay}` : ''}` : 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="account" size={20} color="#2ecc71" />
              <Text style={styles.detailText}>{trackerName}</Text>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Diameter</Text>
                <Text style={styles.statValue}>{typeof tree.diameter === 'number' ? `${tree.diameter.toFixed(2)}m` : 'N/A'}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Fruit Status</Text>
                <Text style={styles.statValue}>{tree.fruitStatus && tree.fruitStatus !== 'none' ? tree.fruitStatus : 'N/A'}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Tracked Date</Text>
                <Text style={styles.statValue}>{tree.dateTracked?.toDate ? tree.dateTracked.toDate().toLocaleDateString() : 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.coordinateContainer}>
              <MaterialIcons name="map" size={20} color="#2ecc71" />
              <Text style={styles.coordinateText}>{typeof tree.coordinates?.latitude === 'number' && typeof tree.coordinates?.longitude === 'number' ? `${tree.coordinates.latitude.toFixed(6)}, ${tree.coordinates.longitude.toFixed(6)}` : 'N/A'}</Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.buttonGroup}>
          {isAdmin ? (
            <>
              <Button mode="contained" style={[styles.button, styles.approveButton]} onPress={handleApprove}>Approve</Button>
              <Button mode="contained" style={[styles.button, styles.rejectButton]} onPress={handleCancelOrReject}>Reject</Button>
            </>
          ) : isOwner ? (
            <Button mode="contained" style={[styles.button, styles.rejectButton]} onPress={handleCancelOrReject}>Cancel Submission</Button>
          ) : null}
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
  buttonGroup: { flexDirection: 'row', gap: 10, marginTop: 20 },
  button: { flex: 1, borderRadius: 25, justifyContent: 'center' },
  approveButton: { backgroundColor: '#2ecc71' },
  rejectButton: { backgroundColor: '#e74c3c' },
});