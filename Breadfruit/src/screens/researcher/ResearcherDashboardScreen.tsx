import React, { useEffect, useState, useCallback } from 'react';
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
  Modal,
  SectionList,
} from 'react-native';
import { Appbar, Card, Text, Button } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export default function ResearcherDashboardScreen() {
  const navigation = useNavigation<any>();
  const [allTrees, setAllTrees] = useState(0);
  const [showOlder, setShowOlder] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);

  const currentUser = auth().currentUser;
  const trackedStatuses = ['verified', 'harvest-ready', 'not-ready', 'harvested'];

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

  // Real-time updates for verified trees
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = firestore()
      .collection('trees')
      .where('trackedById', '==', currentUser.uid)
      .where('status', '==', 'verified')
      .onSnapshot(snap => setAllTrees(snap?.size ?? 0));

    return () => unsubscribe();
  }, [currentUser]);


 // Fetch activity logs for the current user only
 useEffect(() => {
   const user = auth().currentUser;
   if (!user) return;


    const unsubscribe = firestore()
      .collection('activityLog')
      .where('uid', '==', user.uid) // ✅ Match your actual field name
        .where('userRole', '==', 'researcher') // Fetch only logs belonging to this researcher
      .limit(30) // removed orderBy to avoid index requirement
      .onSnapshot(
        (snapshot) => {
          const data = snapshot.docs
            .map((doc) => {
              const raw = doc.data();
              const tsDate = raw.timestamp?.toDate
                ? raw.timestamp.toDate()
                : new Date(raw.timestamp);
              return { id: doc.id, ...raw, timestampDate: tsDate };
            })
            .sort((a, b) => b.timestampDate - a.timestampDate); // manual sort by date (newest first)

          setRecentActivity(data);
        },
        (error) => console.error('Error fetching researcher activity:', error)
      );

    return () => unsubscribe();
  }, []);



  useEffect(() => {
    fetchAllCounts();
  }, [currentUser]);

  useFocusEffect(
    useCallback(() => {
      fetchAllCounts();
    }, [])
  );

  const groupActivitiesByDate = (activities: any[]) => {
    const groups: any = { today: [], yesterday: [], earlier: [], older: [] };
    const now = new Date();
    const todayStr = now.toDateString();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    activities.forEach(act => {
      const actDate = act.timestampDate?.toDateString();
      const diffInDays = Math.floor(
        (now.getTime() - act.timestampDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (actDate === todayStr) groups.today.push(act);
      else if (actDate === yesterdayStr) groups.yesterday.push(act);
      else if (diffInDays <= 7) groups.earlier.push(act);
      else groups.older.push(act);
    });

    return groups;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'tree_added': return { icon: 'tree-outline', color: '#27ae60', label: 'Tree Added' };
      case 'harvest_ready': return { icon: 'fruit-grapes-outline', color: '#f39c12', label: 'Harvest Ready' };
      case 'harvested': return { icon: 'fruit-pineapple', color: '#2ecc71', label: 'Harvested' };
      case 'collected': return { icon: 'basket-outline', color: '#3498db', label: 'Collected' };
      case 'verified': return { icon: 'check-decagram', color: '#16a085', label: 'Verified' };
      case 'deleted': return { icon: 'delete-outline', color: '#e74c3c', label: 'Deleted' };
      default: return { icon: 'file-document-outline', color: '#7f8c8d', label: 'General Activity' };
    }
  };

  const groupedActivities = groupActivitiesByDate(recentActivity);
  const sections = [
    { title: 'Today', data: groupedActivities.today },
    { title: 'Yesterday', data: groupedActivities.yesterday },
    { title: 'Earlier This Week', data: groupedActivities.earlier },
    ...(showOlder ? [{ title: 'Older', data: groupedActivities.older }] : []),
  ].filter(s => s.data.length > 0);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbarHeader}>
        <Appbar.Content title="Dashboard" titleStyle={styles.appbarTitle} />
        <Appbar.Action icon="bell-outline" color="black" onPress={() => {}} />
      </Appbar.Header>

      {/* Dashboard cards above SectionList */}
      <View style={styles.scrollContent}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons name="chart-bar" size={20} color="#2ecc71" />
          <Text style={styles.mainTitle}>Breadfruit Analytics</Text>
        </View>

        <Pressable onPress={() => navigation.navigate('TreeList')}>
          <Card style={[styles.card, styles.primaryCard]}>
            <Card.Content style={styles.cardContentRow}>
              <MaterialCommunityIcons name="tree" size={18} color="#2ecc71" />
              <Text style={styles.cardTitle}>Total Trees Tracked</Text>
            </Card.Content>
            <Card.Content>
              <Text style={styles.largeStat}>{allTrees}</Text>
            </Card.Content>
          </Card>
        </Pressable>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContentRow}>
            <MaterialCommunityIcons name="fruit-cherries" size={18} color="#2ecc71" />
            <Text style={styles.cardTitle}>Harvest Ready</Text>
          </Card.Content>
          <Card.Content>
            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                compact
                onPress={() => navigation.navigate('HarvestList', { filter: 'ripe' })}
                style={styles.ripeButton}
              >
                View Ripe
              </Button>
              <Button
                mode="contained"
                compact
                onPress={() => navigation.navigate('HarvestedList', { filter: 'harvested' })}
                style={styles.harvestedButton}
              >
                View Harvested
              </Button>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* SectionList for Recent Activity */}
      <SectionList
        style={{ paddingHorizontal: 20, marginTop: 10 }}
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={({ item, section }) => {
          const faded = section.title === 'Older';
          return (
            <Pressable
              onPress={() => {
                setSelectedActivity(item);
                setModalVisible(true);
              }}
            >
              <View style={styles.activityItem}>
                <Text style={{ color: faded ? '#999' : '#000' }}>• {item.description}</Text>
                {item.timestampDate && (
                  <Text style={{ color: faded ? '#aaa' : '#666', fontSize: 12 }}>
                    {item.timestampDate.toLocaleString()}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        }}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={{ fontWeight: 'bold', color: title === 'Older' ? '#888' : '#333' }}>
              {title}
            </Text>
          </View>
        )}
        stickySectionHeadersEnabled
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAllCounts} />}
        ListEmptyComponent={<Text style={styles.activityItem}>No recent activity to show.</Text>}
      />

      {/* Activity Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedActivity && (() => {
              const info = getActivityIcon(selectedActivity.type);
              return (
                <>
                  <MaterialCommunityIcons
                    name={info.icon}
                    size={40}
                    color={info.color}
                    style={{ alignSelf: 'center', marginBottom: 10 }}
                  />
                  <Text style={{ textAlign: 'center', fontWeight: 'bold', color: info.color, marginBottom: 10, fontSize: 16 }}>
                    {info.label}
                  </Text>
                </>
              );
            })()}

            <Text style={styles.modalLabel}>Description:</Text>
            <Text style={styles.modalText}>{selectedActivity?.description || 'No description available'}</Text>

            <Text style={styles.modalLabel}>Date & Time:</Text>
            <Text style={styles.modalText}>
              {selectedActivity?.timestampDate ? selectedActivity.timestampDate.toLocaleString() : 'N/A'}
            </Text>

            {selectedActivity?.userName && (
              <>
                <Text style={styles.modalLabel}>Performed By:</Text>
                <Text style={styles.modalText}>{selectedActivity.userName}</Text>
              </>
            )}

            <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fa' },
  appbarHeader: { backgroundColor: '#fff', elevation: 0, borderBottomWidth: 1, borderBottomColor: '#eee' },
  appbarTitle: { color: '#000', fontWeight: 'bold', fontSize: 20 },
  scrollContent: { padding: 20 },
  titleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  mainTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginLeft: 8 },
  card: { marginBottom: 16, borderRadius: 12, backgroundColor: '#fff', elevation: 2 },
  primaryCard: { borderLeftWidth: 5, borderLeftColor: '#2ecc71' },
  cardContentRow: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { color: '#2ecc71', fontWeight: 'bold', fontSize: 14, marginLeft: 8 },
  largeStat: { fontSize: 48, fontWeight: 'bold', color: '#2ecc71', marginTop: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  ripeButton: { backgroundColor: '#2ecc71', flex: 1, marginRight: 5, borderRadius: 20 },
  harvestedButton: { backgroundColor: '#27ae60', flex: 1, marginLeft: 5, borderRadius: 20 },
  activityCard: { borderRadius: 12, backgroundColor: '#fff', elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionHeader: { backgroundColor: '#f9f9f9', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, marginTop: 10 },
  activityItem: { marginTop: 6, borderBottomWidth: 0.5, borderBottomColor: '#eee', paddingBottom: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', width: '85%', borderRadius: 12, padding: 20, elevation: 5 },
  modalLabel: { fontWeight: '600', color: '#444', marginTop: 8 },
  modalText: { color: '#555', fontSize: 14 },
  closeButton: { backgroundColor: '#2ecc71', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 16 },
});
