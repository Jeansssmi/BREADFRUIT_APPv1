import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Appbar, Chip, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUserData } from '@/hooks/useUserData';

// ✅ Filter component for roles
const RoleFilter = ({ selected, onSelect }: { selected: string; onSelect: (role: string) => void }) => {
  const roles = ['All', 'Admin', 'Researcher'];
  return (
    <View style={styles.filterContainer}>
      {roles.map(role => (
        <Chip
          key={role}
          mode="flat" // Use flat for a cleaner look
          selected={selected === role}
          onPress={() => onSelect(role)}
          style={[styles.filterChip, selected === role && styles.activeFilterChip]}
          textStyle={[styles.filterText, selected === role && styles.activeFilterText]}
        >
          {role}
        </Chip>
      ))}
    </View>
  );
};

// ✅ Custom list item component to match the screenshot
const PendingUserItem = ({ user, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.itemContainer}>
    <View style={styles.row}>
      <MaterialCommunityIcons name="account" size={20} color="#555" />
      <Text style={styles.userName}>{user.name}</Text>
    </View>
    <View style={[styles.row, { marginTop: 4 }]}>
      <MaterialCommunityIcons name="email" size={20} color="#555" />
      <Text style={styles.userEmail}>{user.email}</Text>
    </View>
    <View style={styles.footerRow}>
      <Chip style={styles.roleChip} textStyle={styles.roleChipText}>{user.role}</Chip>
      <Text style={styles.dateText}>
        Requested: {user.joined?.toDate ? user.joined.toDate().toLocaleDateString() : new Date(user.joined).toLocaleDateString()}
      </Text>
    </View>
  </TouchableOpacity>
);

export default function PendingUsersScreen() {
  const { users, isLoading } = useUserData({
    mode: 'criteria', field: 'status', operator: '==', value: 'pending',
  });
  const navigation = useNavigation();
  const [selectedRole, setSelectedRole] = useState('All');

  // ✅ Client-side filtering based on the selected role
  const filteredUsers = useMemo(() => {
    if (selectedRole === 'All') {
      return users;
    }
    return users.filter(user => user.role.toLowerCase() === selectedRole.toLowerCase());
  }, [users, selectedRole]);

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color='#2ecc71' /></View>;
  }

  return (
    <View style={styles.container}>
      {/* ✅ Header with Back Button */}
      <Appbar.Header style={styles.appbarHeader}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#333" />
        <Appbar.Content title="Pending List" titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <RoleFilter selected={selectedRole} onSelect={setSelectedRole} />

      <FlatList
        data={filteredUsers}
        keyExtractor={item => item.uid}
        renderItem={({ item }) => (
          <PendingUserItem
            user={item}
            // @ts-ignore
            onPress={() => navigation.navigate('UserDetails', { userID: item.uid })}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-off" size={40} color="#888" />
            <Text style={styles.emptyText}>No pending requests</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  appbarHeader: { backgroundColor: '#ffffff', elevation: 0 },
  appbarTitle: { color: '#333', fontWeight: 'bold', fontSize: 18 },

  // ✅ Styles for Filter Chips to match the picture
  filterContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  filterChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#2ecc71',
  },
  activeFilterChip: {
    backgroundColor: '#2ecc71',
  },
  filterText: {
    color: '#2ecc71',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },

  // ✅ Styles for the List Item to match the picture
   itemContainer: {
      backgroundColor: '#fff',
      paddingVertical: 20,
      paddingHorizontal: 16,
      marginVertical: 6,
      borderRadius: 10,
      elevation: 2, // Softer shadow for Android
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      // Removed border for a cleaner look

      },
  row: {

    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
 roleChip: {
     backgroundColor: '#eafaf1', // Light green background
     paddingHorizontal: 6, // Add horizontal padding
     height: 'auto', // Let height be determined by content + padding
     paddingVertical: 2, // Add vertical padding
   },
  roleChipText: {
    color: '#2ecc71',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
    color: '#888',
  },

  // Empty State
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 50 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 16 },
});