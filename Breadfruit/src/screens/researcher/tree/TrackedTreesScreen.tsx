import TreeCard from '@/components/TreeCard';
import { useTreeData } from '@/hooks/useTreeData';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLayoutEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function TrackedTreesScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { trackedBy } = route.params;

  const { trees, isLoading, error } = useTreeData({
    mode: 'criteria', field: 'trackedBy', operator: '==', value: trackedBy,
  }); 

  useLayoutEffect(() => {
    navigation.setOptions({ title: `${trackedBy}'s Tracked Trees` });
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
  container: { flex: 1, padding: 20, backgroundColor: '#ffffff' }, 
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#e74c3c', fontSize: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 50 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 16 },
  listContent: { paddingBottom: 80 },
});