import React, { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, FAB, Text, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';

export default function AccountManagementScreen() {
  const navigation = useNavigation<any>();
  const [allUsers, setAllUsers] = useState(0);
  const [researchers, setResearchers] = useState(0);
  const [pendings, setPendings] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // --- LOGIC (UNCHANGED) ---
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

  if (refreshing && allUsers === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  const cards = [
    { title: "Researchers", value: researchers, icon: "account-tie", onPress: () => navigation.navigate('UserList', { filter: 'researcher' }) },
    { title: "All Users", value: allUsers, icon: "account-group", onPress: () => navigation.navigate('UserList') },
    { title: "Pending Approvals", value: pendings, icon: "account-clock", onPress: () => navigation.navigate('PendingUsers') },
  ];

  return (
    <View style={styles.screen}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>
          <MaterialCommunityIcons name="account-group" size={24} color="#2c3e50" />{' '}
          Account Management
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAllCounts} />}
      >
        <View style={styles.gridContainer}>
          {cards.map((card, index) => (
            <Pressable
              key={card.title}
              onPress={card.onPress}
              style={({ pressed }) => [
                styles.gridItem,
                pressed && {
                  transform: [{ scale: 0.97 }],
                  shadowOpacity: 0.3,
                  elevation: 6,
                },
              ]}
            >
              <Card style={[styles.card, index === 0 && styles.primaryCard]}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name={card.icon} size={24} color="#2ecc71" />
                    <Text style={styles.cardTitle}>{card.title}</Text>
                  </View>
                  <Text style={styles.statNumber}>{card.value}</Text>
                </Card.Content>
              </Card>
            </Pressable>
          ))}

        </View>
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        color="white"
        onPress={() => navigation.navigate('AddUser')}
      />
    </View>
  );
}

// --- DESIGN (UPDATED TO MATCH IMAGE) ---
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  container: {
    padding: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: 16,
  },
  card: {
     borderRadius: 12,
         elevation: 3,
         backgroundColor: '#fff',
         shadowColor: '#000',
         shadowOpacity: 0.1,
         shadowRadius: 2,
         shadowOffset: { width: 0, height: 1 },
  },
  primaryCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#2ecc71',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    color: '#2ecc71',
    marginLeft: 8,
    fontWeight: '600',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '333',
    textAlign: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 20,
    right: 0,
    bottom: 0,
    backgroundColor: '#2ecc71',
    borderRadius: 28,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});