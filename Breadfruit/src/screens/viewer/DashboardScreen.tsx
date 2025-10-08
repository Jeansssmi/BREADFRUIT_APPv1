import { useNavigation } from '@react-navigation/native';
import { collection, getCountFromServer, getFirestore, query, where } from "firebase/firestore";
import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [allTrees, setAllTrees] = useState(0);
  const [harvestReady, setHarvestReady] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const db = getFirestore();

  const fetchAllCounts = async () => {
    setRefreshing(true);
    try {
      // Example fetch logic (replace with your actual Firestore queries)
      const totalQuery = query(collection(db, "trees"));
      const totalSnap = await getCountFromServer(totalQuery);
      setAllTrees(totalSnap.data().count);

      const harvestQuery = query(collection(db, "trees"), where("status", "==", "harvest_ready"));
      const harvestSnap = await getCountFromServer(harvestQuery);
      setHarvestReady(harvestSnap.data().count);
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAllCounts();
  }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAllCounts} />}
    >
      <Text style={styles.title}>
        <MaterialCommunityIcons name="chart-box" size={24} color="#2ecc71" />{' '}Breadfruit Analytics
      </Text>

      <Pressable onPress={() => navigation.navigate('TreeList')}>
        <View style={[styles.card, styles.primaryCard]}>
          <Text style={styles.cardTitle}>
            <MaterialCommunityIcons name="tree" size={16} color="#2ecc71" />{' '}Total Trees Tracked
          </Text>
          <Text style={styles.primaryStat}>{allTrees}</Text>
        </View>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          <MaterialCommunityIcons name="fruit-pineapple" size={16} color="#2ecc71" />{' '}Harvest Ready
        </Text>
        <Text style={styles.statText}>{harvestReady} trees ready</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          <MaterialCommunityIcons name="clock" size={16} color="#2ecc71" />{' '}Recent Activity
        </Text>
        <Text style={styles.statText}>5 new trees today</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#ffffff' },
  title: { marginBottom: 20, color: '#333', fontWeight: 'bold', fontSize: 22 },
  card: { marginBottom: 15, borderRadius: 12, elevation: 2, backgroundColor: '#ffffff', padding: 15 },
  primaryCard: { borderLeftWidth: 4, borderLeftColor: '#2ecc71' },
  cardTitle: { color: '#2ecc71', marginBottom: 12, fontWeight: '600', fontSize: 16 },
  primaryStat: { color: '#2ecc71', fontWeight: 'bold', fontSize: 20 },
  statText: { color: '#666', fontSize: 16 },
});
