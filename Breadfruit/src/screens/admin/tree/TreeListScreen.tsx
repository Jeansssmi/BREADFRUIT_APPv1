import React, { useState, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Appbar, Card, Chip, FAB, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTreeData } from '@/hooks/useTreeData';

// Custom list item component to match the design in the video
const TreeListItem = ({ tree, onPress }: { tree: any, onPress: () => void }) => (
    <TouchableOpacity onPress={onPress}>
        <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
                <MaterialCommunityIcons name="tree" size={24} color="#2ecc71" style={styles.icon} />
                <View style={styles.textContainer}>
                    <Text style={styles.treeIdText}>{tree.treeID}</Text>
                    <View style={styles.locationContainer}>
                        <MaterialCommunityIcons name="map-marker" size={14} color="#666" />
                       <Text style={styles.locationText}>
                         {tree.barangay ? `${tree.barangay}, ${tree.city}` : tree.city}
                       </Text>

                    </View>
                </View>
            </Card.Content>
        </Card>
    </TouchableOpacity>
);

export default function TreeListScreen() {
    const navigation = useNavigation<any>();
    const { trees, isLoading, error } = useTreeData({ mode: 'criteria', field: 'status', operator: '==', value: 'verified' });
    const [filter, setFilter] = useState<'All' | 'Ripe' | 'Unripe' | 'None'>('All');

    const filteredTrees = useMemo(() => {
        if (filter === 'All') return trees;
        return trees.filter(tree => tree.fruitStatus === filter.toLowerCase());
    }, [trees, filter]);

    if (error) {
        return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;
    }

    return (
        <View style={styles.container}>


            <View style={styles.filterContainer}>
                {(['All', 'Ripe', 'Unripe', 'None'] as const).map(f => (
                    <Chip
                        key={f}
                        mode="outlined"
                        selected={filter === f}
                        onPress={() => setFilter(f)}
                        style={[styles.filterChip, filter === f && styles.activeFilterChip]}
                        textStyle={[styles.filterText, filter === f && styles.activeFilterText]}
                    >
                        {f}
                    </Chip>
                ))}
            </View>

            {isLoading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#2ecc71" /></View>
            ) : (
                <FlatList
                    data={filteredTrees}
                    keyExtractor={item => item.id || item.treeID}
                    renderItem={({ item }) => (
                        <TreeListItem
                            tree={item}
                            // ✅ FIX: Navigate to MapScreen with all necessary parameters
                            onPress={() => navigation.navigate('Map', {
                                treeID: item.id || item.treeID,
                                lat: item.coordinates.latitude,
                                lng: item.coordinates.longitude
                            })}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="magnify-close" size={40} color="#888" />
                            <Text style={styles.emptyText}>No trees found for this filter.</Text>
                        </View>
                    }
                />
            )}

            <FAB
                 icon="plus" style={styles.fab} color="white"
                            onPress={() => navigation.navigate('AddTree')}
            />
        </View>
    );
}
// Styles remain the same as previous correct version...
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#e74c3c', fontSize: 16 },
    appbarHeader: { backgroundColor: '#ffffff', elevation: 0 },
    appbarTitle: { color: '#333', fontWeight: 'bold', fontSize: 18 },
    filterContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    filterChip: { backgroundColor: '#fff', borderColor: '#ccc' },
    activeFilterChip: { backgroundColor: '#eafaf1', borderColor: '#2ecc71' },
    filterText: { color: '#555' },
    activeFilterText: { color: '#2ecc71', fontWeight: 'bold' },
    listContent: { padding: 16 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 50 },
    emptyText: { fontSize: 16, color: '#888', marginTop: 16 },
    card: { marginBottom: 12, borderRadius: 12, backgroundColor: '#ffffff', elevation: 2, borderLeftWidth: 4, borderLeftColor: '#2ecc71' },
    cardContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    icon: { marginRight: 16 },
    textContainer: { flex: 1 },
    treeIdText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    locationContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    locationText: { marginLeft: 4, color: '#666', fontSize: 14 },
    fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#2ecc71', borderRadius: 28 },
});