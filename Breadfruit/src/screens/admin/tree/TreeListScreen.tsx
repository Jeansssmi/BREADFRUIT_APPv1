import TreeCard from '@/components/TreeCard';
import { useTreeData } from '@/hooks/useTreeData';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { Chip, FAB, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const TreeFilter = ({ selected, onSelect }: { selected: string; onSelect: (status: string) => void }) => {
  const fruitStatus = ['All', 'ripe', 'unripe', 'none'];
  return (
    <View style={styles.filterContainer}>
      {fruitStatus.map(status => (
        <Chip
          key={status}
          mode="outlined"
          onPress={() => onSelect(status)}
          style={[styles.filterChip, selected === status && styles.activeFilterChip]}
          textStyle={[styles.filterTextChip, selected === status && styles.activeFilterTextChip]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Chip>
      ))}
    </View>
  );
};

export default function TreeListScreen() {
  const { trees, isLoading, error } = useTreeData(); 
  const [selectedStatus, setSelectedStatus] = useState('All'); 
  const navigation = useNavigation();

  const filteredTrees = useMemo(() => {
    if (selectedStatus === 'All') return trees;
    return trees.filter(tree => tree.fruitStatus === selectedStatus);
  }, [trees, selectedStatus]); 

  if (error) return <View style={styles.container}><Text style={styles.errorText}>{error}</Text></View>;
  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TreeFilter selected={selectedStatus} onSelect={setSelectedStatus} />
        <FlatList
          data={filteredTrees}
          keyExtractor={item => item.treeID}
          renderItem={({ item }) => <TreeCard tree={item} onPress={() => navigation.navigate('TreeDetails', { treeID: item.treeID })} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="tree" size={40} color="#888" />
              <Text style={styles.emptyText}>No matching trees found</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
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