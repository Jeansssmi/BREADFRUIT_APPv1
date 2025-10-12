import React, { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
// ✅ 1. Import Appbar
import { Card, FAB, Text, Appbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';

export default function TreeManagementScreen() {
  const navigation = useNavigation<any>();
  const [allTrees, setAllTrees] = useState(0);
  const [pendings, setPendings] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // This data-fetching logic remains unchanged
  const fetchAllCounts = async () => {
    setRefreshing(true);
    try {
      const allTreesSnap = await firestore().collection('trees').get();
      setAllTrees(allTreesSnap.size);

      const pendingSnap = await firestore().collection('trees').where("status", "==", "pending").get();
      setPendings(pendingSnap.size);

    } catch (error) {
      console.error("Error fetching tree counts:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Refresh data when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', fetchAllCounts);
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
        {/* ✅ 2. Add the Appbar with Title and Search Icon */}
        <Appbar.Header style={styles.appbarHeader}>
            <Appbar.Content title="Trees" titleStyle={styles.appbarTitle} />
            <Appbar.Action icon="magnify" onPress={() => navigation.navigate('Search')} />
        </Appbar.Header>

        <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAllCounts} />}
        >
            <View style={styles.titleContainer}>
                <MaterialCommunityIcons
                  name="forest"
                  size={20}
                  color="#2ecc71"
                  style={{ textShadowColor: '#27ae60', textShadowRadius: 4 }}
                />

                <Text style={styles.mainTitle}>Tree Management</Text>
            </View>

            <View style={styles.gridContainer}>
                <Pressable style={styles.gridItem} onPress={() => navigation.navigate('TreeList')}>
                    <Card style={[styles.card, styles.primaryCard]}>
                        <Card.Content>
                            <View style={styles.cardHeader}>
                                <MaterialCommunityIcons name="forest" size={20} color="#2ecc71" />
                                <Text style={styles.cardTitle}>Trees Tracked</Text>
                            </View>
                            <Text style={styles.cardValue}>{allTrees}</Text>
                        </Card.Content>
                    </Card>
                </Pressable>

                <Pressable style={styles.gridItem} onPress={() => navigation.navigate('PendingTrees')}>
                    <Card style={styles.card}>
                        <Card.Content>
                            <View style={styles.cardHeader}>
                                <MaterialCommunityIcons name="clock-time-three-outline" size={20} color="#2ecc71" />
                                <Text style={styles.cardTitle}>Pending Approvals</Text>
                            </View>
                            <Text style={styles.cardValue}>{pendings}</Text>
                        </Card.Content>
                    </Card>
                </Pressable>
            </View>
        </ScrollView>

        <FAB
            icon="plus" style={styles.fab} color="white"
            onPress={() => navigation.navigate('AddTree')}
        />
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f8fa' // Light gray background
    },
    scrollContent: {
        padding: 20,
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
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    mainTitle: {
          fontSize: 24,
            fontWeight: 'bold',
            color: '#333',
            marginLeft: 8,
    },
    gridContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    gridItem: {
        width: '48%'
    },
    // ✅ Styles for the cards updated to match the picture
    card: {
        borderRadius: 12,
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        minHeight: 140, // Increase height
        justifyContent: 'center',
    },
    primaryCard: {
        borderLeftWidth: 5,
        borderLeftColor: '#2ecc71'
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        color: '#333',
        fontWeight: '600',
        marginLeft: 8,
    },
    cardValue: {
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
});