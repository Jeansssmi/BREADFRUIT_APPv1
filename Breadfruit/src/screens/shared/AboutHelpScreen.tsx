// src/screens/AboutHelpScreen.tsx
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Appbar, Card, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AboutHelpScreen() {
  const navigation = useNavigation<any>();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('themeMode');
        setIsDarkMode(saved === 'dark');
      } catch (e) {
        console.error('Failed to load theme mode', e);
      }
    };
    loadTheme();
  }, []);

  const containerStyle = isDarkMode ? styles.containerDark : styles.containerLight;
  const cardStyle = isDarkMode ? styles.cardDark : styles.cardLight;
  const titleColor = isDarkMode ? '#a5d6a7' : '#00c853';
  const textColor = isDarkMode ? '#ddd' : '#333';

  return (
    <View style={[styles.container, containerStyle]}>
      <Appbar.Header style={{ backgroundColor: isDarkMode ? '#0b3d0b' : '#00c853' }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#fff" />
        <Appbar.Content title="About App" titleStyle={{ color: '#fff', fontWeight: 'bold' }} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={[styles.card, cardStyle]}>
          <Card.Content>
            <Text style={[styles.title, { color: titleColor }]}>🌿 Breadfruit App</Text>

            <Text style={[styles.description, { color: textColor }]}>
              The Breadfruit Monitoring System is a mobile and web-based platform designed to help
              researchers and administrators manage, monitor, and track breadfruit trees efficiently.
              It provides real-time updates, geolocation mapping, and tree growth tracking features
              that support research and environmental sustainability efforts.
            </Text>

            <Text style={[styles.sectionTitle, { color: titleColor }]}>✨ Features:</Text>
            <Text style={[styles.listItem, { color: textColor }]}>• Researcher,Viewer and Admin accounts</Text>
            <Text style={[styles.listItem, { color: textColor }]}>• Tree registration and approval system</Text>
            <Text style={[styles.listItem, { color: textColor }]}>• Real-time map and tree tracking</Text>
            <Text style={[styles.listItem, { color: textColor }]}>• Notifications for updates and approvals</Text>
            <Text style={[styles.listItem, { color: textColor }]}>• Light and Dark Mode support</Text>

            <Text style={[styles.sectionTitle, { color: titleColor }]}>👩‍💻 Developer Info:</Text>
            <Text style={[styles.listItem, { color: textColor }]}>Developed by: ALT F4</Text>
            <Text style={[styles.listItem, { color: textColor }]}>Institution: Your Institution</Text>
            <Text style={[styles.listItem, { color: textColor }]}>Version: 1.0.0</Text>

            <Text style={[styles.footer, { color: textColor }]}>
              Thank you for using Breadfruit App. Together, let's grow a greener future! 🌱
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerLight: { backgroundColor: '#f6fff6' },
  containerDark: { backgroundColor: '#0b0f0b' },
  content: { padding: 20 },
  card: { borderRadius: 20, elevation: 4, padding: 10 },
  cardLight: { backgroundColor: '#fff' },
  cardDark: { backgroundColor: '#111' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  description: { fontSize: 16, lineHeight: 24, marginBottom: 20, textAlign: 'justify' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 5 },
  listItem: { fontSize: 15, marginLeft: 10, marginBottom: 5 },
  footer: { textAlign: 'center', marginTop: 25, fontStyle: 'italic' },
});
