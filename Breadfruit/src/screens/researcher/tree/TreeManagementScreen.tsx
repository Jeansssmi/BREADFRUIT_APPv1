import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, FAB, Text, Appbar } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// ⭐ Use YOUR dark mode
import { useTheme } from "../../../context/ThemeContext";

export default function TreeManagementScreen() {
  const navigation = useNavigation<any>();
  const { dark } = useTheme();  // <-- your dark mode value

  // ⭐ Dynamic theme colors
  const bgColor = dark ? "#000000" : "#FFFFFF";
  const cardColor = dark ? "#111111" : "#FFFFFF";
  const textColor = dark ? "#FFFFFF" : "#222222";
  const borderColor = dark ? "#333" : "#eee";
  const primary = "#2ecc71";

  const [allTrees, setAllTrees] = useState(0);
  const [pendings, setPendings] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const currentUser = auth().currentUser;
  const trackedStatuses = ['verified', 'harvest-ready', 'not-ready', 'harvested'];

  const fetchAllCounts = async () => {
    if (!currentUser) return;
    setRefreshing(true);
    try {
      const verifiedSnap = await firestore()
        .collection('trees')
        .where('trackedById', '==', currentUser.uid)
        .where('status', 'in', trackedStatuses)
        .get();
      setAllTrees(verifiedSnap.size);

      const pendingSnap = await firestore()
        .collection('trees')
        .where('trackedById', '==', currentUser.uid)
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
    if (!currentUser) return;

    const unsubscribeVerified = firestore()
      .collection('trees')
      .where('trackedById', '==', currentUser.uid)
      .where('status', 'in', trackedStatuses)
      .onSnapshot((snap) => setAllTrees(snap?.size ?? 0));

    const unsubscribePending = firestore()
      .collection('trees')
      .where('trackedById', '==', currentUser.uid)
      .where('status', '==', 'pending')
      .onSnapshot((snap) => setPendings(snap.size));

    return () => {
      unsubscribeVerified();
      unsubscribePending();
    };
  }, [currentUser]);

  useEffect(() => {
    fetchAllCounts();
  }, [currentUser]);

  useFocusEffect(
    useCallback(() => {
      fetchAllCounts();
    }, [])
  );

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>

      {/* ⭐ APPBAR */}
      <Appbar.Header
        style={{
          backgroundColor: cardColor,
          borderBottomColor: borderColor,
          borderBottomWidth: 1,
        }}
      >
        <Appbar.Content
          title="Trees"
          titleStyle={{ color: textColor, fontWeight: 'bold' }}
        />

        <Appbar.Action
          icon="magnify"
          color={primary}
          onPress={() => navigation.navigate("Search")}
        />
      </Appbar.Header>

      {/* ⭐ MAIN CONTENT */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchAllCounts} tintColor={textColor} />
        }
      >

        <View style={styles.titleContainer}>
          <MaterialCommunityIcons name="forest" size={22} color={primary} />
          <Text style={[styles.mainTitle, { color: textColor }]}>Tree Management</Text>
        </View>

        <View style={styles.gridContainer}>

          {/* 🌲 Trees Tracked */}
          <Pressable style={styles.gridItem} onPress={() => navigation.navigate('TreeList')}>
            <Card
              style={[
                styles.card,
                {
                  backgroundColor: cardColor,
                  borderLeftColor: primary,   // SAME GREEN BORDER
                },
              ]}
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="forest" size={22} color={primary} />
                  <Text style={[styles.cardTitle, { color: primary }]}>Trees Tracked</Text>
                </View>
                <Text style={[styles.cardValue, { color: textColor }]}>{allTrees}</Text>
              </Card.Content>
            </Card>
          </Pressable>

          {/* ⏳ Pending Approvals */}
          <Pressable
            style={styles.gridItem}
            onPress={() =>
              navigation.navigate("PendingTrees", { researcherId: currentUser.uid })
            }
          >
            <Card
              style={[
                styles.card,
                {
                  backgroundColor: cardColor,
                  borderLeftColor: primary,   // ⭐ ADDED: SAME GREEN BORDER
                },
              ]}
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons
                    name="clock-time-three-outline"
                    size={22}
                    color={primary}
                  />
                  <Text style={[styles.cardTitle, { color: primary }]}>Pending Approvals</Text>
                </View>

                <Text style={[styles.cardValue, { color: textColor }]}>{pendings}</Text>
              </Card.Content>
            </Card>
          </Pressable>

        </View>




      </ScrollView>

      {/* ⭐ Floating Action Button */}
      <FAB
        icon="plus"
        color="white"
        style={[styles.fab, { backgroundColor: primary }]}
        onPress={() => navigation.navigate("AddTree", { from: "TreeManagement" })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  titleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  mainTitle: { fontSize: 24, fontWeight: 'bold', marginLeft: 8 },
  gridContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  gridItem: { width: '48%' },
  card: {
    borderRadius: 12,
    elevation: 2,
    minHeight: 140,
    justifyContent: 'center',
    borderLeftWidth: 5,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontWeight: '600', marginLeft: 8 },
  cardValue: { fontWeight: 'bold', fontSize: 40, textAlign: 'center' },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
});
