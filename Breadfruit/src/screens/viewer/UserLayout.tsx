import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EditUserScreen from './[userID]';

const Stack = createNativeStackNavigator();

export default function UserLayout() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="EditUser"
        component={EditUserScreen}
        options={{
          headerTitle: 'Edit User',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: { color: '#333', fontWeight: 'bold' },
        }}
      />
    </Stack.Navigator>
  );
}
