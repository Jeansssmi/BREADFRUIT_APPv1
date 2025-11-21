import React, { useState, useEffect } from "react";
import { View, ScrollView, Image, StyleSheet } from "react-native";
import { ActivityIndicator, Button, Card, Text } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import firestore from "@react-native-firebase/firestore";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

export default function RejectedDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { treeID } = route.params;

  const [tree, setTree] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection("trees")
      .doc(treeID)
      .onSnapshot((doc) => {
        if (doc.exists) setTree({ id: doc.id, ...doc.data() });
        setLoading(false);
      });

    return () => unsubscribe();
  }, [treeID]);

  const formatDate = (dateTracked: any) => {
    if (!dateTracked) return "N/A";
    if (dateTracked.toDate) return dateTracked.toDate().toLocaleDateString();
    if (typeof dateTracked === "string")
      return new Date(dateTracked).toLocaleDateString();
    return "N/A";
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e74c3c" />
      </View>
    );

  if (!tree)
    return (
      <View style={styles.center}>
        <Text>No rejected tree found.</Text>
      </View>
    );

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {tree.image ? (
          <Image source={{ uri: tree.image }} style={styles.treeImage} />
        ) : (
          <View style={[styles.treeImage, styles.imagePlaceholder]}>
            <MaterialIcons name="no-photography" size={40} color="#666" />
          </View>
        )}

        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.title}>
              {tree.treeID}
            </Text>

            <View style={styles.detailRow}>
              <MaterialIcons name="location-on" size={20} color="#e74c3c" />
              <Text style={styles.detailText}>
                {tree.city}, {tree.barangay}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="tag" size={20} color="#e74c3c" />
              <Text style={styles.detailText}>
                Tracked by: {tree.trackedBy || "Unknown"}
              </Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Diameter</Text>
                <Text style={styles.statValue}>
                  {tree.diameter?.toFixed(2) || "N/A"} m
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Fruit Status</Text>
                <Text style={styles.statValue}>{tree.fruitStatus}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Tracked Date</Text>
                <Text style={styles.statValue}>
                  {formatDate(tree.dateTracked)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="close-circle" size={22} color="#e74c3c" />
              <Text style={[styles.detailText, { color: "#e74c3c" }]}>
                Rejected by Admin
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={[styles.button, { backgroundColor: "#e74c3c" }]}
        >
          Back to Notifications
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  treeImage: { height: 300, borderRadius: 12, marginBottom: 16 },
  imagePlaceholder: { backgroundColor: "#eee", justifyContent: "center", alignItems: "center" },
  detailsCard: { borderRadius: 12, marginBottom: 16, elevation: 2 },
  title: { marginBottom: 20, color: "#e74c3c", fontWeight: "bold" },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
  detailText: { fontSize: 16, color: "#333" },
  statsContainer: { flexDirection: "row", justifyContent: "space-between", marginVertical: 16, gap: 12 },
  statItem: { flex: 1, alignItems: "center", backgroundColor: "#f9f9f9", borderRadius: 8, padding: 12 },
  statLabel: { fontSize: 14, color: "#666", marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: "600", color: "#333" },
  button: { borderRadius: 25, marginTop: 10 },
});
