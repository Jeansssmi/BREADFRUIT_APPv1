import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ActivityIndicator, Card, Text } from "react-native-paper";
import firestore from "@react-native-firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

export default function HarvestListScreen() {
  const { user: currentUser } = useAuth();
  const [trees, setTrees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

 const fetchTrees = useCallback(() => {
   if (!currentUser) return;

   setLoading(true);

   let query = firestore()
     .collection("trees")
     .where("status", "==", "harvest-ready");

   // 🧩 Researchers only see their own trees
   if (currentUser.role === "researcher") {
     query = query.where("trackedById", "==", currentUser.uid);
   }

   const unsubscribe = query.onSnapshot(
     (snapshot) => {
       // ✅ Fetch all docs, then sort locally (newest first)
       const data = snapshot.docs
         .map((doc) => ({
           id: doc.id,
           ...doc.data(),
         }))
         .sort((a, b) => {
           const aDate = a.createdAt?.toDate?.() || new Date(0);
           const bDate = b.createdAt?.toDate?.() || new Date(0);
           return bDate - aDate; // newest first
         });

       setTrees(data);
       setLoading(false);
       setRefreshing(false);
     },
     (error) => {
       console.error("Error fetching trees:", error);
       setLoading(false);
       setRefreshing(false);
     }
   );

   return unsubscribe;
 }, [currentUser]);



  // ✅ Refresh manually
  const handleRefresh = async () => {
    setRefreshing(true);
    fetchTrees();
  };
const handleMarkAsHarvested = async (treeId: string) => {
  Alert.alert("Confirm", "Mark this tree as harvested?", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Yes, Confirm",
      onPress: async () => {
        try {
          const timestamp = firestore.FieldValue.serverTimestamp();

          // 🔹 Update only allowed fields
          await firestore().collection("trees").doc(treeId).update({
            status: "harvested",
            harvestedAt: timestamp,
          });

          // 🔹 Log activity
          await firestore().collection("activityLog").add({
            actionType: "harvest",
            description: `Tree (${treeId}) marked as harvested.`,
            uid: currentUser?.uid,
            userRole: currentUser?.role || "researcher",
            timestamp,
          });

          Alert.alert("Success", "Tree marked as harvested!");
        } catch (error: any) {
          console.error("Error updating tree:", error);
          Alert.alert("Error", error.message || "Failed to update tree status.");
        }
      },
    },
  ]);
};

const handleMarkAsCollected = async (treeId: string, trackedById: string) => {
  Alert.alert("Confirm", "Mark this tree as collected?", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Yes, Confirm",
      onPress: async () => {
        try {
          const timestamp = firestore.FieldValue.serverTimestamp();

          // 🔹 Update tree status
          await firestore().collection("trees").doc(treeId).update({
            status: "collected",
            collectedAt: timestamp,
            collectedBy: currentUser?.displayName || currentUser?.name || "Admin",
          });

          // 🔹 Log activity (for dashboard)
          await firestore().collection("activityLog").add({
            actionType: "collect",
            description: `🌿 ${currentUser?.displayName || "An admin"} marked tree (${treeId}) as collected.`,
            uid: currentUser?.uid,
            userRole: currentUser?.role || "admin",
            timestamp,
          });

          // 🔹 Notify researcher
          if (trackedById) {
            await firestore().collection("notifications").add({
              title: "🌿 Tree Collected",
              message: `Your tree (${treeId}) has been collected by an admin.`,
              recipientID: trackedById,
              recipientRole: "researcher",
              timestamp,
              seen: false,
            });
          }

          Alert.alert("Success", "Tree marked as collected!");
        } catch (error: any) {
          console.error("Error updating tree:", error);
          Alert.alert("Error", error.message || "Failed to update tree status.");
        }
      },
    },
  ]);
};


  useEffect(() => {
    const unsubscribe = fetchTrees();
    return () => unsubscribe && unsubscribe();
  }, [fetchTrees]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  if (trees.length === 0) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="fruit-cherries" size={50} color="#ccc" />
        <Text style={styles.emptyText}>No harvest-ready trees found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={trees}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]}>
                <MaterialCommunityIcons name="image-off" size={40} color="#888" />
              </View>
            )}
            <Card.Content>
              <Text style={styles.treeId}>{item.treeID}</Text>
              <Text style={styles.treeLocation}>
                {item.city}, {item.barangay}
              </Text>
              <Text style={styles.statusLabel}>Status: {item.status}</Text>

              {/* ✅ Role-based buttons */}
              {currentUser?.role === "researcher" && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#2ecc71" }]}
                  onPress={() => handleMarkAsHarvested(item.id)}
                >
                  <Text style={styles.actionButtonText}>Mark as Harvested</Text>
                </TouchableOpacity>
              )}

              {currentUser?.role === "admin" && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#27ae60" }]}
                  onPress={() => handleMarkAsCollected(item.id, item.trackedById)}
                >
                  <Text style={styles.actionButtonText}>Mark as Collected</Text>
                </TouchableOpacity>
              )}
            </Card.Content>
          </Card>
        )}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { marginTop: 10, color: "#666", fontSize: 16 },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 180,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  imagePlaceholder: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  treeId: { fontWeight: "bold", fontSize: 16, color: "#2ecc71", marginTop: 8 },
  treeLocation: { color: "#555", fontSize: 14, marginTop: 4 },
  statusLabel: { color: "#999", marginTop: 4 },
  actionButton: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});
