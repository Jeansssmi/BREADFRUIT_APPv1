import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Import all screens for the Researcher role
import CameraScreen from '../screens/researcher/CameraScreen';
import MapScreen from '../screens/researcher/MapScreen';
import ResearcherDashboardScreen from '../screens/researcher/ResearcherDashboardScreen';
import SearchScreen from '../screens/researcher/SearchScreen';
import TreeManagementScreen from '../screens/researcher/tree/TreeManagementScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import EditProfileScreen from '../screens/shared/EditProfileScreen';

// Import nested tree screens
import AddTreeScreen from '../screens/researcher/tree/AddTreeScreen';
import EditTreeScreen from '../screens/researcher/tree/EditTreeScreen';
import PendingDetailsScreen from '../screens/researcher/tree/PendingDetailsScreen';
import PendingTreesScreen from '../screens/researcher/tree/PendingTreesScreen';
import ProcessFruitScreen from '../screens/researcher/tree/ProcessFruitScreen';
import TreeDetailsScreen from '../screens/researcher/tree/TreeDetailsScreen';
import TreeListScreen from '../screens/researcher/tree/TreeListScreen';
import TrackedTreesScreen from '../screens/researcher/tree/TrackedTreesScreen';

// Create the necessary navigators
const Tab = createBottomTabNavigator();
const MainStack = createNativeStackNavigator();
const TreeStackNav = createNativeStackNavigator();

// This stack contains all screens reachable from the "Trees" tab
function TreeStack() {
  return (
    <TreeStackNav.Navigator>
      <TreeStackNav.Screen name="TreeManagement" component={TreeManagementScreen} />
      <TreeStackNav.Screen name="TreeList" component={TreeListScreen} />
      <TreeStackNav.Screen name="AddTree" component={AddTreeScreen} />
      <TreeStackNav.Screen name="PendingTrees" component={PendingTreesScreen} />
      <TreeStackNav.Screen name="TreeDetails" component={TreeDetailsScreen} />
      <TreeStackNav.Screen name="EditTree" component={EditTreeScreen} />
      <TreeStackNav.Screen name="PendingDetails" component={PendingDetailsScreen} />
      <TreeStackNav.Screen name="ProcessFruit" component={ProcessFruitScreen} />
      <TreeStackNav.Screen name="TrackedTrees" component={TrackedTreesScreen} />
    </TreeStackNav.Navigator>
  );
}

// This component defines the bottom tab bar
function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
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
      <Tab.Screen name="Map" component={MapScreen} options={{ headerShown: false }}/>
      <Tab.Screen name="Trees" component={TreeStack} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// The main export is a stack that includes the Tabs and any full-screen modals
export default function ResearcherNavigator() {
  return (
    <MainStack.Navigator>
    <MainStack.Screen name="EditProfile" component={EditProfileScreen} />
      <MainStack.Screen name="MainTabs" component={Tabs} options={{ headerShown: false }} />
      <MainStack.Screen name="Camera" component={CameraScreen} options={{ presentation: 'modal', headerShown: false }} />
      <MainStack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
    </MainStack.Navigator>
  );
}