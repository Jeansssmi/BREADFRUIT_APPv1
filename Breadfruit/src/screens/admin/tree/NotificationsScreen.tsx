import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Alert, FlatList, StyleSheet, View, Vibration, ScrollView, Pressable } from 'react-native';
import { Appbar, Button, Card, Chip, Divider, List, Snackbar, Text, useTheme, Badge } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Sound from 'react-native-sound';

type NotifDoc = {
  id: string;
  type: string;
  message: string;
  reportID?: string;
  lat?: number;
  lng?: number;
  recipientRole?: string;
  recipientID?: string;
  seen?: boolean;
  read?: boolean;
  archived?: boolean;
  reporterName?: string;
  researcherName?: string;
  timestamp?: FirebaseFirestoreTypes.Timestamp;
  count?: number;
};

const notificationSound = new Sound('notif.mp3', Sound.MAIN_BUNDLE, (e) => {
  if (e) console.log('Sound load error', e);
});

export default function NotificationsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const user = auth().currentUser;

  const [userRole, setUserRole] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotifDoc[]>([]);
  const [filter, setFilter] = useState<'all' | 'unseen' | 'tree-report' | 'archived' | 'tree-approval'>('all');
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState({ visible: false, text: '' });
  const [archivedCount, setArchivedCount] = useState(0);

  // Fetch user role
  useEffect(() => {
    if (!user) return;
    const unsub = firestore()
      .collection("users")
      .doc(user.uid)
      .onSnapshot(doc => setUserRole(doc.data()?.role ?? null));
    return () => unsub();
  }, [user]);

  // Fetch notifications
  useEffect(() => {
    if (!user || !userRole) return;

    let query: FirebaseFirestoreTypes.Query = firestore().collection("notification");

    if (userRole === "admin") {
      query = query.where("recipientRole", "==", "Admin");
    } else {
      query = query.where("recipientID", "==", user.uid);
    }

    const unsub = query
      .orderBy("timestamp", "desc")
      .onSnapshot(async snap => {
        const now = Date.now();
        const expire = 7 * 24 * 60 * 60 * 1000;
        const raw: NotifDoc[] = [];

        for (const d of snap.docs) {
          const data = d.data() as any;
          const ts = data.timestamp?.toDate?.();
          if (ts && now - ts.getTime() > expire) {
            try { await d.ref.delete(); } catch {}
            continue;
          }
          raw.push({ id: d.id, ...data });
        }

        setNotifications(raw);
        setLoading(false);
      });

    return () => unsub();
  }, [userRole, filter]);

  // Sound/vibration for new notifications
  const alertNew = (newSet: NotifDoc[], oldSet: NotifDoc[]) => {
    const fresh = newSet.filter(n =>
      (n.seen === false || n.read === false || n.seen === undefined) &&
      !oldSet.find(o => o.id === n.id)
    );

    if (fresh.length > 0) {
      try { Vibration.vibrate?.(500) } catch {}
      try { notificationSound.play() } catch {}
    }
  };

  // Filters
  const filtered = useMemo(() => {
    if (filter === 'unseen') return notifications.filter(n => !n.seen && !n.read && !n.archived);
    if (filter === 'ripe-alert') return notifications.filter(n => n.type === 'tree-ripe' && !n.archived);
    if (filter === 'tree-approval') return notifications.filter(n => n.type === 'tree-added' && !n.archived);
    if (filter === 'tree-report') return notifications.filter(n => n.type === 'tree-report' && !n.archived);
    if (filter === 'researcher-registered') return notifications.filter(n => n.type === 'researcher-registered' && !n.archived);
    if (filter === 'archived') return notifications.filter(n => n.archived);
    return notifications.filter(n => !n.archived);
  }, [filter, notifications]);

  // Mark as read
  const markSeen = useCallback(async (id: string) => {
    try {
      await firestore().collection("notification").doc(id).update({
        seen: true,
        read: true,
      });

      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, seen: true, read: true } : n))
      );

      // If viewing unseen, remove it from UI
      if (filter === "unseen") {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }

      setSnack({ visible: true, text: "Marked as read" });
    } catch (e) {
      console.log(e);
      setSnack({ visible: true, text: "Failed to mark as read" });
    }
  }, [filter]);

  // Archived Notifications Count (Badge)
  // Archived Notifications Count (Badge)
  useEffect(() => {
    if (!user || !userRole) return;

    let query = firestore().collection("notification");

    if (userRole === "admin") {
      query = query.where("recipientRole", "==", "Admin");
    } else {
      query = query.where("recipientID", "==", user.uid);
    }

    const unsub = query
      .where("archived", "==", true)
      .onSnapshot((snap) => {
        setArchivedCount(snap.size);
      });

    return () => unsub();
  }, [user, userRole]);


  // Archive single notification
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
              await firestore().collection("notification").doc(id).update({
                archived: true,
                archivedAt: firestore.FieldValue.serverTimestamp(),
              });

              setSnack({ visible: true, text: "Notification archived" });
              setNotifications((prev) => prev.filter((n) => n.id !== id));
            } catch (err) {
              console.error("Failed to archive notification:", err);
              Alert.alert("Error", "Failed to archive notification.");
            }
          },
        },
      ]
    );
  }, []);

  // Soft-delete / mark deleted (keeps consistency with your prior behavior)
  const deleteNotification = useCallback(async (id: string) => {
    Alert.alert("Delete Notification", "Are you sure you want to delete this notification?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await firestore().collection("notification").doc(id).update({
              deleted: true,
              deletedAt: firestore.FieldValue.serverTimestamp(),
            });
            setSnack({ visible: true, text: "Notification deleted" });
            setNotifications((prev) => prev.filter((n) => n.id !== id));
          } catch (err) {
            console.error("Failed to delete notification:", err);
            setSnack({ visible: true, text: "Failed to delete" });
          }
        },
      },
    ]);
  }, []);

  const handleViewOnMap = useCallback((n: NotifDoc) => {
    if (typeof n.lat === "number" && typeof n.lng === "number") {
      navigation.navigate("Map", {
        focusTree: {
          latitude: n.lat,
          longitude: n.lng,
          treeID: n.reportID || null,
          highlight: true,
        },
      });
    } else {
      Alert.alert("No Location", "This tree doesn't have coordinates yet.");
    }
  }, [navigation]);

  // UI
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: "#27ae60" }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#fff" />
        <Appbar.Content title={filter === "archived" ? "Archived Notifications" : "Notifications"} color="#fff" />

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

      {/* Fixed filter chips */}
      <View style={styles.fixedFilters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {[
            { key: "all", label: "All" },
            { key: "ripe-alert", label: "Ripe Alerts" },
            { key: "tree-approval", label: "Tree Approvals" },
            { key: "tree-report", label: "Tree Reports" },
            { key: "researcher-registered", label: "New Researchers" },
            { key: "unseen", label: "Unseen" },
          ].map(({ key, label }) => (
            <Chip
              key={key}
              selected={filter === key}
              onPress={() => setFilter(key as any)}
              style={[styles.chip, filter === key && { backgroundColor: "#2ecc71" }]}
              textStyle={{
                color: filter === key ? "#fff" : "#2ecc71",
                fontWeight: "bold",
              }}
            >
              {label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Notification List */}
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 40, color: theme.colors.text }}>
            {loading ? "Loading…" : "No notifications"}
          </Text>
        }
        renderItem={({ item: n }) => {
          const ts = n.timestamp?.toDate?.();
          return (
            <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
              <Card.Content>
                <View style={[styles.row, { alignItems: "flex-start" }]}>
                  <List.Icon
                    icon={
                      n.type === "researcher-registered"
                        ? "account-plus"
                        : "bell" // filled bell for all cards
                    }
                    color={n.type === "researcher-registered" ? "#2ecc71" : "#FFD700"} // yellow for bell
                    style={{ margin: 0, marginRight: 6 }} // adjusted spacing
                  />

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>{n.message}</Text>



                    {!!n.reporterName && n.type !== "tree-added" && (
                      <Text style={{ fontSize: 13, color: theme.dark ? '#aaa' : '#666' }}>

                      </Text>
                    )}

                    {!!ts && (
                      <Text style={{ fontSize: 12, color: theme.dark ? '#aaa' : '#888', marginTop: 6 }}>
                        {ts.toLocaleString()}
                      </Text>
                    )}
                  </View>
                </View>

                <Divider style={{ marginVertical: 10 }} />

                <View style={[styles.row, { justifyContent: 'flex-end', gap: 8 }]}>
                  {/* Replaced View Tree with Mark as Read in action row */}
                  {/* Mark as Read button (text only) */}
                  {!n.read ? (
                    <Button
                      icon="check"
                      mode="text"
                      textColor="#27ae60"
                      compact
                      onPress={() => markSeen(n.id)}
                      labelStyle={{ fontWeight: "bold" }}
                    >
                      Mark as Read
                    </Button>
                  ) : (
                    <Button
                      icon="check"
                      mode="text"
                      textColor="#bcbcbc"
                      compact
                      disabled
                      labelStyle={{ fontWeight: "bold" }}
                    >
                      Read
                    </Button>
                  )}


                  {/* Archive / Unarchive / Delete */}
                  {filter === "archived" ? (
                    <Button icon="archive-arrow-up-outline" mode="text" onPress={() => archiveNotification(n.id)}>
                      Unarchive
                    </Button>
                  ) : (
                    <>
                      <Button icon="archive-outline" mode="text" onPress={() => archiveNotification(n.id)}>
                        Archive
                      </Button>

                      {userRole === "admin" && (
                        <Button
                          icon="delete"
                          mode="text"
                          textColor={theme.colors.error}
                          onPress={() => deleteNotification(n.id)}
                        />
                      )}
                    </>
                  )}
                </View>
              </Card.Content>
            </Card>
          );
        }}
      />

      <Snackbar
        visible={snack.visible}
        onDismiss={() => setSnack({ visible: false, text: '' })}
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
  fixedFilters: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    elevation: 2,
    zIndex: 10,
  },
  chipScroll: {
    flexDirection: "row",
    paddingHorizontal: 10,
    gap: 8,
  },
  chip: {
    borderColor: "#2ecc71",
    borderWidth: 1,
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  card: { marginBottom: 12, borderRadius: 12, elevation: 2 },
  title: { fontWeight: '600', marginBottom: 4 },
});
