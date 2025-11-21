import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
  Alert,
  Pressable,
  ScrollView,
} from "react-native";
import { Appbar, Card, Chip, Text } from "react-native-paper";
import { useRoute, useNavigation } from "@react-navigation/native";
import firestore from "@react-native-firebase/firestore";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import auth from "@react-native-firebase/auth";

export default function ActivityLogsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const highlightId = route.params?.highlightId || null;

  const [activityLogs, setActivityLogs] = useState([]);
  const [hiddenLogs, setHiddenLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today"); // 🟢 today | week | month | all
  const [userRole, setUserRole] = useState(null);
  const [currentUID, setCurrentUID] = useState(null);

  // 🔹 Fetch current user & role
  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    setCurrentUID(user.uid);

    const unsubscribeUser = firestore()
      .collection("users")
      .doc(user.uid)
      .onSnapshot((doc) => {
        if (doc.exists) setUserRole(doc.data().role);
      });

    return () => unsubscribeUser();
  }, []);

  // 🔹 Fetch only the current user's activity logs
  useEffect(() => {
    if (!currentUID) return;
    setLoading(true);

    const now = new Date();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(now.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const unsubscribe = firestore()
      .collection("activityLog")
      .where("uid", "==", currentUID)
      .onSnapshot(
        (snapshot) => {
          let data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // 🧭 Apply filters
          data = data.filter((item) => {
            const t = item.timestamp?.toDate
              ? item.timestamp.toDate()
              : new Date(item.timestamp);

            if (filter === "today") {
              return t >= startOfDay && t <= endOfDay;
            } else if (filter === "week") {
              return t >= startOfWeek && t <= endOfDay;
            } else if (filter === "month") {
              return t >= startOfMonth && t <= endOfDay;
            }
            return true; // all
          });

          // 🧹 Remove locally deleted logs
          data = data.filter((item) => !hiddenLogs.includes(item.id));

           // ✨ Personalize messages for current user
                    data = data.map((log) => {
                      let description = log.description || "";
                      if (
                        log.uid === currentUID &&
                        /researcher added a new tree/i.test(description)
                      ) {
                        description = description.replace(
                          /researcher added a new tree/i,
                          "you added a new tree"
                        );
                      }
                      return { ...log, description };
                    });

          // 🔽 Sort newest first
          data.sort(
            (a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)
          );

          setActivityLogs(data);
          setLoading(false);
        },
        (error) => {
          console.error("Error loading activity logs:", error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [filter, currentUID, hiddenLogs]);

 // 🗑️ Delete one log with confirmation
 const handleDeleteLog = (id: string) => {
   Alert.alert(
     "Delete Activity Log",
     "Are you sure you want to delete this activity? This will remove it from your view.",
     [
       { text: "Cancel", style: "cancel" },
       {
         text: "Yes, Delete",
         style: "destructive",
         onPress: () => {
           // Soft delete (local only)
           setHiddenLogs((prev) => [...prev, id]);
           Alert.alert("Deleted", "The activity has been removed successfully.");
         },
       },
     ]
   );
 };


  /** 🧹 Delete all logs locally **/
  const handleDeleteAllLogs = () => {
    Alert.alert(
      "Delete All Activities",
      "Do you want to delete all activity logs? They won’t be deleted from Firestore.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: () => {
            const allIds = activityLogs.map((log) => log.id);
            setHiddenLogs((prev) => [...prev, ...allIds]);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🔹 Header */}
      <Appbar.Header style={{ backgroundColor: "#27ae60" }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#fff" />
        <Appbar.Content title="Activity Logs" color="#fff" />
        {activityLogs.length > 0 && (
          <Appbar.Action
            icon="delete-sweep"
            color="#fff"
            onPress={handleDeleteAllLogs}
          />
        )}
      </Appbar.Header>


      {/* 🔹 Filter Chips (same UI as Notifications) */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          <Chip
            style={[
              styles.filterChip,
              { backgroundColor: filter === "today" ? "#2ecc71" : "#e8f5e9" },
            ]}
            textStyle={{
              color: filter === "today" ? "#fff" : "#2ecc71",
              fontWeight: "600",
            }}
            onPress={() => setFilter("today")}
          >
            Today
          </Chip>

          <Chip
            style={[
              styles.filterChip,
              { backgroundColor: filter === "week" ? "#2ecc71" : "#e8f5e9" },
            ]}
            textStyle={{
              color: filter === "week" ? "#fff" : "#2ecc71",
              fontWeight: "600",
            }}
            onPress={() => setFilter("week")}
          >
            This Week
          </Chip>

          <Chip
            style={[
              styles.filterChip,
              { backgroundColor: filter === "month" ? "#2ecc71" : "#e8f5e9" },
            ]}
            textStyle={{
              color: filter === "month" ? "#fff" : "#2ecc71",
              fontWeight: "600",
            }}
            onPress={() => setFilter("month")}
          >
            This Month
          </Chip>

          <Chip
            style={[
              styles.filterChip,
              { backgroundColor: filter === "all" ? "#2ecc71" : "#e8f5e9" },
            ]}
            textStyle={{
              color: filter === "all" ? "#fff" : "#2ecc71",
              fontWeight: "600",
            }}
            onPress={() => setFilter("all")}
          >
            All
          </Chip>
        </ScrollView>
      </View>


      {/* 🔹 Activity List */}
      {activityLogs.length > 0 ? (
        <FlatList
          data={activityLogs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card
              style={[
                styles.activityCard,
                item.id === highlightId && {
                  borderLeftColor: "#2ecc71",
                  borderLeftWidth: 5,
                  backgroundColor: "#eafaf1",
                },
              ]}
            >
              <Card.Content>
                <View style={styles.logRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityText}>{item.description}</Text>
                    <Text style={styles.timestamp}>
                      {item.timestamp?.toDate?.()
                        ? new Date(item.timestamp.toDate()).toLocaleString()
                        : ""}
                    </Text>
                  </View>

                  <Pressable onPress={() => handleDeleteLog(item.id)}>
                    <MaterialCommunityIcons
                      name="delete-outline"
                      size={24}
                      color="#e74c3c"
                    />
                  </Pressable>
                </View>
              </Card.Content>
            </Card>
          )}
          contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 10 }}
        />
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="calendar-blank-outline"
            size={50}
            color="#aaa"
          />
          <Text style={styles.emptyText}>
            {filter === "today"
              ? "No activity recorded today."
              : filter === "week"
              ? "No activity recorded this week."
              : filter === "month"
              ? "No activity recorded this month."
              : "No activity logs found."}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginVertical: 10,
    gap: 10,
  },
  chip: {
    borderColor: "#2ecc71",
    borderWidth: 1,
  },
  activityCard: {
    marginVertical: 6,
    borderRadius: 10,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activityText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
  timestamp: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 15,
    color: "#888",
    marginTop: 10,
    fontStyle: "italic",
  },

filterBar: {
  zIndex: 10,
  elevation: 3,
  paddingVertical: 6,
  borderBottomWidth: 1,
  borderColor: "#ddd",
  backgroundColor: "#fff",
},
filtersScroll: {
  paddingHorizontal: 12,
  paddingVertical: 6,
  alignItems: "center",
},
filterChip: {
  marginRight: 8,
  borderRadius: 12,
},

});
