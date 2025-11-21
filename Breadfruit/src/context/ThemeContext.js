import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ThemeContext = createContext({
  dark: false,
  toggleTheme: () => {},
  setDark: (_value: boolean) => {}
});

export const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(false);

  // Load saved theme
  useEffect(() => {
    const loadTheme = async () => {
      const storedTheme = await AsyncStorage.getItem("themeMode");
      if (storedTheme) {
        setDark(storedTheme === "dark");
      }
    };
    loadTheme();
  }, []);

  // Save theme whenever it changes
  useEffect(() => {
    AsyncStorage.setItem("themeMode", dark ? "dark" : "light");
  }, [dark]);

  const toggleTheme = () => setDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ dark, toggleTheme, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
