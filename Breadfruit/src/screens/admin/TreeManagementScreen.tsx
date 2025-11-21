import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Card, FAB, Text, Appbar, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';

export default function TreeManagementScreen() {
  const navigation = useNavigation();
  const theme = useTheme();

  const [trackedTrees, setTrackedTrees] = useState(0);
  const [pendings, setPendings] = useState(0);

  const [activeReports, setActiveReports] = useState(0);
  const [softDeletedReports, setSoftDeletedReports] = useState(0);

  const [refreshing, setRefreshing] = useState(false);

  // ─────────────────────────────────────────────────────────
  // LIVE COUNTS
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    // Trees
    const unsubTracked = firestore()
      .collection("trees")
      .where("status", "in", ["verified", "harvest-ready", "harvested", "not-ready"])
      .onSnapshot((snap) => setTrackedTrees(snap.size));

    const unsubPending = firestore()
      .collection("trees")
      .where("status", "==", "pending")
      .onSnapshot((snap) => setPendings(snap.size));

    // Reports (active + deleted)
    const unsubReports = firestore()
      .collection("treeReports")
      .onSnapshot((snap) => {
        let active = 0;
        let deleted = 0;

        snap.forEach((d) => {
          const data = d.data() || {};
          if (data.isDeleted) deleted++;
          else active++;
        });

        setActiveReports(active);
        setSoftDeletedReports(deleted);
      });

    return () => {
      unsubTracked();
      unsubPending();
      unsubReports();
    };
  }, []);

  const cards = [
    {
      title: "Trees Tracked",
      value: trackedTrees,
      icon: "tree",
      onPress: () => navigation.navigate("TreeList"),
      highlight: true,
    },

    {
      title: "Pending Approvals",
      value: pendings,
      icon: "clock-outline",
      onPress: () => navigation.navigate("PendingTrees"),
      highlight: false,
    },

    {
      title: "Tree Reports",
      value: activeReports + softDeletedReports,
      subtitle: `Active: ${activeReports} | Deleted: ${softDeletedReports}`,
      icon: "alert-circle-outline",
      onPress: () => navigation.navigate("TreeReportsScreen"),
      highlight: false,
    },

    {
      title: "Trash Bin Reports",
      value: softDeletedReports,
      subtitle: "Soft deleted reports",
      icon: "delete-empty",
      onPress: () => navigation.navigate("TreeReportsTrashScreen"),
      highlight: false,
    },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={[styles.appbarHeader, { backgroundColor: theme.colors.card }]}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color={theme.colors.text} />
        <Appbar.Content title="Trees" color={theme.colors.text} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          <MaterialCommunityIcons name="forest" size={22} color={theme.colors.primary} /> Tree Management
        </Text>

        <View style={styles.cardRow}>
          {cards.map((card) => (
            <Pressable key={card.title} onPress={card.onPress} style={styles.cardWrapper}>
              <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
                <Card.Content style={styles.cardContent}>
                  <View style={styles.iconRow}>
                    <MaterialCommunityIcons name={card.icon} size={24} color={theme.colors.primary} />
                    <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>{card.title}</Text>
                  </View>
                  <Text style={[styles.cardNumber, { color: theme.colors.text }]}>
                    {card.value}
                  </Text>
                  {card.subtitle && (
                    <Text style={[styles.cardSubtitle, { color: theme.colors.text }]}>
                      {card.subtitle}
                    </Text>
                  )}
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
        onPress={() => navigation.navigate("AddTree")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 30, paddingBottom: 100 },
  sectionTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  cardRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  cardWrapper: { width: "48%", marginBottom: 16 },
  card: { borderRadius: 12, elevation: 3, borderLeftWidth: 3 },
  cardContent: { alignItems: "center" },
  iconRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: "600", marginLeft: 8 },
  cardNumber: { fontSize: 40, fontWeight: "bold" },
  cardSubtitle: { fontSize: 12, marginTop: 5, opacity: 0.6, textAlign: "center" },
  fab: { position: "absolute", bottom: 0, right: 0, margin: 16 },
  appbarHeader: { borderBottomWidth: 1, borderBottomColor: "#ddd" },
});
