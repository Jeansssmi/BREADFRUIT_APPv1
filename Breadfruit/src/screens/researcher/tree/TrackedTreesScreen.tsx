import React, { useLayoutEffect, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { Text, FAB, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import TreeCard from '@/components/TreeCard';

export default function TrackedTreesScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const theme = useTheme();

  const { trackedBy, displayName } = route.params;

  const [trees, setTrees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const allowedStatuses = ['verified', 'harvest-ready', 'not-ready', 'harvested'];

  useEffect(() => {
    if (!trackedBy) return;
    setLoading(true);

    // ✅ First check if this trackedBy UID is actually a researcher
    const userRef = firestore().collection('users').doc(trackedBy);
    let unsubscribeTrees: any = null;

    const unsubscribeUser = userRef.onSnapshot(
      (userDoc) => {
        if (!userDoc.exists || userDoc.data()?.role !== 'researcher') {
          setError('This user is not a researcher.');
          setTrees([]);
          setLoading(false);
          return;
        }

        // ✅ Fetch only researcher's tracked trees (real-time)
        unsubscribeTrees = firestore()
          .collection('trees')
          .where('trackedById', '==', trackedBy)
          .onSnapshot(
            (snapshot) => {
              const filtered = snapshot.docs
                .map((doc) => ({ treeID: doc.id, ...doc.data() }))
                .filter((tree) => allowedStatuses.includes(tree.status));

              setTrees(filtered);
              setError(null);
              setLoading(false);
            },
            (err) => {
              console.error('Error fetching tracked trees:', err);
              setError('Failed to load trees.');
              setLoading(false);
            }
          );
      },
      (error) => {
        console.error('Error checking user role:', error);
        setError('Failed to verify researcher.');
        setLoading(false);
      }
    );

    // ✅ Clean up both subscriptions
    return () => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeTrees) unsubscribeTrees();
    };
  }, [trackedBy]);

  // 🔹 Header setup
  useLayoutEffect(() => {
    const formattedName = displayName
      ? displayName.endsWith('s')
        ? `${displayName}'`
        : `${displayName}'s`
      : 'Researcher';

    navigation.setOptions({
      headerShown: true,
      headerTitle: `${formattedName} Tracked Trees`,
      headerTitleStyle: {
        fontWeight: 'bold',
        color: theme.colors.primary,
      },
      headerStyle: {
        backgroundColor: theme.colors.background,
        elevation: 0,
        shadowOpacity: 0,
      },
    });
  }, [navigation, displayName, theme]);

  // 🔹 Loading / Error states
  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // 🔹 Main content
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        <FlatList
          data={trees}
          keyExtractor={(item) => item.treeID}
          renderItem={({ item }) => (
            <TreeCard
              tree={item}
              onPress={() => navigation.navigate('TreeDetails', { treeID: item.treeID })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="tree"
                size={40}
                color={theme.dark ? '#aaa' : '#888'}
              />
              <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                {displayName || 'This researcher'} has no tracked trees yet.
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />

        {/* ✅ Only researchers can add new trees */}
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color="white"
          onPress={() => navigation.navigate('AddTree', { trackedBy })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, textAlign: 'center', paddingHorizontal: 20 },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyText: { fontSize: 16, marginTop: 16, textAlign: 'center' },
  listContent: { paddingBottom: 80 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: 28,
  },
});
