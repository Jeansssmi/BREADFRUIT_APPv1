import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function UserTypeSelectionScreen() {
  const navigation = useNavigation<any>();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 🌙 Load saved theme from AsyncStorage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themeMode');
        setIsDarkMode(savedTheme === 'dark');
      } catch (e) {
        console.error('Failed to load theme mode', e);
      }
    };
    loadTheme();
  }, []);

  const handleSelect = (type: 'researcher' | 'admin' | 'viewer') => {
    navigation.navigate('RegisterForm', { type });
  };

  // 🎨 Dynamic colors
  const backgroundColor = isDarkMode ? '#121212' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#333333';
  const buttonColor = '#2ecc71';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="account-multiple-plus" size={80} color={buttonColor} />
      </View>

      <Text variant="headlineMedium" style={[styles.title, { color: textColor }]}>
        Select Account Type
      </Text>

      <Button
        mode="contained"
        onPress={() => handleSelect('researcher')}
        style={[styles.button, { backgroundColor: buttonColor }]}
        labelStyle={styles.buttonLabel}
      >
        Researcher
      </Button>


      <Button
        mode="contained"
        onPress={() => handleSelect('viewer')}
        style={[styles.button, { backgroundColor: buttonColor }]}
        labelStyle={styles.buttonLabel}
      >
        Viewer
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  iconContainer: { alignItems: 'center', marginBottom: 20 },
  title: { marginBottom: 30, textAlign: 'center' },
  button: { marginVertical: 10, borderRadius: 25 },
  buttonLabel: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
