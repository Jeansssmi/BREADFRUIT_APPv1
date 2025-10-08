import { useNavigation } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function UserTypeSelectionScreen() {
  const navigation = useNavigation();

  const handleSelect = (type: 'researcher' | 'admin' | 'viewer') => {
    navigation.navigate('RegisterForm', { type }); 
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="account-multiple-plus" size={80} color="#2ecc71" />
      </View>
      <Text variant="headlineMedium" style={styles.title}>Select Account Type</Text>
      <Button mode="contained" onPress={() => handleSelect('researcher')} style={styles.button} labelStyle={styles.buttonLabel}>
        Researcher
      </Button>
      <Button mode="contained" onPress={() => handleSelect('admin')} style={styles.button} labelStyle={styles.buttonLabel}>
        Admin
      </Button>
      <Button mode="contained" onPress={() => handleSelect('viewer')} style={styles.button} labelStyle={styles.buttonLabel}>
        Viewer
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#ffffff' },
  iconContainer: { alignItems: 'center', marginBottom: 20 },
  title: { marginBottom: 30, textAlign: 'center', color: '#333' },
  button: { marginVertical: 10, borderRadius: 25, backgroundColor: '#2ecc71' },
  buttonLabel: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});