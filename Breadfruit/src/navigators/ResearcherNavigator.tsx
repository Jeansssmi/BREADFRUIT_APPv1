import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Import all screens for the Researcher role
import CameraScreen from '../screens/researcher/CameraScreen';
import MapScreen from '../screens/researcher/MapScreen';
import ResearcherDashboardScreen from '../screens/researcher/ResearcherDashboardScreen';
import SearchScreen from '../screens/researcher/SearchScreen';
import TreeManagementScreen from '../screens/researcher/tree/TreeManagementScreen'; // Root screen for the tab
import ProfileScreen from '../screens/shared/ProfileScreen';
import EditProfileScreen from '../screens/shared/EditProfileScreen';
import NotificationPreferencesScreen from '../screens/shared/NotificationPreferencesScreen';
import AboutHelpScreen from '../screens/shared/AboutHelpScreen';
import barangayData from "../constants/barangayData";


// Import nested tree screens
import AddTreeScreen from '../screens/researcher/tree/AddTreeScreen';
import DiameterScannerScreen from '../screens/researcher/tree/DiameterScannerScreen';
import EditTreeScreen from '../screens/researcher/tree/EditTreeScreen';
import PendingDetailsScreen from '../screens/researcher/tree/PendingDetailsScreen';
import PendingTreesScreen from '../screens/researcher/tree/PendingTreesScreen';
import ProcessFruitScreen from '../screens/researcher/tree/ProcessFruitScreen';
import TreeDetailsScreen from '../screens/researcher/tree/TreeDetailsScreen';
import TreeListScreen from '../screens/researcher/tree/TreeListScreen';
import TrackedTreesScreen from '../screens/researcher/tree/TrackedTreesScreen';
import EditUserScreen from '../screens/researcher/user/EditUserScreen';

// Create the necessary navigators
const Tab = createBottomTabNavigator();
const MainStack = createNativeStackNavigator();
const TreeStackNav = createNativeStackNavigator();
const ProfileStackNav = createNativeStackNavigator();

// This stack contains all screens reachable from the "Trees" tab
function TreeStack() {
  return (
    // ✅ FIX: Set TreeManagementScreen as the initial route again
    <TreeStackNav.Navigator initialRouteName="TreeManagement">

      {/* 🟢 Root Screen (Header hidden in Tabs) */}
      <TreeStackNav.Screen name="TreeManagement" component={TreeManagementScreen} options={{ headerShown: false }} />

      {/* Subsequent List Screen (Header shown for navigation) */}
      <TreeStackNav.Screen name="TreeList" component={TreeListScreen} options={{ headerTitle: 'Tree List' }} />

      {/* Other screens in the stack */}
      <TreeStackNav.Screen name="AddTree" component={AddTreeScreen} options={{ headerTitle: 'Add Tree' }} />
      <TreeStackNav.Screen name="DiameterScannerScreen" component={DiameterScannerScreen} options={{ headerTitle: 'Diameter Scan' }} />
      <TreeStackNav.Screen name="PendingTrees" component={PendingTreesScreen} options={{ headerTitle: 'Pending Trees' }} />
      <TreeStackNav.Screen name="TreeDetails" component={TreeDetailsScreen} options={{ headerTitle: 'Tree Details' }} />
      <TreeStackNav.Screen name="EditTree" component={EditTreeScreen} options={{ headerTitle: 'Edit Tree' }} />
      <TreeStackNav.Screen name="PendingDetails" component={PendingDetailsScreen} options={{ headerTitle: 'Pending Details' }} />
      <TreeStackNav.Screen name="ProcessFruit" component={ProcessFruitScreen} options={{ headerTitle: 'Process Fruit' }} />
      <TreeStackNav.Screen name="TrackedTrees" component={TrackedTreesScreen} options={{ headerTitle: 'Tracked Trees' }} />

    </TreeStackNav.Navigator>
  );
}

// This stack is for the Profile tab to allow navigation to edit screens
function ProfileStack() {
    return (
        <ProfileStackNav.Navigator>
               <ProfileStackNav.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false }} />
               <ProfileStackNav.Screen name="EditUser" component={EditUserScreen} options={{ headerTitle: 'Edit User' }} />
               <ProfileStackNav.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} options={{ headerTitle: 'Notifications' }} />
               <ProfileStackNav.Screen name="AboutHelp" component={AboutHelpScreen} options={{ headerTitle: 'About & Help' }} />
        </ProfileStackNav.Navigator>
    )
}

// This component defines the bottom tab bar
function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // Ensures the entire tab view has no header
        tabBarActiveTintColor: '#2ecc71',
        tabBarIcon: ({ color, size }) => {
          let iconName = 'dashboard';
          if (route.name === 'Map') iconName = 'map';
          else if (route.name === 'Trees') iconName = 'forest';
          else if (route.name === 'Profile') iconName = 'person';
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={ResearcherDashboardScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Trees" component={TreeStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

// The main export is a stack that includes the Tabs and any full-screen modals
export default function ResearcherNavigator() {
  return (
    <MainStack.Navigator>
      <MainStack.Screen name="MainTabs" component={Tabs} options={{ headerShown: false }} />
      {/* These screens are outside the tab flow and will get the default header */}
      <MainStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <MainStack.Screen name="Camera" component={CameraScreen} options={{ presentation: 'modal', headerShown: false }} />
      <MainStack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
    </MainStack.Navigator>
  );
}