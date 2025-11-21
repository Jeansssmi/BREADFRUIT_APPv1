// TreeReportsScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Alert, Pressable } from "react-native";
import { Card, Text, Divider, Button, Snackbar, useTheme } from "react-native-paper";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

export default function TreeReportsScreen({ navigation }: any) {
  const theme = useTheme();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState({ visible: false, text: "" });

  // ─────────────────────────────────────────────────────────
  // FETCH ONLY NON-DELETED REPORTS (🔥 FIXED)
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = firestore()
      .collection("treeReports")
      .where("isDeleted", "!=", true) // ⭐ Fetch only active
      .orderBy("isDeleted")           // ⭐ Firestore requirement
      .orderBy("createdAt", "desc")
      .onSnapshot((snap) => {
        if (!snap) return;

        const arr: any[] = [];

        snap.docs.forEach((d) => {
          const data = d.data();

          arr.push({
            id: d.id,
            ...data,
            coordinates: {
              lat: data.coordinates?.latitude,
              lng: data.coordinates?.longitude,
            },
          });
        });

        setReports(arr);
        setLoading(false);
      });

    return () => unsub();
  }, []);

  // ─────────────────────────────────────────────────────────
  // SOFT DELETE REPORT
  // ─────────────────────────────────────────────────────────
  const softDeleteReport = useCallback((id: string) => {
    Alert.alert(
      "Delete Report?",
      "This report will be soft deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          style: "destructive",
          onPress: async () => {
            try {
              const adminID = auth().currentUser?.uid ?? "unknown";

              await firestore().collection("treeReports").doc(id).update({
                isDeleted: true,
                deletedAt: firestore.FieldValue.serverTimestamp(),
                deletedBy: adminID,
                restoredAt: firestore.FieldValue.delete(),
              });

              // Instantly remove from UI
              setReports((prev) => prev.filter((r) => r.id !== id));

              setSnack({ visible: true, text: "Report soft deleted" });
            } catch (err) {
              console.log(err);
              Alert.alert("Error", "Could not soft delete report.");
            }
          },
        },
      ]
    );
  }, []);

  // ─────────────────────────────────────────────────────────
  // RENDER REPORT CARD
  // ─────────────────────────────────────────────────────────
  const renderItem = ({ item }: any) => {
    const createdAt = item.createdAt?.toDate?.()?.toLocaleString?.() ?? "Unknown";

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Tree Report</Text>

          <Text style={styles.text}>Reporter Role: {item.reporterRole}</Text>

          {/* Location */}
          <Pressable
            onPress={() =>
              navigation.navigate("Map", {
                focusTree: {
                  latitude: item.coordinates.lat,
                  longitude: item.coordinates.lng,
                  zoomIn: true,
                },
              })
            }
          >
            <Text style={styles.location}>
              📍 {item.coordinates.lat?.toFixed(5)}, {item.coordinates.lng?.toFixed(5)}
            </Text>
          </Pressable>

          <Text style={styles.timestamp}>{createdAt}</Text>

          <Divider style={{ marginVertical: 10 }} />

          <View style={styles.row}>
            {/* View on map */}
            <Button
              mode="text"
              icon="map"
              textColor="#27ae60"
              onPress={() =>
                navigation.navigate("Map", {
                  focusTree: {
                    latitude: item.coordinates.lat,
                    longitude: item.coordinates.lng,
                    zoomIn: true,
                  },
                })
              }
            >
              View on Map
            </Button>

            {/* Soft Delete */}
            <Button
              mode="text"
              icon="delete"
              textColor={theme.colors.error}
              onPress={() => softDeleteReport(item.id)}
            >
              Delete
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={reports}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 30 }}>
            {loading ? "Loading…" : "No reports found"}
          </Text>
        }
        renderItem={renderItem}
      />

      {/* Snackbar */}
      <Snackbar
        visible={snack.visible}
        onDismiss={() => setSnack({ visible: false, text: "" })}
        duration={2500}
        style={{ backgroundColor: theme.colors.primary }}
      >
        {snack.text}
      </Snackbar>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
  },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  text: { fontSize: 14, marginBottom: 4 },
  timestamp: { fontSize: 12, color: "#888" },
  row: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 10,
  },
  location: {
    fontSize: 14,
    color: "#2ecc71",
    textDecorationLine: "underline",
    marginTop: 4,
  },
});
