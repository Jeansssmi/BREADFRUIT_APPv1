// ✅ NotificationsScreen.tsx (Researcher Only Version)
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
    "all" | "unseen" | "tree-ripe" | "approval"
  >("all");
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState({ visible: false, text: "" });


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
                for (const d of snap.docs)
                { const data = d.data() as any;
                    const ts = data.timestamp?.toDate?.(); if (ts && now - ts.getTime() > expire) { try { await d.ref.delete(); } catch {} continue; } raw.push({ id: d.id, ...data }); } alertNew(raw, notifications); setNotifications(raw); setLoading(false); }); return () => unsub(); }, [user]);



  // ✅ Sound + vibration for new alerts
  const alertNew = (newSet: NotifDoc[], oldSet: NotifDoc[]) => {
    const fresh = newSet.filter(
      (n) => (!n.seen || !n.read) && !oldSet.some((o) => o.id === n.id)
    );

    if (fresh.length > 0) {
      Vibration.vibrate?.(500);
      notificationSound.play();
    }
  };

  const filtered = useMemo(() => {
    if (filter === "unseen")
      return notifications.filter((n) => !n.seen && !n.read);
    if (filter === "tree-ripe")
      return notifications.filter((n) => n.type === "tree-ripe");
    if (filter === "approval")
      return notifications.filter((n) => n.type === "approval");
    return notifications;
  }, [filter, notifications]);

  // ✅ mark notification as seen/read
  const markSeen = useCallback(async (id: string) => {
    await firestore().collection("notification").doc(id).update({
      seen: true,
      read: true,
    });
  }, []);

  // ✅ Delete single notification
  const deleteNotification = useCallback(async (id: string) => {
    Alert.alert("Delete Notification?", "This will remove it permanently.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await firestore().collection("notification").doc(id).delete();
          setSnack({ visible: true, text: "Deleted" });
        },
      },
    ]);
  }, []);

  // ✅ Open Tree List Screen when tapped
  const handleOpenTreeList = useCallback(
    (n: NotifDoc) => {
      markSeen(n.id);

      if (n.type === "tree-ripe" && n.relatedTreeID) {
        return navigation.navigate("TreeList", {
          highlightTreeId: n.relatedTreeID,
        });
      }

      Alert.alert("Unknown notification type");
    },
    []
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      {/* ✅ Header */}
      <Appbar.Header
        style={[styles.header, { backgroundColor: theme.colors.card }]}
      >
        <Appbar.Content title="Notifications" />
      </Appbar.Header>

      {/* ✅ Fixed filter bar (always visible at top) */}
      <View style={[styles.filterBar, { backgroundColor: theme.colors.background }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
          keyboardShouldPersistTaps="handled"
        >
          <Chip
            style={styles.filterChip}
            selected={filter === "tree-ripe"}
            onPress={() => setFilter("tree-ripe")}
          >
            Tree Ripe Alerts
          </Chip>
          <Chip
            style={styles.filterChip}
            selected={filter === "approval"}
            onPress={() => setFilter("approval")}
          >
            Approval
          </Chip>
          <Chip
            style={styles.filterChip}
            selected={filter === "unseen"}
            onPress={() => setFilter("unseen")}
          >
            Unseen
          </Chip>
          <Chip
            style={styles.filterChip}
            selected={filter === "all"}
            onPress={() => setFilter("all")}
          >
            All
          </Chip>
        </ScrollView>
      </View>

      {/* ✅ Notification List */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <Text
            style={{
              textAlign: "center",
              marginTop: 40,
              color: theme.colors.text,
            }}
          >
            {loading ? "Loading…" : "No notifications"}
          </Text>
        }
        renderItem={({ item: n }) => {
          const ts = n.timestamp?.toDate?.();

          return (
            <Card
              style={[styles.card, { backgroundColor: theme.colors.card }]}
            >
              <Card.Content>
                <View style={styles.row}>
                  <List.Icon icon="bell-ring" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                      {n.message}
                    </Text>

                    {!!ts && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: theme.dark ? "#aaa" : "#888",
                        }}
                      >
                        {ts.toLocaleString()}
                      </Text>
                    )}

                    {!n.seen && !n.read && <Badge style={{ marginTop: 6 }} />}
                  </View>
                </View>

                <Divider style={{ marginVertical: 10 }} />

                <View
                  style={[
                    styles.row,
                    { justifyContent: "flex-end", gap: 8 },
                  ]}
                >
                  {n.type === "tree-ripe" && (
                    <Button
                      icon="fruit-cherries"
                      mode="text"
                      onPress={() => handleOpenTreeList(n)}
                    >
                      View Tree
                    </Button>
                  )}

                  {(!n.seen || !n.read) && (
                    <Button
                      icon="check"
                      mode="text"
                      onPress={() => markSeen(n.id)}
                    />
                  )}

                  <Button
                    icon="delete"
                    mode="text"
                    textColor={theme.colors.error}
                    onPress={() => deleteNotification(n.id)}
                  />
                </View>
              </Card.Content>
            </Card>
          );
        }}
      />

      {/* ✅ Snackbar */}
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
  header: { elevation: 0 },
  filterBar: {
    zIndex: 10,
    elevation: 5,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  filtersScroll: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6,
    alignItems: "center",
  },
  filterChip: {
    marginRight: 8,
  },
  row: { flexDirection: "row", alignItems: "center" },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  title: { fontWeight: "600", marginBottom: 4 },
});
