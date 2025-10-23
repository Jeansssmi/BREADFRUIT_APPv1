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
  useTheme, // ✅ Import useTheme
} from "react-native-paper";
import firestore from "@react-native-firebase/firestore";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from "@/context/AuthContext";

// 🪄 Enable smooth animations for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ActivityLogsScreen({ navigation }) {
  const theme = useTheme(); // ✅ Access theme
  const { user } = useAuth();

  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // 🔄 Firestore listener
  useEffect(() => {
    let query = firestore().collection("activityLog").orderBy("timestamp", sortOrder);
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

  // 🔍 Search filter
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

  const toggleSortOrder = () => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // 🗑️ Admin-only clear logs
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* ✅ Appbar */}
      <Appbar.Header
        style={[
          styles.appbarHeader,
          { backgroundColor: theme.colors.card, borderBottomColor: theme.dark ? "#333" : "#eee" },
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

      {/* 🔍 Search & Filter */}
      <View style={styles.searchFilterContainer}>
        <Searchbar
          placeholder="Search researcher, role, or tree ID..."
          placeholderTextColor={theme.dark ? "#aaa" : "#666"}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[
            styles.searchBar,
            { backgroundColor: theme.dark ? "#2a2a2a" : "#f5f5f5", color: theme.colors.text },
          ]}
          inputStyle={{ fontSize: 14, color: theme.colors.text }}
          iconColor={theme.colors.primary}
        />

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              icon="filter-variant"
              onPress={() => setMenuVisible(true)}
              textColor={theme.colors.primary}
              style={[styles.filterButton, { borderColor: theme.colors.primary }]}
            >
              {getFilterLabel()}
            </Button>
          }
        >
          <Menu.Item onPress={() => { setFilter("all"); setMenuVisible(false); }} title="All Activity" />
          <Menu.Item onPress={() => { setFilter("create"); setMenuVisible(false); }} title="Created Trees" />
          <Menu.Item onPress={() => { setFilter("harvest"); setMenuVisible(false); }} title="Harvested Trees" />
          <Menu.Item onPress={() => { setFilter("collected"); setMenuVisible(false); }} title="Collected Trees" />
        </Menu>
      </View>

      {/* 🪵 Activity Logs */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <Card
              key={log.id}
              style={[
                styles.logCard,
                { backgroundColor: theme.colors.card, shadowColor: theme.dark ? "#000" : "#ccc" },
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
                    <Text style={[styles.logText, { color: theme.colors.text }]}>{log.description}</Text>
                  </View>

                  <TouchableOpacity onPress={() => toggleExpand(log.id)}>
                    <MaterialCommunityIcons
                      name={expandedId === log.id ? "chevron-up" : "chevron-down"}
                      size={24}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                {(() => {
                  let dateValue = null;
                  const ts = log.timestamp;

                  if (ts) {
                    if (typeof ts.toDate === "function") dateValue = ts.toDate();
                    else if (typeof ts === "number") dateValue = new Date(ts);
                    else if (typeof ts === "string") dateValue = new Date(ts);
                    else if (ts.seconds) dateValue = new Date(ts.seconds * 1000);
                  }

                  return (
                    <Text style={[styles.timestampText, { color: theme.dark ? "#aaa" : "#888" }]}>
                      {dateValue ? dateValue.toLocaleString() : "No timestamp"}
                    </Text>
                  );
                })()}

                {expandedId === log.id && (
                  <View
                    style={[
                      styles.detailsContainer,
                      { backgroundColor: theme.dark ? "#2a2a2a" : "#f9f9f9" },
                    ]}
                  >
                    {log.userRole && (
                      <Text style={[styles.detailText, { color: theme.colors.text }]}>
                        <Text style={[styles.detailLabel, { color: theme.colors.primary }]}>
                          Role:
                        </Text>{" "}
                        {log.userRole}
                      </Text>
                    )}
                    {log.uid && (
                      <Text style={[styles.detailText, { color: theme.colors.text }]}>
                        <Text style={[styles.detailLabel, { color: theme.colors.primary }]}>
                          User ID:
                        </Text>{" "}
                        {log.uid}
                      </Text>
                    )}
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
            No logs found.
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

// 🎨 Styles (unchanged layout)
const styles = StyleSheet.create({
  container: { flex: 1 },
  appbarHeader: {
    elevation: 0,
    borderBottomWidth: 1,
  },
  appbarTitle: { fontSize: 20, fontWeight: "bold" },
  searchFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    elevation: 0,
    height: 40,
    borderRadius: 8,
  },
  filterButton: {
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
  },
  scrollContainer: { padding: 15 },
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
