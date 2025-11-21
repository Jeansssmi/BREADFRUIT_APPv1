import React, { useState, useEffect, useMemo, useLayoutEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { Card, Chip, FAB, Text, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Appbar } from 'react-native-paper';

const TreeListItem = ({ tree, onMapPress }) => {
  const theme = useTheme();

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
      <Card.Content style={styles.cardContent}>
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: theme.dark ? '#1e1e1e' : '#eafaf1' },
          ]}
        >
          <MaterialCommunityIcons
            name="tree"
            size={28}
            color={theme.colors.primary}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.treeIdText, { color: theme.colors.text }]}>
            {tree.treeID}
          </Text>

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
            <Text
              style={[styles.statusLabel, { color: theme.dark ? '#bbb' : '#555' }]}
            >
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

        {/* MAP BUTTON ONLY */}
        <TouchableOpacity
          onPress={onMapPress}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: theme.colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: 10,
          }}
        >
          <MaterialCommunityIcons name="map-marker" size={22} color="#fff" />
        </TouchableOpacity>
      </Card.Content>
    </Card>
  );
};

export default function TreeListScreen() {
  const navigation = useNavigation();
  const theme = useTheme();

  const [trees, setTrees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState("asc");

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('trees')
      .where('status', 'in', ['verified', 'harvest-ready', 'harvested', 'not-ready'])
      .onSnapshot(
        (querySnapshot) => {
          const data = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
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
    let data =
      statusFilter === "All"
        ? [...trees]
        : trees.filter((tree) => tree.status === statusFilter);

    data.sort((a, b) => {
      if (sortOrder === "asc") return a.treeID.localeCompare(b.treeID);
      return b.treeID.localeCompare(a.treeID);
    });

    return data;
  }, [trees, statusFilter, sortOrder]);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

      {/* APPBAR */}
      <Appbar.Header mode="small" statusBarHeight={0}>
        <Appbar.Content title="Tree List" />

        <Appbar.Action
          icon="sort-ascending"
          color={sortOrder === "asc" ? theme.colors.primary : undefined}
          onPress={() => setSortOrder("asc")}
        />

        <Appbar.Action
          icon="sort-descending"
          color={sortOrder === "desc" ? theme.colors.primary : undefined}
          onPress={() => setSortOrder("desc")}
        />
      </Appbar.Header>

      {/* FILTER BAR FIXED */}
      <View
        style={[
          styles.filterWrapper,
          { backgroundColor: theme.colors.card } // DARK MODE FIX
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {['All', 'verified', 'harvest-ready', 'harvested', 'not-ready'].map(
            (status) => (
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
                        : theme.colors.card,
                  },
                ]}
                textStyle={{
                  color:
                    statusFilter === status ? '#fff' : theme.colors.primary,
                  fontWeight: statusFilter === status ? 'bold' : 'normal',
                }}
              >
                {status === 'All'
                  ? 'All'
                  : status.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </Chip>
            )
          )}
        </ScrollView>
      </View>

      {/* TREE LIST */}
      <FlatList
        data={filteredTrees}
        keyExtractor={(item) => item.id || item.treeID}
        renderItem={({ item }) => (
          <TreeListItem
            tree={item}
            onMapPress={() =>
              navigation.navigate("Map", {
                focusTree: {
                  treeID: item.treeID,
                  latitude: item.coordinates?.latitude,
                  longitude: item.coordinates?.longitude,
                  zoomIn: true,
                },
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  filterWrapper: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingVertical: 8,
    elevation: 4,
  },

  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  filterChip: {
    marginHorizontal: 6,
    borderWidth: 1,
  },

  listContent: {
    padding: 12,
    paddingTop: 60,
  },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
  },

  emptyText: { fontSize: 16, marginTop: 16 },

  card: {
    borderRadius: 14,
    elevation: 3,
    marginBottom: 10,
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

  locationContainer: { flexDirection: 'row', marginTop: 4 },
  locationText: { marginLeft: 4, fontSize: 13 },

  statusRow: { flexDirection: 'row', marginTop: 6 },
  statusLabel: { fontSize: 13, marginRight: 4 },
  statusValue: { fontSize: 13, fontWeight: 'bold' },
});
