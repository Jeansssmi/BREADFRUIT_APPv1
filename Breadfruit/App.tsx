import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigators/RootNavigator';

import { firebase } from '@react-native-firebase/app';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

export default function App() {
  useEffect(() => {
    const app = firebase.app();
    console.log('Firebase initialized:', app.name); // should log [DEFAULT]
  }, []);

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
