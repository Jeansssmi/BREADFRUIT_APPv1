import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigators/RootNavigator';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { ToastProvider } from './src/context/ToastProvider'; // ✅ Import global toast system

import { firebase } from '@react-native-firebase/app';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

// ✅ Initialize Geocoder
import Geocoder from 'react-native-geocoding';
Geocoder.init("AIzaSyDkaDuJ4kRUpUJiXZrj7MHczYUFIcCIZNk");

// ✅ Internal wrapper that applies global theme from ThemeContext
function ThemedApp() {
  const { isDarkMode } = useTheme();

  const CombinedLightTheme = {
    ...MD3LightTheme,
    ...NavigationDefaultTheme,
    colors: {
      ...MD3LightTheme.colors,
      ...NavigationDefaultTheme.colors,
      primary: '#2ecc71',
      accent: '#27ae60',
      background: '#f7f8fa',
      card: '#ffffff',
      text: '#000000',
    },
  };

  const CombinedDarkTheme = {
    ...MD3DarkTheme,
    ...NavigationDarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      ...NavigationDarkTheme.colors,
      primary: '#2ecc71',
      accent: '#27ae60',
      background: '#121212',
      card: '#1e1e1e',
      text: '#ffffff',
    },
  };

  const theme = isDarkMode ? CombinedDarkTheme : CombinedLightTheme;

  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <ToastProvider> {/* ✅ Wrap here so it works across all screens */}
          <NavigationContainer theme={theme}>
            <RootNavigator />
          </NavigationContainer>
        </ToastProvider>
      </PaperProvider>
    </AuthProvider>
  );
}

export default function App() {
  useEffect(() => {
    const app = firebase.app();
    console.log('Firebase initialized:', app.name); // should log [DEFAULT]
  }, []);

  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}
