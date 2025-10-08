import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Screens
import MapScreen from '../screens/viewer/MapScreen';
import FruitScannerScreen from '../screens/viewer/FruitScannerScreen';
import TreeDetailsScreen from '../screens/viewer/TreeDetailsScreen';
import TreeListScreen from '../screens/viewer/TreeListScreen';
import ProfileScreen from '../screens/viewer/ProfileScreen';
import EditUserScreen from '../screens/viewer/EditUserScreen';


import NotificationPreferencesScreen from '../screens/shared/NotificationPreferencesScreen';
import AboutHelpScreen from '../screens/shared/AboutHelpScreen';

const Tab = createBottomTabNavigator();
const TreeStackNav = createNativeStackNavigator();
const ProfileStackNav = createNativeStackNavigator();

function TreeStack() {
  return (
    <TreeStackNav.Navigator>
      <TreeStackNav.Screen name="TreeList" component={TreeListScreen} />
      <TreeStackNav.Screen name="TreeDetails" component={TreeDetailsScreen} />
      <TreeStackNav.Screen name="FruitScanner" component={FruitScannerScreen} />
    </TreeStackNav.Navigator>
  );
}

function ProfileStack() {
  return (
    <ProfileStackNav.Navigator>
     <ProfileStackNav.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false }} />
      <ProfileStackNav.Screen name="EditUser" component={EditUserScreen} options={{ headerTitle: 'Edit User' }} />
       <ProfileStackNav.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} options={{ headerTitle: 'Notifications' }} />
       <ProfileStackNav.Screen name="AboutHelp" component={AboutHelpScreen} options={{ headerTitle: 'About & Help' }} />
    </ProfileStackNav.Navigator>
  );
}

export default function ViewerNavigator() {
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
