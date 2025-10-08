import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import the screen this navigator will manage
import ProcessFruitScreen from './[treeID]';

const Stack = createNativeStackNavigator();

export default function ProcessFruitLayout() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProcessFruit" 
        component={ProcessFruitScreen} 
        options={{ headerTitle: 'Send Attachment' }} 
      />
    </Stack.Navigator>
  );
}