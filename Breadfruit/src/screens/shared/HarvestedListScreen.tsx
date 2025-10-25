import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  View,
  Pressable,
} from "react-native";
import { ActivityIndicator, Card, Text } from "react-native-paper";
import firestore from "@react-native-firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";

export default function HarvestedListScreen() {
  const { user: currentUser } = useAuth();
  const navigation = useNavigation<any>();

  const [trees, setTrees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // ✅ Real-time listener (no need to refresh)
    let query = firestore().collection("trees").where("status", "==", "harvested");

    // ✅ Researchers only see their own harvested trees
    if (currentUser?.role === "researcher") {
      query = query.where("trackedById", "==", currentUser.uid);
    }

    const unsubscribe = query.onSnapshot(
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTrees(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching harvested trees:", error);
        setLoading(false);
      }
    );

    // ✅ Cleanup listener on unmount
    return () => unsubscribe();
  }, [currentUser]);

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
        <Text style={styles.emptyText}>No harvested trees found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={trees}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate("TreeList", {
                treeID: item.treeID, // ✅ Pass only this treeID
              })
            }
          >
            <Card style={styles.card}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                  <MaterialCommunityIcons
                    name="image-off"
                    size={40}
                    color="#888"
                  />
                </View>
              )}
              <Card.Content>
                <Text style={styles.treeId}>{item.treeID || "Unknown ID"}</Text>
                {item.city && item.barangay && (
                  <Text style={styles.treeLocation}>
                    {item.barangay}, {item.city}
                  </Text>
                )}
                <Text style={styles.statusLabel}>Status: {item.status}</Text>

                {item.harvestedAt && item.harvestedAt.toDate ? (
                  <Text style={styles.harvestedDate}>
                    Date: {item.harvestedAt.toDate().toLocaleString()}
                  </Text>
                ) : (
                  <Text style={styles.harvestedDate}>Date: N/A</Text>
                )}
              </Card.Content>
            </Card>
          </Pressable>
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
  treeId: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#2ecc71",
    marginTop: 8,
  },
  treeLocation: { color: "#555", fontSize: 14, marginTop: 4 },
  statusLabel: { color: "#999", marginTop: 4 },
  harvestedDate: { color: "#555", marginTop: 2, fontStyle: "italic" },
});
