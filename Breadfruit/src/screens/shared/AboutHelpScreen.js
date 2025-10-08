import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Text, List } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function AboutHelpScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbarHeader}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#333" />
        <Appbar.Content title="About & Help" titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineSmall" style={styles.headline}>Breadfruit Tracker App</Text>
        <Text style={styles.versionText}>Version 1.2.0 (Build 202508)</Text>

        <List.Section title="Help & Support" titleStyle={styles.sectionTitle}>
          <List.Item
            title="FAQs"
            description="Find answers to common questions"
            left={() => <MaterialIcons name="help-outline" size={24} color="#2ecc71" />}
            right={() => <MaterialIcons name="chevron-right" size={24} color="#ccc" />}
            onPress={() => alert('Navigate to FAQ web link.')}
          />
          <List.Item
            title="Contact Support"
            description="Email our support team"
            left={() => <MaterialIcons name="mail-outline" size={24} color="#2ecc71" />}
            right={() => <MaterialIcons name="chevron-right" size={24} color="#ccc" />}
            onPress={() => alert('Open email client.')}
          />
        </List.Section>

        <List.Section title="Legal" titleStyle={styles.sectionTitle}>
          <List.Item
            title="Terms of Service"
            left={() => <MaterialIcons name="gavel" size={24} color="#666" />}
            right={() => <MaterialIcons name="chevron-right" size={24} color="#ccc" />}
            onPress={() => alert('Navigate to Terms.')}
          />
          <List.Item
            title="Privacy Policy"
            left={() => <MaterialIcons name="security" size={24} color="#666" />}
            right={() => <MaterialIcons name="chevron-right" size={24} color="#ccc" />}
            onPress={() => alert('Navigate to Privacy Policy.')}
          />
        </List.Section>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  appbarHeader: { backgroundColor: '#ffffff', elevation: 0 },
  appbarTitle: { color: '#333', fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 0, paddingBottom: 20 },
  headline: {
    fontWeight: 'bold',
    color: '#2ecc71',
    textAlign: 'center',
    marginTop: 20
  },
  versionText: {
    textAlign: 'center',
    color: '#999',
    marginBottom: 30
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#f7f7f7',
    paddingVertical: 8,
  }
});