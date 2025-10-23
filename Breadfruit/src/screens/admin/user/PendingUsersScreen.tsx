import React, { useMemo, useState, useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Appbar, Chip, Text, useTheme } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUserData } from '@/hooks/useUserData';

// ✅ Role Filter Component (theme-aware)
const RoleFilter = ({ selected, onSelect }) => {
  const theme = useTheme();
  const roles = ['All', 'Admin', 'Researcher'];
  return (
    <View style={[styles.filterContainer, { backgroundColor: theme.colors.background }]}>
      {roles.map(role => (
        <Chip
          key={role}
          mode="flat"
          selected={selected === role}
          onPress={() => onSelect(role)}
          style={[
            styles.filterChip,
            {
              borderColor: theme.colors.primary,
              backgroundColor:
                selected === role ? theme.colors.primary : theme.colors.background,
            },
          ]}
          textStyle={{
            color: selected === role ? '#fff' : theme.colors.primary,
            fontWeight: selected === role ? 'bold' : '500',
          }}
        >
          {role}
        </Chip>
      ))}
    </View>
  );
};

// ✅ Pending User Item (theme-aware)
const PendingUserItem = ({ user, onPress }) => {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.itemContainer, { backgroundColor: theme.colors.card }]}
      activeOpacity={0.8}
    >
      <View style={styles.row}>
        <MaterialCommunityIcons
          name="account"
          size={20}
          color={theme.dark ? '#ccc' : '#555'}
        />
        <Text style={[styles.userName, { color: theme.colors.text }]}>{user.name}</Text>
      </View>

      <View style={[styles.row, { marginTop: 4 }]}>
        <MaterialCommunityIcons
          name="email"
          size={20}
          color={theme.dark ? '#aaa' : '#555'}
        />
        <Text style={[styles.userEmail, { color: theme.colors.text }]}>{user.email}</Text>
      </View>

      <View style={styles.footerRow}>
        <Chip
          style={[
            styles.roleChip,
            { backgroundColor: theme.dark ? '#1e1e1e' : '#eafaf1' },
          ]}
          textStyle={[styles.roleChipText, { color: theme.colors.primary }]}
        >
          {user.role}
        </Chip>
        <Text style={[styles.dateText, { color: theme.dark ? '#bbb' : '#888' }]}>
          Requested:{' '}
          {user.joined?.toDate
            ? user.joined.toDate().toLocaleDateString()
            : new Date(user.joined).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function PendingUsersScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [selectedRole, setSelectedRole] = useState('All');
  const [refreshKey, setRefreshKey] = useState(0);
  const { users, isLoading } = useUserData({
    mode: 'criteria',
    field: 'status',
    operator: '==',
    value: 'pending',
  });

  // Re-fetch when screen refocuses
  useFocusEffect(
    useCallback(() => {
      setRefreshKey(prev => prev + 1);
    }, [])
  );

  // ✅ Filter by role
  const filteredUsers = useMemo(() => {
    if (selectedRole === 'All') return users;
    return users.filter(user => user.role.toLowerCase() === selectedRole.toLowerCase());
  }, [users, selectedRole]);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 🔹 Role Filter */}
      <RoleFilter selected={selectedRole} onSelect={setSelectedRole} />

      {/* 🔹 Pending Users List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={item => item.uid}
        renderItem={({ item }) => (
          <PendingUserItem
            user={item}
            onPress={() => navigation.navigate('UserDetails', { userID: item.uid })}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="account-off"
              size={40}
              color={theme.dark ? '#aaa' : '#888'}
            />
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              No pending requests
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  filterContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  filterChip: {
    borderWidth: 1,
  },

  // ✅ List Item
  itemContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginVertical: 6,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  roleChip: {
    paddingHorizontal: 6,
    height: 'auto',
    paddingVertical: 2,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});
