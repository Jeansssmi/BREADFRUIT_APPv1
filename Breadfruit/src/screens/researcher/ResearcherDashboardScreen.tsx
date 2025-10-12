import React, { useEffect, useState, useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Card, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';

export default function ResearcherDashboardScreen() {
  const navigation = useNavigation<any>();
  const [allTrees, setAllTrees] = useState(0);
  const [harvestReady, setHarvestReady] = useState(0);
  const [recentActivityCount, setRecentActivityCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllCounts = useCallback(async () => {
    setRefreshing(true);
    try {
      const treesCollection = firestore().collection('trees');
      const allTreesSnap = await treesCollection.where('status', '==', 'verified').get();
      setAllTrees(allTreesSnap.size);
      const harvestSnap = await treesCollection.where("status", "==", "harvest-ready").get();
      setHarvestReady(harvestSnap.size);
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const activitySnap = await firestore()
        .collection('activity')
        .where('actionType', '==', 'create')
        .where('timestamp', '>=', oneDayAgo)
        .get();
      setRecentActivityCount(activitySnap.size);
    } catch (error) {
      console.error("Error fetching counts:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchAllCounts);
    return unsubscribe;
  }, [navigation, fetchAllCounts]);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbarHeader}>
        <Appbar.Content title="Dashboard" titleStyle={styles.appbarTitle} />
        <Appbar.Action icon="bell-outline" color="black" onPress={() => { /* Navigate to notifications */ }} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAllCounts} />}
      >
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons name="chart-bar" size={20} color="#2ecc71" />
          <Text style={styles.mainTitle}>Breadfruit Analytics</Text>
        </View>

         {/* ✅ FIX: Navigate directly to the 'TrackedTrees' screen by name */}
                <Pressable onPress={() => navigation.navigate('TreeList')}>
                  <Card style={[styles.card, styles.primaryCard]}>
                    <Card.Content style={styles.cardContentRow}>
                      <MaterialCommunityIcons name="tree" size={18} color="#2ecc71" />
                      <Text style={styles.cardTitle}>Total Trees Tracked</Text>
                    </Card.Content>
                    <Card.Content>
                      <Text style={styles.largeStat}>{allTrees}</Text>
                    </Card.Content>
                  </Card>
                </Pressable>


        <Card style={styles.card}>
          <Card.Content style={styles.cardContentRow}>
            <MaterialCommunityIcons name="fruit-cherries" size={18} color="#2ecc71" />
            <Text style={styles.cardTitle}>Harvest Ready</Text>
          </Card.Content>
          <Card.Content>
            <Text style={styles.smallStat}>{harvestReady} trees ready</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContentRow}>
            <MaterialCommunityIcons name="clock-time-three-outline" size={18} color="#2ecc71" />
            <Text style={styles.cardTitle}>Recent Activity</Text>
          </Card.Content>
          <Card.Content>
            <Text style={styles.smallStat}>{recentActivityCount} new trees today</Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa'
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
  scrollContent: {
    padding: 16
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  primaryCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#2ecc71',
  },
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  cardTitle: {
    color: '#2ecc71',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  largeStat: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginTop: 8,
  },
  smallStat: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
});