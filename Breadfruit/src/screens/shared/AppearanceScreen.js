import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Switch, useTheme as paperTheme } from "react-native-paper";
import { useTheme } from "../../context/ThemeContext";

export default function AppearanceScreen() {
  const { dark, toggleTheme } = useTheme();
  const theme = paperTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Appearance
      </Text>

      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          Dark Mode
        </Text>
        <Switch value={dark} onValueChange={toggleTheme} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 30 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
  },
  label: { fontSize: 18 },
});
