import React, { useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Card, FAB, Text ,Appbar} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
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
      const allTreesSnap = await firestore().collection('trees').get();
      setAllTrees(allTreesSnap.size);

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

  useEffect(() => {
    fetchAllCounts();
  }, []);

  return (
    <View style={styles.screen}>
      {/* Floating Top Header */}
       <Appbar.Header style={styles.appbarHeader}>
                <Appbar.Content title="Trees" titleStyle={styles.appbarTitle} />
                <Appbar.Action icon="magnify" onPress={() => navigation.navigate('Search')} />
            </Appbar.Header>


      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchAllCounts} />
        }
      >
        {/* Header Title */}
        <Text style={styles.sectionTitle}>
          <MaterialCommunityIcons name="forest" size={22} color="#2ecc71" />{'  '}
          Tree Management
        </Text>

        {/* Two Cards Side by Side */}
        <View style={styles.cardRow}>
          {/* Trees Tracked Card */}
          <Pressable
            style={styles.cardWrapper}
            onPress={() => navigation.navigate('TreeList')}
          >
            <Card style={[styles.card, styles.highlightCard]}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconRow}>
                  <MaterialCommunityIcons
                    name="tree"
                    size={20}
                    color="#2ecc71"
                  />
                  <Text style={styles.cardTitle}>Trees Tracked</Text>
                </View>
                <Text style={styles.cardNumber}>{allTrees}</Text>
              </Card.Content>
            </Card>
          </Pressable>

          {/* Pending Approvals Card */}
          <Pressable
            style={styles.cardWrapper}
            onPress={() => navigation.navigate('PendingTrees')}
          >
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconRow}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={20}
                    color="#2ecc71"
                  />
                  <Text style={styles.cardTitle}>Pending Approvals</Text>
                </View>
                <Text style={styles.cardNumber}>{pendings}</Text>
              </Card.Content>
            </Card>
          </Pressable>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
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
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  /* Floating header card for title and search */
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 30, // space below floating header
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48%',
  },
  card: {
    borderRadius: 12,
    elevation: 3,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  highlightCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#2ecc71',
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  iconRow: {
    color: '#333',
            fontWeight: '600',
            marginLeft: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2ecc71',
  },
  cardNumber: {
    color: '#2ecc71',
            fontWeight: 'bold',
            fontSize: 40, // Larger font for the number
            textAlign: 'center',
            marginTop: 8,
  },
  fab: {
       position: 'absolute',
           margin: 16,
           right: 0,
           bottom: 0,
           backgroundColor: '#2ecc71',
           borderRadius: 28
  },
   // ✅ 3. Add styles for the header
      appbarHeader: {
          backgroundColor: '#fff',      // solid white header
                elevation: 0,                 // remove shadow (Android)
                shadowOpacity: 0,             // remove shadow (iOS)
                borderBottomWidth: 1,         // subtle divider line
                borderBottomColor: '#eee',
      },
      appbarTitle: {
          color: '#000',
               fontWeight: 'bold',
               fontSize: 20,
      },
});
