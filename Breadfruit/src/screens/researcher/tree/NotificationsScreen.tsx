// ✅ NotificationsScreen.tsx (Updated with read behavior)
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  View,
  Vibration,
  ScrollView,
} from "react-native";
import {
  Appbar,
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  List,
  Snackbar,
  Text,
  useTheme,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import firestore, {
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import Sound from "react-native-sound";

type NotifDoc = {
  id: string;
  type: string;
  message: string;
  treeId?: string;
  relatedTreeID?: string;
  seen?: boolean;
  read?: boolean;
  timestamp?: FirebaseFirestoreTypes.Timestamp;
};

const notificationSound = new Sound(
  "notif.mp3",
  Sound.MAIN_BUNDLE,
  (e) => e && console.log("Sound load error:", e)
);

export default function NotificationsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const user = auth().currentUser;

  const [notifications, setNotifications] = useState<NotifDoc[]>([]);
  const [filter, setFilter] = useState<
    "all" | "unseen" | "tree-ripe" | "approval" | "rejected"
  >("all");
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState({ visible: false, text: "" });
  const [archivedCount, setArchivedCount] = useState(0);

  // 🔔 Live listener
  useEffect(() => {
    if (!user) return;
    const unsub = firestore()
      .collection("notification")
      .where("recipientID", "==", user.uid)
      .orderBy("timestamp", "desc")
      .onSnapshot(async (snap) => {
        const raw: NotifDoc[] = [];
        const now = Date.now();
        const expire = 7 * 24 * 60 * 60 * 1000;

        for (const d of snap.docs) {
          const data = d.data() as any;
          const ts = data.timestamp?.toDate?.();
          if (ts && now - ts.getTime() > expire) {
            try {
              await d.ref.delete();
            } catch {}
            continue;
          }
          raw.push({ id: d.id, ...data });
        }

        alertNew(raw, notifications);

        setNotifications(raw);
        setLoading(false);
      });

    return () => unsub();
  }, [user]);

  const alertNew = (newSet: NotifDoc[], oldSet: NotifDoc[]) => {
    const fresh = newSet.filter(
      (n) => (!n.seen || !n.read) && !oldSet.some((o) => o.id === n.id)
    );
    if (fresh.length > 0) {
      Vibration.vibrate?.(500);
      notificationSound.play();
    }
  };

  // Archived count
  useEffect(() => {
    if (!user) return;

    const unsub = firestore()
      .collection("notification")
      .where("recipientID", "==", user.uid)
      .where("archived", "==", true)
      .onSnapshot((snap) => setArchivedCount(snap.size));

    return () => unsub();
  }, [user]);

  // Filters
  const filtered = useMemo(() => {
    let list = notifications;

    if (filter === "unseen") list = list.filter((n) => !n.read);
    if (filter === "tree-ripe") list = list.filter((n) => n.type === "tree-ripe");

    if (filter === "approval")
      list = list.filter((n) =>
        (n.message + "").toLowerCase().includes("approved")
      );

    if (filter === "rejected")
      list = list.filter((n) =>
        (n.message + "").toLowerCase().includes("rejected")
      );

    return list;
  }, [filter, notifications]);

  // ⭐ Mark Read (used by card tap & button)
  const markSeen = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, seen: true, read: true } : n))
    );

    await firestore().collection("notification").doc(id).update({
      seen: true,
      read: true,
    });
  }, []);

  // ⭐ Card tap also marks as read
  const handleOpenNotification = useCallback(
    async (n: NotifDoc) => {
      await markSeen(n.id); // ⭐ ensures read:true BEFORE navigation

      if (n.type === "tree-ripe" && n.relatedTreeID)
        return navigation.navigate("TreeList", {
          highlightTreeId: n.relatedTreeID,
        });

      if (
        (n.message + "").toLowerCase().includes("approved") ||
        n.type === "approval"
      ) {
        return navigation.navigate("ApprovedDetails", {
          treeID: n.relatedTreeID || n.treeId,
        });
      }

      if (
        (n.message + "").toLowerCase().includes("rejected") ||
        n.type === "rejected"
      ) {
        return navigation.navigate("RejectedDetails", {
          treeID: n.relatedTreeID || n.treeId,
        });
      }

      Alert.alert("Notification", "This notification has no linked details.");
    },
    [navigation]
  );

  // Delete
  const deleteNotification = useCallback(async (id: string) => {
    Alert.alert("Delete Notification", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await firestore()
            .collection("notification")
            .doc(id)
            .update({
              deleted: true,
              deletedAt: firestore.FieldValue.serverTimestamp(),
            });

          setNotifications((prev) => prev.filter((n) => n.id !== id));
          setSnack({ visible: true, text: "Notification deleted" });
        },
      },
    ]);
  }, []);

  // Archive
  const archiveNotification = useCallback(async (id: string) => {
    Alert.alert(
      "Archive Notification",
      "Do you want to move this notification to archive?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          onPress: async () => {
            try {
              // ⭐ First update Firestore
              await firestore()
                .collection("notification")
                .doc(id)
                .update({
                  archived: true,
                  archivedAt: firestore.FieldValue.serverTimestamp(),
                });

              // ⭐ Then update UI
              setNotifications((prev) => prev.filter((n) => n.id !== id));

              // ⭐ Show message
              setSnack({ visible: true, text: "Notification archived" });

              // ⭐ Force refresh archive count if listener hasn't fired yet
              setArchivedCount((prev) => prev + 1);

            } catch (err) {
              console.error("Failed to archive notification:", err);
              Alert.alert("Error", "Failed to archive notification.");
            }
          },
        },
      ]
    );
  }, []);


  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: "#27ae60" }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#fff" />
        <Appbar.Content title="Notifications" color="#fff" />

        {/* Archive Button */}
        <View style={{ marginRight: 10 }}>
          <Appbar.Action
            icon="archive-outline"
            color="#fff"
            onPress={() => navigation.navigate("ArchivedNotificationsScreen")}
          />
          {archivedCount > 0 && (
            <Badge
              style={{
                position: "absolute",
                top: 4,
                right: 2,
                backgroundColor: "#2ecc71",
                color: "#fff",
                fontWeight: "bold",
                fontSize: 10,
              }}
              size={18}
            >
              {archivedCount}
            </Badge>
          )}
        </View>
      </Appbar.Header>

      {/* Filters */}
      <View style={[styles.filterBar, { backgroundColor: theme.colors.background }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {[
            { key: "all", label: "All" },
            { key: "tree-ripe", label: "Tree Ripe Alerts" },
            { key: "approval", label: "Tree Approved" },
            { key: "rejected", label: "Tree Rejected" },
            { key: "unseen", label: "Unseen" },
          ].map((f) => (
            <Chip
              key={f.key}
              style={[
                styles.filterChip,
                { backgroundColor: filter === f.key ? "#2ecc71" : "#e8f5e9" },
              ]}
              textStyle={{
                color: filter === f.key ? "#fff" : "#2ecc71",
                fontWeight: "600",
              }}
              onPress={() => setFilter(f.key as any)}
            >
              {f.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Notification List */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item: n }) => {
          const ts = n.timestamp?.toDate?.();

          return (
            <Card
              style={[styles.card, { backgroundColor: theme.colors.card }]}
              onPress={() => handleOpenNotification(n)}
            >
              <Card.Content>
                <View style={styles.row}>
                  <List.Icon icon="bell-ring" color="#FFD700" />

                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                      {n.message}
                    </Text>

                    {ts && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: theme.dark ? "#aaa" : "#888",
                        }}
                      >
                        {ts.toLocaleString()}
                      </Text>
                    )}

                    {!n.read && (
                      <Badge style={{ marginTop: 6, alignSelf: "flex-start" }}>
                        New
                      </Badge>
                    )}
                  </View>
                </View>

                <Divider style={{ marginVertical: 10 }} />

                {/* ⭐ UPDATED BUTTON LOGIC ⭐ */}
                <View style={[styles.row, { justifyContent: "flex-end", gap: 8 }]}>
                  <Button
                    icon={n.read ? "check-circle" : "check"}
                    mode="text"
                    compact
                    disabled={n.read}
                    textColor={n.read ? "#888" : "#2ecc71"}
                    onPress={() => markSeen(n.id)}
                  >
                    {n.read ? "Read" : "Mark as Read"}
                  </Button>

                  <Button
                    icon="archive"
                    mode="text"
                    compact
                    textColor="#27ae60"
                    onPress={() => archiveNotification(n.id)}
                  >
                    Archive
                  </Button>

                  <Button
                    icon="delete"
                    mode="text"
                    compact
                    textColor={theme.colors.error}
                    onPress={() => deleteNotification(n.id)}
                  >
                    Delete
                  </Button>
                </View>
              </Card.Content>
            </Card>
          );
        }}
      />

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
  filterBar: {
    zIndex: 10,
    elevation: 5,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  filtersScroll: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
  },
  filterChip: { marginRight: 8 },
  row: { flexDirection: "row", alignItems: "center" },
  card: { marginBottom: 12, borderRadius: 12, elevation: 2 },
  title: { fontWeight: "600", marginBottom: 4 },
});
