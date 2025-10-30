import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Alert, FlatList, StyleSheet, View, Vibration } from 'react-native';
import { Appbar, Badge, Button, Card, Chip, Divider, List, Snackbar, Text, useTheme } from 'react-native-paper';
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
  reporterName?: string;
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
  const [filter, setFilter] = useState<'all' | 'unseen' | 'tree-report'>('all');
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState({ visible: false, text: '' });

  useEffect(() => {
    if (!user) return;
    const unsub = firestore()
      .collection("users")
      .doc(user.uid)
      .onSnapshot(doc => setUserRole(doc.data()?.role ?? null));
    return () => unsub();
  }, [user]);

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

        if (userRole === "admin") {
          const grouped: Record<string, NotifDoc> = {};
          for (const n of raw) {
            if (n.type !== "tree-report" || typeof n.lat !== "number") {
              grouped[n.id] = n;
              continue;
            }
            const key = `${n.lat.toFixed(5)}_${n.lng.toFixed(5)}`;
            if (!grouped[key]) grouped[key] = { ...n, count: 1 };
            else grouped[key].count = (grouped[key].count ?? 1) + 1;
          }
          const list = Object.values(grouped);
          alertNew(list, notifications);
          setNotifications(list);
        } else {
          alertNew(raw, notifications);
          setNotifications(raw);
        }

        setLoading(false);
      });

    return () => unsub();
  }, [userRole, notifications]);

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

  const filtered = useMemo(() => {
    if (filter === 'unseen') return notifications.filter(n => !n.seen && !n.read);
    if (filter === 'tree-report') return notifications.filter(n => n.type === 'tree-report');
    return notifications;
  }, [filter, notifications]);

  const markSeen = useCallback(async (id: string) => {
    try {
      await firestore().collection("notification").doc(id).update({
        seen: true,
        read: true,
      });
      setSnack({ visible: true, text: "Marked seen" });
    } catch {}
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    Alert.alert("Delete Notification?", "This will remove it permanently.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await firestore().collection("notification").doc(id).delete();
            setSnack({ visible: true, text: "Deleted" });
          } catch {}
        }
      },
    ]);
  }, []);

  const handleDeleteAll = useCallback(() => {
    Alert.alert(
      "Delete All Notifications?",
      "This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              const batch = firestore().batch();
              notifications.forEach(n =>
                batch.delete(firestore().collection("notification").doc(n.id))
              );
              await batch.commit();
              setSnack({ visible: true, text: "All deleted" });
            } catch {}
          }
        }
      ]
    );
  }, [notifications]);

  const handleViewOnMap = useCallback((n: NotifDoc) => {
    if (typeof n.lat === 'number') {
      if (userRole === "admin") markSeen(n.id);
      navigation.navigate("MapScreen", { lat: n.lat, lng: n.lng });
      return;
    }

    if (n.reportID) {
      firestore()
        .collection("treeReports")
        .doc(n.reportID)
        .get()
        .then(doc => {
          const gp = doc.data()?.coordinates;
          if (!gp) return Alert.alert("Missing location");
          markSeen(n.id);
          navigation.navigate("MapScreen", { lat: gp.latitude, lng: gp.longitude });
        });
    }
  }, [userRole]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

      <Appbar.Header style={[styles.header, { backgroundColor: theme.colors.card }]}>
        <Appbar.Content title="Notifications" />

        {(userRole === "admin" && notifications.length > 0) && (
          <Appbar.Action
            icon="delete-sweep"
            color={theme.colors.error}
            onPress={handleDeleteAll}
          />
        )}
      </Appbar.Header>

      <View style={styles.filters}>
        <Chip selected={filter === 'tree-report'} onPress={() => setFilter('tree-report')}>
          Tree Reports
        </Chip>
        <Chip selected={filter === 'unseen'} onPress={() => setFilter('unseen')}>
          Unseen
        </Chip>
        <Chip selected={filter === 'all'} onPress={() => setFilter('all')}>
          All
        </Chip>
      </View>

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

                <View style={styles.row}>
                  <List.Icon icon="bell-ring" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                      {n.message}
                    </Text>
                    {!!n.reporterName && (
                      <Text style={{ fontSize: 13, color: theme.dark ? '#aaa' : '#666' }}>
                        Reported by {n.reporterName}
                      </Text>
                    )}
                    {!!ts && (
                      <Text style={{ fontSize: 12, color: theme.dark ? '#aaa' : '#888' }}>
                        {ts.toLocaleString()}
                      </Text>
                    )}
                    {!n.seen && !n.read && (
                      <Badge style={{ alignSelf: 'flex-start', marginTop: 6 }} />
                    )}
                    {!!n.count && n.count > 1 && (
                      <Chip compact style={{ marginTop: 6 }}>{n.count} reports</Chip>
                    )}
                  </View>
                </View>

                <Divider style={{ marginVertical: 10 }} />

                <View style={[styles.row, { justifyContent: 'flex-end', gap: 8 }]}>
                  {n.type === "tree-report" && (
                    <Button icon="map-marker-radius" mode="text" onPress={() => handleViewOnMap(n)}>
                      Map
                    </Button>
                  )}

                  {(n.seen === false || n.read === false) && (
                    <Button icon="check" mode="text" onPress={() => markSeen(n.id)} />
                  )}

                  {userRole === "admin" && (
                    <Button
                      icon="delete"
                      mode="text"
                      textColor={theme.colors.error}
                      onPress={() => deleteNotification(n.id)}
                    />
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
  header: { elevation: 0 },
  filters: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 10, gap: 8 },
  chip: { borderRadius: 20 },
  row: { flexDirection: 'row', alignItems: 'center' },
  card: { marginBottom: 12, borderRadius: 12, elevation: 2 },
  title: { fontWeight: '600', marginBottom: 4 },
});
