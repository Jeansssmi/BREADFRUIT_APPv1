import React, { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// ✅ Correct import for react-native-firebase
import firestore from '@react-native-firebase/firestore';

export default function ResearcherDashboardScreen() {
  const navigation = useNavigation();
  const [allTrees, setAllTrees] = useState(0);
  const [harvestReady, setHarvestReady] = useState(0);
  const [scansLogged, setScansLogged] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllCounts = async () => {
    setRefreshing(true);
    try {
      // ✅ Correct syntax for react-native-firebase
      const allTreesSnap = await firestore().collection('trees').get();
      setAllTrees(allTreesSnap.size);

      const harvestSnap = await firestore().collection('trees').where("status", "==", "harvest-ready").get();
      setHarvestReady(harvestSnap.size);

      const scansSnap = await firestore().collection('scans').get();
      setScansLogged(scansSnap.size);

      const activitySnap = await firestore()
        .collection('activity')
        .orderBy("timestamp", "desc")
        .limit(5)
        .get();

      const activities = activitySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentActivity(activities);

    } catch (error) {
      console.error("Error fetching counts:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllCounts();
  }, []);
  // ✅ Icon mapping for activity types
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "create":
        return <MaterialCommunityIcons name="tree" size={20} color="#2ecc71" />;
      case "update":
        return <MaterialCommunityIcons name="pencil" size={20} color="#3498db" />;
      case "delete":
        return <MaterialCommunityIcons name="delete" size={20} color="#e74c3c" />;
      default:
        return <MaterialCommunityIcons name="information" size={20} color="#7f8c8d" />;
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAllCounts} />}
    >
      <Text variant="titleLarge" style={styles.title}>
        <MaterialCommunityIcons name="chart-box" size={24} color="#2ecc71" />{'  '}Breadfruit Analytics
      </Text>

      {/* --- Total Trees Card (Full Width) --- */}
      <Pressable onPress={() => navigation.navigate('Trees', { screen: 'TreeList' })}>
        <Card style={[styles.card, styles.primaryCard]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Total Trees Tracked</Text>
            <Text variant="displayMedium" style={styles.primaryStat}>{allTrees}</Text>
          </Card.Content>
        </Card>
      </Pressable>

      {/* --- Stats Grid (Two Columns) --- */}
      <View style={styles.statsGrid}>
        <View style={styles.statColumn}>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>Harvest Ready</Text>
              <Text variant="bodyLarge" style={styles.statText}>{harvestReady} trees ready</Text>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.statColumn}>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>Scans Logged</Text>
              <Text variant="bodyLarge" style={styles.statText}>{scansLogged} scans total</Text>
            </Card.Content>
          </Card>
        </View>
      </View>

      {/* --- ✅ Recent Activity Section (Box Style) --- */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Recent Activity</Text>
      {recentActivity.length === 0 ? (
        <Text style={styles.noActivity}>No recent activity found.</Text>
      ) : (
        recentActivity.map((item) => (
          <Card key={item.id} style={styles.card}>
            <Card.Content style={styles.activityRow}>
              <View style={styles.iconContainer}>{getActivityIcon(item.actionType)}</View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityText}>{item.description}</Text>
                <Text style={styles.activityMeta}>
                  {item.userRole} • {new Date(item.timestamp).toLocaleString()}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#ffffff' },
  title: { marginBottom: 20, fontWeight: 'bold' },
  card: { marginBottom: 15, borderRadius: 12, elevation: 2, backgroundColor: '#fff' },
  primaryCard: { borderLeftWidth: 4, borderLeftColor: '#2ecc71' },

  // Stats layout
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statColumn: { width: '48%' },

  // Text styles
  cardTitle: { color: '#2ecc71', fontWeight: '600', fontSize: 16 },
  primaryStat: { color: '#2ecc71', fontWeight: 'bold', fontSize: 36 },
  statText: { color: '#666', fontSize: 14 },

  // Recent activity
  sectionTitle: { marginTop: 20, marginBottom: 10, fontWeight: 'bold', fontSize: 18, color: '#333' },
  noActivity: { color: '#888', fontStyle: 'italic', textAlign: 'center' },
  activityRow: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { marginRight: 10 },
  activityText: { fontSize: 15, fontWeight: '500', color: '#333' },
  activityMeta: { fontSize: 12, color: '#777', marginTop: 4 },
});
