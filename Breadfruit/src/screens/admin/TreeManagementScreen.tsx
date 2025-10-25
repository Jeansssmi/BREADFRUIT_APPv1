import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Card, FAB, Text, Appbar, useTheme } from 'react-native-paper'; // ✅ useTheme added
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';

export default function TreeManagementScreen() {
  const navigation = useNavigation();
  const theme = useTheme(); // ✅ global theme hook

  const [trackedTrees, setTrackedTrees] = useState(0);
  const [pendings, setPendings] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllCounts = async () => {
    setRefreshing(true);
    try {
      const verifiedSnap = await firestore()
        .collection('trees')
        .where('status', '==', 'verified')
        .get();

      const harvestReadySnap = await firestore()
        .collection('trees')
        .where('status', '==', 'harvest-ready')
        .get();

      const harvestedSnap = await firestore()
        .collection('trees')
        .where('status', '==', 'harvested')
        .get();

      const notReadySnap = await firestore()
        .collection('trees')
        .where('status', '==', 'not-ready')
        .get();

      const totalTracked =
        verifiedSnap.size +
        harvestReadySnap.size +
        harvestedSnap.size +
        notReadySnap.size;

      setTrackedTrees(totalTracked);

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
    // ✅ Live total tracked trees (excluding pending)
    const unsubTracked = firestore()
      .collection('trees')
      .where('status', 'in', ['verified', 'harvest-ready', 'harvested', 'not-ready'])
      .onSnapshot((snapshot) => {
        setTrackedTrees(snapshot.size);
      });

    // ✅ Live pending trees
    const unsubPending = firestore()
      .collection('trees')
      .where('status', '==', 'pending')
      .onSnapshot((snapshot) => {
        setPendings(snapshot.size);
      });

    // Cleanup listeners when leaving screen
    return () => {
      unsubTracked();
      unsubPending();
    };
  }, []);
  const cards = [
    {
      title: 'Trees Tracked',
      value: trackedTrees,
      icon: 'tree',
      onPress: () => navigation.navigate('TreeList'),
      highlight: true,
    },
    {
      title: 'Pending Approvals',
      value: pendings,
      icon: 'clock-outline',
      onPress: () => navigation.navigate('PendingTrees'),
      highlight: false,
    },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header
        style={[
          styles.appbarHeader,
          {
            backgroundColor: theme.colors.card,
            borderBottomColor: theme.dark ? '#333' : '#eee',
          },
        ]}
      >
        <Appbar.Content
          title="Trees"
          titleStyle={[styles.appbarTitle, { color: theme.colors.text }]}
        />
        <Appbar.Action
          icon="magnify"
          color={theme.colors.text}
          onPress={() => navigation.navigate('Search')}
        />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchAllCounts} />
        }
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.text },
          ]}
        >
          <MaterialCommunityIcons
            name="forest"
            size={22}
            color={theme.colors.primary}
          />{'  '}
          Tree Management
        </Text>

        <View style={styles.cardRow}>
          {cards.map((card) => (
            <Pressable
              key={card.title}
              onPress={card.onPress}
              style={({ pressed }) => [
                styles.cardWrapper,
                pressed && {
                  transform: [{ scale: 0.97 }],
                  shadowOpacity: 0.25,
                  elevation: 6,
                },
              ]}
              android_ripple={{
                color: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              }}
            >
              <Card
                style={[
                  styles.card,
                  { backgroundColor: theme.colors.card },
                  card.highlight && { borderLeftColor: theme.colors.primary },
                ]}
              >
                <Card.Content style={styles.cardContent}>
                  <View style={styles.iconRow}>
                    <MaterialCommunityIcons
                      name={card.icon}
                      size={24}
                      color={theme.colors.primary}
                    />
                    <Text
                      style={[
                        styles.cardTitle,
                        { color: theme.colors.primary },
                      ]}
                    >
                      {card.title}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.cardNumber,
                      { color: theme.colors.text },
                    ]}
                  >
                    {card.value}
                  </Text>
                </Card.Content>
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        color="white"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('AddTree')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 30, paddingBottom: 100 },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cardWrapper: { width: '48%' },
  card: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    borderLeftWidth: 3,
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  iconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  cardNumber: {
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  appbarHeader: {
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
  },
  appbarTitle: { fontWeight: 'bold', fontSize: 20 },
});
