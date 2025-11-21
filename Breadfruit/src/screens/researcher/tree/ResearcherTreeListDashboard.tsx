import React, { useState, useEffect, useMemo, useLayoutEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView
} from 'react-native';
import { Card, Chip, Text, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Appbar } from 'react-native-paper';


// ----------------------
//  Tree Item Component
// ----------------------
const TreeListItem = ({ tree, onMapPress }) => {
  const theme = useTheme();

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
      <Card.Content style={styles.cardContent}>

        {/* Left Icon */}
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: theme.dark ? '#1e1e1e' : '#eafaf1' }
          ]}
        >
          <MaterialCommunityIcons
            name="tree-outline"
            size={28}
            color={theme.colors.primary}
          />
        </View>

        {/* Text Section */}
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
                  : { color: theme.dark ? '#bbb' : '#7f8c8d' }
              ]}
            >
              {tree.status.charAt(0).toUpperCase() +
                tree.status.slice(1).replace('-', ' ')}
            </Text>
          </View>
        </View>

        {/* 🌲 TREE BUTTON */}
        <TouchableOpacity
          onPress={onMapPress}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: theme.colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: 10
          }}
        >
          <MaterialCommunityIcons name="pine-tree" size={22} color="#fff" />
        </TouchableOpacity>

      </Card.Content>
    </Card>
  );
};




export default function ResearcherTreeListDashboard() {
  const navigation = useNavigation();
  const theme = useTheme();

  const [trees, setTrees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('asc');

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('trees')
      .where('status', 'in', ['verified', 'harvest-ready', 'harvested', 'not-ready'])
      .onSnapshot(
        snap => {
          const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTrees(data);
          setIsLoading(false);
        },
        err => {
          console.error(err);
          setIsLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  const filteredTrees = useMemo(() => {
    let data =
      statusFilter === 'All'
        ? [...trees]
        : trees.filter(tree => tree.status === statusFilter);

    data.sort((a, b) =>
      sortOrder === 'asc'
        ? a.treeID.localeCompare(b.treeID)
        : b.treeID.localeCompare(a.treeID)
    );

    return data;
  }, [trees, statusFilter, sortOrder]);

  if (isLoading) {
    return (
      <View style={[styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* APPBAR */}
      <Appbar.Header mode="small" statusBarHeight={0}>

        {/* 🔙 Back Button */}
        <Appbar.BackAction onPress={() => navigation.goBack()} />

        <Appbar.Content title="Total Trees" />

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


      {/* Filter Chips */}
      <View style={[styles.filterWrapper, { backgroundColor: theme.colors.card }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['All', 'verified', 'harvest-ready', 'harvested', 'not-ready'].map(s => (
            <Chip
              key={s}
              mode="outlined"
              selected={statusFilter === s}
              onPress={() => setStatusFilter(s)}
              style={styles.filterChip}
              textStyle={{
                color: statusFilter === s ? '#fff' : theme.colors.primary
              }}
            >
              {s.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Tree List */}
      <FlatList
        data={filteredTrees}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TreeListItem
            tree={item}
            onMapPress={() =>
              navigation.navigate('TreeDetails', {
                treeID: item.id
              })
            }
          />
        )}
      />
    </View>
  );
}




// ----------------------
//   Styles
// ----------------------
const styles = StyleSheet.create({
  container: { flex: 1 },

  filterWrapper: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingVertical: 8
  },

  filterChip: {
    marginHorizontal: 6,
    borderWidth: 1
  },

  listContent: {
    padding: 12,
    paddingTop: 60
  },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  card: {
    borderRadius: 14,
    elevation: 3,
    marginBottom: 10
  },

  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14
  },

  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },

  textContainer: { flex: 1 },
  treeIdText: { fontSize: 16, fontWeight: 'bold' },

  locationContainer: { flexDirection: 'row', marginTop: 4 },
  locationText: { marginLeft: 4, fontSize: 13 },

  statusRow: { flexDirection: 'row', marginTop: 6 },
  statusLabel: { fontSize: 13, marginRight: 4 },
  statusValue: { fontSize: 13, fontWeight: 'bold' }
});
