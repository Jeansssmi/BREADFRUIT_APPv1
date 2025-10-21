import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
} from "react-native";
import {
  Appbar,
  Card,
  Text,
  ActivityIndicator,
  Menu,
  Button,
} from "react-native-paper";
import firestore from "@react-native-firebase/firestore";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

export default function ActivityLogsScreen({ navigation }: any) {
  const [activities, setActivities] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedResearcher, setSelectedResearcher] = useState("All Researchers");
  const [researchers, setResearchers] = useState<any[]>([]);

  // ✅ Fetch researchers for filter dropdown
  useEffect(() => {
    const unsub = firestore()
      .collection("users")
      .where("role", "==", "researcher")
      .onSnapshot((snap) => {
        const users = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setResearchers(users);
      });
    return () => unsub();
  }, []);

  // ✅ Fetch all researcher activity logs
  useEffect(() => {
    const unsubscribe = firestore()
      .collection("activityLog")
      .orderBy("timestamp", "desc")
      .onSnapshot(
        (snapshot) => {
          const data = snapshot.docs.map((doc) => {
            const raw = doc.data();
            const tsDate = raw.timestamp?.toDate
              ? raw.timestamp.toDate()
              : new Date(raw.timestamp);
            return { id: doc.id, ...raw, timestampDate: tsDate };
          });
          setActivities(data);
          setFiltered(data);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching activity logs:", error);
          setLoading(false);
        }
      );
    return () => unsubscribe();
  }, []);

  // ✅ Apply search and filter
  useEffect(() => {
    let result = activities;

    if (selectedResearcher !== "All Researchers") {
      result = result.filter((a) => a.userName === selectedResearcher);
    }

    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.description?.toLowerCase().includes(lower) ||
          a.userName?.toLowerCase().includes(lower)
      );
    }

    setFiltered(result);
  }, [searchQuery, activities, selectedResearcher]);

  // ✅ Group by date
  const groupActivities = (items: any[]) => {
    const grouped: any = {};
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    items.forEach((act) => {
      const dateStr = act.timestampDate?.toDateString();
      let label = "";
      const diffInDays = Math.floor(
        (now.getTime() - act.timestampDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dateStr === today) label = "Today";
      else if (dateStr === yesterdayStr) label = "Yesterday";
      else if (diffInDays <= 7) label = "Earlier this week";
      else label = "Older";

      if (!grouped[label]) grouped[label] = [];
      grouped[label].push(act);
    });

    return grouped;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "tree_added":
        return { icon: "tree-outline", color: "#27ae60", label: "Tree Added" };
      case "harvest_ready":
        return {
          icon: "fruit-grapes-outline",
          color: "#f39c12",
          label: "Harvest Ready",
        };
      case "harvested":
        return { icon: "fruit-pineapple", color: "#2ecc71", label: "Harvested" };
      case "collected":
        return { icon: "basket-outline", color: "#3498db", label: "Collected" };
      case "verified":
        return { icon: "check-decagram", color: "#16a085", label: "Verified" };
      case "deleted":
        return { icon: "delete-outline", color: "#e74c3c", label: "Deleted" };
      default:
        return {
          icon: "file-document-outline",
          color: "#7f8c8d",
          label: "General Activity",
        };
    }
  };

  const grouped = groupActivities(filtered);

  return (
    <View style={styles.container}>
      {/* ✅ Header */}
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Activity Logs" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      {/* ✅ Search + Filter */}
      <View style={styles.filterRow}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#888" />
          <TextInput
            placeholder="Search activity..."
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setMenuVisible(true)}
              style={styles.filterButton}
              textColor="#2ecc71"
            >
              {selectedResearcher.length > 15
                ? selectedResearcher.slice(0, 15) + "..."
                : selectedResearcher}
            </Button>
          }
        >
          <Menu.Item
            title="All Researchers"
            onPress={() => {
              setSelectedResearcher("All Researchers");
              setMenuVisible(false);
            }}
          />
          {researchers.map((r) => (
            <Menu.Item
              key={r.id}
              title={r.name}
              onPress={() => {
                setSelectedResearcher(r.name);
                setMenuVisible(false);
              }}
            />
          ))}
        </Menu>
      </View>

      {/* ✅ Logs */}
      <ScrollView style={styles.scroll}>
        {loading ? (
          <ActivityIndicator animating={true} color="#2ecc71" />
        ) : filtered.length === 0 ? (
          <Text style={{ textAlign: "center", color: "#888", marginTop: 30 }}>
            No activity found.
          </Text>
        ) : (
          Object.keys(grouped).map((section) => (
            <View key={section} style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>{section}</Text>
              {grouped[section].map((item: any) => {
                const info = getActivityIcon(item.type);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setSelectedActivity(item);
                      setModalVisible(true);
                    }}
                  >
                    <Card style={styles.activityCard}>
                      <Card.Content style={styles.activityRow}>
                        <MaterialCommunityIcons
                          name={info.icon}
                          size={22}
                          color={info.color}
                        />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.activityDescription}>
                            {item.description}
                          </Text>
                          <Text style={styles.activitySub}>
                            {item.userName || "Unknown"} •{" "}
                            {item.timestampDate.toLocaleString()}
                          </Text>
                        </View>
                      </Card.Content>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      {/* ✅ Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {selectedActivity && (() => {
              const info = getActivityIcon(selectedActivity.type);
              return (
                <>
                  <MaterialCommunityIcons
                    name={info.icon}
                    size={40}
                    color={info.color}
                    style={{ alignSelf: "center", marginBottom: 10 }}
                  />
                  <Text
                    style={{
                      textAlign: "center",
                      fontWeight: "bold",
                      color: info.color,
                      marginBottom: 10,
                      fontSize: 16,
                    }}
                  >
                    {info.label}
                  </Text>
                </>
              );
            })()}

            <Text style={styles.modalLabel}>Description:</Text>
            <Text style={styles.modalText}>
              {selectedActivity?.description || "N/A"}
            </Text>

            <Text style={styles.modalLabel}>Date & Time:</Text>
            <Text style={styles.modalText}>
              {selectedActivity?.timestampDate
                ? selectedActivity.timestampDate.toLocaleString()
                : "N/A"}
            </Text>

            {selectedActivity?.userName && (
              <>
                <Text style={styles.modalLabel}>Performed By:</Text>
                <Text style={styles.modalText}>
                  {selectedActivity.userName}
                </Text>
              </>
            )}

            {selectedActivity?.locationCity && (
              <>
                <Text style={styles.modalLabel}>Location:</Text>
                <Text style={styles.modalText}>
                  {selectedActivity.locationCity},{" "}
                  {selectedActivity.barangay || ""}
                </Text>
              </>
            )}

            <Pressable
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: { fontWeight: "bold", color: "#2ecc71", fontSize: 20 },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    margin: 10,
    gap: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
  },
  searchInput: { flex: 1, paddingVertical: 8, marginLeft: 8, color: "#333" },
  filterButton: { borderColor: "#2ecc71", borderRadius: 8, height: 45 },
  scroll: { paddingHorizontal: 12 },
  sectionContainer: { marginTop: 10 },
  sectionTitle: {
    fontWeight: "bold",
    color: "#2ecc71",
    marginBottom: 6,
    marginTop: 8,
  },
  activityCard: {
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#fff",
    elevation: 1,
  },
  activityRow: { flexDirection: "row", alignItems: "center" },
  activityDescription: { fontWeight: "500", color: "#333" },
  activitySub: { color: "#888", fontSize: 12, marginTop: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "85%",
  },
  modalLabel: { fontWeight: "bold", color: "#444", marginTop: 8 },
  modalText: { color: "#555", marginBottom: 4 },
  closeButton: {
    backgroundColor: "#2ecc71",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
});
