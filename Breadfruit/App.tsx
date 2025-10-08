
// Import your providers and the main navigator
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigators/RootNavigator';

import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import 'react-native-gesture-handler'; // Recommended to be at the top
import 'react-native-reanimated';
import { Buffer } from "buffer";
global.Buffer = global.Buffer || Buffer;


export default function App() {
  return (
    <AuthProvider>
      <PaperProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </PaperProvider>
    </AuthProvider>
  );
}