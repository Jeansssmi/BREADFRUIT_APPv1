import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Card, FAB, Text ,Appbar} from 'react-native-paper';
import { useNavigation , useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';

export default function TreeManagementScreen() {
  const navigation = useNavigation();
  const [allTrees, setAllTrees] = useState(0);
  const [pendings, setPendings] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllCounts = async () => {
    setRefreshing(true);
    try {
      const verifiedSnap = await firestore()
        .collection('trees')
        .where('status', '==', 'verified')
        .get();
      setAllTrees(verifiedSnap.size);

      const pendingSnap = await firestore()
        .collection('trees')
        .where('status', '==', 'pending')
        .get();
      setPendings(pendingSnap.size);
    } catch (error) {
      console.error('Error fetching tree counts:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAllCounts(); }, []);
  useFocusEffect(useCallback(() => { fetchAllCounts(); }, []));

  const cards = [
    { title: "Trees Tracked", value: allTrees, icon: "tree", onPress: () => navigation.navigate('TreeList'), highlight: true },
    { title: "Pending Approvals", value: pendings, icon: "clock-outline", onPress: () => navigation.navigate('PendingTrees'), highlight: false },
  ];

  return (
    <View style={styles.screen}>
      <Appbar.Header style={styles.appbarHeader}>
        <Appbar.Content title="Trees" titleStyle={styles.appbarTitle} />
        <Appbar.Action icon="magnify" onPress={() => navigation.navigate('Search')} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAllCounts} />}
      >
        <Text style={styles.sectionTitle}>
          <MaterialCommunityIcons name="forest" size={22} color="#2ecc71" />{'  '}
          Tree Management
        </Text>

        <View style={styles.cardRow}>
          {cards.map((card, index) => (
            <Pressable
              key={card.title}
              onPress={card.onPress}
              style={({ pressed, hovered }) => [
                styles.cardWrapper,
                (pressed || hovered) && {
                  transform: [{ scale: 0.97 }],
                  shadowOpacity: 0.25,
                  elevation: 6,
                },
              ]}
              android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
            >
              <Card style={[styles.card, card.highlight && styles.highlightCard]}>
                <Card.Content style={styles.cardContent}>
                  <View style={styles.iconRow}>
                    <MaterialCommunityIcons name={card.icon} size={24} color="#2ecc71" />
                    <Text style={styles.cardTitle}>{card.title}</Text>
                  </View>
                  <Text style={styles.cardNumber}>{card.value}</Text>
                </Card.Content>
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        color="white"
        style={styles.fab}
        onPress={() => navigation.navigate('AddTree')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff' },
  container: { paddingHorizontal: 16, paddingTop: 30, paddingBottom: 100 },
  sectionTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cardWrapper: { width: '48%' },
  card: {
    borderRadius: 12,
    elevation: 3,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  highlightCard: { borderLeftWidth: 3, borderLeftColor: '#2ecc71' },
  cardContent: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  iconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#2ecc71', marginLeft: 8 },
  cardNumber: { fontSize: 40, fontWeight: 'bold', color: '#333', textAlign: 'center', marginTop: 8 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#2ecc71', borderRadius: 28 },
  appbarHeader: { backgroundColor: '#fff', elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: '#eee' },
  appbarTitle: { color: '#000', fontWeight: 'bold', fontSize: 20 },
});
