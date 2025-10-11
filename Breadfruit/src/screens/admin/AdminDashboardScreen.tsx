import React, { useEffect, useState, useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// ✅ Correct import for react-native-firebase
import firestore from '@react-native-firebase/firestore';

export default function AdminDashboardScreen() {
  const navigation = useNavigation();
  const [allTrees, setAllTrees] = useState(0);
  const [allUsers, setAllUsers] = useState(0);
  const [researchers, setResearchers] = useState(0);
  const [pendingUsers, setPendingUsers] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllCounts = useCallback(async () => {
    setRefreshing(true);
    try {
      // ✅ Correct syntax for react-native-firebase
      const treesSnap = await firestore().collection('trees').get();
      setAllTrees(treesSnap.size);

      const usersSnap = await firestore().collection('users').get();
      setAllUsers(usersSnap.size);

      const researcherSnap = await firestore().collection('users').where("role", "==", "researcher").get();
      setResearchers(researcherSnap.size);

      const pendingSnap = await firestore().collection('users').where("status", "==", "pending").get();
      setPendingUsers(pendingSnap.size);

    } catch (error) {
      console.error("Error fetching counts: ", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllCounts();
  }, [fetchAllCounts]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAllCounts} />}
    >
     <Text variant="titleLarge" style={styles.title}>
             <MaterialCommunityIcons name="forest" size={24} color="#2ecc71" />{'  '}Admin Dashboard
           </Text>

      <View style={styles.gridContainer}>

        {/* Trees tracked */}
        <Pressable
          style={styles.gridItem}
          onPress={() => navigation.navigate('Trees', { screen: 'TreeList' })}
        >
          <Card style={[styles.card, styles.primaryCard]}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                <MaterialCommunityIcons name="forest" size={20} color="#2ecc71" />{'  '}Trees Tracked
              </Text>
              <Text variant="displayMedium" style={styles.primaryStat}>{allTrees}</Text>
            </Card.Content>
          </Card>
        </Pressable>

        {/* All users */}
        <Pressable
          style={styles.gridItem}
          onPress={() => navigation.navigate('Accounts', { screen: 'UserList' })}
        >
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                <MaterialCommunityIcons name="account-group" size={20} color="#2ecc71" />{'  '}All Users
              </Text>
              <Text variant="displayMedium" style={styles.primaryStat}>{allUsers}</Text>
            </Card.Content>
          </Card>
        </Pressable>

        {/* Researchers */}
        <Pressable
          style={styles.gridItem}
          onPress={() => navigation.navigate('Accounts', { screen: 'UserList', params: { filter: 'researcher' } })}
        >
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                <MaterialCommunityIcons name="account" size={20} color="#2ecc71" />{'  '}Researchers
              </Text>
              <Text variant="displayMedium" style={styles.primaryStat}>{researchers}</Text>
            </Card.Content>
          </Card>
        </Pressable>

        {/* Pending approvals */}
        <Pressable
          style={styles.gridItem}
          onPress={() => navigation.navigate('Accounts', { screen: 'PendingUsers' })}
        >
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                <MaterialCommunityIcons name="account-clock" size={20} color="#2ecc71" />{'  '}Pending Approvals
              </Text>
              <Text variant="displayMedium" style={styles.primaryStat}>{pendingUsers}</Text>
            </Card.Content>
          </Card>
        </Pressable>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#ffffff' },
  title: { marginBottom: 20, fontWeight: 'bold' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', marginBottom: 15 },
  card: { borderRadius: 12, elevation: 2 },
  primaryCard: { borderLeftWidth: 4, borderLeftColor: '#2ecc71' },
  cardTitle: { color: '#2ecc71', fontWeight: '600' },
  primaryStat: { color: '#2ecc71', fontWeight: 'bold' },
});
