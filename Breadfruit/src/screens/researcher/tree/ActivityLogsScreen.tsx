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
  Button,
} from "react-native-paper";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

export default function ResearcherActivityLogsScreen({ navigation }: any) {
  const [activities, setActivities] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsubscribe = firestore()
      .collection("activityLog")
      .where("userId", "==", auth().currentUser?.uid)
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
          console.error("Error fetching logs:", error);
          setLoading(false);
        }
      );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      setFiltered(
        activities.filter((a) =>
          a.description?.toLowerCase().includes(lower)
        )
      );
    } else {
      setFiltered(activities);
    }
  }, [searchQuery, activities]);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="My Activity Logs" titleStyle={styles.headerTitle} />
      </Appbar.Header>

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

      <ScrollView style={styles.scroll}>
        {loading ? (
          <ActivityIndicator animating={true} color="#2ecc71" />
        ) : filtered.length === 0 ? (
          <Text style={{ textAlign: "center", color: "#888", marginTop: 30 }}>
            No activity found.
          </Text>
        ) : (
          filtered.map((item: any) => (
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
                    name="clock-outline"
                    size={22}
                    color="#2ecc71"
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.activityDescription}>
                      {item.description}
                    </Text>
                    <Text style={styles.activitySub}>
                      {item.timestampDate.toLocaleString()}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* ✅ Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {selectedActivity?.description || "Activity Details"}
            </Text>
            <Text style={styles.modalText}>
              {selectedActivity?.timestampDate?.toLocaleString()}
            </Text>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
  },
  searchInput: { flex: 1, paddingVertical: 8, marginLeft: 8, color: "#333" },
  scroll: { paddingHorizontal: 12 },
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
  modalTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 8 },
  modalText: { color: "#555" },
  closeButton: {
    backgroundColor: "#2ecc71",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
});
