import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { ActivityIndicator, Card, Text, Chip } from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function AdminPendingTreesScreen() {
  const navigation = useNavigation<any>();
  const [trees, setTrees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Fetch pending trees with researcher name using trackedByID
  const fetchPendingTrees = async () => {
    setLoading(true);
    try {
      const treeSnapshot = await firestore()
        .collection('trees')
        .where('status', '==', 'pending')
        .get();

      const treeList: any[] = [];

      for (const doc of treeSnapshot.docs) {
        const treeData = doc.data();

        let trackedByName = 'Unknown';
        if (treeData.trackedByID) {
          const userDoc = await firestore()
            .collection('users')
            .doc(treeData.trackedByID)
            .get();

          if (userDoc.exists) {
            const userData = userDoc.data();
            trackedByName = userData?.name || 'Unknown';
          }
        }

        treeList.push({
          id: doc.id,
          ...treeData,
          trackedByName,
        });
      }

      setTrees(treeList);
    } catch (error) {
      console.error('Error fetching trees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTrees();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPendingTrees();
    setRefreshing(false);
  };

  // ✅ Color-coded chip
  const getFruitStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'ripe':
        return '#27ae60';
      case 'unripe':
        return '#f39c12';
      case 'none':
        return '#7f8c8d';
      default:
        return '#95a5a6';
    }
  };

  const renderTree = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('PendingApprovalScreen', { treeID: item.id })}
    >
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          {/* Tree Image */}
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.treeImage} />
          ) : (
            <View style={[styles.treeImage, styles.placeholder]}>
              <MaterialIcons name="park" size={36} color="#666" />
            </View>
          )}

          {/* Tree Info */}
          <View style={styles.info}>
            <Text variant="titleMedium" style={styles.title}>
              {item.treeID || 'Unnamed Tree'}
            </Text>
            <Text style={styles.subtitle}>
              {item.barangay}, {item.city}
            </Text>

            <View style={styles.row}>
              <Text style={styles.statusLabel}>Tracked by:</Text>
              <Text style={styles.trackerName}>{item.trackedByName}</Text>
            </View>

            {/* Fruit Status Badge */}
            <View style={{ marginTop: 8 }}>
              <Chip
                style={[
                  styles.fruitStatusChip,
                  { backgroundColor: getFruitStatusColor(item.fruitStatus) },
                ]}
                textStyle={{ color: '#fff', fontWeight: 'bold' }}
              >
                {item.fruitStatus
                  ? item.fruitStatus.charAt(0).toUpperCase() + item.fruitStatus.slice(1)
                  : 'Unknown'}
              </Chip>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  if (trees.length === 0) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="nature" size={48} color="#bbb" />
        <Text style={{ color: '#666', marginTop: 10 }}>No pending trees found.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={trees}
      keyExtractor={(item) => item.id}
      renderItem={renderTree}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ padding: 16 }}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
    backgroundColor: '#fff',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  treeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  subtitle: {
    color: '#555',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  statusLabel: {
    fontSize: 13,
    color: '#777',
  },
  trackerName: {
    fontSize: 13,
    color: '#2ecc71',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  fruitStatusChip: {
    alignSelf: 'flex-start',
    height: 28,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
