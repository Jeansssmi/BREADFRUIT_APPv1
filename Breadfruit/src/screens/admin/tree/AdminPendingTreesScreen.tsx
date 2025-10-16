import TreeCard from '@/components/TreeCard';
import { useTreeData } from '@/hooks/useTreeData';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { FAB, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PendingTreesScreen() {
  const { trees, isLoading, error } = useTreeData({
    mode: 'criteria',
    field: 'status',
    operator: '==',
    value: 'pending',
  });

  const navigation = useNavigation<any>();

  if (error) {
    return <View style={styles.container}><Text style={styles.errorText}>{error}</Text></View>;
  }

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FlatList
          data={trees}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TreeCard
              tree={item}
              // ✅ FIX: Navigate to the consolidated details screen for any pending tree.
              // The details screen itself will decide which buttons to show.
              onPress={() => navigation.navigate('PendingApprovalScreen', { treeID: item.id })}
            />
          )}
          // ... (rest of FlatList)
        />
        <FAB
          icon="plus"
          style={styles.fab}
          color="white"
          onPress={() => navigation.navigate('AddTree')}
        />
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  container: { flex: 1, padding: 20, backgroundColor: '#ffffff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#e74c3c', fontSize: 16, textAlign: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 50 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 16, textAlign: 'center' },
  listContent: { paddingBottom: 80 },
  filterContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  filterChip: { borderRadius: 8, borderColor: '#2ecc71' },
  filterTextChip: { color: '#2ecc71', fontSize: 12 },
  activeFilterChip: { backgroundColor: '#2ecc71' },
  activeFilterTextChip: { color: 'white' },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#2ecc71', borderRadius: 50 },
});
