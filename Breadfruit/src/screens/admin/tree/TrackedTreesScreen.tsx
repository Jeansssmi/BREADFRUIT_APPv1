// ✅ TrackedTreesScreen.tsx
import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { ActivityIndicator, Card, Text } from "react-native-paper";
import { useRoute, useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTreeData } from "@/hooks/useTreeData";

export default function TrackedTreesScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  // @ts-ignore
  const { userID } = route.params;

  const { trees, isLoading, error } = useTreeData({
    mode: "criteria",
    field: "trackedBy",
    operator: "==",
    value: userID,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>Error loading trees: {error}</Text>
      </View>
    );
  }

  if (trees.length === 0) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="tree-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>No tracked trees found for this user.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      {trees.map((tree) => (
        <Card key={tree.treeID} style={styles.card}>
          <Card.Content>
            <Text style={styles.title}>{tree.species || "Unknown Tree"}</Text>
            <Text style={styles.subtitle}>
              📏 Diameter: {tree.diameter || "N/A"} cm | 🌳 Height: {tree.height || "N/A"} m
            </Text>
            <Text style={styles.location}>
              📍 {tree.latitude?.toFixed(4)}, {tree.longitude?.toFixed(4)}
            </Text>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8fa" },
  scrollContainer: { padding: 16 },
  card: { marginBottom: 12, borderRadius: 10, elevation: 2 },
  title: { fontWeight: "bold", fontSize: 18, color: "#2ecc71" },
  subtitle: { fontSize: 14, color: "#555", marginTop: 4 },
  location: { fontSize: 13, color: "#888", marginTop: 6 },
  emptyText: { fontSize: 16, color: "#666", marginTop: 8 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
