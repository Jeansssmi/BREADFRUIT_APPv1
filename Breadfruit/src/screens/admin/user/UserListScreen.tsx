import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View, TextInput } from 'react-native';
import { Appbar, ActivityIndicator, Chip, Text, useTheme } from 'react-native-paper'; // ✅ useTheme added
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import UserCard from '@/components/UserCard';

export default function UserListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme(); // ✅ Access global theme

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { filter } = route.params || {};
  const [selectedRole, setSelectedRole] = useState(filter || 'All');
  const [searchQuery, setSearchQuery] = useState('');

   // ✅ Real-time Firestore listener for VERIFIED users
   useEffect(() => {
     const unsubscribe = firestore()
       .collection('users')
       .where('status', '==', 'verified')
       .onSnapshot(
         (snapshot) => {
           const verifiedUsers = snapshot.docs.map((doc) => {
             const data = doc.data();
             return {
               uid: doc.id,
               ...data,
               joined: data.joined
                 ? data.joined.toDate
                   ? data.joined.toDate()
                   : new Date(data.joined)
                 : null,
               role: data.role || 'viewer',
               name: data.name || 'Unknown',
               email: data.email || 'N/A',
             };
           });
           setUsers(verifiedUsers);
           setIsLoading(false);
         },
         (error) => {
           console.error('Error fetching users:', error);
           setIsLoading(false);
         }
       );

     return () => unsubscribe(); // ✅ cleanup listener when screen unmounts
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
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 🔍 Search Input */}
      <TextInput
        placeholder="Search users by name or email..."
        placeholderTextColor={theme.dark ? '#aaa' : '#888'}
        style={[
          styles.searchInput,
          {
            borderColor: theme.colors.primary,
            color: theme.colors.text,
            backgroundColor: theme.dark ? '#1e1e1e' : '#fff',
          },
        ]}
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
              {
                borderColor: theme.colors.primary,
                backgroundColor:
                  selectedRole === role
                    ? theme.colors.primary
                    : theme.dark
                    ? '#2a2a2a'
                    : theme.colors.card,
              },
            ]}
            textStyle={{
              color:
                selectedRole === role
                  ? '#fff'
                  : theme.colors.primary,
              fontWeight: selectedRole === role ? 'bold' : 'normal',
            }}
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
            onPress={() => navigation.navigate('UserDetails', { userID: item.uid })}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="account-off-outline"
              size={40}
              color={theme.dark ? '#aaa' : '#888'}
            />
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              No verified users found
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  appbarHeader: { elevation: 0 },
  appbarTitle: { fontWeight: 'bold', fontSize: 18 },
  searchInput: {
    margin: 16,
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: { borderRadius: 8 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyText: { fontSize: 16, marginTop: 16 },
});
