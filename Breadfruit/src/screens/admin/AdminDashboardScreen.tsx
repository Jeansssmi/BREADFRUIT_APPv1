import React, { useEffect, useState, useCallback } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Card, Text, Appbar, Badge } from "react-native-paper";
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
  const [recentActivity, setRecentActivity] = useState([]);
  const [unseenCount, setUnseenCount] = useState(0);

  // Fetch dashboard statistics
  const fetchAllCounts = useCallback(async () => {
    setRefreshing(true);
    try {
      // ✅ Count all tree statuses
      const statuses = ["verified", "harvest-ready", "not-ready", "harvested"];
      let totalTrees = 0;

      for (const status of statuses) {
        const snap = await firestore()
          .collection("trees")
          .where("status", "==", status)
          .get();
        totalTrees += snap.size;
      }

      setAllTrees(totalTrees);

      // ✅ User counts
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

  // Fetch unseen notifications count
  useEffect(() => {
    const unsubscribe = firestore()
      .collection("notification")
      .where("recipientRole", "==", "Admin")
      .where("seen", "==", false)
      .onSnapshot(
        (snapshot) => setUnseenCount(snapshot.size),
        (error) => console.error("Error fetching notifications:", error)
      );

    return unsubscribe;
  }, []);

  // Fetch recent activity
  useEffect(() => {
    const unsubscribe = firestore()
      .collection("activityLog")
      .orderBy("timestamp", "desc")
      .limit(5)
      .onSnapshot(
        (snapshot) => {
          const data = snapshot.docs.map((doc) => {
            const raw = doc.data();
            let tsDate = raw.timestamp?.toDate
              ? raw.timestamp.toDate()
              : new Date(raw.timestamp);
            return { id: doc.id, ...raw, timestampDate: tsDate };
          });
          setRecentActivity(data);
        },
        (error) => console.error("Error fetching activity:", error)
      );

    return () => unsubscribe();
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case "create":
        return "tree";
      case "harvest":
        return "fruit-cherries";
      case "collected":
        return "package-variant-closed";
      default:
        return "clock-outline";
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbarHeader}>
        <Appbar.Content title="Dashboard" titleStyle={styles.appbarTitle} />
        <View style={{ marginRight: 10 }}>
          <Appbar.Action
            icon="bell-outline"
            color="black"
            onPress={() => navigation.navigate("NotificationsScreen")}
          />
          {unseenCount > 0 && (
            <Badge
              size={12}
              style={{
                position: "absolute",
                top: 5,
                right: 5,
                backgroundColor: "#e74c3c",
              }}
            />
          )}
        </View>
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchAllCounts} />
        }
      >
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons name="view-dashboard" size={24} color="#2ecc71" />
          <Text style={styles.mainTitle}>Admin Dashboard</Text>
        </View>

        {/* Dashboard Cards */}
        <View style={styles.gridContainer}>
          <Pressable
            style={styles.gridItem}
            onPress={() => navigation.navigate("TreeList")}
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

          <Pressable
            style={styles.gridItem}
            onPress={() => navigation.navigate("UserList")}
          >
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="account-group" size={20} color="#2ecc71" />
                  <Text style={styles.cardTitle}>All Users</Text>
                </View>
                <Text style={styles.cardValue}>{allUsers}</Text>
              </Card.Content>
            </Card>
          </Pressable>

          <Pressable
            style={styles.gridItem}
            onPress={() => navigation.navigate("UserListScreen", { filter: "researcher" })}
          >
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="account-tie" size={20} color="#2ecc71" />
                  <Text style={styles.cardTitle}>Researchers</Text>
                </View>
                <Text style={styles.cardValue}>{researchers}</Text>
              </Card.Content>
            </Card>
          </Pressable>

          <Pressable
            style={styles.gridItem}
            onPress={() => navigation.navigate("PendingUsers")}
          >
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="account-clock" size={20} color="#2ecc71" />
                  <Text style={styles.cardTitle}>User Approval</Text>
                </View>
                <Text style={styles.cardValue}>{pendingUsers}</Text>
              </Card.Content>
            </Card>
          </Pressable>
        </View>

        {/* Recent Activity */}
        <Pressable onPress={() => navigation.navigate("ActivityLogsScreen")}>
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

              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <View key={activity.id} style={styles.activityItem}>
                    <Text>• {activity.description}</Text>
                    {activity.timestampDate && (
                      <Text style={{ color: "#888", fontSize: 12 }}>
                        {activity.timestampDate.toLocaleString()}
                      </Text>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.activityItem}>No recent activity to show.</Text>
              )}
            </Card.Content>
          </Card>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  scrollContainer: { padding: 20 },
  appbarHeader: { backgroundColor: "#ffffff", elevation: 0, borderBottomWidth: 1, borderBottomColor: "#eee" },
  appbarTitle: { fontSize: 20, fontWeight: "bold", color: "#2ecc71" },
  titleContainer: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 8 },
  mainTitle: { fontSize: 22, fontWeight: "bold", color: "#333" },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 20 },
  gridItem: { width: "48%", marginBottom: 15 },
  card: { borderRadius: 12, elevation: 2, backgroundColor: "#fff" },
  primaryCard: { borderLeftWidth: 4, borderLeftColor: "#2ecc71" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  cardTitle: { color: "#2ecc71", fontWeight: "600" },
  cardValue: { fontSize: 22, fontWeight: "bold", color: "#333", marginTop: 6 },
  activityCard: { borderRadius: 12, backgroundColor: "#fff", elevation: 2 },
  activityItem: { marginTop: 6 },
});
