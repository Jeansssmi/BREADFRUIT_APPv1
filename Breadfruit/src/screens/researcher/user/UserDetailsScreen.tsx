import { LoadingAlert, NotificationAlert } from '@/components/NotificationModal';
import { functions } from '@/firebaseConfig';
import { useUserData } from '@/hooks/useUserData';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, getFirestore, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function UserDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userID } = route.params;
  const { users, isLoading } = useUserData({ mode: 'single', uid: userID.toString() }); 
  const [loading, setLoading] = useState(false);
  const user = users[0];

  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'info' | 'error'>('info');

  const handleDelete = (uid: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this user?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive',
        onPress: async () => {
          const deleteUser = httpsCallable(functions, 'deleteUser');
          setLoading(true);
          try {
            await deleteUser({ uid });
            setNotificationMessage('User deleted successfully.');
            setNotificationType('success');
            setNotificationVisible(true);
          } catch(error) {
            console.error(error);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }

  const handleApprove = (uid: string) => {
    Alert.alert('Confirm Approval', 'Are you sure you want to approve this user?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve',
        onPress: async () => {
          setLoading(true);
          try {
            const db = getFirestore();
            const docRef = doc(db, 'users', uid);
            await updateDoc(docRef, { status: 'verified' });
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
    ]);
  }

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color='#2ecc71' /></View>;
  }
  if (!user) {
    return <View style={styles.center}><Text>User not found</Text></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <LoadingAlert visible={loading} message="Please wait..." />
        <NotificationAlert
          visible={notificationVisible} message={notificationMessage} type={notificationType}
          onClose={() => {
            setNotificationVisible(false);
            if (notificationType === 'success') navigation.goBack();
          }}
        />
        <View style={styles.avatarContainer}>
          {user?.image ? <Image source={{ uri: user.image }} style={styles.avatar} /> : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <MaterialCommunityIcons name="account" size={40} color="#666" />
            </View>
          )}
          <Text variant="titleLarge" style={styles.title}>{user?.name}</Text>
          <Text style={styles.roleBadge}>{user?.role?.toUpperCase()}</Text>
        </View>
        <Card style={styles.detailsCard}>
          <Card.Content>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="email" size={20} color="#2ecc71" /><Text style={styles.detailText}>{user?.email}</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="calendar" size={20} color="#2ecc71" />
              <Text style={styles.detailText}>{user.status === 'pending' ? 'Requested:' : 'Joined:'} {new Date(user.joined).toLocaleDateString()}</Text>
            </View>
          </Card.Content>
        </Card>
        {user.status === 'pending' ? (
          <View style={styles.buttonGroup}>
            <Button mode="contained" style={styles.button} onPress={() => handleApprove(userID.toString())}>Approve</Button>
            <Button mode="contained" style={[styles.button, styles.deleteButton]} onPress={() => handleDelete(userID.toString())}>Reject</Button>
          </View>
        ) : (
          <View style={styles.buttonGroup}>
            <Button mode="contained" style={styles.button} onPress={() => navigation.navigate('EditUser', { userID: user.uid })}>Edit Profile</Button>
            <Button mode="contained" style={[styles.button, styles.deleteButton]} onPress={() => handleDelete(userID.toString())}>Delete User</Button>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1, padding: 20, backgroundColor: '#ffffff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarContainer: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 16 },
  avatarPlaceholder: { backgroundColor: '#f0faf3', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  roleBadge: { backgroundColor: '#2ecc71', color: 'white', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, fontSize: 12, fontWeight: 'bold' },
  detailsCard: { borderRadius: 12, marginBottom: 24, elevation: 2 },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  detailText: { fontSize: 16, color: '#333' },
  buttonGroup: { gap: 12, marginTop: 16 },
  button: { borderRadius: 25, backgroundColor: '#2ecc71' },
  deleteButton: { backgroundColor: '#333' },
});