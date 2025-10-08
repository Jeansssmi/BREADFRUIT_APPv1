import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import your screen components
import RegisterScreen from './[type]';
import UserTypeSelectionScreen from './user-type';

const Stack = createNativeStackNavigator();

export default function RegisterLayout() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="UserTypeSelection" 
        component={UserTypeSelectionScreen} 
        options={{ headerTitle: 'Select User Type' }} 
      />
      <Stack.Screen 
        name="RegisterForm" 
        component={RegisterScreen} 
        options={{ headerTitle: 'Register' }} 
      />
    </Stack.Navigator>
  );
}