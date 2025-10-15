import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// --- Import all screens ---
import EditDiameterScannerScreen from "../screens/researcher/tree/EditDiameterScannerScreen";
import DiameterScannerScreen from "../screens/researcher/tree/DiameterScannerScreen";
import AccountManagementScreen from "../screens/admin/AccountManagementScreen";
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import TreeManagementScreen from "../screens/admin/TreeManagementScreen";
import ProfileScreen from "../screens/shared/ProfileScreen";
import EditProfileScreen from "../screens/shared/EditProfileScreen";
import NotificationPreferencesScreen from "../screens/shared/NotificationPreferencesScreen";
import AboutHelpScreen from "../screens/shared/AboutHelpScreen";
import AddTreeScreen from "../screens/admin/tree/AddTreeScreen";
import SearchScreen from "../screens/admin/tree/SearchScreen";
import EditTreeScreen from "../screens/admin/tree/EditTreeScreen";
import PendingTreesScreen from "../screens/admin/tree/PendingTreesScreen";
import TreeDetailsScreen from "../screens/admin/tree/TreeDetailsScreen";
import TreeListScreen from "../screens/admin/tree/TreeListScreen";
import TrackedTreesScreen from "../screens/admin/tree/TrackedTreesScreen";
import AddUserScreen from "../screens/admin/user/AddUserScreen";
import EditUserScreen from "../screens/admin/user/EditUserScreen";
import PendingUsersScreen from "../screens/admin/user/PendingUsersScreen";
import UserDetailsScreen from "../screens/admin/user/UserDetailsScreen";
import UserListScreen from "../screens/admin/user/UserListScreen";
import MapScreen from "../screens/researcher/MapScreen"; // or correct path


// --- Create navigators ---
const Tab = createBottomTabNavigator();
const MainStack = createNativeStackNavigator();
const TreeStackNav = createNativeStackNavigator();
const AccountStackNav = createNativeStackNavigator();
const ProfileStackNav = createNativeStackNavigator();



// --- TREE STACK ---
function TreeStack() {
  return (
    <TreeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <TreeStackNav.Screen name="TreeManagement" component={TreeManagementScreen} />

      <TreeStackNav.Screen name="TreeList" component={TreeListScreen} />
    </TreeStackNav.Navigator>
  );
}


// --- ACCOUNT STACK ---
function AccountStack() {
  return (
    <AccountStackNav.Navigator>
      <AccountStackNav.Screen
        name="AccountManagement"
        component={AccountManagementScreen}
        options={{ headerShown: false }}
      />
      <AccountStackNav.Screen
        name="UserList"
        component={UserListScreen}
        options={{ headerTitle: "All Users" }}
      />
      <AccountStackNav.Screen
        name="AddUser"
        component={AddUserScreen}
        options={{ headerTitle: "Add User" }}
      />
      <AccountStackNav.Screen
        name="EditUser"
        component={EditUserScreen}
        options={{ headerTitle: "Edit User" }}
      />
      <AccountStackNav.Screen
        name="PendingUsers"
        component={PendingUsersScreen}
        options={{ headerTitle: "Pending Approvals" }}
      />
      <AccountStackNav.Screen
        name="UserDetails"
        component={UserDetailsScreen}
        options={{ headerTitle: "User Details" }}
      />
    </AccountStackNav.Navigator>
  );
}


// --- PROFILE STACK ---
function ProfileStack() {
  return (
    <ProfileStackNav.Navigator>
      <ProfileStackNav.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStackNav.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerTitle: "Edit Profile" }}
      />
      <ProfileStackNav.Screen
        name="NotificationPreferences"
        component={NotificationPreferencesScreen}
        options={{ headerTitle: "Notifications" }}
      />
      <ProfileStackNav.Screen
        name="AboutHelp"
        component={AboutHelpScreen}
        options={{ headerTitle: "About & Help" }}
      />
    </ProfileStackNav.Navigator>
  );
}


// --- ADMIN TABS ---
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#2ecc71",
        tabBarIcon: ({ color, size }) => {
          let iconName = "dashboard";
          if (route.name === "Trees") iconName = "forest";
          else if (route.name === "Accounts") iconName = "people";
          else if (route.name === "Profile") iconName = "person";
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Trees" component={TreeStack} />
      <Tab.Screen name="Accounts" component={AccountStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}


// --- MAIN WRAPPER STACK ---
export default function AdminNavigator() {
  return (
    <MainStack.Navigator>
      <MainStack.Screen
        name="AdminTabs"
        component={AdminTabs}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name="UserListScreen"
        component={UserListScreen}
        options={{ headerTitle: "All Users" }}
      />
      <MainStack.Screen
        name="PendingUsersScreen"
        component={PendingUsersScreen}
        options={{ headerTitle: "Pending Approvals" }}
      />
      <MainStack.Screen name="UserList" component={UserListScreen} options={{ headerTitle: "All Users" }} />
      <MainStack.Screen name="TreeList" component={TreeListScreen} options={{ headerTitle: "Trees Tracked" }} />
      <MainStack.Screen name="PendingUsers" component={PendingUsersScreen} options={{ headerTitle: "Pending List" }} />
      <MainStack.Screen name="UserDetails" component={UserDetailsScreen} options={{ headerTitle: "User Details" }} />
      <MainStack.Screen name="TrackedTreesScreen" component={TrackedTreesScreen} options={{ headerTitle: "Tracked Trees" }} />
      <MainStack.Screen name="EditTree" component={EditTreeScreen} options={{ headerTitle: "Edit Tree" }} />
       <MainStack.Screen name="TreeDetails" component={TreeDetailsScreen} options={{ headerTitle: " Tree Details" }} />
       <MainStack.Screen name="AddTree" component={AddTreeScreen} options={{ headerTitle: "Add Tree" }} />
      <MainStack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
     <MainStack.Screen name="EditUser" component={EditUserScreen} options={{ headerTitle: "Edit User" }} />
      <MainStack.Screen name="DiameterScannerScreen" component={DiameterScannerScreen} options={{ headerTitle: "Scan Diameter" }} />
     <MainStack.Screen name="EditDiameterScannerScreen" component={EditDiameterScannerScreen} options={{ headerTitle: "Re-Scan Diameter" }} />
     <MainStack.Screen name="PendingTrees" component={PendingTreesScreen} options={{ headerTitle: "Pending Trees" }} />
      <MainStack.Screen
        name="ResearchersScreen"
        component={UserListScreen}
        options={{ headerTitle: "Researchers" }}
        initialParams={{ filter: "researcher" }}
      />

      {/* ✅ Add this new screen */}
      <MainStack.Screen
        name="Map"
        component={MapScreen}
        options={{ headerTitle: "Tree Location" }}
      />
    </MainStack.Navigator>
  );
}
