import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  View,
} from "react-native";
import {
  Appbar,
  Badge,
  Button,
  Card,
  Divider,
  List,
  Snackbar,
  Text,
  useTheme,
} from "react-native-paper";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

export default function ArchivedNotificationsScreen({ navigation }: any) {
  const theme = useTheme();
  const user = auth().currentUser;
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState({ visible: false, text: "" });

  // 🔹 Fetch archived notifications (Exclude soft-deleted)
  useEffect(() => {
    if (!user) return;

    const unsub = firestore()
      .collection("notification")
      .where("recipientID", "==", user.uid)
      .where("archived", "==", true)
      .onSnapshot(
        (snap) => {
          if (!snap || snap.empty) {
            setNotifications([]);
            setLoading(false);
            return;
          }

          // 🟢 Remove soft-deleted items using filter
          const list = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((n) => !n.deleted);

          // Sort newest archive first
          list.sort(
            (a, b) =>
              (b.archivedAt?.seconds || 0) -
              (a.archivedAt?.seconds || 0)
          );

          setNotifications(list);
          setLoading(false);
        },
        (err) => {
          console.error("Error fetching archived notifications:", err);
          setLoading(false);
        }
      );

    return () => unsub();
  }, [user]);

  // ♻️ Unarchive
  const handleUnarchive = useCallback(async (id: string) => {
    Alert.alert(
      "Unarchive Notification",
      "Do you want to move this notification back to your inbox?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unarchive",
          onPress: async () => {
            try {
              await firestore().collection("notification").doc(id).update({
                archived: false,
                archivedAt: firestore.FieldValue.delete(),
              });

              // Remove from UI instantly
              setNotifications((prev) => prev.filter((n) => n.id !== id));

              setSnack({ visible: true, text: "Notification restored" });
            } catch (err) {
              console.error("Unarchive Error:", err);
              Alert.alert("Error", "Failed to unarchive notification");
            }
          },
        },
      ]
    );
  }, []);

  // ❌ Soft Delete
  const handleDelete = useCallback(async (id: string) => {
    Alert.alert(
      "Delete Notification",
      "Do you want to remove this notification? This is a soft delete.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await firestore()
                .collection("notification")
                .doc(id)
                .update({
                  deleted: true,
                  deletedAt: firestore.FieldValue.serverTimestamp(),
                });

              // 🟢 Remove from UI immediately
              setNotifications((prev) => prev.filter((n) => n.id !== id));

              setSnack({ visible: true, text: "Notification removed" });
            } catch (err) {
              console.error("Soft Delete Error:", err);
              Alert.alert("Error", "Failed to delete notification");
            }
          },
        },
      ]
    );
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

      {/* 🔹 Header */}
      <Appbar.Header style={{ backgroundColor: "#27ae60" }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#fff" />
        <Appbar.Content title="Archived Notifications" color="#fff" />
      </Appbar.Header>

      {/* 🔹 List */}
      {loading ? (
        <View style={styles.center}>
          <Text>Loading...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <List.Icon icon="archive-outline" color="#aaa" />
          <Text style={{ color: "#888", marginTop: 10 }}>No archived notifications</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item: n }) => {
            const ts = n.timestamp?.toDate?.();
            return (
              <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
                <Card.Content>
                  <View style={styles.row}>
                    <List.Icon icon="bell" color="#FFD700" style={{ marginRight: 10, marginLeft: -4 }}/>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={[styles.title, { color: theme.colors.text }]}>
                        {n.message}
                      </Text>

                      {!!ts && (
                        <Text style={styles.timestamp}>
                          {ts.toLocaleString()}
                        </Text>
                      )}

                      <Badge
                        style={{
                          marginTop: 6,
                          alignSelf: "flex-start",
                          backgroundColor: "#27ae60",
                        }}
                      >
                        Archived
                      </Badge>
                    </View>
                  </View>

                  <Divider style={{ marginVertical: 10 }} />

                  <View style={[styles.row, { justifyContent: "flex-end", gap: 8 }]}>
                    <Button
                      icon="inbox-arrow-up"
                      mode="text"
                      textColor="#2ecc71"
                      compact
                      onPress={() => handleUnarchive(n.id)}
                    >
                      Unarchive
                    </Button>

                    <Button
                      icon="delete"
                      mode="text"
                      textColor="#e74c3c"
                      compact
                      onPress={() => handleDelete(n.id)}
                    >
                      Delete
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            );
          }}
        />
      )}

      {/* Snackbar */}
      <Snackbar
        visible={snack.visible}
        onDismiss={() => setSnack({ visible: false, text: "" })}
        duration={2200}
        style={{ backgroundColor: theme.colors.primary }}
      >
        {snack.text}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "center" },
  title: { fontWeight: "600", marginBottom: 4 },
  timestamp: {
    fontSize: 12,
    color: "#777",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
