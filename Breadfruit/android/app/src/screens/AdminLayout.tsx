import { useAuth } from '@/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

// Import the navigators that this layout will manage
import TabsLayout from './(tabs)/_layout';
import TreeLayout from './tree/_layout';
import UserLayout from './user/_layout';


const Stack = createNativeStackNavigator();

function AdminNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name='Tabs' component={TabsLayout} options={{ headerShown: false }} />
      <Stack.Screen name='UserStack' component={UserLayout} options={{ headerShown: false }} />
      <Stack.Screen name='TreeStack' component={TreeLayout} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

export default function AdminLayout() {
  const { user, initialized } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    // If initialization isn't finished, do nothing.
    if (!initialized) return;

    // If the user is not an admin, redirect them to the Login screen.
    // The 'replace' action prevents them from going back to the admin area.
    if (user?.role !== 'admin') {
      navigation.replace('Login');
    }
  }, [initialized, user, navigation]);

  // Show a loading screen while the auth state is being checked.
  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  // If the user is an admin, render the main admin navigator.
  // Otherwise, render nothing while the redirect happens.
  return user?.role === 'admin' ? <AdminNavigator /> : null;
}