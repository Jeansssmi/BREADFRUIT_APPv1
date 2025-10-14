import React, { useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { ActivityIndicator, Appbar, Card, Text, Chip } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';

import { LoadingAlert, NotificationAlert } from '@/components/NotificationModal';
import { useUserData } from '@/hooks/useUserData';

export default function UserDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  // @ts-ignore
  const { userID } = route.params;
  const { users, isLoading } = useUserData({ mode: 'single', uid: userID.toString() });
  const [loading, setLoading] = useState(false);
  const user = users[0];

  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'info' | 'error'>('info');

  const handleDelete = (uid: string) => {
    Alert.alert('Confirm Reject/Delete', 'Are you sure you want to reject and delete this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            const deleteUser = functions().httpsCallable('deleteUser');
            await deleteUser({ uid });
            setNotificationMessage('User deleted successfully.');
            setNotificationType('success');
            setNotificationVisible(true);
          } catch (error) {
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
      {
        text: 'Approve',
        onPress: async () => {
          setLoading(true);
          try {
            const docRef = firestore().collection('users').doc(uid);
            await docRef.update({ status: 'verified' });
            setNotificationMessage('Successfully approved!');
            setNotificationType('success');
            setNotificationVisible(true);
          } catch (error) {
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
    <View style={styles.container}>


      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <LoadingAlert visible={loading} message="Please wait..." />
        <NotificationAlert
          visible={notificationVisible} message={notificationMessage} type={notificationType}
          onClose={() => {
            setNotificationVisible(false);
            if (notificationType === 'success') navigation.goBack();
          }}
        />

        <View style={styles.profileSection}>
            <View style={styles.avatarCircle}>
                {user?.image ? (
                    <Image source={{ uri: user.image }} style={styles.avatarImage} />
                ) : (
                    <MaterialCommunityIcons name="account" size={60} color="#2ecc71" />
                )}
            </View>
            <Text style={styles.userName}>{user?.name}</Text>
            <Chip style={styles.roleChip} textStyle={styles.roleChipText}>{user?.role}</Chip>
        </View>

        <Card style={styles.detailsCard}>
          <Card.Content>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="email-outline" size={24} color="#2ecc71" />
              <Text style={styles.detailText}>{user?.email}</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="account-cog-outline" size={24} color="#2ecc71" />
              <Text style={styles.detailText}>{user?.role}</Text>
            </View>

            {/* ✅ Make "Tracked Trees" tappable */}
              <TouchableOpacity
                style={styles.detailItem}
                onPress={() => navigation.navigate("TrackedTreesScreen", { userID: user.uid })}
                       >
                <MaterialCommunityIcons name="tree-outline" size={24} color="#2ecc71" />
                <Text style={[styles.detailText, { color: "#2ecc71", fontWeight: "bold" }]}>
                           View Tracked Trees
                 </Text>
                 </TouchableOpacity>

            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={24} color="#2ecc71" />
              <Text style={styles.detailText}>
                {user.status === 'pending' ? 'Requested:' : 'Joined:'} {user.joined?.toDate ? user.joined.toDate().toLocaleDateString() : new Date(user.joined).toLocaleDateString()}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <View style={styles.buttonContainer}>
        {user.status === 'pending' ? (
          <>
            <TouchableOpacity style={[styles.button, styles.approveButton]} onPress={() => handleApprove(userID.toString())}>
              <Text style={styles.buttonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={() => handleDelete(userID.toString())}>
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={[styles.button, styles.approveButton]} onPress={() => navigation.navigate('EditUser', { userID: user.uid })}>
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={() => handleDelete(userID.toString())}>
              <Text style={styles.buttonText}>Delete User</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fa' },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  appbarHeader: { backgroundColor: '#f7f8fa', elevation: 0 },
  appbarTitle: { color: '#333', fontWeight: 'bold', fontSize: 18 },

  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eafaf1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2ecc71',
    marginBottom: 16,
    marginTop: 20,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,

  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  roleChip: {
    backgroundColor: '#2ecc71',
    marginTop: 8,
  },
  roleChipText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
  },

  detailsCard: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  // ✅ Styles for the detail items are now more compressed
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,      // Reduced vertical padding
    paddingHorizontal: 16,
    gap: 12,                  // Reduced gap between icon and text
  },
  detailText: {
    fontSize: 15,             // Slightly smaller font size
    color: '#333',
    textTransform: 'capitalize',
  },

  buttonContainer: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#f7f8fa',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  button: {
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    elevation: 2,
  },
  approveButton: {
    backgroundColor: '#2ecc71',
  },
  rejectButton: {
    backgroundColor: '#333',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});