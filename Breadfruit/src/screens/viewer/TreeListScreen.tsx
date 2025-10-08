import TreeCard from '@/components/TreeCard';
import { useTreeData } from '@/hooks/useTreeData';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// TreeFilter component converted to plain RN
function TreeFilter({ selected, onSelect, options }) {
  return (
    <View style={styles.filterContainer}>
      {options.map(option => {
        const isActive = selected === option;
        return (
          <TouchableOpacity
            key={option}
            style={[
              styles.filterChip,
              isActive && styles.activeFilterChip
            ]}
            onPress={() => onSelect(option)}
          >
            <Text style={[styles.filterTextChip, isActive && styles.activeFilterTextChip]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TreeListScreen() {
  const { trees, isLoading, error } = useTreeData(); 
  const [selectedStatus, setSelectedStatus] = useState('All'); 
  const navigation = useNavigation();

  const filteredTrees = useMemo(() => {
    if (selectedStatus === 'All') return trees;
    return trees.filter(tree => tree.fruitStatus === selectedStatus);
  }, [trees, selectedStatus]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const filterOptions = ['All', 'Ready', 'Unripe', 'Harvested']; // example statuses

  return (
    <View style={styles.container}>
      <TreeFilter selected={selectedStatus} onSelect={setSelectedStatus} options={filterOptions} />

      {isLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#2ecc71"/>
        </View>
      ) : (
        <FlatList
          data={filteredTrees}
          keyExtractor={item => item.treeID}
          renderItem={({ item }) => (
            <TreeCard 
              tree={item} 
              onPress={() => navigation.navigate('Map', {
                lat: item.coordinates.latitude,
                lng: item.coordinates.longitude
              })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="tree" size={40} color="#888" />
              <Text style={styles.emptyText}>No matching trees found</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#ffffff' }, 
  errorText: { color: '#e74c3c', fontSize: 16, marginTop: 10, textAlign: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 16, textAlign: 'center' },
  listContent: { paddingBottom: 24 },
  filterContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  filterChip: { borderRadius: 8, borderWidth: 1, borderColor: '#2ecc71', paddingVertical: 4, paddingHorizontal: 10 },
  filterTextChip: { color: '#2ecc71', fontSize: 12 },
  activeFilterChip: { backgroundColor: '#2ecc71' },
  activeFilterTextChip: { color: 'white' },
});
