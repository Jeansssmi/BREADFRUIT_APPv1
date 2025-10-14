import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigators/RootNavigator';
import { ThemeProvider } from './src/context/ThemeContext';

import { firebase } from '@react-native-firebase/app';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

// ✅ 1. Import the Geocoder library
import Geocoder from 'react-native-geocoding';

// ✅ 2. Initialize Geocoder here with your API key
// This should only be done once in your entire application.
Geocoder.init("AIzaSyDkaDuJ4kRUpUJiXZrj7MHczYUFIcCIZNk");

export default function App() {
  useEffect(() => {
    const app = firebase.app();
    console.log('Firebase initialized:', app.name); // should log [DEFAULT]
  }, []);

  return (
          <ThemeProvider>
    <AuthProvider>
      <PaperProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </PaperProvider>
    </AuthProvider>
      </ThemeProvider>
  );
}
