import React, { useState, useEffect, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Chip, FAB, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const TreeListItem = ({ tree, onPress }: { tree: any; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons name="tree" size={28} color="#2ecc71" />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.treeIdText}>{tree.treeID}</Text>

          <View style={styles.locationContainer}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#888" />
            <Text style={styles.locationText}>
              {tree.barangay ? `${tree.barangay}, ${tree.city}` : tree.city}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status:</Text>
            <Text
              style={[
                styles.statusValue,
                tree.status === 'verified'
                  ? { color: '#27ae60' }
                  : tree.status === 'harvest-ready'
                  ? { color: '#f1c40f' }
                  : tree.status === 'harvested'
                  ? { color: '#8e5b32' }
                  : { color: '#7f8c8d' },
              ]}
            >
              {tree.status.charAt(0).toUpperCase() + tree.status.slice(1).replace('-', ' ')}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  </TouchableOpacity>
);

export default function TreeListScreen() {
  const navigation = useNavigation<any>();
  const [trees, setTrees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'All' | 'verified' | 'harvest-ready' | 'harvested' | 'not-ready'>('All');

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('trees')
      .where('status', 'in', ['verified', 'harvest-ready', 'harvested', 'not-ready'])
      .onSnapshot(
        (querySnapshot) => {
          const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setTrees(data);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error fetching trees:', error);
          setIsLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  const filteredTrees = useMemo(() => {
    if (statusFilter === 'All') return trees;
    return trees.filter((tree) => tree.status === statusFilter);
  }, [trees, statusFilter]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🔹 Status Filter */}
      <View style={styles.filterContainer}>
        {(['All', 'verified', 'harvest-ready', 'harvested', 'not-ready'] as const).map((status) => (
          <Chip
            key={status}
            mode="outlined"
            selected={statusFilter === status}
            onPress={() => setStatusFilter(status)}
            style={[styles.filterChip, statusFilter === status && styles.activeFilterChip]}
            textStyle={[styles.filterText, statusFilter === status && styles.activeFilterText]}
          >
            {status === 'All'
              ? 'All'
              : status.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </Chip>
        ))}
      </View>

      {/* 🔹 Tree List */}
      <FlatList
        data={filteredTrees}
        keyExtractor={(item) => item.id || item.treeID}
        renderItem={({ item }) => (
          <TreeListItem
            tree={item}
            onPress={() =>
              navigation.navigate('Map', {
                treeID: item.id,
                lat: item.coordinates?.latitude,
                lng: item.coordinates?.longitude,
              })
            }
          />
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="magnify-close" size={40} color="#888" />
            <Text style={styles.emptyText}>No trees found for this filter.</Text>
          </View>
        }
      />

      {/* 🔹 Add Button */}
      <FAB icon="plus" style={styles.fab} color="white" onPress={() => navigation.navigate('AddTree')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  filterChip: { backgroundColor: '#fff', borderColor: '#ccc', margin: 4 },
  activeFilterChip: { backgroundColor: '#eafaf1', borderColor: '#2ecc71' },
  filterText: { color: '#555' },
  activeFilterText: { color: '#2ecc71', fontWeight: 'bold' },
  listContent: { padding: 12 },
  divider: { height: 8 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 50 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 16 },
  card: {
    borderRadius: 14,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eafaf1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContainer: { flex: 1 },
  treeIdText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  locationContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  locationText: { marginLeft: 4, color: '#666', fontSize: 13 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  statusLabel: { fontSize: 13, color: '#555', marginRight: 4 },
  statusValue: { fontSize: 13, fontWeight: 'bold' },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2ecc71',
    borderRadius: 28,
    elevation: 5,
  },
});
