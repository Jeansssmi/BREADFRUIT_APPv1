import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, FAB, Text, Appbar } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth'; // ✅ Added for current user

export default function TreeManagementScreen() {
  const navigation = useNavigation<any>();
  const [allTrees, setAllTrees] = useState(0);
  const [pendings, setPendings] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const currentUser = auth().currentUser;
  const trackedStatuses = ['verified', 'harvest-ready', 'not-ready', 'harvested'];
  const fetchAllCounts = async () => {
    if (!currentUser) return;
    setRefreshing(true);
    try {
      // ✅ Only count trees tracked by this user (trackedByID)
      const verifiedSnap = await firestore()
        .collection('trees')
        .where('trackedById', '==', currentUser.uid)
        .where('status', 'in', trackedStatuses)
        .get();
      setAllTrees(verifiedSnap.size);

      const pendingSnap = await firestore()
        .collection('trees')
        .where('trackedById', '==', currentUser.uid)
        .where('status', '==', 'pending')
        .get();
      setPendings(pendingSnap.size);
    } catch (error) {
      console.error('Error fetching tree counts:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // ✅ Real-time updates for this user's verified and pending trees
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeVerified = firestore()
      .collection('trees')
      .where('trackedById', '==', currentUser.uid)
      .where('status', '==', 'verified')
      .onSnapshot(snap => setAllTrees(snap?.size ?? 0));

    const unsubscribePending = firestore()
      .collection('trees')
      .where('trackedById', '==', currentUser.uid)
      .where('status', '==', 'pending')
      .onSnapshot(snap => setPendings(snap.size));

    return () => {
      unsubscribeVerified();
      unsubscribePending();
    };
  }, [currentUser]);

  // ✅ Initial load
  useEffect(() => {
    fetchAllCounts();
  }, [currentUser]);

  // ✅ Refresh when returning to this screen
  useFocusEffect(
    useCallback(() => {
      fetchAllCounts();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbarHeader}>
        <Appbar.Content title="Trees" titleStyle={styles.appbarTitle} />
        <Appbar.Action icon="magnify" onPress={() => navigation.navigate('Search')} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAllCounts} />}
      >
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons
            name="forest"
            size={20}
            color="#2ecc71"
            style={{ textShadowColor: '#27ae60', textShadowRadius: 4 }}
          />
          <Text style={styles.mainTitle}>Tree Management</Text>
        </View>

        <View style={styles.gridContainer}>
          <Pressable style={styles.gridItem} onPress={() => navigation.navigate('TreeList')}>
            <Card style={[styles.card, styles.primaryCard]}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="forest" size={20} color="#2ecc71" />
                  <Text style={styles.cardTitle}>Trees Tracked</Text>
                </View>
                <Text style={styles.cardValue}>{allTrees}</Text>
              </Card.Content>
            </Card>
          </Pressable>

          <Pressable style={styles.gridItem} onPress={() => navigation.navigate('PendingTrees')}>
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="clock-time-three-outline" size={20} color="#2ecc71" />
                  <Text style={styles.cardTitle}>Pending Approvals</Text>
                </View>
                <Text style={styles.cardValue}>{pendings}</Text>
              </Card.Content>
            </Card>
          </Pressable>
        </View>
      </ScrollView>

      <FAB icon="plus" style={styles.fab} color="white" onPress={() => navigation.navigate('AddTree')} />
    </View>
  );
}

// ✅ Keep your same styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  scrollContent: {
    padding: 20,
  },
  appbarHeader: {
    backgroundColor: '#fff',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  appbarTitle: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    minHeight: 140,
    justifyContent: 'center',
  },
  primaryCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#2ecc71',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    color: '#333',
    fontWeight: '600',
    marginLeft: 8,
  },
  cardValue: {
    color: '#2ecc71',
    fontWeight: 'bold',
    fontSize: 40,
    textAlign: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2ecc71',
    borderRadius: 28,
  },
});
