import UserCard from '@/components/UserCard';
import { useUserData } from '@/hooks/useUserData';
import { useNavigation, useRoute } from "@react-navigation/native";
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Chip, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const RoleFilter = ({ selected, onSelect }: { selected: string; onSelect: (role: string) => void }) => {
  const roles = ['All', 'admin', 'researcher', 'viewer'];
  return (
    <View style={styles.filterContainer}>
      {roles.map(role => (
        <Chip
          key={role} mode="outlined" onPress={() => onSelect(role)}
          style={[styles.filterChip, selected === role && styles.activeFilterChip]}
          textStyle={[styles.filterTextChip, selected === role && styles.activeFilterTextChip]}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Chip>
      ))}
    </View>
  );
};

export default function UserListScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { users, isLoading } = useUserData({ 
    mode: 'criteria', field: 'status', operator: '==', value: 'verified',
  }); 
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState(route.params?.filter || 'All');

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = selectedRole === 'All' || user.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, selectedRole]);

  if (isLoading) {
    return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" color='#2ecc71' /></View>;
  }

  return (
    <View style={styles.container}>
      <RoleFilter selected={selectedRole} onSelect={setSelectedRole} />
      <FlatList
        data={filteredUsers}
        keyExtractor={item => item.uid}
        renderItem={({ item }) => <UserCard user={item} onPress={() => navigation.navigate('UserDetails', { userID: item.uid })} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-remove" size={40} color="#888" />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#ffffff' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 50 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 16 },
  listContent: { paddingBottom: 24 }, 
  filterContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  filterChip: { borderRadius: 8, borderColor: '#2ecc71' },
  filterTextChip: { color: '#2ecc71', fontSize: 12 }, 
  activeFilterChip: { backgroundColor: '#2ecc71' },
  activeFilterTextChip: { color: 'white' }, 
});