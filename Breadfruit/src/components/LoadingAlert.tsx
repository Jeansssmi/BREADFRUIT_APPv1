import React from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";

interface LoadingAlertProps {
  visible: boolean;
  message?: string;
}

export const LoadingAlert: React.FC<LoadingAlertProps> = ({ visible, message }) => {
  if (!visible) return null; // don’t render at all when hidden

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay} pointerEvents="auto">
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#2ecc71" />
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  message: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
});
