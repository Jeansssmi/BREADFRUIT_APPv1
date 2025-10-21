import React, { useLayoutEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { Text, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';

import TreeCard from '@/components/TreeCard';
import { useTreeData } from '@/hooks/useTreeData';

export default function TrackedTreesScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  // ✅ Receive trackedBy (for Firestore) and displayName (for title)
  const { trackedBy, displayName } = route.params;

  // ✅ Fetch trees tracked by this user
  const { trees, isLoading, error } = useTreeData({
    mode: 'criteria',
    field: 'trackedBy',
    operator: '==',
    value: trackedBy,
  });

  // ✅ Custom header that shows "<Name>'s Tracked Trees"
  useLayoutEffect(() => {
    if (displayName) {
      // ✅ Automatically handle "s" or "'s"
      const formattedName = displayName.endsWith('s')
        ? `${displayName}'`
        : `${displayName}'s`;

      navigation.setOptions({
        headerShown: true,
        headerTitle: `${formattedName} Tracked Trees`,
        headerTitleStyle: {
          fontWeight: 'bold',
          color: '#2ecc71',
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
        },
      });
    } else {
      navigation.setOptions({
        headerShown: true,
        headerTitle: "User's Tracked Trees",
      });
    }
  }, [navigation, displayName]);


  if (error)
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );

  if (isLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );

  return (
    <SafeAreaView style={styles.safeArea}>
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
              <MaterialCommunityIcons name="tree" size={40} color="#888" />
              <Text style={styles.emptyText}>
                {displayName || 'This user'} has not tracked any trees yet.
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />

        {/* ✅ Floating Add Tree Button */}
        <FAB
          icon="plus"
          style={styles.fab}
          color="white"
          onPress={() => navigation.navigate('AddTree', { trackedBy })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#e74c3c', fontSize: 16 },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyText: { fontSize: 16, color: '#888', marginTop: 16 },
  listContent: { paddingBottom: 80 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#2ecc71',
    borderRadius: 28,
  },
});
