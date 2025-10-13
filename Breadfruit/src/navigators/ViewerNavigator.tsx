import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Screens
import MapScreen from '../screens/viewer/MapScreen';
import FruitScannerScreen from '../screens/viewer/FruitScannerScreen';
import TreeDetailsScreen from '../screens/viewer/TreeDetailsScreen';
import TreeListScreen from '../screens/viewer/TreeListScreen';
import ProfileScreen from '../screens/viewer/ProfileScreen';
import EditProfileScreen from '../screens/viewer/EditProfileScreen';
import NotificationPreferencesScreen from '../screens/shared/NotificationPreferencesScreen';
import AboutHelpScreen from '../screens/shared/AboutHelpScreen';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();
const TreeStackNav = createNativeStackNavigator();
const ProfileStackNav = createNativeStackNavigator();

// --- Tree Stack for Trees Tab ---
function TreeStack() {
  return (
    <TreeStackNav.Navigator>
      <TreeStackNav.Screen
        name="TreeList"
        component={TreeListScreen}
        options={{ headerTitle: 'Trees' }}
      />
    </TreeStackNav.Navigator>
  );
}

// --- Profile Stack ---
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
        options={{ headerTitle: 'Edit Profile' }}
      />
      <ProfileStackNav.Screen
        name="NotificationPreferences"
        component={NotificationPreferencesScreen}
        options={{ headerTitle: 'Notifications' }}
      />
      <ProfileStackNav.Screen
        name="AboutHelp"
        component={AboutHelpScreen}
        options={{ headerTitle: 'About & Help' }}
      />
    </ProfileStackNav.Navigator>
  );
}

// --- Main Tab Navigator ---
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2ecc71',
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Map') iconName = 'map';
          else if (route.name === 'Trees') iconName = 'park'; // Valid Material Icon
          else if (route.name === 'Profile') iconName = 'person';
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ unmountOnBlur: true }} // Keep map state
      />
      <Tab.Screen name="Trees" component={TreeStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

// --- Root Stack ---
export default function ViewerNavigator() {
  return (
    <RootStack.Navigator>
      {/* Main Tabs */}
      <RootStack.Screen
        name="Main"
        component={MainTabs}
        options={{ headerShown: false }}
      />

      {/* Screens that appear above tabs */}
      <RootStack.Screen
        name="TreeDetails"
        component={TreeDetailsScreen}
        options={{ headerTitle: 'Tree Details' }}
      />
      <RootStack.Screen
        name="FruitScanner"
        component={FruitScannerScreen}
        options={{ headerTitle: 'Fruit Scanner' }}
      />
    </RootStack.Navigator>
  );
}
