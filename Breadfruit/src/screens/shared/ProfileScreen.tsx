import { useAuth } from '@/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Alert, StyleSheet, View, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, Appbar } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';


// Custom component for each setting item in the list
const SettingsItem = ({ icon, name, onPress, isLogout = false }) => (
  <TouchableOpacity onPress={onPress} style={styles.settingsItem}>
    <MaterialIcons name={icon} size={24} color={isLogout ? '#D32F2F' : '#333'} />
    <Text style={[styles.settingsItemText, isLogout && { color: '#D32F2F' }]}>{name}</Text>
    {!isLogout && <MaterialIcons name="chevron-right" size={24} color="#ccc" />}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();

  const getInitials = () => {
    if (!user?.name) return 'G';
    return user.name.split(' ')[0][0].toUpperCase();
  };

  const handleLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => logout() },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* ✅ Header with Title and Notification Bell */}
      <Appbar.Header style={styles.appbarHeader}>
        <Appbar.Content title="Profile" titleStyle={styles.appbarTitle} />
        <Appbar.Action icon="bell-outline" color="black" onPress={() => { /* Navigate to notifications */ }} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ✅ Profile Info Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarCircle}>
            {user?.image ? (
              <Image source={{ uri: user.image }} style={styles.profileImage} />
            ) : (
              <Text style={styles.initialsText}>{getInitials()}</Text>
            )}
          </View>
          <Text style={styles.name}>{user?.name || 'Guest User'}</Text>
          <Text style={styles.email}>{user?.email || 'No email provided'}</Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('EditProfile')}
            style={styles.editButton}
            labelStyle={styles.editButtonLabel}
            icon={() => <MaterialIcons name="edit" size={16} color="white" />}
          >
            Edit Profile
          </Button>
        </View>

        {/* ✅ Settings List Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.settingsTitle}>Settings</Text>
          <SettingsItem
            icon="notifications"
            name="Notification Preferences"
            onPress={() => navigation.navigate('NotificationPreferences')}
          />
          <SettingsItem
            icon="account-circle"
            name="Account Settings"
            onPress={() => { /* Navigate to Account Settings */ }}
          />
          <SettingsItem
            icon="palette"
            name="Appearance"
            onPress={() => { /* Navigate to Appearance */ }}
          />
          <SettingsItem
            icon="bookmark"
            name="Tracked Trees"
            onPress={() => navigation.navigate('TrackedTrees', { trackedBy: user.uid })}
          />
          <SettingsItem
            icon="logout"
            name="Logout"
            onPress={handleLogout}
            isLogout={true}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa', // Light gray background
  },
  appbarHeader: {
    backgroundColor: '#fff',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  appbarTitle: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    paddingVertical: 30,
    alignItems: 'center',
    backgroundColor: '#f7f8fa',
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2ecc71',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  initialsText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  editButton: {
    borderRadius: 30,
    backgroundColor: '#2ecc71',
    paddingHorizontal: 20,
  },
  editButtonLabel: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  settingsSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginBottom: 10,
    marginLeft: 10,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
  },
  settingsItemText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
});