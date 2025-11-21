import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

import { useTreeData } from '@/hooks/useTreeData';

// ⭐ Your ThemeContext
import { useTheme } from "../../../context/ThemeContext";

export default function TreeDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { treeID } = route.params;

  const { dark } = useTheme();

  // ⭐ DARK MODE COLORS
  const bgColor = dark ? "#000" : "#fff";
  const cardColor = dark ? "#111" : "#fff";
  const textColor = dark ? "#fff" : "#333";
  const textSub = dark ? "#ccc" : "#666";
  const placeholderColor = dark ? "#222" : "#eee";
  const statBg = dark ? "#1a1a1a" : "#eee";
  const primary = "#2ecc71";

  const [loading, setLoading] = useState(false);

  // Fetch tree
  const { trees, isLoading } = useTreeData({ mode: 'single', treeID });
  const tree = trees?.[0];

  useEffect(() => {
    if (!treeID) {
      Alert.alert("Error", "Missing Tree ID.");
      navigation.goBack();
    }
  }, [treeID]);


  // LOADING SCREEN
  if (isLoading || loading) {
    return (
      <View style={[styles.center, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  if (!tree) {
    return (
      <View style={[styles.center, { backgroundColor: bgColor }]}>
        <Text style={{ color: textColor }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        <View style={[styles.container, { backgroundColor: bgColor }]}>

          {/* IMAGE */}
          {tree.image ? (
            <Image source={{ uri: tree.image }} style={styles.treeImage} resizeMode="cover" />
          ) : (
            <View style={[styles.treeImage, { backgroundColor: placeholderColor, justifyContent: "center", alignItems: "center" }]}>
              <MaterialIcons name="no-photography" size={40} color={textSub} />
            </View>
          )}

          {/* DETAILS CARD */}
          <Card style={[styles.detailsCard, { backgroundColor: cardColor }]}>
            <Card.Content>

              <Text variant="titleLarge" style={[styles.title, { color: primary }]}>
                {tree.treeID}
              </Text>

              {/* LOCATION */}
              <View style={styles.detailRow}>
                <MaterialIcons name="location-on" size={20} color={primary} />
                <Text style={[styles.detailText, { color: textColor }]}>
                  {tree.city}
                </Text>
              </View>

              {/* STATS */}
              <View style={styles.statsContainer}>
                <View style={[styles.statItem, { backgroundColor: statBg }]}>
                  <Text style={[styles.statLabel, { color: textSub }]}>Diameter</Text>
                  <Text style={[styles.statValue, { color: textColor }]}>{tree.diameter.toFixed(2)}m</Text>
                </View>

                <View style={[styles.statItem, { backgroundColor: statBg }]}>
                  <Text style={[styles.statLabel, { color: textSub }]}>Tracked Date</Text>
                  <Text style={[styles.statValue, { color: textColor }]}>
                    {new Date(tree.dateTracked).toLocaleDateString()}
                  </Text>
                </View>

                <View style={[styles.statItem, { backgroundColor: statBg }]}>
                  <Text style={[styles.statLabel, { color: textSub }]}>Fruit Status</Text>
                  <Text style={[styles.statValue, { color: textColor }]}>
                    {tree.fruitStatus}
                  </Text>
                </View>
              </View>

              {/* COORDINATES */}
              <View style={styles.coordinateContainer}>
                <MaterialIcons name="map" size={20} color={primary} />
                <Text style={[styles.coordinateText, { color: textSub }]}>
                  {tree.coordinates.latitude.toFixed(6)}, {tree.coordinates.longitude.toFixed(6)}
                </Text>
              </View>

            </Card.Content>
          </Card>

          {/* BUTTONS */}
          <View style={styles.buttonGroup}>

            <Button
              mode="contained"
              style={[styles.button, { backgroundColor: primary }]}
              labelStyle={{ color: "#fff", fontWeight: "600" }}
              onPress={() => navigation.goBack()}
            >
              Close Details
            </Button>

          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  treeImage: {
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
  },

  detailsCard: {
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
  },

  title: { marginBottom: 20, fontWeight: "bold" },

  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
  detailText: { fontSize: 16 },

  statsContainer: { flexDirection: "row", justifyContent: "space-between", marginVertical: 16, gap: 12 },

  statItem: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },

  statLabel: { fontSize: 14, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: "600" },

  coordinateContainer: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 8 },
  coordinateText: { fontSize: 14, fontFamily: "monospace" },

  buttonGroup: { flexDirection: "row", gap: 10, marginTop: 20 },
  button: { flex: 1, borderRadius: 25 },
});
