import React from 'react';
import { View, StyleSheet, Switch } from 'react-native';
import { Appbar, Text, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext'; // ✅ Use your ThemeContext

export default function AppearanceScreen() {
  const navigation = useNavigation();
  const { isDarkMode, toggleDarkMode } = useTheme(); // ✅ Access global theme

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#f7f8fa' }]}>
      {/* Header */}
      <Appbar.Header style={{ backgroundColor: isDarkMode ? '#1c1c1c' : '#00c853' }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#fff" />
        <Appbar.Content title="Appearance" titleStyle={{ color: '#fff', fontWeight: 'bold' }} />
      </Appbar.Header>

      {/* Main Content */}
      <View style={styles.content}>
        <Card style={[styles.card, { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' }]}>
          <Card.Content style={styles.cardContent}>
            <Text style={[styles.label, { color: isDarkMode ? '#fff' : '#333' }]}>Dark Mode</Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode} // ✅ uses global toggle
              thumbColor={isDarkMode ? '#2ecc71' : '#f4f3f4'}
              trackColor={{ false: '#767577', true: '#a5d6a7' }}
            />
          </Card.Content>
        </Card>

        <Text style={[styles.description, { color: isDarkMode ? '#bbb' : '#666' }]}>
          Switch between light and dark themes for better visibility and comfort.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, alignItems: 'center' },
  card: {
    width: '90%',
    borderRadius: 20,
    elevation: 2,
    marginTop: 40,
    padding: 10,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { fontSize: 18, fontWeight: 'bold' },
  description: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 25,
    lineHeight: 22,
  },
});
