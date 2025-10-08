import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Pressable } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Screens
import DashboardScreen from './index';
import MapScreen from './map';
import ProfileScreen from './profile';
import NotificationBell from '@/components/NotificationBell'; // keep as is
import TreeListScreen from '../tree-list';

const Tab = createBottomTabNavigator();

export default function TabsLayout() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2ecc71',
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { color: '#333', fontWeight: 'bold' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <MaterialIcons name="dashboard" size={24} color={color} />,
          headerRight: () => <NotificationBell />,
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <MaterialIcons name="map" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="TreeList"
        component={TreeListScreen}
        options={({ navigation }) => ({
          title: 'Trees',
          tabBarIcon: ({ color }) => <MaterialIcons name="forest" size={24} color={color} />,
          headerRight: () => (
            <Pressable onPress={() => navigation.navigate('Search')}>
              <MaterialCommunityIcons name="magnify" size={24} style={{ marginRight: 16 }} />
            </Pressable>
          ),
        })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <MaterialIcons name="person" size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
