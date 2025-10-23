import React, { useEffect, useState, useCallback } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Card,
  Text,
  Appbar,
  Badge,
  useTheme,
  Button, // ✅ added for toggle
  Divider,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import firestore from "@react-native-firebase/firestore";

export default function AdminDashboardScreen() {
  const navigation = useNavigation();
  const theme = useTheme();

  const [allTrees, setAllTrees] = useState(0);
  const [allUsers, setAllUsers] = useState(0);
  const [researchers, setResearchers] = useState(0);
  const [pendingUsers, setPendingUsers] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [showActivity, setShowActivity] = useState(false); // ✅ toggle state

  // ✅ Fetch dashboard statistics
  const fetchAllCounts = useCallback(async () => {
    setRefreshing(true);
    try {
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

  // ✅ Fetch unseen notifications count
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

  // ✅ Fetch recent activity
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header
        style={[
          styles.appbarHeader,
          {
            backgroundColor: theme.colors.card,
            borderBottomColor: theme.dark ? "#333" : "#eee",
          },
        ]}
      >
        <Appbar.Content
          title="Dashboard"
          titleStyle={[styles.appbarTitle, { color: theme.colors.text }]}
        />
        <View style={{ marginRight: 10 }}>
          <Appbar.Action
            icon="bell-outline"
            color={theme.colors.text}
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
        {/* Title */}
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons
            name="view-dashboard"
            size={24}
            color={theme.colors.primary}
          />
          <Text style={[styles.mainTitle, { color: theme.colors.text }]}>
            Admin Dashboard
          </Text>
        </View>

        {/* ✅ Dashboard Cards */}
        <View style={styles.gridContainer}>
          {[
            {
              title: "Trees Tracked",
              value: allTrees,
              icon: "forest",
              onPress: () => navigation.navigate("TreeListToMap"),
            },
            {
              title: "All Users",
              value: allUsers,
              icon: "account-group",
              onPress: () => navigation.navigate("UserList"),
            },
            {
              title: "Researchers",
              value: researchers,
              icon: "account-tie",
              onPress: () =>
                navigation.navigate("UserListScreen", { filter: "researcher" }),
            },
            {
              title: "User Approval",
              value: pendingUsers,
              icon: "account-clock",
              onPress: () => navigation.navigate("PendingUsers"),
            },
          ].map((card) => (
            <Pressable key={card.title} style={styles.gridItem} onPress={card.onPress}>
              <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <MaterialCommunityIcons
                      name={card.icon}
                      size={20}
                      color={theme.colors.primary}
                    />
                    <Text
                      style={[styles.cardTitle, { color: theme.colors.primary }]}
                    >
                      {card.title}
                    </Text>
                  </View>
                  <Text style={[styles.cardValue, { color: theme.colors.text }]}>
                    {card.value}
                  </Text>
                </Card.Content>
              </Card>
            </Pressable>
          ))}
        </View>

        {/* ✅ Clean Toggleable Recent Activity */}
        <Card style={[styles.activityCard, { backgroundColor: theme.colors.card }]}>
          <Card.Content>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MaterialCommunityIcons
                  name="clock-time-three-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
                  Recent Activity
                </Text>
              </View>

              <Button
                mode="text"
                compact
                onPress={() => setShowActivity((prev) => !prev)}
                labelStyle={{ color: theme.colors.primary, fontWeight: "bold" }}
              >
                {showActivity ? "Hide" : "Show"}
              </Button>
            </View>

            {showActivity && (
              <>
                <Divider style={{ marginVertical: 10 }} />
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <View key={activity.id} style={styles.activityItem}>
                      <Text style={{ color: theme.colors.text }}>
                        • {activity.description}
                      </Text>
                      {activity.timestampDate && (
                        <Text
                          style={{
                            color: theme.dark ? "#aaa" : "#888",
                            fontSize: 12,
                          }}
                        >
                          {activity.timestampDate.toLocaleString()}
                        </Text>
                      )}
                    </View>
                  ))
                ) : (
                  <Text
                    style={[styles.activityItem, { color: theme.colors.text }]}
                  >
                    No recent activity to show.
                  </Text>
                )}
              </>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: 20 },
  appbarHeader: {
    elevation: 0,
    borderBottomWidth: 1,
  },
  appbarTitle: { fontSize: 20, fontWeight: "bold" },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  mainTitle: { fontSize: 22, fontWeight: "bold" },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  gridItem: { width: "48%", marginBottom: 15 },
  card: { borderRadius: 12, elevation: 2 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: { fontWeight: "600" },
  cardValue: { fontSize: 22, fontWeight: "bold", marginTop: 6 },
  activityCard: { borderRadius: 12, elevation: 2 },
  activityItem: { marginTop: 6 },
});
