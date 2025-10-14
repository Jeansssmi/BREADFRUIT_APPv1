import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load saved theme from storage
  useEffect(() => {
    const loadTheme = async () => {
      const saved = await AsyncStorage.getItem('isDarkMode');
      if (saved !== null) setIsDarkMode(saved === 'true');
    };
    loadTheme();
  }, []);

  // Save theme whenever it changes
  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    await AsyncStorage.setItem('isDarkMode', newMode.toString());
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
