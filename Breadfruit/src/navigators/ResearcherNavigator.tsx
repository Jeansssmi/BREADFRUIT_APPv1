import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Import all screens
import CameraScreen from '../screens/researcher/CameraScreen';
import MapScreen from '../screens/researcher/MapScreen';
import ResearcherDashboardScreen from '../screens/researcher/ResearcherDashboardScreen';
import SearchScreen from '../screens/researcher/SearchScreen';
import TreeManagementScreen from '../screens/researcher/tree/TreeManagementScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import EditProfileScreen from '../screens/shared/EditProfileScreen';
import NotificationPreferencesScreen from '../screens/shared/NotificationPreferencesScreen';
import AboutHelpScreen from '../screens/shared/AboutHelpScreen';

// Import nested tree screens
import AddTreeScreen from '../screens/researcher/tree/AddTreeScreen';
import DiameterScannerScreen from '../screens/researcher/tree/DiameterScannerScreen';
import EditDiameterScannerScreen from '../screens/researcher/tree/EditDiameterScannerScreen';
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

/**
 * ✅ This stack is now simplified. It only contains screens that are exclusive
 * to the "Trees" tab's initial flow. Navigating to details or edit screens
 * will now call screens from the MainStack.
 */
function TreeStack() {
  return (
    <TreeStackNav.Navigator initialRouteName="TreeManagement">
      <TreeStackNav.Screen name="TreeManagement" component={TreeManagementScreen} options={{ headerShown: false }} />
      <TreeStackNav.Screen name="TreeList" component={TreeListScreen} options={{ headerTitle: 'Tree List' }} />
      <TreeStackNav.Screen name="PendingTrees" component={PendingTreesScreen} options={{ headerTitle: 'Pending Trees' }} />
    </TreeStackNav.Navigator>
  );
}

// This stack is for the Profile tab (no changes needed)
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

// This component defines the bottom tab bar (no changes needed)
function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
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

/**
 * ✅ This is the main navigator and the source of the fix.
 * It contains the Tab navigator as one screen, and all other screens
 * are defined here as siblings. This allows any tab to navigate to them,
 * and they will correctly appear on top of the tab bar.
 */
export default function ResearcherNavigator() {
  return (
    <MainStack.Navigator>
      {/* The Tab navigator is the base screen */}
      <MainStack.Screen name="MainTabs" component={Tabs} options={{ headerShown: false }} />

      {/* All screens that should appear OVER the tabs are now defined here ONLY */}
      <MainStack.Screen name="TreeDetails" component={TreeDetailsScreen} options={{ headerTitle: 'Tree Details' }} />
      <MainStack.Screen name="EditTree" component={EditTreeScreen} options={{ headerTitle: 'Edit Tree' }} />
      <MainStack.Screen name="AddTree" component={AddTreeScreen} options={{ headerTitle: 'Add Tree' }} />
      <MainStack.Screen name="PendingDetails" component={PendingDetailsScreen} options={{ headerTitle: 'Pending Details' }} />
      <MainStack.Screen name="ProcessFruit" component={ProcessFruitScreen} options={{ headerTitle: 'Process Fruit' }} />
      <MainStack.Screen name="TrackedTrees" component={TrackedTreesScreen} options={{ headerTitle: 'Tracked Trees' }} />

      {/* Scanner Screens */}
      <MainStack.Screen name="DiameterScanner" component={DiameterScannerScreen} options={{ headerTitle: 'Scan Diameter' }} />
      <MainStack.Screen name="EditDiameterScanner" component={EditDiameterScannerScreen} options={{ headerTitle: 'Rescan Diameter' }} />

      {/* Other Screens */}
      <MainStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <MainStack.Screen name="Camera" component={CameraScreen} options={{ presentation: 'modal', headerShown: false }} />
      <MainStack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
    </MainStack.Navigator>
  );
}