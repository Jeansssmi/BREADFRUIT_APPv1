import React, { useEffect, useState, useCallback } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  InteractionManager,
} from "react-native";
import {
  Card,
  Text,
  Appbar,
  Badge,
  useTheme,
  Button, // ✅ added for toggle
  Divider,
} from "react-native-paper";
import { useNavigation , useFocusEffect} from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";




export default function AdminDashboardScreen() {
  const navigation = useNavigation();
  const theme = useTheme();

  const [unreadCount, setUnreadCount] = useState(0);

  const [allTrees, setAllTrees] = useState(0);
  const [allUsers, setAllUsers] = useState(0);
  const [researchers, setResearchers] = useState(0);
  const [pendingUsers, setPendingUsers] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [showActivity, setShowActivity] = useState(false);
  const [trackedTrees, setTrackedTrees] = useState(0);
  const [pendings, setPendings] = useState(0);
  const [pendingTrees, setPendingTrees] = useState(0);


 // ✅ Fetch dashboard statistics directly from Firestore (optimized + fixed)
 const fetchAllCounts = async () => {
   setRefreshing(true);
   try {

     const trackedSnap = await firestore()
       .collection("trees")
       .where("status", "in", ["verified", "harvest-ready", "not-ready", "harvested"])
       .get();
     setAllTrees(trackedSnap.size);


     const usersSnap = await firestore().collection("users").get();
     setAllUsers(usersSnap.size);

     const researchersSnap = await firestore()
       .collection("users")
       .where("role", "==", "researcher")
       .get();
     setResearchers(researchersSnap.size);


         const pendingUsersSnap = await firestore()
           .collection("users")
           .where("status", "==", "pending")
           .get();
         setPendingUsers(pendingUsersSnap.size)

    const unsubPending = firestore()
      .collection('trees')
      .where('status', '==', 'pending')

     .onSnapshot((snapshot) => {
       if (!snapshot) {
         setPendings(0);
         return;
       }
       setPendings(snapshot.size ?? 0);
     });
  const pendingTreesSnap = await firestore()
    .collection("trees")
    .where("status", "==", "pending")
    .get();

  setPendingTrees(pendingTreesSnap.size);



   } catch (error) {
     console.error("Error fetching counts:", error);
   } finally {
     setRefreshing(false);
   }
 };

// ✅ Count ALL unread notifications for admin (read == false)
useEffect(() => {
  const user = auth().currentUser;
  if (!user) return;

  const unsubUser = firestore()
    .collection("users")
    .doc(user.uid)
    .onSnapshot((userDoc) => {
      const role = userDoc.data()?.role;
      let unsubNotif;

      // RESET COUNT
      setUnseenCount(0);

      // ✅ ADMIN → count where recipientRole = "Admin"
      if (role === "admin") {
        unsubNotif = firestore()
          .collection("notification")
          .where("recipientRole", "==", "Admin")
          .where("read", "==", false)    // ← FIXED HERE
          .onSnapshot((snap) => setUnseenCount(snap?.size ?? 0));

        return;
      }

      // ✅ Researcher → count own unread notifications
      if (role === "researcher") {
        unsubNotif = firestore()
          .collection("notification")
          .where("recipientID", "==", user.uid)
          .where("read", "==", false)    // ← FIXED HERE
          .onSnapshot((snap) => setUnseenCount(snap?.size ?? 0));

        return;
      }

      // ❌ Viewer → no notifications
      setUnseenCount(null);
    });

  return () => unsubUser();
}, []);


// ✅ Real-time Recent Activity with reliable timestamp updates
useEffect(() => {
  const unsubscribe = firestore()
    .collection("activityLog")
    .orderBy("timestamp", "desc")
    .limit(5)
    .onSnapshot(
      (snapshot) => {
        const updatedData = snapshot.docs.map((doc) => {
          const raw = doc.data();
          const timestamp = raw.timestamp;

          // Handle various timestamp formats safely
          let tsDate = null;
          if (timestamp) {
            if (typeof timestamp.toDate === "function") tsDate = timestamp.toDate();
            else if (typeof timestamp === "number") tsDate = new Date(timestamp);
            else if (typeof timestamp === "string") tsDate = new Date(timestamp);
            else if (timestamp.seconds) tsDate = new Date(timestamp.seconds * 1000);
          }

          return { id: doc.id, ...raw, timestampDate: tsDate };
        });

        // Always sort again to handle late Firestore timestamp updates
        updatedData.sort((a, b) => (b.timestampDate || 0) - (a.timestampDate || 0));

        setRecentActivity(updatedData);
      },
      (error) => console.error("Error fetching activity:", error)
    );

  return () => unsubscribe();
}, []);


  const getActivityIcon = (type) => {
    switch (type) {
      case "create":
        return "tree";
      case "harvest":
        return "fruit-cherries";
      case "collected":
        return "package-variant-closed";
      default:
        return "clock-outline";
    }
  };

// ✅ Debounced + cleaned real-time Firestore listeners
  useFocusEffect(
    useCallback(() => {
      let timeoutId;

     const unsubTrees = firestore()
       .collection("trees")
       .where("status", "in", ["verified", "harvest-ready", "not-ready", "harvested"])
       .onSnapshot((snapshot) => {
         clearTimeout(timeoutId);
         timeoutId = setTimeout(() => setAllTrees(snapshot.size), 150);
       });

      const unsubUsers = firestore()
        .collection("users")
        .onSnapshot((snapshot) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => setAllUsers(snapshot.size), 150);
        });

      const unsubResearchers = firestore()
        .collection("users")
        .where("role", "==", "researcher")
        .onSnapshot((snapshot) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => setResearchers(snapshot.size), 150);
        });

      const unsubPending = firestore()
        .collection("users")
        .where("status", "==", "pending")
        .onSnapshot((snapshot) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => setPendingUsers(snapshot.size), 150);
        });

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        unsubTrees();
        unsubUsers();
        unsubResearchers();
        unsubPending();
      };
    }, [])
  );

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      fetchAllCounts();
    });
    return () => task.cancel();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header
        style={[
          styles.appbarHeader,
          {
            backgroundColor: theme.colors.card,
            borderBottomColor: theme.dark ? "#333" : "#eee",
          },
        ]}
      >
        <Appbar.Content
          title="Dashboard"
          titleStyle={[styles.appbarTitle, { color: theme.colors.text }]}
        />

        <View style={{ marginRight: 10 }}>
          <Appbar.Action
            icon="bell-ring"
            color="#FFD700" // 🟡 Yellow bell icon
            onPress={() => navigation.navigate("NotificationsScreen")}
          />
          {unseenCount > 0 && (
            <View
              style={{
                position: "absolute",
                top: 2,
                right: 4,
                backgroundColor: "#e74c3c",
                borderRadius: 10,
                minWidth: 18,
                height: 18,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 3,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                {unseenCount > 9 ? "9+" : unseenCount}
              </Text>
            </View>
          )}
        </View>

      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchAllCounts} />
        }
      >
        {/* Title */}
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons
            name="view-dashboard"
            size={24}
            color={theme.colors.primary}
          />
          <Text style={[styles.mainTitle, { color: theme.colors.text }]}>
            Admin Dashboard
          </Text>
        </View>

        {/* ✅ Dashboard Cards */}
        <View style={styles.gridContainer}>
          {[

            {
              title: "Map Trees",
              value: allTrees,
              icon: "forest",
              onPress: () => navigation.navigate("Map"),
            },


            {
              title: "All Users",
              value: allUsers,
              icon: "account-group",
              onPress: () => navigation.navigate("UserList"),
            },
            {
              title: "Pending Trees",
              value: pendingTrees,
              icon: "account-clock",
              onPress: () => navigation.navigate("PendingTrees"),
            },
            {
              title: "Pending Users",
              value: pendingUsers,
              icon: "account-clock",
              onPress: () => navigation.navigate("PendingUsers"),
            },
          ].map((card) => (
            <Pressable key={card.title} style={styles.gridItem} onPress={card.onPress}>
              <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <MaterialCommunityIcons
                      name={card.icon}
                      size={20}
                      color={theme.colors.primary}
                    />
                    <Text
                      style={[styles.cardTitle, { color: theme.colors.primary }]}
                    >
                      {card.title}
                    </Text>
                  </View>
                  <Text style={[styles.cardValue, { color: theme.colors.text }]}>
                    {card.value}
                  </Text>
                </Card.Content>
              </Card>
            </Pressable>
          ))}
        </View>


     {/* ✅ Clean Toggleable Recent Activity */}
     <Card style={[styles.activityCard, { backgroundColor: theme.colors.card }]}>
       <Card.Content>
         <View
           style={{
             flexDirection: "row",
             alignItems: "center",
             justifyContent: "space-between",
           }}
         >
           <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
             <MaterialCommunityIcons
               name="clock-time-three-outline"
               size={20}
               color={theme.colors.primary}
             />
             <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
               Recent Activity
             </Text>
           </View>

           <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
             <Button
               mode="text"
               compact
               onPress={() => navigation.navigate("ActivityLogsScreen")}
               labelStyle={{ color: theme.colors.primary, fontWeight: "bold" }}
             >
               Show All
             </Button>

             <Button
               mode="text"
               compact
               onPress={() => setShowActivity((prev) => !prev)}
               labelStyle={{ color: theme.colors.primary, fontWeight: "bold" }}
             >
               {showActivity ? "Hide" : "Show"}
             </Button>
           </View>
         </View>

         {showActivity && (
           <>
             <Divider style={{ marginVertical: 10 }} />
             {recentActivity.length > 0 ? (
               recentActivity.map((activity) => (
                 <Pressable
                   key={activity.id}
                   style={({ pressed }) => [
                     styles.activityItem,
                     {
                       backgroundColor: pressed
                         ? theme.dark
                           ? "#333"
                           : "#f0f0f0"
                         : "transparent",
                       borderRadius: 6,
                       paddingVertical: 6,
                       paddingHorizontal: 4,
                     },
                   ]}
                   onPress={() =>
                     navigation.navigate("ActivityLogsScreen", {
                       highlightId: activity.id,
                     })
                   }
                 >
                   <Text
                     style={{ color: theme.colors.text, fontWeight: "500" }}
                     numberOfLines={1}
                   >
                     • {activity.description}
                   </Text>
                   {activity.timestampDate && (
                     <Text
                       style={{
                         color: theme.dark ? "#aaa" : "#888",
                         fontSize: 12,
                       }}
                     >
                       {activity.timestampDate.toLocaleString()}
                     </Text>
                   )}
                 </Pressable>
               ))
             ) : (
               <Text
                 style={[styles.activityItem, { color: theme.colors.text }]}
               >
                 No recent activity to show.
               </Text>
             )}
           </>
         )}
       </Card.Content>
     </Card>



      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: 20 },
  appbarHeader: {
    elevation: 0,
    borderBottomWidth: 1,
  },
  appbarTitle: { fontSize: 20, fontWeight: "bold" },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  mainTitle: { fontSize: 22, fontWeight: "bold" },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  gridItem: { width: "48%", marginBottom: 15 },
  card: { borderRadius: 12, elevation: 2 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: { fontWeight: "600" },
  cardValue: { fontSize: 22, fontWeight: "bold", marginTop: 6 },
  activityCard: { borderRadius: 12, elevation: 2 },
  activityItem: { marginTop: 6 },
});
