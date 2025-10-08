import { useAuth } from '@/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

// Import the navigators and screens this layout will manage
import TabsLayout from './(tabs)/_layout'; 
import SearchScreen from './search';
import TreeLayout from './tree/_layout'; // Assuming you have a tree stack
import UserLayout from './user/_layout'; // Assuming you have a user stack

const Stack = createNativeStackNavigator();

function MainNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name='Tabs' component={TabsLayout} options={{ headerShown: false }} />
      <Stack.Screen name='TreeStack' component={TreeLayout} options={{ headerShown: false }} />
      <Stack.Screen name='UserStack' component={UserLayout} options={{ headerShown: false }} />
      <Stack.Screen name='Search' component={SearchScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

export default function MainLayout() {
  const { user, initialized } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (!initialized) return;
    if (user?.role !== 'viewer') {
      navigation.replace('Login');
    }
  }, [initialized, user, navigation]);

  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  // Only render the navigator if the user has the correct role
  return user?.role === 'viewer' ? <MainNavigator /> : null;
}