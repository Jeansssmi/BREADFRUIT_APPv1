// TreeReportsTrashScreen.tsx
import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, Alert, Pressable } from "react-native";
import { Card, Text, Divider, Button, Snackbar, useTheme } from "react-native-paper";
import firestore from "@react-native-firebase/firestore";

export default function TreeReportsTrashScreen({ navigation }: any) {
  const theme = useTheme();
  const [reports, setReports] = useState<any[]>([]);
  const [snack, setSnack] = useState({ visible: false, text: "" });

  // ─────────────────────────────────────────────────────────
  // FETCH ONLY SOFT-DELETED REPORTS
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = firestore()
      .collection("treeReports")
      .where("isDeleted", "==", true)
      .onSnapshot((snap) => {
        if (!snap || snap.empty) {
          setReports([]);
          return;
        }

        const arr: any[] = [];

        snap.docs.forEach((d) => {
          const data = d.data() || {};

          arr.push({
            id: d.id,
            ...data,
            coordinates: {
              lat: data.coordinates?.latitude ?? null,
              lng: data.coordinates?.longitude ?? null,
            },
          });
        });

        setReports(arr);
      });

    return () => unsub();
  }, []);

  // ─────────────────────────────────────────────────────────
  // RESTORE REPORT (moves back to active reports)
  // ─────────────────────────────────────────────────────────
  const restoreReport = async (id: string) => {
    await firestore().collection("treeReports").doc(id).update({
      isDeleted: false,
      restoredAt: firestore.FieldValue.serverTimestamp(),
      deletedAt: firestore.FieldValue.delete(),
      deletedBy: firestore.FieldValue.delete(),
    });

    // Instantly remove from UI
    setReports((prev) => prev.filter((r) => r.id !== id));

    setSnack({ visible: true, text: "Report restored" });
  };

const removeForever = (id: string) => {
  Alert.alert(
    "Delete Permanently?",
    "This will be permanently deleted.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        style: "destructive",
        onPress: async () => {
          try {
            // remove from UI immediately
            setReports((prev) => prev.filter((r) => r.id !== id));

            // run transaction (guaranteed delete)
            await firestore().runTransaction(async (tx) => {
              const ref = firestore().collection("treeReports").doc(id);
              tx.delete(ref);
            });

            setSnack({ visible: true, text: "Deleted permanently" });
          } catch (err: any) {
              console.log("DELETE ERROR:", err);   // 🔥 SHOW REAL FIRESTORE ERROR
              Alert.alert("Error", err.message || "Could not delete report.");
            }
        },
      },
    ]
  );
};



  const renderItem = ({ item }: any) => {
    const lat = item.coordinates?.lat;
    const lng = item.coordinates?.lng;

    return (
      <Card style={[styles.card, { backgroundColor: "#f8d7da" }]}>
        <Card.Content>
          <Text style={styles.title}>⚠ Deleted Tree Report</Text>

          <Text style={styles.text}>Reporter Role: {item.reporterRole}</Text>

          {/* Deleted report still shows location */}
          <Pressable
            onPress={() =>
              navigation.navigate("Map", {
                focusTree: {
                  latitude: lat,
                  longitude: lng,
                  zoomIn: true,
                },
              })
            }
          >
            <Text style={styles.location}>
              📍 {lat?.toFixed(5)}, {lng?.toFixed(5)}
            </Text>
          </Pressable>

          <Divider style={{ marginVertical: 10 }} />

          <View style={styles.row}>
            {/* Restore Button */}
            <Button
              mode="text"
              icon="backup-restore"
              textColor="#2980b9"
              onPress={() => restoreReport(item.id)}
            >
              Restore
            </Button>

            {/* Permanent Delete Button */}
            <Button
              mode="text"
              icon="delete"
              textColor={theme.colors.error}
              onPress={() => removeForever(item.id)}
            >
              Remove
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
          <Text style={{ textAlign: "center", marginTop: 30 }}>No deleted reports</Text>
        }
        renderItem={renderItem}
      />

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

const styles = StyleSheet.create({
  card: { marginBottom: 12, borderRadius: 12, elevation: 3 },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 6 },
  text: { fontSize: 14, marginBottom: 4 },
  location: {
    fontSize: 14,
    color: "#2ecc71",
    fontWeight: "bold",
    textDecorationLine: "underline",
    marginTop: 5,
  },
  row: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
});
