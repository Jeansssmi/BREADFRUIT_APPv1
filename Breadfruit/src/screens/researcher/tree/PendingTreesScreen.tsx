import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { FAB, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import firestore from "@react-native-firebase/firestore";
import TreeCard from "@/components/TreeCard";
import { useAuth } from "@/context/AuthContext"; // Import useAuth

export default function PendingTreesScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth(); // Get current user
  const [trees, setTrees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setError("You must be logged in to view this page.");
      setIsLoading(false);
      return;
    }

    // Base query for pending trees
    let query = firestore().collection("trees").where("status", "==", "pending");

    // ✅ If the user is a researcher, add another filter to only show their own trees
    if (user.role === "researcher") {
      query = query.where("trackedBy", "==", user.name);
    }

const unsubscribe = query.onSnapshot(
      (snapshot) => {
        const data: any[] = [];
        snapshot.forEach((doc) => {
          const treeData = doc.data();
          data.push({
            id: doc.id,
            city: treeData.city || "Unknown City",
            barangay: treeData.barangay || "Unknown Barangay",
            location: treeData.location || null,
            ...treeData,
          });
        });
        setTrees(data);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching pending trees:", err);
        setError("Failed to fetch data. Check permissions.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);


  if (error) {
    return <View style={styles.container}><Text style={styles.errorText}>{error}</Text></View>;
  }

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2ecc71" /></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {trees.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No pending trees found.</Text>
          </View>
        ) : (
          <FlatList
            data={trees}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TreeCard
                tree={item}
                onPress={() => navigation.navigate("PendingDetails", { treeID: item.id })}
              />
            )}
            contentContainerStyle={styles.listContent}
          />
        )}

      </View>
    </SafeAreaView>
  );
}

// --- Styles remain the same ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#ffffff" },
  container: { flex: 1, padding: 20, backgroundColor: "#ffffff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "#e74c3c", fontSize: 16, textAlign: "center" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyText: { fontSize: 16, color: "#888", textAlign: "center" },
  listContent: { paddingBottom: 80 },
  fab: { position: "absolute", margin: 16, right: 0, bottom: 0, backgroundColor: "#2ecc71", borderRadius: 50 },
});