import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, FAB, Text } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// ✅ Correct import for react-native-firebase
import firestore from '@react-native-firebase/firestore';

export default function TreeManagementScreen() {
  const navigation = useNavigation();
  const [allTrees, setAllTrees] = useState(0);
  const [pendings, setPendings] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllCounts = async () => {
    setRefreshing(true);
    try {
      // ✅ Correct syntax for react-native-firebase (replaces getCountFromServer)
      const allTreesSnap = await firestore().collection("trees").get();
      setAllTrees(allTreesSnap.size);

      const pendingSnap = await firestore().collection("trees").where("status", "==", "pending").get();
      setPendings(pendingSnap.size);

    } catch (error) {
      console.error("Error fetching tree counts:", error);
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
      {/* Title Row */}
      <View style={styles.titleRow}>
        <MaterialIcons name="forest" size={24} color="#2ecc71" />
        <Text style={styles.title}>Tree Management</Text>
      </View>

      {/* Cards Grid */}
      <View style={styles.gridContainer}>
        // Inside TreeManagementScreen.tsx
        // This navigates to the list of VERIFIED trees (TreeListScreen)
        <Pressable style={styles.gridItem} onPress={() => navigation.navigate('TreeList')}>
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <MaterialIcons name="forest" size={30} color="#2ecc71" />
              <Text style={[styles.cardLabel, { color: '#2ecc71' }]}>Trees Tracked</Text>
              <Text style={styles.cardValue}>{allTrees}</Text>
            </Card.Content>
          </Card>
        </Pressable>
        // This navigates to the list of PENDING trees
        <Pressable style={styles.gridItem} onPress={() => navigation.navigate('PendingTrees')}>
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <MaterialIcons name="access-time" size={30} color="#f79a00" />
              <Text style={[styles.cardLabel, { color: '#f79a00' }]}>Pending Approvals</Text>
              <Text style={styles.cardValue}>{pendings}</Text>
            </Card.Content>
          </Card>
        </Pressable>
      </View>

      {/* Floating Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        color="white"
        onPress={() => navigation.navigate('AddTree')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
    color: '#222',
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
  },
  card: {
    borderRadius: 12,
    backgroundColor: '#fff',
    minHeight: 120,

    // ✅ Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,

    // ✅ Elevation for Android
    elevation: 3,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2ecc71',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2ecc71',
  },
});
