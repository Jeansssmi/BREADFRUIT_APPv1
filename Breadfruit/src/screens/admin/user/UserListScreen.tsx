import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View, TextInput } from 'react-native';
import { Appbar, ActivityIndicator, Chip, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import UserCard from '@/components/UserCard';

export default function UserListScreen() {
  const navigation = useNavigation();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ Fetch all VERIFIED users from Firestore
  useEffect(() => {
    const fetchVerifiedUsers = async () => {
      try {
        setIsLoading(true);
        const snapshot = await firestore()
          .collection('users')
          .where('status', '==', 'verified')
          .get();

        const verifiedUsers = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            uid: doc.id,
            ...data,
            // ✅ Ensure joined is always a JS Date or null
            joined: data.joined ? (data.joined.toDate ? data.joined.toDate() : new Date(data.joined)) : null,
            // ✅ Ensure role is always a string
            role: data.role || 'viewer',
            name: data.name || 'Unknown',
            email: data.email || 'N/A',
          };
        });

        setUsers(verifiedUsers);
      } catch (error) {
        console.error('Error fetching verified users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerifiedUsers();
  }, []);

  // ✅ Filter users by role and search
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const name = (user.name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const role = user.role || 'viewer';

      const matchesSearch =
        name.includes(searchQuery.toLowerCase()) ||
        email.includes(searchQuery.toLowerCase());
      const matchesRole = selectedRole === 'All' || role === selectedRole;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, selectedRole]);

  // ✅ Loading state
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* 🔍 Search Input */}
      <TextInput
        placeholder="Search users by name or email..."
        placeholderTextColor="#aaa"
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* 🧩 Role Filter Chips */}
      <View style={styles.filterContainer}>
        {['All', 'admin', 'researcher', 'viewer'].map((role) => (
          <Chip
            key={role}
            mode="outlined"
            onPress={() => setSelectedRole(role)}
            style={[
              styles.filterChip,
              selectedRole === role && styles.activeFilterChip,
            ]}
            textStyle={[
              styles.filterTextChip,
              selectedRole === role && styles.activeFilterTextChip,
            ]}
          >
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Chip>
        ))}
      </View>

      {/* 📋 Verified Users List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <UserCard
            user={item}
            onPress={() =>
              navigation.navigate('UserDetails', { userID: item.uid })
            }
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="account-off-outline"
              size={40}
              color="#888"
            />
            <Text style={styles.emptyText}>No verified users found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  appbarHeader: { backgroundColor: '#f7f8fa', elevation: 0 },
  appbarTitle: { color: '#333', fontWeight: 'bold', fontSize: 18 },
  searchInput: {
    margin: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2ecc71',
    borderRadius: 10,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: { borderRadius: 8, borderColor: '#2ecc71' },
  filterTextChip: { color: '#2ecc71', fontSize: 12 },
  activeFilterChip: { backgroundColor: '#2ecc71' },
  activeFilterTextChip: { color: 'white' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyText: { fontSize: 16, color: '#888', marginTop: 16 },
});
