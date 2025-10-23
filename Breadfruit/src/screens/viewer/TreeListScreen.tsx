import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from 'react-native-paper'; // ✅ useTheme from Paper
import TreeCard from '@/components/TreeCard';
import { useTreeData } from '@/hooks/useTreeData';

// ✅ TreeFilter (unchanged UI, themed colors)
function TreeFilter({ selected, onSelect, options, theme }) {
  return (
    <View style={styles.filterContainer}>
      {options.map(option => {
        const isActive = selected === option;
        return (
          <TouchableOpacity
            key={option}
            style={[
              styles.filterChip,
              {
                borderColor: theme.colors.primary,
                backgroundColor: isActive ? theme.colors.primary : 'transparent',
              },
            ]}
            onPress={() => onSelect(option)}
          >
            <Text
              style={[
                styles.filterTextChip,
                { color: isActive ? '#fff' : theme.colors.primary },
              ]}
            >
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
  const theme = useTheme(); // ✅ Access global Paper + ThemeContext colors

  const filteredTrees = useMemo(() => {
    if (selectedStatus === 'All') return trees;
    return trees.filter(tree => tree.fruitStatus === selectedStatus);
  }, [trees, selectedStatus]);

  const filterOptions = ['All', 'Ready', 'Unripe', 'Harvested'];

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error || '#e74c3c' }]}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TreeFilter
        selected={selectedStatus}
        onSelect={setSelectedStatus}
        options={filterOptions}
        theme={theme}
      />

      {isLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTrees}
          keyExtractor={item => item.treeID}
          renderItem={({ item }) => (
            <TreeCard
              tree={item}
              onPress={() =>
                navigation.navigate('Map', {
                  lat: item.coordinates.latitude,
                  lng: item.coordinates.longitude,
                })
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="tree" size={40} color={theme.colors.text} />
              <Text
                style={[
                  styles.emptyText,
                  { color: theme.dark ? '#aaa' : '#888' },
                ]}
              >
                No matching trees found
              </Text>
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
  container: { flex: 1, padding: 20 },
  errorText: { fontSize: 16, marginTop: 10, textAlign: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, marginTop: 16, textAlign: 'center' },
  listContent: { paddingBottom: 24 },
  filterContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  filterChip: { borderRadius: 8, borderWidth: 1, paddingVertical: 4, paddingHorizontal: 10 },
  filterTextChip: { fontSize: 12 },
});
