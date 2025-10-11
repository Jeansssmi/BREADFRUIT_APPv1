import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Import all screens
import AccountManagementScreen from '../screens/admin/AccountManagementScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import TreeManagementScreen from '../screens/admin/TreeManagementScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import EditProfileScreen from '../screens/shared/EditProfileScreen';
import NotificationPreferencesScreen from '../screens/shared/NotificationPreferencesScreen';
import AboutHelpScreen from '../screens/shared/AboutHelpScreen';
import AddTreeScreen from '../screens/admin/tree/AddTreeScreen';
import EditTreeScreen from '../screens/admin/tree/EditTreeScreen';
import PendingTreesScreen from '../screens/admin/tree/PendingTreesScreen';
import TreeDetailsScreen from '../screens/admin/tree/TreeDetailsScreen';
import TreeListScreen from '../screens/admin/tree/TreeListScreen';
import AddUserScreen from '../screens/admin/user/AddUserScreen';
import EditUserScreen from '../screens/admin/user/EditUserScreen';
import PendingUsersScreen from '../screens/admin/user/PendingUsersScreen';
import UserDetailsScreen from '../screens/admin/user/UserDetailsScreen';
import UserListScreen from '../screens/admin/user/UserListScreen';

// Create navigators
const Tab = createBottomTabNavigator();
const TreeStackNav = createNativeStackNavigator();
const AccountStackNav = createNativeStackNavigator();
const ProfileStackNav = createNativeStackNavigator();

// --- Tree Stack Navigator ---
// Manages all screens related to trees
function TreeStack() {
  return (
    <TreeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <TreeStackNav.Screen name="TreeManagement" component={TreeManagementScreen} />
      <TreeStackNav.Screen name="AddTree" component={AddTreeScreen} />
      <TreeStackNav.Screen name="EditTree" component={EditTreeScreen} />
      <TreeStackNav.Screen name="PendingTrees" component={PendingTreesScreen} />
      <TreeStackNav.Screen name="TreeDetails" component={TreeDetailsScreen} />
      <TreeStackNav.Screen name="TreeList" component={TreeListScreen} />
    </TreeStackNav.Navigator>
  );
}

// --- Account Stack Navigator ---
// Manages all screens related to user accounts
function AccountStack() {
  return (
    <AccountStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AccountStackNav.Screen name="AccountManagement" component={AccountManagementScreen} />
      <AccountStackNav.Screen name="AddUser" component={AddUserScreen} />
      <AccountStackNav.Screen name="EditUser" component={EditUserScreen} />
      <AccountStackNav.Screen name="PendingUsers" component={PendingUsersScreen} />
      <AccountStackNav.Screen name="UserDetails" component={UserDetailsScreen} />
      <AccountStackNav.Screen name="UserList" component={UserListScreen} />
    </AccountStackNav.Navigator>
  );
}

// --- Profile Stack Navigator ---
// Manages screens accessible from the main profile page
function ProfileStack() {
  return (
    <ProfileStackNav.Navigator>
      <ProfileStackNav.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false }} />
      <ProfileStackNav.Screen name="EditProfile" component={EditProfileScreen} options={{ headerTitle: 'Edit Profile' }} />
      <ProfileStackNav.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} options={{ headerTitle: 'Notifications' }} />
      <ProfileStackNav.Screen name="AboutHelp" component={AboutHelpScreen} options={{ headerTitle: 'About & Help' }} />
    </ProfileStackNav.Navigator>
  );
}

// --- Main Admin Bottom Tab Navigator ---
export default function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2ecc71',
        tabBarIcon: ({ color, size }) => {
          let iconName = 'dashboard';
          if (route.name === 'Trees') iconName = 'forest';
          else if (route.name === 'Accounts') iconName = 'people';
          else if (route.name === 'Profile') iconName = 'person';
          return <MaterialIcons name={iconName as string} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Trees" component={TreeStack} />
      {/* ✅ FIX: Ensure the "Accounts" tab uses the AccountStack navigator */}
      <Tab.Screen name="Accounts" component={AccountStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}