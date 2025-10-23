import React, { useEffect, useState, useCallback } from 'react';
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
  Modal,
  SectionList,
  ScrollView,
} from 'react-native';
import { Appbar, Card, Text, Button, useTheme, Divider } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export default function ResearcherDashboardScreen() {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const [allTrees, setAllTrees] = useState(0);
  const [showOlder, setShowOlder] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [showActivity, setShowActivity] = useState(false); // ✅ toggle button

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

  useEffect(() => {
    fetchAllCounts();
  }, [currentUser]);

  useFocusEffect(
    useCallback(() => {
      fetchAllCounts();
    }, [])
  );

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = firestore()
      .collection('activityLog')
      .where('uid', '==', currentUser.uid)
      .where('userRole', '==', 'researcher')
      .limit(30)
      .onSnapshot((snapshot) => {
        const data = snapshot.docs
          .map((doc) => {
            const raw = doc.data();
            const tsDate = raw.timestamp?.toDate
              ? raw.timestamp.toDate()
              : new Date(raw.timestamp);
            return { id: doc.id, ...raw, timestampDate: tsDate };
          })
          .sort((a, b) => b.timestampDate - a.timestampDate);
        setRecentActivity(data);
      });
    return () => unsubscribe();
  }, [currentUser]);

  const groupActivitiesByDate = (activities: any[]) => {
    const groups: any = { today: [], yesterday: [], earlier: [], older: [] };
    const now = new Date();
    const todayStr = now.toDateString();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    activities.forEach((act) => {
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
      case 'tree_added':
        return { icon: 'tree-outline', color: '#27ae60', label: 'Tree Added' };
      case 'harvest_ready':
        return { icon: 'fruit-grapes-outline', color: '#f39c12', label: 'Harvest Ready' };
      case 'harvested':
        return { icon: 'fruit-pineapple', color: '#2ecc71', label: 'Harvested' };
      case 'collected':
        return { icon: 'basket-outline', color: '#3498db', label: 'Collected' };
      case 'verified':
        return { icon: 'check-decagram', color: '#16a085', label: 'Verified' };
      case 'deleted':
        return { icon: 'delete-outline', color: '#e74c3c', label: 'Deleted' };
      default:
        return { icon: 'file-document-outline', color: '#7f8c8d', label: 'General Activity' };
    }
  };

  const groupedActivities = groupActivitiesByDate(recentActivity);
  const sections = [
    { title: 'Today', data: groupedActivities.today },
    { title: 'Yesterday', data: groupedActivities.yesterday },
    { title: 'Earlier This Week', data: groupedActivities.earlier },
    ...(showOlder ? [{ title: 'Older', data: groupedActivities.older }] : []),
  ].filter((s) => s.data.length > 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header
        style={[
          styles.appbarHeader,
          { backgroundColor: theme.colors.card, borderBottomColor: theme.dark ? '#333' : '#eee' },
        ]}
      >
        <Appbar.Content
          title="Dashboard"
          titleStyle={[styles.appbarTitle, { color: theme.colors.text }]}
        />
        <Appbar.Action icon="bell-outline" color={theme.colors.text} onPress={() => {}} />
      </Appbar.Header>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAllCounts} />}
      >
        {/* Dashboard cards */}
        <View style={styles.scrollContent}>
          <View style={styles.titleContainer}>
            <MaterialCommunityIcons name="chart-bar" size={20} color={theme.colors.primary} />
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
                <Text style={[styles.largeStat, { color: theme.colors.text }]}>{allTrees}</Text>
              </Card.Content>
            </Card>
          </Pressable>

          <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <Card.Content style={styles.cardContentRow}>
              <MaterialCommunityIcons
                name="fruit-cherries"
                size={18}
                color={theme.colors.primary}
              />
              <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>Harvest Ready</Text>
            </Card.Content>
            <Card.Content>
              <View style={styles.buttonRow}>
                <Button
                  mode="contained"
                  compact
                  onPress={() => navigation.navigate('HarvestList', { filter: 'ripe' })}
                  style={[styles.ripeButton, { backgroundColor: theme.colors.primary }]}
                >
                  View Ripe
                </Button>
                <Button
                  mode="contained"
                  compact
                  onPress={() => navigation.navigate('HarvestedList', { filter: 'harvested' })}
                  style={[
                    styles.harvestedButton,
                    { backgroundColor: theme.dark ? '#1e8e5f' : '#27ae60' },
                  ]}
                >
                  View Harvested
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* ✅ Show/Hide Button for Recent Activity */}
        <Card style={[styles.card, { backgroundColor: theme.colors.card, marginHorizontal: 20 }]}>
          <Card.Content>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
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

              <Button
                mode="text"
                compact
                onPress={() => setShowActivity((prev) => !prev)}
                labelStyle={{ color: theme.colors.primary, fontWeight: 'bold' }}
              >
                {showActivity ? 'Hide' : 'Show'}
              </Button>
            </View>

            {showActivity && (
              <>
                <Divider style={{ marginVertical: 10 }} />
                <SectionList
                  sections={sections}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}  // ✅ Fix nested list error
                  renderItem={({ item, section }) => {
                    const faded = section.title === 'Older';
                    return (
                      <Pressable
                        onPress={() => {
                          setSelectedActivity(item);
                          setModalVisible(true);
                        }}
                      >
                        <View
                          style={[
                            styles.activityItem,
                            { borderBottomColor: theme.dark ? '#333' : '#eee' },
                          ]}
                        >
                          <Text style={{ color: faded ? '#999' : theme.colors.text }}>
                            • {item.description}
                          </Text>
                          {item.timestampDate && (
                            <Text
                              style={{
                                color: faded ? '#aaa' : theme.dark ? '#ccc' : '#666',
                                fontSize: 12,
                              }}
                            >
                              {item.timestampDate.toLocaleString()}
                            </Text>
                          )}
                        </View>
                      </Pressable>
                    );
                  }}
                  renderSectionHeader={({ section: { title } }) => (
                    <View
                      style={[
                        styles.sectionHeader,
                        { backgroundColor: theme.dark ? '#1c1c1c' : '#f9f9f9' },
                      ]}
                    >
                      <Text style={{ fontWeight: 'bold', color: theme.colors.text }}>{title}</Text>
                    </View>
                  )}
                  stickySectionHeadersEnabled
                  ListEmptyComponent={
                    <Text style={[styles.activityItem, { color: theme.colors.text }]}>
                      No recent activity to show.
                    </Text>
                  }
                />
              </>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Modal unchanged */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.card }]}>
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
                  <Text
                    style={{
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: info.color,
                      marginBottom: 10,
                      fontSize: 16,
                    }}
                  >
                    {info.label}
                  </Text>
                </>
              );
            })()}
            <Text style={[styles.modalLabel, { color: theme.colors.text }]}>Description:</Text>
            <Text style={[styles.modalText, { color: theme.colors.text }]}>
              {selectedActivity?.description || 'No description available'}
            </Text>
            <Text style={[styles.modalLabel, { color: theme.colors.text }]}>Date & Time:</Text>
            <Text style={[styles.modalText, { color: theme.colors.text }]}>
              {selectedActivity?.timestampDate
                ? selectedActivity.timestampDate.toLocaleString()
                : 'N/A'}
            </Text>
            {selectedActivity?.userName && (
              <>
                <Text style={[styles.modalLabel, { color: theme.colors.text }]}>Performed By:</Text>
                <Text style={[styles.modalText, { color: theme.colors.text }]}>
                  {selectedActivity.userName}
                </Text>
              </>
            )}
            <Pressable
              style={[styles.closeButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%', borderRadius: 12, padding: 20, elevation: 5 },
  modalLabel: { fontWeight: '600', marginTop: 8 },
  modalText: { fontSize: 14 },
  closeButton: { paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 16 },
});
