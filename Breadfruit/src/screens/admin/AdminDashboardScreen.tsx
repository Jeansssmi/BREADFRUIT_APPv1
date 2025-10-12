import React, { useEffect, useState, useCallback } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Card, Text, Appbar } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import firestore from "@react-native-firebase/firestore";

export default function AdminDashboardScreen() {
  const navigation = useNavigation();

  const [allTrees, setAllTrees] = useState(0);
  const [allUsers, setAllUsers] = useState(0);
  const [researchers, setResearchers] = useState(0);
  const [pendingUsers, setPendingUsers] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Fetch dashboard statistics
  const fetchAllCounts = useCallback(async () => {
    setRefreshing(true);
    try {
      const treesSnap = await firestore().collection("trees").get();
      setAllTrees(treesSnap.size);

      const usersSnap = await firestore().collection("users").get();
      setAllUsers(usersSnap.size);

      const researcherSnap = await firestore()
        .collection("users")
        .where("role", "==", "researcher")
        .get();
      setResearchers(researcherSnap.size);

      const pendingSnap = await firestore()
        .collection("users")
        .where("status", "==", "pending")
        .get();
      setPendingUsers(pendingSnap.size);
    } catch (error) {
      console.error("Error fetching counts: ", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllCounts();
  }, [fetchAllCounts]);

  return (
    <View style={styles.container}>
      {/* ✅ Appbar Header */}
      <Appbar.Header style={styles.appbarHeader}>
        <Appbar.Content title="Dashboard" titleStyle={styles.appbarTitle} />
        <Appbar.Action
          icon="bell-outline"
          color="black"
          onPress={() => {
            // Add notification navigation here
          }}
        />
      </Appbar.Header>

      {/* ✅ Scrollable Dashboard */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchAllCounts} />
        }
      >
        {/* Dashboard Title */}
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons name="view-dashboard" size={24} color="#2ecc71" />
          <Text style={styles.mainTitle}>Admin Dashboard</Text>
        </View>

        {/* ✅ Statistic Cards */}
        <View style={styles.gridContainer}>
          {/* Trees Tracked */}
          <Pressable
            style={styles.gridItem}
            onPress={() => navigation.navigate("Trees", { screen: "TreeList" })}
          >
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

          {/* All Users */}
          <Pressable
            style={styles.gridItem}
            onPress={() => navigation.navigate("Accounts", { screen: "UserList" })}
          >
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons
                    name="account-group"
                    size={20}
                    color="#2ecc71"
                  />
                  <Text style={styles.cardTitle}>All Users</Text>
                </View>
                <Text style={styles.cardValue}>{allUsers}</Text>
              </Card.Content>
            </Card>
          </Pressable>

          {/* Researchers */}
          <Pressable
            style={styles.gridItem}
            onPress={() =>
              navigation.navigate("Accounts", {
                screen: "UserList",
                params: { filter: "researcher" },
              })
            }
          >
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons
                    name="account-tie"
                    size={20}
                    color="#2ecc71"
                  />
                  <Text style={styles.cardTitle}>Researchers</Text>
                </View>
                <Text style={styles.cardValue}>{researchers}</Text>
              </Card.Content>
            </Card>
          </Pressable>

          {/* Pending Approvals */}
          <Pressable
            style={styles.gridItem}
            onPress={() => navigation.navigate("Accounts", { screen: "PendingUsers" })}
          >
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons
                    name="account-clock"
                    size={20}
                    color="#2ecc71"
                  />
                  <Text style={styles.cardTitle}>Approval</Text>
                </View>
                <Text style={styles.cardValue}>{pendingUsers}</Text>
              </Card.Content>
            </Card>
          </Pressable>
        </View>

        {/* ✅ Recent Activity */}
        <Card style={styles.activityCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="clock-time-three-outline"
                size={20}
                color="#2ecc71"
              />
              <Text style={styles.cardTitle}>Recent Activity</Text>
            </View>
            <View style={styles.activityItem}>
              <Text>• Juan added a new tree</Text>
            </View>
            <View style={styles.activityItem}>
              <Text>• Maria updated tree #42 details</Text>
            </View>
            <View style={styles.activityItem}>
              <Text>• 3 new registrations approved</Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  scrollContainer: { padding: 20 },
  appbarHeader: {
    backgroundColor: "#ffffff",
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  appbarTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2ecc71",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  gridItem: { width: "48%", marginBottom: 15 },
  card: {
    borderRadius: 12,
    elevation: 2,
    backgroundColor: "#fff",
  },
  primaryCard: { borderLeftWidth: 4, borderLeftColor: "#2ecc71" },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: { color: "#2ecc71", fontWeight: "600" },
  cardValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginTop: 6,
  },
  activityCard: {
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 2,
  },
  activityItem: { marginTop: 6 },
});
