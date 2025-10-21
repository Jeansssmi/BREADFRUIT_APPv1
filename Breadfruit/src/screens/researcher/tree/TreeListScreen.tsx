import React, { useState, useEffect, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Chip, FAB, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '@/context/AuthContext';

const TreeListItem = ({ tree, onEdit, onViewMap }: { tree: any; onEdit: () => void; onViewMap: () => void }) => (
  <Card style={styles.card}>
    <Card.Content style={styles.cardContent}>
      <MaterialCommunityIcons name="tree-outline" size={28} color="#2ecc71" style={styles.icon} />
      <View style={styles.textContainer}>
        <Text style={styles.treeIdText}>{tree.treeID}</Text>
        <View style={styles.locationContainer}>
          <MaterialCommunityIcons name="map-marker" size={14} color="#666" />
          <Text style={styles.locationText}>
            {tree.barangay ? `${tree.barangay}, ${tree.city}` : tree.city}
          </Text>
        </View>
        <Text style={[styles.statusText, getStatusStyle(tree.status)]}>
          {tree.status ? tree.status.toUpperCase() : 'UNKNOWN'}
        </Text>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <MaterialCommunityIcons name="pencil" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapButton} onPress={onViewMap}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.buttonText}>Map</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card.Content>
  </Card>
);

function getStatusStyle(status: string) {
  switch (status?.toLowerCase()) {
    case 'verified':
      return { color: '#2ecc71', fontWeight: 'bold' };
    case 'harvest-ready':
      return { color: '#f1c40f', fontWeight: 'bold' };
    case 'harvested':
      return { color: '#8B4513', fontWeight: 'bold' };
    case 'not ready for harvest':
      return { color: '#e67e22', fontWeight: 'bold' };
    default:
      return { color: '#7f8c8d' };
  }
}

export default function TreeListScreen() {
  const navigation = useNavigation<any>();
  const { user: currentUser } = useAuth();
  const [trees, setTrees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'All' | 'Verified' | 'Harvest-ready' | 'Not-ready' | 'Harvested'>('All');

  useEffect(() => {
    if (!currentUser) return;
    const allowedStatuses = ['verified', 'harvest-ready', 'not-ready', 'harvested'];
    const unsubscribe = firestore()
      .collection('trees')
      .where('trackedById', '==', currentUser.uid)
      .where('status', 'in', allowedStatuses)
      .onSnapshot(
        snapshot => {
          const fetchedTrees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTrees(fetchedTrees);
          setIsLoading(false);
        },
        err => {
          console.error(err);
          setError('Failed to load trees');
          setIsLoading(false);
        }
      );
    return () => unsubscribe();
  }, [currentUser]);

  const filteredTrees = useMemo(() => {
    if (filter === 'All') return trees;
    if (filter === 'Harvest-ready') return trees.filter(t => t.status?.toLowerCase() === 'harvest-ready');
    if (filter === 'Verified') return trees.filter(t => t.status?.toLowerCase() === 'verified');
    if (filter === 'Harvested') return trees.filter(t => t.status?.toLowerCase() === 'harvested');
    if (filter === 'Not-ready') return trees.filter(t => t.status?.toLowerCase() === 'not-ready');
    return trees;
  }, [trees, filter]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {(['All', 'Verified', 'Harvest-ready', 'Not-ready', 'Harvested'] as const).map(f => (
          <Chip
            key={f}
            mode="outlined"
            selected={filter === f}
            onPress={() => setFilter(f)}
            style={[styles.filterChip, filter === f && styles.activeFilterChip]}
            textStyle={[styles.filterText, filter === f && styles.activeFilterText]}
          >
            {f}
          </Chip>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2ecc71" />
        </View>
      ) : (
        <FlatList
          data={filteredTrees}
          keyExtractor={item => item.id || item.treeID}
          renderItem={({ item }) => (
            <TreeListItem
              tree={item}
              onEdit={() => navigation.navigate('EditTree', { treeID: item.id })}
              onViewMap={() =>
                navigation.navigate('Map', {
                  lat: item.coordinates?.latitude,
                  lng: item.coordinates?.longitude,
                  treeID: item.id,
                })
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="magnify-close" size={40} color="#888" />
              <Text style={styles.emptyText}>No trees found for this filter.</Text>
            </View>
          }
        />
      )}

      <FAB icon="plus" style={styles.fab} color="white" onPress={() => navigation.navigate('AddTree')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#e74c3c', fontSize: 16 },
  filterContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: 10, flexWrap: 'wrap' },
  filterChip: { backgroundColor: '#fff', borderColor: '#ccc', marginVertical: 4 },
  activeFilterChip: { backgroundColor: '#eafaf1', borderColor: '#2ecc71' },
  filterText: { color: '#555' },
  activeFilterText: { color: '#2ecc71', fontWeight: 'bold' },
  listContent: { padding: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 50 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 16 },
  card: { marginBottom: 12, borderRadius: 14, backgroundColor: '#fff', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  cardContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  icon: { marginRight: 16 },
  textContainer: { flex: 1 },
  treeIdText: { fontSize: 16, fontWeight: 'bold', color: '#2ecc71' },
  locationContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  locationText: { marginLeft: 4, color: '#666', fontSize: 14 },
  statusText: { marginTop: 6, fontSize: 14 },
  buttonContainer: { flexDirection: 'row', marginTop: 10 },
  editButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#333', paddingVertical: 6, borderRadius: 8, marginRight: 8 },
  mapButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#2ecc71', paddingVertical: 6, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#2ecc71', borderRadius: 28 },
});
