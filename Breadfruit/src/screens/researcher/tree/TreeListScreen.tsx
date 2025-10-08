import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, FlatList, ActivityIndicator, Pressable, TouchableOpacity } from 'react-native';
import { Appbar, Text, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTreeData } from '@/hooks/useTreeData'; // Import your hook

// Define the type for the filter state
type TreeFilter = 'verified' | 'pending';

// --- Placeholder for the List Item component ---
// NOTE: This component assumes a structure for the tree data
const TreeListItem = ({ tree, onPress }) => (
    <TouchableOpacity onPress={onPress}>
        <Card style={styles.listItemCard}>
            <Card.Content style={styles.listItemContent}>
                <MaterialIcons name="forest" size={30} color="#2ecc71" style={styles.listItemIcon} />
                <View style={styles.listItemTextContainer}>
                    <Text style={styles.listItemTitle}>{tree.treeID || 'N/A'}</Text>
                    <Text style={styles.listItemSubtitle}>
                        Status: {tree.status ? tree.status.toUpperCase() : 'UNKNOWN'} |
                        {tree.city || 'No Location'}
                    </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#ccc" />
            </Card.Content>
        </Card>
    </TouchableOpacity>
);
// --- End Placeholder ---

export default function TreeListScreen() {
    const navigation = useNavigation();

    // State to toggle between 'verified' (Tracked) and 'pending' lists
    const [currentFilter, setCurrentFilter] = useState<TreeFilter>('verified');

    // Use the hook to fetch data based on the selected filter
    const { trees, isLoading, error } = useTreeData({
        mode: 'criteria',
        field: 'status',
        operator: '==',
        value: currentFilter
    });

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <MaterialIcons name="info-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No {currentFilter} trees found.</Text>
        </View>
    );

    const handleTreePress = (treeID) => {
        // Navigate to the specific details screen for the selected tree
        navigation.navigate('TreeDetails', { treeID });
    };

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appbarHeader}>
                <Appbar.BackAction onPress={() => navigation.goBack()} color="#333" />
                <Appbar.Content title="Tree Listings" titleStyle={styles.appbarTitle} />
            </Appbar.Header>

            {/* --- Filtering Buttons Section (Matches Image) --- */}
            <View style={styles.filterBar}>
                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        currentFilter === 'verified' && styles.filterButtonActive
                    ]}
                    onPress={() => setCurrentFilter('verified')}
                >
                    <Text style={[
                        styles.filterButtonText,
                        currentFilter === 'verified' && styles.filterButtonTextActive
                    ]}>
                        Tracked Trees
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        currentFilter === 'pending' && styles.filterButtonPending
                    ]}
                    onPress={() => setCurrentFilter('pending')}
                >
                    <Text style={[
                        styles.filterButtonText,
                        currentFilter === 'pending' && styles.filterButtonTextPending
                    ]}>
                        Pending Trees
                    </Text>
                </TouchableOpacity>
            </View>

            {/* --- List Display --- */}
            {isLoading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#2ecc71" /></View>
            ) : (
                <FlatList
                    data={trees}
                    keyExtractor={(item) => item.treeID}
                    renderItem={({ item }) => (
                        <TreeListItem
                            tree={item}
                            onPress={() => handleTreePress(item.treeID)}
                        />
                    )}
                    ListEmptyComponent={renderEmptyList}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff'
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    appbarHeader: {
        backgroundColor: '#ffffff',
        elevation: 0
    },
    appbarTitle: {
        color: '#333',
        fontWeight: 'bold'
    },

    // --- Filter Bar Styles (Matching Image) ---
    filterBar: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        marginBottom: 15,
        justifyContent: 'space-between',
    },
    filterButton: {
        flex: 1,
        paddingVertical: 12,
        marginHorizontal: 5,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    filterButtonActive: {
        backgroundColor: '#2ecc71',
        borderColor: '#2ecc71',
    },
    filterButtonPending: {
        backgroundColor: '#f79a00',
        borderColor: '#f79a00',
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    filterButtonTextActive: {
        color: '#ffffff',
    },
    filterButtonTextPending: {
        color: '#ffffff',
    },

    // --- List Styles ---
    listContent: {
        paddingHorizontal: 15,
        paddingBottom: 40,
    },
    emptyContainer: {
        marginTop: 50,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: '#999',
    },
    listItemCard: {
        marginBottom: 10,
        elevation: 1,
        borderRadius: 8,
    },
    listItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    listItemIcon: {
        marginRight: 15,
    },
    listItemTextContainer: {
        flex: 1,
    },
    listItemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    listItemSubtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    }
});