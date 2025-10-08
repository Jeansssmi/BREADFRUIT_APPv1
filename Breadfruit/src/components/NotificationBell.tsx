// components/NotificationBell.tsx (Add to header)
import { View, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';

export default function NotificationBell() {
  return (
    <View style={styles.container}>
      <IconButton
        icon="bell"
        size={24}
        onPress={() => console.log('Navigate to notifications')}
      />
    </View>
  );
} 

const styles = StyleSheet.create({
  container: {
    marginRight: 10, // Adds spacing from screen edge
  },
});