import React, { useState, useEffect, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Chip, FAB, Text, useTheme } from 'react-native-paper'; // ✅ useTheme added
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useRoute } from '@react-navigation/native';

const TreeListItem = ({ tree, onEdit, onViewMap }: { tree: any; onEdit: () => void; onViewMap: () => void }) => {
  const theme = useTheme(); // ✅ make card react to theme
  return (
    <Card
      style={[
        styles.card,
        { backgroundColor: theme.colors.card, shadowColor: theme.dark ? '#000' : '#000' },
      ]}
    >
      <Card.Content style={styles.cardContent}>
        <MaterialCommunityIcons
          name="tree-outline"
          size={28}
          color={theme.colors.primary}
          style={styles.icon}
        />
        <View style={styles.textContainer}>
          <Text style={[styles.treeIdText, { color: theme.colors.primary }]}>{tree.treeID}</Text>
          <View style={styles.locationContainer}>
            <MaterialCommunityIcons
              name="map-marker"
              size={14}
              color={theme.dark ? '#aaa' : '#666'}
            />
            <Text
              style={[styles.locationText, { color: theme.dark ? '#ccc' : '#666' }]}
            >
              {tree.barangay ? `${tree.barangay}, ${tree.city}` : tree.city}
            </Text>
          </View>
          <Text
            style={[
              styles.statusText,
              getStatusStyle(tree.status),
              { color: theme.dark ? getStatusStyle(tree.status).color : getStatusStyle(tree.status).color },
            ]}
          >
            {tree.status ? tree.status.toUpperCase() : 'UNKNOWN'}
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.editButton} onPress={onEdit}>
              <MaterialCommunityIcons
                name="pencil"
                size={16}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapButton} onPress={onViewMap}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={16}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.buttonText}>Map</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

function getStatusStyle(status: string) {
  switch (status?.toLowerCase()) {
    case 'verified':
      return { color: '#2ecc71', fontWeight: 'bold' };
    case 'harvest-ready':
      return { color: '#f1c40f', fontWeight: 'bold' };
    case 'harvested':
      return { color: '#8B4513', fontWeight: 'bold' };
    case 'not ready for harvest':
    case 'not-ready':
      return { color: '#e67e22', fontWeight: 'bold' };
    default:
      return { color: '#7f8c8d' };
  }
}

export default function TreeListScreen() {
   const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user: currentUser } = useAuth();
  const theme = useTheme(); // ✅ theme context

  const [trees, setTrees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<
    'All' | 'Verified' | 'Harvest-ready' | 'Not-ready' | 'Harvested'
  >('All');
 const treeIDParam = route.params?.treeID || null;

 useEffect(() => {
   if (!currentUser) return;
   const allowedStatuses = ['verified', 'harvest-ready', 'not-ready', 'harvested'];

   let query = firestore()
     .collection('trees')
     .where('trackedById', '==', currentUser.uid)
     .where('status', 'in', allowedStatuses);

   // ✅ If a specific treeID was passed, only fetch that one
   if (treeIDParam) {
     query = firestore().collection('trees').where('treeID', '==', treeIDParam);
   }

   const unsubscribe = query.onSnapshot(
     (snapshot) => {
       const fetchedTrees = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
       setTrees(fetchedTrees);
       setIsLoading(false);
     },
     (err) => {
       console.error(err);
       setError('Failed to load trees');
       setIsLoading(false);
     }
   );
   return () => unsubscribe();
 }, [currentUser, treeIDParam]);


  const filteredTrees = useMemo(() => {
    if (filter === 'All') return trees;
    if (filter === 'Harvest-ready')
      return trees.filter((t) => t.status?.toLowerCase() === 'harvest-ready');
    if (filter === 'Verified')
      return trees.filter((t) => t.status?.toLowerCase() === 'verified');
    if (filter === 'Harvested')
      return trees.filter((t) => t.status?.toLowerCase() === 'harvested');
    if (filter === 'Not-ready')
      return trees.filter((t) => t.status?.toLowerCase() === 'not-ready');
    return trees;
  }, [trees, filter]);

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.filterContainer}>
        {(['All', 'Verified', 'Harvest-ready', 'Not-ready', 'Harvested'] as const).map((f) => (
          <Chip
            key={f}
            mode="outlined"
            selected={filter === f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  filter === f
                    ? theme.dark
                      ? '#2f4f3f'
                      : '#eafaf1'
                    : theme.colors.card,
                borderColor:
                  filter === f
                    ? theme.colors.primary
                    : theme.dark
                    ? '#444'
                    : '#ccc',
              },
            ]}
            textStyle={[
              styles.filterText,
              {
                color:
                  filter === f
                    ? theme.colors.primary
                    : theme.dark
                    ? '#bbb'
                    : '#555',
                fontWeight: filter === f ? 'bold' : 'normal',
              },
            ]}
          >
            {f}
          </Chip>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTrees}
          keyExtractor={(item) => item.id || item.treeID}
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
              <MaterialCommunityIcons
                name="magnify-close"
                size={40}
                color={theme.dark ? '#aaa' : '#888'}
              />
              <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                No trees found for this filter.
              </Text>
            </View>
          }
        />
      )}

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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16 },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    flexWrap: 'wrap',
  },
  filterChip: { marginVertical: 4 },
  listContent: { padding: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 50 },
  emptyText: { fontSize: 16, marginTop: 16 },
  card: {
    marginBottom: 12,
    borderRadius: 14,
    elevation: 4,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  icon: { marginRight: 16 },
  textContainer: { flex: 1 },
  treeIdText: { fontSize: 16, fontWeight: 'bold' },
  locationContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  locationText: { marginLeft: 4, fontSize: 14 },
  statusText: { marginTop: 6, fontSize: 14 },
  buttonContainer: { flexDirection: 'row', marginTop: 10 },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  mapButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2ecc71',
    paddingVertical: 6,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, borderRadius: 28 },
});
