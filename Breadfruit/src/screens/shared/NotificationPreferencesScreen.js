import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Appbar, Text, Switch } from 'react-native-paper';

export default function NotificationPreferencesScreen() {
  const navigation = useNavigation();
  const [isAlertsEnabled, setIsAlertsEnabled] = React.useState(true);
  const [isUpdatesEnabled, setIsUpdatesEnabled] = React.useState(false);

  return (
    <View style={styles.container}>


      <View style={styles.settingItem}>
        <Text style={styles.settingText}>Tree Ripeness Alerts</Text>
        <Switch
          value={isAlertsEnabled}
          onValueChange={setIsAlertsEnabled}
          color="#2ecc71"
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingText}>App News and Updates</Text>
        <Switch
          value={isUpdatesEnabled}
          onValueChange={setIsUpdatesEnabled}
          color="#2ecc71"
        />
      </View>

      <Text style={styles.hintText}>Control which types of alerts you receive from the app.</Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  appbarHeader: { backgroundColor: '#ffffff', elevation: 0 },
  appbarTitle: { color: '#333', fontWeight: 'bold' },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  hintText: {
    paddingHorizontal: 20,
    marginTop: 15,
    fontSize: 13,
    color: '#999',
  }
});