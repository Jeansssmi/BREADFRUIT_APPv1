import React, { useLayoutEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { Appbar, Text } from 'react-native-paper'; // ✅ 1. Import Appbar
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import TreeCard from '@/components/TreeCard';
import { useTreeData } from '@/hooks/useTreeData';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TrackedTreesScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  // @ts-ignore
  const { trackedBy } = route.params;

  const { trees, isLoading, error } = useTreeData({
    mode: 'criteria', field: 'trackedBy', operator: '==', value: trackedBy,
  });

  // ✅ 2. Configure the header within useLayoutEffect
  useLayoutEffect(() => {
    navigation.setOptions({
      title: trackedBy ? `${trackedBy}'s Tracked Trees` : 'Tracked Trees',
      headerShown: true, // Make sure header is visible
      header: () => (
        <Appbar.Header style={{ backgroundColor: '#ffffff', elevation: 0 }}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={trackedBy ? `${trackedBy}'s Trees` : 'Tracked Trees'} titleStyle={{ fontWeight: 'bold' }} />
        </Appbar.Header>
      )
    });
  }, [navigation, trackedBy]);

  if (error) return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;
  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FlatList
          data={trees}
          keyExtractor={item => item.treeID}
          renderItem={({ item }) => (
            <TreeCard
              tree={item}
              // @ts-ignore
              onPress={() => navigation.navigate('TreeDetails', { treeID: item.treeID })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="tree" size={40} color="#888" />
              <Text style={styles.emptyText}>This user has not tracked any trees.</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  // ✅ 3. Adjusted padding to account for the header
  container: { flex: 1, backgroundColor: '#ffffff' },
  listContent: { padding: 20, paddingBottom: 80 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#e74c3c', fontSize: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 50 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 16 },
});