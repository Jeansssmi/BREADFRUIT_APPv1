import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import firestore from '@react-native-firebase/firestore';

import { LoadingAlert, NotificationAlert } from '@/components/NotificationModal';
import { useTreeData } from '@/hooks/useTreeData';

export default function TreeDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { treeID } = route.params;
  const { trees, isLoading } = useTreeData({ mode: 'single', treeID: treeID.toString() });
  const tree = trees[0];

  const [loading, setLoading] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('info');

  // This helper function safely formats numbers or returns 'N/A'
  const safeToFixed = (value: any, digits = 2) =>
    typeof value === 'number' ? value.toFixed(digits) : 'N/A';

const handleDelete = async (currentTreeID: string) => {
  Alert.alert('Confirm Deletion', 'Are you sure you want to delete this tree?', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: async () => {
        setLoading(true);
        try {
          const treeRef = firestore().collection('trees').doc(currentTreeID);
          const treeDoc = await treeRef.get();

          if (!treeDoc.exists) {
            setNotificationMessage('Tree not found.');
            setNotificationType('error');
            setNotificationVisible(true);
            return;
          }

          const treeData = treeDoc.data();

          // 🧹 Delete the image in Firebase Storage (if it exists)
          if (treeData?.image) {
            try {
              const imageRef = storage().refFromURL(treeData.image);
              await imageRef.delete();
              console.log('Deleted image from storage.');
            } catch (err) {
              console.log('No image to delete or already deleted.');
            }
          }

          // 🧹 Delete the Firestore document
          await treeRef.delete();

          // ✅ Notify and auto-navigate back
          setNotificationMessage('Tree deleted successfully.');
          setNotificationType('success');
          setNotificationVisible(true);
        } catch (error) {
          console.error(error);
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


  const handleApprove = (currentTreeID: string) => {
    Alert.alert('Confirm Approve', 'Are you sure you want to approve this tree?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await firestore().collection('trees').doc(currentTreeID).update({ status: 'verified' });
            setNotificationMessage('Successfully approved!');
            setNotificationType('success');
            setNotificationVisible(true);
          } catch(error) {
            console.error(error);
          } finally {
            setLoading(false);
          }
        },
      },
    ])
  }

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2ecc71" /></View>;
  }
  if (!tree) {
    return <View style={styles.errorContainer}><Text>Tree not found</Text></View>;
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
            // After success, navigate back
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
                  {/* ✅ FIX: Used the safeToFixed helper to prevent crash */}
                  <Text style={styles.statValue}>{safeToFixed(tree.diameter)}m</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Tracked Date</Text>
                <Text style={styles.statValue}>
                  {tree.dateTracked?.toDate ? tree.dateTracked.toDate().toLocaleDateString() : 'N/A'}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Fruit Status</Text>
                <Text style={styles.statValue}>{tree.fruitStatus}</Text>
              </View>
            </View>
            <View style={styles.coordinateContainer}>
              <MaterialIcons name="map" size={20} color="#2ecc71" />
              {/* ✅ FIX: Also applied safeToFixed to coordinates for robustness */}
              <Text style={styles.coordinateText}>
                {safeToFixed(tree.coordinates?.latitude, 6)}, {safeToFixed(tree.coordinates?.longitude, 6)}
              </Text>
            </View>
          </Card.Content>
        </Card>
        {tree.status === 'pending' ? (
          <View style={styles.buttonGroup}>
            <Button mode="contained" style={styles.button} onPress={() => handleApprove(tree.treeID)}>Approve</Button>
            <Button mode="contained" onPress={() => handleDelete(tree.treeID)} style={[styles.button, styles.updateButton]}>
              Reject
            </Button>
          </View>
        ) : (
          <View style={styles.buttonGroup}>
            <Button
              mode="contained"
              style={styles.button}
              onPress={() => navigation.navigate('EditTree', { treeID: tree.treeID })}
            >
              Update Details
            </Button>
            <Button mode="contained" onPress={() => handleDelete(tree.treeID)} style={[styles.button, styles.updateButton]}>
              Delete
            </Button>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1, padding: 16, backgroundColor: '#ffffff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
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
  button: { flex: 1, borderRadius: 25, backgroundColor: '#2ecc71' },
  updateButton: { backgroundColor: '#333' },
  buttonLabel: { color: 'white', fontWeight: 'bold' },
});