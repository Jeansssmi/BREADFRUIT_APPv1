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
const RootStack = createNativeStackNavigator(); // The new root navigator
const TreeStackNav = createNativeStackNavigator();
const ProfileStackNav = createNativeStackNavigator();

// This stack is for navigation within the "Trees" tab
function TreeStack() {
  return (
    <TreeStackNav.Navigator>
      <TreeStackNav.Screen name="TreeList" component={TreeListScreen} />
      {/* We keep TreeDetails here for navigation from the list view */}
      <TreeStackNav.Screen name="TreeDetails" component={TreeDetailsScreen} />
    </TreeStackNav.Navigator>
  );
}

// No changes to the ProfileStack
function ProfileStack() {
  return (
    <ProfileStackNav.Navigator>
      <ProfileStackNav.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false }} />
      <ProfileStackNav.Screen name="EditProfile" component={EditProfileScreen} options={{ headerTitle: 'Edit User' }} />
      <ProfileStackNav.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} options={{ headerTitle: 'Notifications' }} />
      <ProfileStackNav.Screen name="AboutHelp" component={AboutHelpScreen} options={{ headerTitle: 'About & Help' }} />
    </ProfileStackNav.Navigator>
  );
}

// This new component contains the original Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2ecc71',
        tabBarIcon: ({ color, size }) => {
          let iconName = 'map';
          if (route.name === 'Trees') iconName = 'forest';
          else if (route.name === 'Profile') iconName = 'person';
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Trees" component={TreeStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

// ✅ This is the new default export. It defines the overall app structure.
export default function ViewerNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen
        name="Main"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      {/* Screens defined here will appear ON TOP of the tab bar */}
      <RootStack.Screen name="TreeDetails" component={TreeDetailsScreen} />
      <RootStack.Screen name="FruitScanner" component={FruitScannerScreen} />
    </RootStack.Navigator>
  );
}