import React, { useEffect, useState, useCallback } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { ActivityIndicator, Appbar, Card, Text } from "react-native-paper";
import firestore from "@react-native-firebase/firestore";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Firestore collection name (must match your database)
  const COLLECTION_NAME = "notification";

  // ✅ Fetch and listen to notifications for Admin
  const fetchNotifications = useCallback(() => {
    const unsubscribe = firestore()
      .collection(COLLECTION_NAME)
      .where("recipientRole", "==", "Admin")
      .orderBy("timestamp", "desc")
      .onSnapshot(
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setNotifications(data);
          setLoading(false);
          setRefreshing(false);
        },
        (error) => {
          console.error("Error fetching notifications:", error);
          setLoading(false);
          setRefreshing(false);
        }
      );

    return unsubscribe;
  }, []);

  // ✅ Mark all unread notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadSnap = await firestore()
        .collection(COLLECTION_NAME)
        .where("recipientRole", "==", "Admin")
        .where("read", "==", false)
        .get();

      if (unreadSnap.empty) return;

      const batch = firestore().batch();
      unreadSnap.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });

      await batch.commit();
      console.log("✅ All notifications marked as read.");
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // ✅ Load notifications in real-time on mount
  useEffect(() => {
    setLoading(true);
    const unsubscribe = fetchNotifications();
    markAllAsRead(); // mark unseen as read when opened
    return () => unsubscribe && unsubscribe();
  }, [fetchNotifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // ✅ Helper to format Firestore timestamp
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown date";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Appbar.Header style={styles.appbarHeader}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Notifications" titleStyle={styles.appbarTitle} />
        <Appbar.Action
          icon="check-all"
          color="#2ecc71"
          onPress={markAllAsRead}
        />
      </Appbar.Header>

      {/* Empty State */}
      {notifications.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="bell-off-outline" size={50} color="#ccc" />
          <Text style={styles.emptyText}>No notifications yet.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          renderItem={({ item }) => (
            <Card
              style={[
                styles.card,
                !item.read && { borderLeftWidth: 4, borderLeftColor: "#2ecc71" },
              ]}
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardBody}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.message}>{item.message}</Text>
                  {item.senderName && (
                    <Text style={styles.sender}>By: {item.senderName}</Text>
                  )}
                  <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
                </View>
              </Card.Content>
            </Card>
          )}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  appbarHeader: {
    backgroundColor: "#fff",
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  appbarTitle: { color: "#2ecc71", fontWeight: "bold", fontSize: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { marginTop: 10, color: "#666", fontSize: 16 },
  card: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 2,
  },
  cardContent: { flexDirection: "row", alignItems: "center" },
  cardBody: { flex: 1 },
  title: { fontWeight: "bold", fontSize: 16, color: "#2ecc71", marginBottom: 4 },
  message: { fontSize: 14, color: "#333", marginBottom: 6 },
  sender: { fontSize: 13, color: "#888", marginBottom: 4 },
  timestamp: { fontSize: 12, color: "#aaa", textAlign: "right" },
});
