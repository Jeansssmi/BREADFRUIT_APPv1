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
  Searchbar,
  IconButton,
  Snackbar,
  Chip,
  Badge,
  useTheme,
} from "react-native-paper";
import firestore from "@react-native-firebase/firestore";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from "@/context/AuthContext";

// 🪄 Enable smooth animations for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ActivityLogsScreen({ navigation }) {
  const theme = useTheme();
  const { user } = useAuth();
 const [isLoading, setIsLoading] = useState(false);

  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

// 🔄 Firestore listener (smart auto-refresh)
useEffect(() => {
  setIsLoading(true);

  let query = firestore().collection("activityLog");

  // 🧩 Only apply filter when needed
  if (selectedRole !== "All") {
    query = query.where("userRole", "in", [
      selectedRole,
      selectedRole.toLowerCase(),
      selectedRole.toUpperCase(),
    ]);
  }

  const unsubscribe = query.onSnapshot(
    (snapshot) => {
      const logs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // ✅ Update state
      setActivityLogs(logs);
      setIsLoading(false);

      // Optional feedback
      if (logs.length === 0) {
        setSnackbarMessage(`ℹ️ No ${selectedRole} activity found.`);
      } else {
        setSnackbarMessage(`✅ Showing ${selectedRole} activities`);
      }
      setSnackbarVisible(true);
    },
    (error) => {
      console.error("Error fetching logs:", error);
      setSnackbarMessage("❌ Failed to fetch logs.");
      setSnackbarVisible(true);
      setIsLoading(false);
    }
  );

  return unsubscribe;
}, [selectedRole]);




  // 🧮 Count logs by role
  const counts = {
    All: activityLogs.length,
    Admin: activityLogs.filter((l) => l.userRole?.toLowerCase() === "admin").length,
    Researcher: activityLogs.filter((l) => l.userRole?.toLowerCase() === "researcher").length,
    Viewer: activityLogs.filter((l) => l.userRole?.toLowerCase() === "viewer").length,
  };

  // 🔍 Search + Filter logic
  useEffect(() => {
    const lower = searchQuery.toLowerCase();
    const filtered = activityLogs.filter((log) => {
      const matchesSearch =
        log.description?.toLowerCase().includes(lower) ||
        log.uid?.toLowerCase().includes(lower) ||
        log.userRole?.toLowerCase().includes(lower);
      const matchesRole =
        selectedRole === "All" ||
        log.userRole?.toLowerCase() === selectedRole.toLowerCase();
      return matchesSearch && matchesRole;
    });

    const sorted = [...filtered].sort((a, b) => {
      const aTime = a.timestamp?.seconds || 0;
      const bTime = b.timestamp?.seconds || 0;
      return sortOrder === "desc" ? bTime - aTime : aTime - bTime;
    });

    setFilteredLogs(sorted);
  }, [searchQuery, activityLogs, selectedRole, sortOrder]);

  const toggleSortOrder = () =>
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // 🗑️ Clear logs
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

  const getIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "create":
        return "tree";
      case "harvest":
        return "fruit-cherries";
      case "collected":
        return "package-variant-closed";
      default:
        return "account-clock-outline";
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* ✅ Appbar */}
      <Appbar.Header
        style={[
          styles.appbarHeader,
          {
            backgroundColor: theme.colors.card,
            borderBottomColor: theme.dark ? "#333" : "#eee",
          },
        ]}
      >
        <Appbar.BackAction onPress={() => navigation.goBack()} color={theme.colors.text} />
        <Appbar.Content
          title="Activity Logs"
          titleStyle={[styles.appbarTitle, { color: theme.colors.primary }]}
        />
        <IconButton
          icon={sortOrder === "desc" ? "sort-clock-descending" : "sort-clock-ascending"}
          iconColor={theme.colors.primary}
          onPress={toggleSortOrder}
        />
        {user?.role === "admin" && (
          <IconButton
            icon="delete-outline"
            iconColor={theme.colors.error || "#e74c3c"}
            onPress={handleClearLogs}
          />
        )}
      </Appbar.Header>




      {/* 🧩 Fixed Filter Buttons */}
      <View
        style={[
          styles.fixedFilterBar,
          { backgroundColor: theme.colors.card, borderBottomColor: theme.dark ? "#333" : "#ccc" },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {["All", "Admin", "Researcher", "Viewer"].map((role) => (
            <View key={role} style={{ position: "relative" }}>
              <Chip
                mode="outlined"
                onPress={() => setSelectedRole(role)}
                style={[
                  styles.roleChip,
                  {
                    borderColor: theme.colors.primary,
                    backgroundColor:
                      selectedRole === role
                        ? theme.colors.primary
                        : theme.dark
                        ? "#2a2a2a"
                        : theme.colors.background,
                  },
                ]}
                textStyle={{
                  color: selectedRole === role ? "#fff" : theme.colors.primary,
                  fontWeight: selectedRole === role ? "bold" : "normal",
                }}
              >
                {role}
              </Chip>

              {/* 🔢 Count Badge */}
              {counts[role] > 0 && (
                <Badge
                  size={18}
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        selectedRole === role ? "#fff" : theme.colors.primary,
                      color:
                        selectedRole === role ? theme.colors.primary : "#fff",
                    },
                  ]}
                >
                  {counts[role]}
                </Badge>
              )}
            </View>
          ))}
        </ScrollView>
      </View>


      {/* 🔍 Search Bar */}
      <Searchbar
        placeholder="Search activity, user, or role..."
        placeholderTextColor={theme.dark ? "#aaa" : "#666"}
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={[
          styles.searchBar,
          {
            backgroundColor: theme.dark ? "#2a2a2a" : "#f5f5f5",
            color: theme.colors.text,
          },
        ]}
        inputStyle={{ fontSize: 14, color: theme.colors.text }}
        iconColor={theme.colors.primary}
      />

      {/* 🪵 Activity Logs (below fixed filter) */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContainer, { paddingTop: 10 }]} // ensure space for fixed bar
      >
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <Card
              key={log.id}
              style={[
                styles.logCard,
                {
                  backgroundColor: theme.colors.card,
                  shadowColor: theme.dark ? "#000" : "#ccc",
                },
              ]}
            >
              <Card.Content>
                <View style={styles.logHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <MaterialCommunityIcons
                      name={getIcon(log.actionType)}
                      size={22}
                      color={theme.colors.primary}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.logText, { color: theme.colors.text }]}>
                      {log.description}
                    </Text>
                  </View>

                  <TouchableOpacity onPress={() => toggleExpand(log.id)}>
                    <MaterialCommunityIcons
                      name={expandedId === log.id ? "chevron-up" : "chevron-down"}
                      size={24}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                <Text
                  style={[styles.timestampText, { color: theme.dark ? "#aaa" : "#888" }]}
                >
                  {log.timestamp?.seconds
                    ? new Date(log.timestamp.seconds * 1000).toLocaleString()
                    : "No timestamp"}
                </Text>

                {expandedId === log.id && (
                  <View
                    style={[
                      styles.detailsContainer,
                      { backgroundColor: theme.dark ? "#2a2a2a" : "#f9f9f9" },
                    ]}
                  >
                    <Text style={[styles.detailText, { color: theme.colors.text }]}>
                      <Text style={[styles.detailLabel, { color: theme.colors.primary }]}>
                        Role:
                      </Text>{" "}
                      {log.userRole}
                    </Text>
                    <Text style={[styles.detailText, { color: theme.colors.text }]}>
                      <Text style={[styles.detailLabel, { color: theme.colors.primary }]}>
                        User ID:
                      </Text>{" "}
                      {log.uid}
                    </Text>
                    {log.treeID && (
                      <Text style={[styles.detailText, { color: theme.colors.text }]}>
                        <Text style={[styles.detailLabel, { color: theme.colors.primary }]}>
                          Tree ID:
                        </Text>{" "}
                        {log.treeID}
                      </Text>
                    )}
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        ) : (
          <Text style={[styles.noLogsText, { color: theme.dark ? "#aaa" : "#888" }]}>
            Loading...
          </Text>
        )}
      </ScrollView>

      {/* ✅ Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{ label: "OK", onPress: () => setSnackbarVisible(false) }}
        style={[styles.snackbar, { backgroundColor: theme.colors.primary }]}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  appbarHeader: { elevation: 0, borderBottomWidth: 1 },
  appbarTitle: { fontSize: 20, fontWeight: "bold" },

  // ✅ Moved search bar below filter buttons
  searchBar: {
    marginHorizontal: 12,
    marginTop: 50, // space below fixed filter bar
    marginBottom: 20, // space before first log
    elevation: 0,
    borderRadius: 10,
  },

  // ✅ Filter bar now sits at very top (under Appbar)
  fixedFilterBar: {
    position: "absolute",
    top: 60, // directly under Appbar
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomWidth: 1,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 3,
  },

  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 10,
  },
  roleChip: { borderRadius: 8 },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
  },
  scrollContainer: {
    paddingHorizontal: 15,
    paddingBottom: 100,
  },
  logCard: {
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logText: { fontSize: 15, flexShrink: 1 },
  timestampText: { fontSize: 12, marginTop: 4, marginLeft: 30 },
  detailsContainer: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
  },
  detailText: { fontSize: 13, marginTop: 2 },
  detailLabel: { fontWeight: "bold" },
  noLogsText: { textAlign: "center", marginTop: 40, fontSize: 15 },
  snackbar: { margin: 10, borderRadius: 8 },
});
