import React, { useEffect, useState, useCallback } from 'react';
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
  Modal,
  SectionList,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Appbar, Card, Text, Button, useTheme, Divider } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export default function ResearcherDashboardScreen() {
  const navigation = useNavigation<any>();
  const theme = useTheme();


  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [allTrees, setAllTrees] = useState(0);
  const [showActivity, setShowActivity] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  const currentUser = auth().currentUser;
  const trackedStatuses = ['verified', 'harvest-ready', 'not-ready', 'harvested'];


 useEffect(() => {
   if (!currentUser) return;

   const unsubscribe = firestore()
     .collection("notification")
     .where("recipientID", "==", currentUser.uid)
     .where("read", "==", false)
     .onSnapshot(
       (snapshot) => {
         // ✅ SAFETY CHECK FOR NULL SNAPSHOT
         if (!snapshot || snapshot.empty) {
           setUnreadCount(0);
           return;
         }

         // ✅ number of unread notifications
         setUnreadCount(snapshot.docs.length);
       },
       (error) => {
         console.error("Notification listener error:", error);
         setUnreadCount(0); // prevent crash ✅
       }
     );

   return () => unsubscribe();
 }, [currentUser]);


  // 🔹 Fetch tree count
  const fetchAllCounts = async () => {
    if (!currentUser) return;
    setRefreshing(true);
    try {
      const treesSnap = await firestore()
        .collection('trees')
        .where('trackedById', '==', currentUser.uid)
        .where('status', 'in', trackedStatuses)
        .get();
      setAllTrees(treesSnap.size);
    } catch (error) {
      console.error('Error fetching tree counts:', error);
    } finally {
      setRefreshing(false);
    }
  };


  useEffect(() => {
    fetchAllCounts();
  }, [currentUser]);

  useFocusEffect(
    useCallback(() => {
      fetchAllCounts();
    }, [])
  );

  // 🔹 Get current user info
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = firestore()
      .collection('users')
      .doc(currentUser.uid)
      .onSnapshot((doc) => {
        if (doc.exists) {
          setUser({ uid: doc.id, ...doc.data() });
          setLoading(false);
        }
      });
    return () => unsubscribe();
  }, []);

  // ✅ Fetch today's recent activities — index-free version
  useEffect(() => {
    if (!currentUser) return;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const unsubscribe = firestore()
      .collection('activityLog')
      .where('uid', '==', currentUser.uid)
      .onSnapshot(
        (snapshot) => {
          let data = snapshot.docs.map((doc) => {
            const raw = doc.data();
            const tsDate = raw.timestamp?.toDate
              ? raw.timestamp.toDate()
              : new Date(raw.timestamp);
            return { id: doc.id, ...raw, timestampDate: tsDate };
          });

          // ✅ Filter only today’s logs (locally)
          data = data.filter(
            (a) => a.timestampDate >= startOfDay && a.timestampDate <= endOfDay
          );

          // ✅ Sort newest first
          data.sort((a, b) => b.timestampDate - a.timestampDate);

          setRecentActivity(data.slice(0, 30)); // Limit display to 30 items max
        },
        (error) => console.error('Error fetching activities:', error)
      );

    return () => unsubscribe();
  }, [currentUser]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'add':
        return { icon: 'plus-circle', color: '#2ecc71', label: 'Tree Added' };
      case 'update':
        return { icon: 'pencil-circle', color: '#f1c40f', label: 'Tree Updated' };
      case 'delete':
        return { icon: 'delete-circle', color: '#e74c3c', label: 'Tree Deleted' };
      default:
        return { icon: 'information-outline', color: '#3498db', label: 'Activity' };
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  // ✅ Section for “Today”
  const sections = [
    {
      title: 'Today',
      data: recentActivity,
    },
  ];
return (
  <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

    {/* ✅ App Bar with Bell */}
    <Appbar.Header style={styles.appbarHeader}>
      <Appbar.Content title="Dashboard" titleStyle={styles.appbarTitle} />

      <View style={styles.bellWrapper}>
        <Appbar.Action
          icon="bell-outline"
          color={theme.colors.primary}
          onPress={() => navigation.navigate("NotificationsScreen")}
        />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </Text>
          </View>
        )}
      </View>
    </Appbar.Header>

    {/* ✅ Main ScrollView stays inside root View */}
    <ScrollView
      style={{ flex: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAllCounts} />}
    >

      {/* Dashboard cards */}
      <View style={styles.scrollContent}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons
            name="chart-bar"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={[styles.mainTitle, { color: theme.colors.text }]}>
            Breadfruit Analytics
          </Text>
        </View>

        <Pressable onPress={() => navigation.navigate('TreeList')}>
          <Card
            style={[
              styles.card,
              { backgroundColor: theme.colors.card, borderLeftColor: theme.colors.primary },
            ]}
          >
            <Card.Content style={styles.cardContentRow}>
              <MaterialCommunityIcons name="tree" size={18} color={theme.colors.primary} />
              <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
                Total Trees Tracked
              </Text>
            </Card.Content>
            <Card.Content>
              <Text style={[styles.largeStat, { color: theme.colors.text }]}>
                {allTrees}
              </Text>
            </Card.Content>
          </Card>
        </Pressable>
      </View>

      {/* ✅ Recent Activity Section */}
      <Card style={[styles.card, { backgroundColor: theme.colors.card, marginHorizontal: 20 }]}>
        <Card.Content>


          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons
                name="clock-time-three-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>
                Recent Activity
              </Text>
            </View>

            <View style={{ flexDirection: 'row' }}>
              {/* ✅ New Show/Hide Button */}
              <Button
                mode="text"
                compact
                onPress={() => setShowActivity(!showActivity)}
                labelStyle={{ color: theme.colors.primary, fontWeight: 'bold' }}
              >
                {showActivity ? 'Hide' : 'Show'}
              </Button>

              {/* Existing View All Button (unchanged) */}
              <Button
                mode="text"
                compact
                onPress={() => navigation.navigate('ActivityLogsScreen')}
                labelStyle={{ color: theme.colors.primary, fontWeight: 'bold' }}
              >
                View All
              </Button>
            </View>
          </View>




          <Divider style={{ marginVertical: 10 }} />

         {showActivity && (
           <SectionList
             sections={[{ title: 'Today', data: recentActivity }]}
             keyExtractor={(item) => item.id}
             scrollEnabled={false}
             renderItem={({ item }) => (
               <Pressable onPress={() => navigation.navigate('ActivityLogsScreen')}>
                 <View style={[styles.activityItem, { borderBottomColor: theme.dark ? '#333' : '#eee' }]}>
                   <Text style={{ color: theme.colors.text }}>• {item.description}</Text>
                 </View>
               </Pressable>
             )}
           />
         )}


        </Card.Content>
      </Card>

    </ScrollView>
  </View>
);
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  appbarHeader: { elevation: 0, borderBottomWidth: 1 },
  appbarTitle: { fontWeight: 'bold', fontSize: 20 },
  scrollContent: { padding: 20 },
  titleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  mainTitle: { fontSize: 24, fontWeight: 'bold', marginLeft: 8 },
  card: { marginBottom: 16, borderRadius: 12, elevation: 2, borderLeftWidth: 5 },
  cardContentRow: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontWeight: 'bold', fontSize: 14, marginLeft: 8 },
  largeStat: { fontSize: 48, fontWeight: 'bold', marginTop: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  ripeButton: { flex: 1, marginRight: 5, borderRadius: 20 },
  harvestedButton: { flex: 1, marginLeft: 5, borderRadius: 20 },
  sectionHeader: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, marginTop: 10 },
  activityItem: { marginTop: 6, borderBottomWidth: 0.5, paddingBottom: 4 },

bellWrapper: {
  position: "absolute",
  right: 10,
  top: 8,
},

badge: {
  position: "absolute",
  right: -4,
  top: -4,
  backgroundColor: "#e74c3c",
  borderRadius: 10,
  minWidth: 18,
  height: 18,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 2,
  zIndex: 999,
},

badgeText: {
  color: "#fff",
  fontSize: 10,
  fontWeight: "bold",
  textAlign: "center",
},
});
