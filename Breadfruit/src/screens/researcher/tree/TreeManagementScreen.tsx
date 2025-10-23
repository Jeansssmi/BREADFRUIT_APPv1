import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, FAB, Text, Appbar, useTheme } from 'react-native-paper'; // ✅ useTheme added
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export default function TreeManagementScreen() {
  const navigation = useNavigation<any>();
  const theme = useTheme(); // ✅ Access global theme

  const [allTrees, setAllTrees] = useState(0);
  const [pendings, setPendings] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const currentUser = auth().currentUser;
  const trackedStatuses = ['verified', 'harvest-ready', 'not-ready', 'harvested'];

  const fetchAllCounts = async () => {
    if (!currentUser) return;
    setRefreshing(true);
    try {
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

  // ✅ Real-time updates
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeVerified = firestore()
      .collection('trees')
      .where('trackedById', '==', currentUser.uid)
      .where('status', '==', 'verified')
      .onSnapshot((snap) => setAllTrees(snap?.size ?? 0));

    const unsubscribePending = firestore()
      .collection('trees')
      .where('trackedById', '==', currentUser.uid)
      .where('status', '==', 'pending')
      .onSnapshot((snap) => setPendings(snap.size));

    return () => {
      unsubscribeVerified();
      unsubscribePending();
    };
  }, [currentUser]);

  useEffect(() => {
    fetchAllCounts();
  }, [currentUser]);

  useFocusEffect(
    useCallback(() => {
      fetchAllCounts();
    }, [])
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header
        style={[
          styles.appbarHeader,
          { backgroundColor: theme.colors.card, borderBottomColor: theme.dark ? '#333' : '#eee' },
        ]}
      >
        <Appbar.Content
          title="Trees"
          titleStyle={[styles.appbarTitle, { color: theme.colors.text }]}
        />
        <Appbar.Action
          icon="magnify"
          color={theme.colors.text}
          onPress={() => navigation.navigate('Search')}
        />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAllCounts} />}
      >
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons
            name="forest"
            size={20}
            color={theme.colors.primary}
            style={{ textShadowColor: theme.colors.primary, textShadowRadius: 4 }}
          />
          <Text style={[styles.mainTitle, { color: theme.colors.text }]}>Tree Management</Text>
        </View>

        <View style={styles.gridContainer}>
          <Pressable style={styles.gridItem} onPress={() => navigation.navigate('TreeList')}>
            <Card
              style={[
                styles.card,
                { backgroundColor: theme.colors.card, borderLeftColor: theme.colors.primary },
              ]}
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="forest" size={20} color={theme.colors.primary} />
                  <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
                    Trees Tracked
                  </Text>
                </View>
                <Text style={[styles.cardValue, { color: theme.colors.text }]}>{allTrees}</Text>
              </Card.Content>
            </Card>
          </Pressable>

          <Pressable style={styles.gridItem} onPress={() => navigation.navigate('PendingTrees')}>
            <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons
                    name="clock-time-three-outline"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
                    Pending Approvals
                  </Text>
                </View>
                <Text style={[styles.cardValue, { color: theme.colors.text }]}>{pendings}</Text>
              </Card.Content>
            </Card>
          </Pressable>
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="white"
        onPress={() => navigation.navigate('AddTree')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  appbarHeader: { elevation: 0, shadowOpacity: 0, borderBottomWidth: 1 },
  appbarTitle: { fontWeight: 'bold', fontSize: 20 },
  titleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  mainTitle: { fontSize: 24, fontWeight: 'bold', marginLeft: 8 },
  gridContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  gridItem: { width: '48%' },
  card: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    minHeight: 140,
    justifyContent: 'center',
    borderLeftWidth: 5,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontWeight: '600', marginLeft: 8 },
  cardValue: { fontWeight: 'bold', fontSize: 40, textAlign: 'center', marginTop: 8 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, borderRadius: 28 },
});
