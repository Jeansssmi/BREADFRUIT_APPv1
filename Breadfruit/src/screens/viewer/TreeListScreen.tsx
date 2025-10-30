import React, { useState, useEffect, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Chip, FAB, Text, useTheme } from 'react-native-paper'; // ✅ Added useTheme
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const TreeListItem = ({ tree, onPress }) => {
  const theme = useTheme(); // ✅ use theme for card and text colors

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Card.Content style={styles.cardContent}>
          <View style={[styles.iconWrapper, { backgroundColor: theme.dark ? '#1e1e1e' : '#eafaf1' }]}>
            <MaterialCommunityIcons name="tree" size={28} color={theme.colors.primary} />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.treeIdText, { color: theme.colors.text }]}>{tree.treeID}</Text>

            <View style={styles.locationContainer}>
              <MaterialCommunityIcons
                name="map-marker"
                size={14}
                color={theme.dark ? '#aaa' : '#888'}
              />
              <Text style={[styles.locationText, { color: theme.colors.text }]}>
                {tree.barangay ? `${tree.barangay}, ${tree.city}` : tree.city}
              </Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: theme.dark ? '#bbb' : '#555' }]}>
                Status:
              </Text>
              <Text
                style={[
                  styles.statusValue,
                  tree.status === 'verified'
                    ? { color: '#27ae60' }
                    : tree.status === 'harvest-ready'
                    ? { color: '#f1c40f' }
                    : tree.status === 'harvested'
                    ? { color: '#8e5b32' }
                    : { color: theme.dark ? '#bbb' : '#7f8c8d' },
                ]}
              >
                {tree.status.charAt(0).toUpperCase() +
                  tree.status.slice(1).replace('-', ' ')}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

export default function TreeListScreen() {
  const navigation = useNavigation();
  const theme = useTheme(); // ✅ access global theme
  const [trees, setTrees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

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
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 🔹 Status Filter */}
      <View
        style={[
          styles.filterContainer,
          {
            backgroundColor: theme.colors.card,
            borderBottomColor: theme.dark ? '#333' : '#e0e0e0',
          },
        ]}
      >
        {['All', 'verified', 'harvest-ready', 'harvested', 'not-ready'].map((status) => (
          <Chip
            key={status}
            mode="outlined"
            selected={statusFilter === status}
            onPress={() => setStatusFilter(status)}
            style={[
              styles.filterChip,
              {
                borderColor: theme.colors.primary,
                backgroundColor:
                  statusFilter === status
                    ? theme.colors.primary
                    : theme.colors.background,
              },
            ]}
            textStyle={{
              color:
                statusFilter === status
                  ? '#fff'
                  : theme.colors.primary,
              fontWeight: statusFilter === status ? 'bold' : 'normal',
            }}
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


    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  filterChip: { margin: 4, borderWidth: 1 },
  listContent: { padding: 12 },
  divider: { height: 8 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 50 },
  emptyText: { fontSize: 16, marginTop: 16 },
  card: {
    borderRadius: 14,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContainer: { flex: 1 },
  treeIdText: { fontSize: 16, fontWeight: 'bold' },
  locationContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  locationText: { marginLeft: 4, fontSize: 13 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  statusLabel: { fontSize: 13, marginRight: 4 },
  statusValue: { fontSize: 13, fontWeight: 'bold' },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    elevation: 5,
  },
});
