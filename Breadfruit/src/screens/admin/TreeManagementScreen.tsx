import { useNavigation } from '@react-navigation/native';
import { collection, getCountFromServer, getFirestore, query, where } from "firebase/firestore";
import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, FAB, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function TreeManagementScreen() {
  const navigation = useNavigation();
  const [allTrees, setAllTrees] = useState(0);
  const [pendings, setPendings] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const db = getFirestore();

  const fetchAllCounts = async () => {
    try {
      // Count ALL trees
      const allTreesSnap = await getCountFromServer(collection(db, "trees"));
      setAllTrees(allTreesSnap.data().count);

      // Count Pending Trees (status = pending)
      const pendingQuery = query(collection(db, "trees"), where("status", "==", "pending"));
      const pendingSnap = await getCountFromServer(pendingQuery);
      setPendings(pendingSnap.data().count);

    } catch (error) {
      console.error("Error fetching tree counts:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllCounts();
  }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAllCounts} />}
    >
      <Text variant="titleLarge" style={styles.title}>
        <MaterialCommunityIcons name="forest" size={24} color="#2ecc71" />{'  '}Tree Management
      </Text>
      <View style={styles.gridContainer}>
        <Pressable style={styles.gridItem} onPress={() => navigation.navigate('TreeList')}>
          <Card style={[styles.card, styles.primaryCard]}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>Trees Tracked</Text>
              <Text variant="displayMedium" style={styles.primaryStat}>{allTrees}</Text>
            </Card.Content>
          </Card>
        </Pressable>
        <Pressable style={styles.gridItem} onPress={() => navigation.navigate('PendingTrees')}>
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
        onPress={() => navigation.navigate('AddTree')}
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
