import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
  Alert,
  Pressable,
} from "react-native";
import { Appbar, Card, Chip, Text, Button } from "react-native-paper";
import { useRoute, useNavigation } from "@react-navigation/native";
import firestore from "@react-native-firebase/firestore";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import auth from "@react-native-firebase/auth";

export default function ActivityLogsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const highlightId = route.params?.highlightId || null;

  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today");
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

  // 🔹 Fetch Activity Logs (Safe, No Index Required)
  useEffect(() => {
    if (!currentUID || !userRole) return;
    setLoading(true);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let query = firestore()
      .collection("activityLog")
      .where("uid", "==", currentUID);

    query
      .get()
      .then((snapshot) => {
        let data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (filter === "today") {
          data = data.filter((item) => {
            const t = item.timestamp?.toDate
              ? item.timestamp.toDate()
              : new Date(item.timestamp);
            return t >= startOfDay && t <= endOfDay;
          });
        }

        data.sort(
          (a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)
        );

        setActivityLogs(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading activity logs:", error);
        setLoading(false);
      });
  }, [filter, currentUID, userRole]);

  // 🗑️ Delete a specific log
  const handleDeleteLog = (id: string) => {
    Alert.alert(
      "Delete Activity",
      "Are you sure you want to delete this activity?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await firestore().collection("activityLog").doc(id).delete();
              setActivityLogs((prev) => prev.filter((item) => item.id !== id));
            } catch (error) {
              console.error("Error deleting log:", error);
            }
          },
        },
      ]
    );
  };

  // 🧹 Delete all logs
  const handleDeleteAllLogs = () => {
    Alert.alert(
      "Delete All Activities",
      "Are you sure you want to delete all your activity logs?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              const snapshot = await firestore()
                .collection("activityLog")
                .where("uid", "==", currentUID)
                .get();

              const batch = firestore().batch();
              snapshot.forEach((doc) => batch.delete(doc.ref));
              await batch.commit();

              setActivityLogs([]);
            } catch (error) {
              console.error("Error deleting all logs:", error);
            }
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
      <Appbar.Header style={{ backgroundColor: "#2ecc71" }}>
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

      {/* 🔹 Filters */}
      <View style={styles.filterContainer}>
        <Chip
          selected={filter === "today"}
          onPress={() => setFilter("today")}
          style={[
            styles.chip,
            filter === "today" && { backgroundColor: "#2ecc71" },
          ]}
          textStyle={{
            color: filter === "today" ? "#fff" : "#2ecc71",
            fontWeight: "bold",
          }}
        >
          Today
        </Chip>
        <Chip
          selected={filter === "all"}
          onPress={() => setFilter("all")}
          style={[
            styles.chip,
            filter === "all" && { backgroundColor: "#2ecc71" },
          ]}
          textStyle={{
            color: filter === "all" ? "#fff" : "#2ecc71",
            fontWeight: "bold",
          }}
        >
          All
        </Chip>
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

                  {/* 🗑️ Individual Delete Button */}
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
});
