import { useAuth } from '@/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Alert, StyleSheet, View, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, Appbar, useTheme } from 'react-native-paper'; // ✅ Added useTheme
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// ✅ Custom component for each setting item
const SettingsItem = ({ icon, name, onPress, isLogout = false, theme }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.settingsItem,
      { backgroundColor: theme.colors.card },
    ]}
  >
    <MaterialIcons
      name={icon}
      size={24}
      color={isLogout ? '#D32F2F' : theme.colors.text}
    />
    <Text
      style={[
        styles.settingsItemText,
        { color: isLogout ? '#D32F2F' : theme.colors.text },
      ]}
    >
      {name}
    </Text>
    {!isLogout && (
      <MaterialIcons name="chevron-right" size={24} color={theme.colors.text} />
    )}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const theme = useTheme(); // ✅ Access global theme

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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* ✅ Header with Title and Notification Bell */}
      <Appbar.Header
        style={[
          styles.appbarHeader,
          { backgroundColor: theme.colors.card, borderBottomColor: theme.dark ? '#333' : '#eee' },
        ]}
      >
        <Appbar.Content
          title="Profile"
          titleStyle={[styles.appbarTitle, { color: theme.colors.text }]}
        />
        <Appbar.Action icon="bell-outline" color={theme.colors.text} onPress={() => {}} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ✅ Profile Info Section */}
        <View
          style={[
            styles.profileSection,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <View
            style={[
              styles.avatarCircle,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            {user?.image ? (
              <Image source={{ uri: user.image }} style={styles.profileImage} />
            ) : (
              <Text style={styles.initialsText}>{getInitials()}</Text>
            )}
          </View>
          <Text style={[styles.name, { color: theme.colors.text }]}>
            {user?.name || 'Guest User'}
          </Text>
          <Text
            style={[
              styles.email,
              { color: theme.dark ? '#bbb' : '#666' },
            ]}
          >
            {user?.email || 'No email provided'}
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('EditProfile')}
            style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
            labelStyle={styles.editButtonLabel}
            icon={() => <MaterialIcons name="edit" size={16} color="white" />}
          >
            Edit Profile
          </Button>
        </View>

        {/* ✅ Settings List Section */}
        <View style={styles.settingsSection}>
          <Text
            style={[
              styles.settingsTitle,
              { color: theme.colors.primary },
            ]}
          >
            Settings
          </Text>




          <SettingsItem
            icon="palette"
            name="Appearance"
            onPress={() => navigation.navigate('Appearance')}
            theme={theme}
          />

          <SettingsItem
            icon="bookmark"
            name="Tracked Trees"
            onPress={() => navigation.navigate('TrackedTrees', { trackedBy: user.uid })}
            theme={theme}
          />

          <SettingsItem
            icon="logout"
            name="Logout"
            onPress={handleLogout}
            isLogout={true}
            theme={theme}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appbarHeader: {
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
  },
  appbarTitle: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 20,
  },
  editButton: {
    borderRadius: 30,
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
    marginBottom: 10,
    marginLeft: 10,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
  },
  settingsItemText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
  },
});
