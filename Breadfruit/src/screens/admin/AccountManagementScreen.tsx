import React, { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, FAB, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';

export default function AccountManagementScreen() {
  const navigation = useNavigation<any>();
  const [allUsers, setAllUsers] = useState(0);
  const [researchers, setResearchers] = useState(0);
  const [pendings, setPendings] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllCounts = async () => {
    setRefreshing(true);
    try {
      const usersCollection = firestore().collection("users");
      const allUsersSnap = await usersCollection.get();
      setAllUsers(allUsersSnap.size);
      const researcherSnap = await usersCollection.where("role", "==", "researcher").get();
      setResearchers(researcherSnap.size);
      const pendingSnap = await usersCollection.where("status", "==", "pending").get();
      setPendings(pendingSnap.size);
    } catch (error) {
      console.error("Error fetching user counts:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAllCounts();
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAllCounts} />}
    >
      <Text variant="titleLarge" style={styles.title}>
        <MaterialCommunityIcons name="account-group" size={24} color="#2ecc71" />{'  '}Account Management
      </Text>
      <View style={styles.gridContainer}>
        {/* ✅ FIX: Correct navigation calls */}
        <Pressable style={styles.gridItem} onPress={() => navigation.navigate('UserList', { filter: 'researcher' })}>
          <Card style={[styles.card, styles.primaryCard]}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>Researchers</Text>
              <Text variant="displayMedium" style={styles.primaryStat}>{researchers}</Text>
            </Card.Content>
          </Card>
        </Pressable>
        <Pressable style={styles.gridItem} onPress={() => navigation.navigate('UserList')}>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>All Users</Text>
              <Text variant="displayMedium" style={styles.primaryStat}>{allUsers}</Text>
            </Card.Content>
          </Card>
        </Pressable>
        <Pressable style={styles.gridItem} onPress={() => navigation.navigate('PendingUsers')}>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>Pending Approvals</Text>
              <Text variant="displayMedium" style={styles.primaryStat}>{pendings}</Text>
            </Card.Content>
          </Card>
        </Pressable>
      </View>
      <FAB
        icon="plus" style={styles.fab} color="white"
        onPress={() => navigation.navigate('AddUser')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#ffffff' },
  title: { marginBottom: 20, fontWeight: 'bold' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', marginBottom: 15 },
  card: { borderRadius: 12, elevation: 2, minHeight: 120 },
  primaryCard: { borderLeftWidth: 4, borderLeftColor: '#2ecc71' },
  cardTitle: { color: '#2ecc71', fontWeight: '600' },
  primaryStat: { color: '#2ecc71', fontWeight: 'bold' },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#2ecc71', borderRadius: 50 },
});