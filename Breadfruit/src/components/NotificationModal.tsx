import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export const LoadingAlert = ({ visible, message = "Loading..." }) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
    >
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <ActivityIndicator size="large" color="#2ecc71" />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

export const NotificationAlert = ({visible, message = "Something happened!", type = "info", onClose}) => {
  const getIconProps = () => {
    switch (type) {
      case 'success':
        return { name: 'check-circle' as const, color: '#2ecc71' };
      case 'error':
        return { name: 'error' as const, color: '#e74c3c' };
      default:
        return { name: 'info' as const, color: '#333' };
    }
  };

  const icon = getIconProps();

  return (
    <Modal
      transparent={true}
      // animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <MaterialIcons name={icon.name} size={40} color={icon.color} />
          <Text style={[styles.notificationMessage, { color: icon.color }]}>{message}</Text>
          <Button
            mode="contained"
            onPress={onClose}
            style={styles.okButton}
            labelStyle={{ color: '#333' }}
          >
            Close
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  alertBox: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200
  },
  message: {
    marginTop: 10,
    fontSize: 16,
    color: '#333'
  }, 
  notificationMessage: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  okButton: {
    marginTop: 10,
    backgroundColor: 'white',
    // borderRadius: 25,
    paddingHorizontal: 24,
  }
});