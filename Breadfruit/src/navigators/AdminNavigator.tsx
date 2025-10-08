import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Screens
import AccountManagementScreen from '../screens/admin/AccountManagementScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import TreeManagementScreen from '../screens/admin/TreeManagementScreen';
// Shared Screens
import ProfileScreen from '../screens/shared/ProfileScreen';
import EditProfileScreen from '../screens/shared/EditProfileScreen'; // Used in ProfileStack
import NotificationPreferencesScreen from '../screens/shared/NotificationPreferencesScreen';
import AboutHelpScreen from '../screens/shared/AboutHelpScreen';

// Tree screens
import AddTreeScreen from '../screens/admin/tree/AddTreeScreen';
import EditTreeScreen from '../screens/admin/tree/EditTreeScreen';
import PendingTreesScreen from '../screens/admin/tree/PendingTreesScreen';
import ProcessFruitScreen from '../screens/admin/tree/ProcessFruitScreen';
import SearchScreen from '../screens/admin/tree/SearchScreen';
import TrackedTreesScreen from '../screens/admin/tree/TrackedTreesScreen';
import TreeDetailsScreen from '../screens/admin/tree/TreeDetailsScreen';
import TreeListScreen from '../screens/admin/tree/TreeListScreen';

// User screens
import AddUserScreen from '../screens/admin/user/AddUserScreen';
import EditUserScreen from '../screens/admin/user/EditUserScreen'; // Used in AccountStack
import PendingUsersScreen from '../screens/admin/user/PendingUsersScreen';
import UserDetailsScreen from '../screens/admin/user/UserDetailsScreen';
import UserListScreen from '../screens/admin/user/UserListScreen';

const Tab = createBottomTabNavigator();
const TreeStackNav = createNativeStackNavigator();
const AccountStackNav = createNativeStackNavigator();
// ✅ FIX 1: Define the ProfileStack Navigator
const ProfileStackNav = createNativeStackNavigator();


function TreeStack() {
  return (
    <TreeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <TreeStackNav.Screen name="TreeManagement" component={TreeManagementScreen} />
      <TreeStackNav.Screen name="AddTree" component={AddTreeScreen} />
      <TreeStackNav.Screen name="EditTree" component={EditTreeScreen} />
      <TreeStackNav.Screen name="PendingTrees" component={PendingTreesScreen} />
      <TreeStackNav.Screen name="ProcessFruit" component={ProcessFruitScreen} />
      <TreeStackNav.Screen name="Search" component={SearchScreen} />
      <TreeStackNav.Screen name="TrackedTrees" component={TrackedTreesScreen} />
      <TreeStackNav.Screen name="TreeDetails" component={TreeDetailsScreen} />
      <TreeStackNav.Screen name="TreeList" component={TreeListScreen} />
    </TreeStackNav.Navigator>
  );
}

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

function ProfileStack() {
    return (
        <ProfileStackNav.Navigator>
               {/* Set headerShown: false on the root screen so the tab navigator hides it */}
               <ProfileStackNav.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false }} />

               {/* ✅ FIX 3: Use EditProfileScreen for profile editing */}
               <ProfileStackNav.Screen name="EditProfile" component={EditProfileScreen} options={{ headerTitle: 'Edit Profile' }} />

               <ProfileStackNav.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} options={{ headerTitle: 'Notifications' }} />
               <ProfileStackNav.Screen name="AboutHelp" component={AboutHelpScreen} options={{ headerTitle: 'About & Help' }} />
        </ProfileStackNav.Navigator>
    )
}

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
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Trees" component={TreeStack} />
      <Tab.Screen name="Accounts" component={AccountStack} />
      {/* ✅ FIX 2: Use ProfileStack (the navigator) as the component for the Profile tab */}
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}