import React, { useLayoutEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { Text, FAB, useTheme } from 'react-native-paper'; // ✅ useTheme added
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';

import TreeCard from '@/components/TreeCard';
import { useTreeData } from '@/hooks/useTreeData';

export default function TrackedTreesScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const theme = useTheme(); // ✅ theme support

  const { trackedBy, displayName } = route.params;

  const { trees, isLoading, error } = useTreeData({
    mode: 'criteria',
    field: 'trackedBy',
    operator: '==',
    value: trackedBy,
  });

  useLayoutEffect(() => {
    if (displayName) {
      const formattedName = displayName.endsWith('s')
        ? `${displayName}'`
        : `${displayName}'s`;

      navigation.setOptions({
        headerShown: true,
        headerTitle: `${formattedName} Tracked Trees`,
        headerTitleStyle: {
          fontWeight: 'bold',
          color: theme.colors.primary, // ✅ themed header text
        },
        headerStyle: {
          backgroundColor: theme.colors.background, // ✅ themed header
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
  }, [navigation, displayName, theme]);

  if (error)
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
      </View>
    );

  if (isLoading)
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );

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
                color={theme.dark ? '#aaa' : '#888'} // ✅ theme-aware icon
              />
              <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                {displayName || 'This user'} has not tracked any trees yet.
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />

        {/* ✅ Floating Add Tree Button (theme primary color) */}
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
  errorText: { fontSize: 16 },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyText: { fontSize: 16, marginTop: 16 },
  listContent: { paddingBottom: 80 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: 28,
  },
});
