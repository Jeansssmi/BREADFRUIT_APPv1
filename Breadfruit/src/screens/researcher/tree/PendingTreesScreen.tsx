import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { FAB, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import firestore from "@react-native-firebase/firestore";
import TreeCard from "@/components/TreeCard";
import { useAuth } from "@/context/AuthContext";

// ⭐ Use YOUR ThemeContext (manual dark mode)
import { useTheme } from "../../../context/ThemeContext";

// Appbar MUST come from RNP
import { Appbar } from "react-native-paper";

export default function PendingTreesScreen() {
  const navigation = useNavigation<any>();
  const { params } = useRoute<any>();
  const { user } = useAuth();

  // ⭐ Your dark-mode
  const { dark } = useTheme();

  // ⭐ Custom color system (same as TreeManagement & TreeList)
  const bgColor = dark ? "#000000" : "#FFFFFF";
  const cardColor = dark ? "#111111" : "#FFFFFF";
  const textColor = dark ? "#FFFFFF" : "#333333";
  const textSub = dark ? "#AAAAAA" : "#888888";
  const borderColor = dark ? "#333" : "#eee";
  const primary = "#2ecc71";

  const [trees, setTrees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const researcherId = params?.researcherId || user?.uid;

    if (!researcherId) {
      setError("User not found or invalid researcher ID.");
      setIsLoading(false);
      return;
    }

    const query = firestore()
      .collection("trees")
      .where("trackedById", "==", researcherId)
      .where("status", "==", "pending");

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
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <Text style={[styles.errorText, { color: "#e74c3c" }]}>{error}</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>

      {/* ⭐ APPBAR */}
      <Appbar.Header
        style={{
          backgroundColor: cardColor,
          borderBottomWidth: 1,
          borderBottomColor: borderColor,
        }}
      >
        <Appbar.BackAction
          onPress={() => navigation.navigate("TreeManagement")}
          color={textColor}
        />
        <Appbar.Content title="Pending Trees" titleStyle={{ color: textColor }} />
      </Appbar.Header>

      {/* ⭐ CONTENT */}
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
        <View style={[styles.container, { backgroundColor: bgColor }]}>

          {trees.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: textSub }]}>
                No pending trees found.
              </Text>
            </View>
          ) : (
            <FlatList
              data={trees}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TreeCard
                  tree={item}
                  onPress={() =>
                    navigation.navigate("PendingDetails", { treeID: item.id })
                  }
                />
              )}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </SafeAreaView>

      {/* ⭐ FAB BUTTON */}
      <FAB
        icon="plus"
        style={[
          styles.fab,
          { backgroundColor: primary },
        ]}
        color="#fff"
        onPress={() =>
          navigation.navigate("AddTree", { from: "TreeManagement" })
        }
      />
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  errorText: { fontSize: 16, textAlign: "center" },

  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyText: { fontSize: 16, textAlign: "center" },

  listContent: { paddingBottom: 80 },

  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 50,
  },
});
