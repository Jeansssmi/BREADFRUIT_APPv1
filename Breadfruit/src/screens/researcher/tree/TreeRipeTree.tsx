import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
} from "react-native";
import { Card, Text, Appbar } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import firestore from "@react-native-firebase/firestore";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../../context/ThemeContext";


// ⭐ CARD ITEM — ONLY MAP BUTTON IS CLICKABLE
const TreeListItem = ({ tree, onMapPress }) => {
  const { dark } = useTheme();

  const cardColor = dark ? "#111" : "#fff";
  const textColor = dark ? "#fff" : "#222";
  const iconBg = dark ? "#1e1e1e" : "#eafaf1";
  const primary = "#2ecc71";

  return (
    <Card style={[styles.card, { backgroundColor: cardColor }]}>
      <Card.Content style={styles.cardContent}>

        {/* TREE ICON */}
        <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons name="tree" size={28} color={primary} />
        </View>

        {/* TREE INFO */}
        <View style={styles.textContainer}>
          <Text style={[styles.treeIdText, { color: textColor }]}>
            {tree.treeID}
          </Text>

          <View style={styles.locationContainer}>
            <MaterialCommunityIcons
              name="map-marker"
              size={14}
              color={dark ? "#aaa" : "#666"}
            />
            <Text style={[styles.locationText, { color: textColor }]}>
              {tree.barangay
                ? `${tree.barangay}, ${tree.city}`
                : tree.city}
            </Text>
          </View>

          {/* STATUS */}
          <View style={styles.statusRow}>
            <Text
              style={[
                styles.statusLabel,
                { color: dark ? "#bbb" : "#555" },
              ]}
            >
              Status:
            </Text>

            <Text
              style={[
                styles.statusValue,
                tree.status === "verified"
                  ? { color: "#27ae60" }
                  : tree.status === "harvest-ready"
                  ? { color: "#f1c40f" }
                  : tree.status === "harvested"
                  ? { color: "#8e5b32" }
                  : { color: dark ? "#bbb" : "#7f8c8d" },
              ]}
            >
              {tree.status.replace("-", " ").toUpperCase()}
            </Text>
          </View>
        </View>

        {/* MAP BUTTON — ONLY CLICKABLE PART */}
        <View style={styles.mapWrapper}>
          <MaterialCommunityIcons
            name="map-marker"
            size={28}
            color="#fff"
            style={styles.mapButton}
            onPress={onMapPress} // ⭐ ONLY clickable area
          />
        </View>
      </Card.Content>
    </Card>
  );
};


export default function TreeRipeTree() {
  const navigation = useNavigation();
  const route = useRoute();
  const { dark } = useTheme();

  const primary = "#2ecc71";
  const bgColor = dark ? "#000" : "#fff";
  const cardColor = dark ? "#111" : "#fff";
  const textColor = dark ? "#fff" : "#222";

  const treeID = route.params?.treeID;

  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  // ⭐ Get single tree only
  useEffect(() => {
    if (!treeID) return;

    const unsub = firestore()
      .collection("trees")
      .where("treeID", "==", treeID)
      .onSnapshot((snap) => {
        if (!snap.empty) {
          setTree({ id: snap.docs[0].id, ...snap.docs[0].data() });
        }
        setLoading(false);
      });

    return () => unsub();
  }, [treeID]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  if (!tree) {
    return (
      <View style={[styles.center, { backgroundColor: bgColor }]}>
        <Text style={{ color: textColor }}>Tree not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* HEADER */}
      <Appbar.Header style={{ backgroundColor: cardColor }}>
        <Appbar.BackAction color={textColor} onPress={() => navigation.goBack()} />
        <Appbar.Content title="Tree Ripe Alert" titleStyle={{ color: textColor }} />
      </Appbar.Header>

      {/* LIST */}
      <FlatList
        data={[tree]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <TreeListItem
            tree={item}
            onMapPress={() =>
              navigation.navigate("Map", {
                focusTree: {
                  treeID: item.treeID,
                  latitude: item.coordinates?.latitude,
                  longitude: item.coordinates?.longitude,
                  zoomIn: true,
                },
              })
            }
          />
        )}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },

  card: {
    borderRadius: 14,
    elevation: 2,
    shadowColor: "#000",
    marginBottom: 10,
  },

  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },

  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  textContainer: { flex: 1 },
  treeIdText: { fontSize: 16, fontWeight: "bold" },
  locationContainer: { flexDirection: "row", marginTop: 4 },
  locationText: { marginLeft: 4, fontSize: 13 },

  statusRow: { flexDirection: "row", marginTop: 6 },
  statusLabel: { fontSize: 13, marginRight: 4 },
  statusValue: { fontSize: 13, fontWeight: "bold" },

  // ⭐ MAP BUTTON ONLY CLICKABLE
  mapWrapper: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
  },

  mapButton: {
    backgroundColor: "#2ecc71",
    padding: 10,
    borderRadius: 25,
  },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
