import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  Appbar,
  Card,
  Text,
  Menu,
  Button,
  Searchbar,
  IconButton,
  Snackbar,
} from "react-native-paper";
import firestore from "@react-native-firebase/firestore";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from "@/context/AuthContext"; // ✅ Access user role

// 🪄 Enable smooth animations for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ActivityLogsScreen({ navigation }) {
  const { user } = useAuth(); // ✅ Get current user (for role)
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // 🔄 Firestore live listener
  useEffect(() => {
    let query = firestore()
      .collection("activityLog")
      .orderBy("timestamp", sortOrder);

    if (filter !== "all") query = query.where("actionType", "==", filter);

    const unsubscribe = query.onSnapshot(
      (snapshot) => {
        const logs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setActivityLogs(logs);
      },
      (error) => console.error("Error fetching logs:", error)
    );

    return unsubscribe;
  }, [filter, sortOrder]);

  // 🔍 Filter search results
  useEffect(() => {
    const lower = searchQuery.toLowerCase();
    setFilteredLogs(
      activityLogs.filter(
        (log) =>
          log.description?.toLowerCase().includes(lower) ||
          log.uid?.toLowerCase().includes(lower) ||
          log.userRole?.toLowerCase().includes(lower)
      )
    );
  }, [searchQuery, activityLogs]);

  // 🔁 Sorting & expand toggle
  const toggleSortOrder = () =>
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // 🗑️ Clear all logs (Admin only)
  const handleClearLogs = async () => {
    Alert.alert("Confirm", "Are you sure you want to delete all activity logs?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes, Delete All",
        style: "destructive",
        onPress: async () => {
          try {
            const snapshot = await firestore().collection("activityLog").get();
            const batch = firestore().batch();
            snapshot.docs.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();

            setSnackbarMessage("✅ All logs cleared successfully!");
            setSnackbarVisible(true);
          } catch (error) {
            console.error("Error clearing logs:", error);
            setSnackbarMessage("❌ Failed to clear logs.");
            setSnackbarVisible(true);
          }
        },
      },
    ]);
  };

  // 🧭 Helpers
  const getIcon = (type: string) => {
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

  const getFilterLabel = () => {
    switch (filter) {
      case "create":
        return "Created";
      case "harvest":
        return "Harvested";
      case "collected":
        return "Collected";
      default:
        return "All Activity";
    }
  };

  return (
    <View style={styles.container}>
      {/* ✅ Appbar */}
      <Appbar.Header style={styles.appbarHeader}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Activity Logs" titleStyle={styles.appbarTitle} />

        <IconButton
          icon={
            sortOrder === "desc"
              ? "sort-clock-descending"
              : "sort-clock-ascending"
          }
          iconColor="#2ecc71"
          onPress={toggleSortOrder}
        />

        {/* 🗑️ Admin Only Delete Button */}
        {user?.role === "admin" && (
          <IconButton
            icon="delete-outline"
            iconColor="#e74c3c"
            onPress={handleClearLogs}
          />
        )}
      </Appbar.Header>

      {/* 🔍 Search & Filter */}
      <View style={styles.searchFilterContainer}>
        <Searchbar
          placeholder="Search researcher, role, or tree ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
          inputStyle={{ fontSize: 14 }}
        />

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              icon="filter-variant"
              onPress={() => setMenuVisible(true)}
              textColor="#2ecc71"
              style={styles.filterButton}
            >
              {getFilterLabel()}
            </Button>
          }
        >
          <Menu.Item
            onPress={() => {
              setFilter("all");
              setMenuVisible(false);
            }}
            title="All Activity"
          />
          <Menu.Item
            onPress={() => {
              setFilter("create");
              setMenuVisible(false);
            }}
            title="Created Trees"
          />
          <Menu.Item
            onPress={() => {
              setFilter("harvest");
              setMenuVisible(false);
            }}
            title="Harvested Trees"
          />
          <Menu.Item
            onPress={() => {
              setFilter("collected");
              setMenuVisible(false);
            }}
            title="Collected Trees"
          />
        </Menu>
      </View>

      {/* 🪵 Activity Logs */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <Card key={log.id} style={styles.logCard}>
              <Card.Content>
                <View style={styles.logHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <MaterialCommunityIcons
                      name={getIcon(log.actionType)}
                      size={22}
                      color="#2ecc71"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.logText}>{log.description}</Text>
                  </View>

                  <TouchableOpacity onPress={() => toggleExpand(log.id)}>
                    <MaterialCommunityIcons
                      name={
                        expandedId === log.id ? "chevron-up" : "chevron-down"
                      }
                      size={24}
                      color="#2ecc71"
                    />
                  </TouchableOpacity>
                </View>

                {(() => {
                  let dateValue = null;

                  if (log.timestamp) {
                    const ts = log.timestamp;

                    // Handle Firestore Timestamp
                    if (typeof ts.toDate === "function") {
                      try {
                        dateValue = ts.toDate();
                      } catch (e) {
                        dateValue = null;
                      }
                    }
                    // Handle numeric milliseconds
                    else if (typeof ts === "number") {
                      dateValue = new Date(ts);
                    }
                    // Handle ISO strings
                    else if (typeof ts === "string") {
                      const parsed = new Date(ts);
                      if (!isNaN(parsed.getTime())) dateValue = parsed;
                    }
                    // Handle object with seconds/nanoseconds
                    else if (ts.seconds && typeof ts.seconds === "number") {
                      dateValue = new Date(ts.seconds * 1000 + (ts.nanoseconds ? ts.nanoseconds / 1e6 : 0));
                    }
                  }

                  return dateValue ? (
                    <Text style={styles.timestampText}>{dateValue.toLocaleString()}</Text>
                  ) : (
                    <Text style={styles.timestampText}>No timestamp</Text>
                  );
                })()}


                {expandedId === log.id && (
                  <View style={styles.detailsContainer}>
                    {log.userRole && (
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Role:</Text> {log.userRole}
                      </Text>
                    )}
                    {log.uid && (
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>User ID:</Text> {log.uid}
                      </Text>
                    )}
                    {log.treeID && (
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Tree ID:</Text> {log.treeID}
                      </Text>
                    )}
                    {log.coordinates && (
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Coordinates:</Text>{" "}
                        {log.coordinates.latitude}, {log.coordinates.longitude}
                      </Text>
                    )}
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        ) : (
          <Text style={styles.noLogsText}>No logs found.</Text>
        )}
      </ScrollView>

      {/* ✅ Snackbar Notification */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: "OK",
          onPress: () => setSnackbarVisible(false),
        }}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

// 🎨 Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  appbarHeader: {
    backgroundColor: "#fff",
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  appbarTitle: { fontSize: 20, fontWeight: "bold", color: "#2ecc71" },
  searchFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    elevation: 0,
    height: 40,
    borderRadius: 8,
  },
  filterButton: {
    borderColor: "#2ecc71",
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
  },
  scrollContainer: { padding: 15 },
  logCard: {
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
    backgroundColor: "#fff",
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logText: { fontSize: 15, color: "#333", flexShrink: 1 },
  timestampText: {
    color: "#888",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 30,
  },
  detailsContainer: {
    marginTop: 10,
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
  },
  detailText: { fontSize: 13, color: "#444", marginTop: 2 },
  detailLabel: { fontWeight: "bold", color: "#2ecc71" },
  noLogsText: {
    textAlign: "center",
    color: "#888",
    marginTop: 40,
    fontSize: 15,
  },
  snackbar: {
    backgroundColor: "#2ecc71",
    margin: 10,
    borderRadius: 8,
  },
});
