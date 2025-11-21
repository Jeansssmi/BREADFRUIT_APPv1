import React, { useState, useEffect, useMemo, useLayoutEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { Card, Chip, Text, Button, Appbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import auth from '@react-native-firebase/auth';
// ⭐ YOUR DARK MODE
import { useTheme } from "../../../context/ThemeContext";

const TreeListItem = ({ tree, onCardPress, onEditPress, onMapPress }) => {
  const { dark } = useTheme();

  const bgColor = dark ? "#000" : "#fff";
  const cardColor = dark ? "#111" : "#fff";
  const textColor = dark ? "#fff" : "#222";
  const iconBg = dark ? "#1e1e1e" : "#eafaf1";
  const primary = "#2ecc71";

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onCardPress}>
      <Card style={[styles.card, { backgroundColor: cardColor }]}>
        <Card.Content style={styles.cardContent}>

          <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
            <MaterialCommunityIcons name="tree" size={28} color={primary} />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.treeIdText, { color: textColor }]}>
              {tree.treeID}
            </Text>

            <View style={styles.locationContainer}>
              <MaterialCommunityIcons name="map-marker" size={14} color={dark ? "#aaa" : "#666"} />
              <Text style={[styles.locationText, { color: textColor }]}>
                {tree.barangay ? `${tree.barangay}, ${tree.city}` : tree.city}
              </Text>
            </View>

            {/* STATUS */}
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: dark ? "#bbb" : "#555" }]}>
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
                {tree.status.charAt(0).toUpperCase() + tree.status.slice(1).replace("-", " ")}
              </Text>
            </View>
          </View>

          {/* EDIT BUTTON */}
          <TouchableOpacity
            onPress={onEditPress}
            style={{
              width: 32,
              height: 32,
              borderRadius: 21,
              backgroundColor: primary,
              justifyContent: "center",
              alignItems: "center",
              marginLeft: 10,
            }}
          >
            <MaterialCommunityIcons name="pencil" size={22} color="#fff" />
          </TouchableOpacity>

          {/* MAP BUTTON */}
          <TouchableOpacity
            onPress={onMapPress}
            style={{
              width: 32,
              height: 32,
              borderRadius: 21,
              backgroundColor: primary,
              justifyContent: "center",
              alignItems: "center",
              marginLeft: 10,
            }}
          >
            <MaterialCommunityIcons name="map-marker" size={22} color="#fff" />
          </TouchableOpacity>

        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

export default function TreeListScreen() {
  const navigation = useNavigation();

  // ⭐ YOUR DARK MODE
  const { dark } = useTheme();

  // ⭐ SAME COLORS AS TreeManagementScreen
  const bgColor = dark ? "#000" : "#fff";
  const cardColor = dark ? "#111" : "#fff";
  const textColor = dark ? "#fff" : "#222";
  const primary = "#2ecc71";

  const [trees, setTrees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("asc");

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  useEffect(() => {
    const currentUser = auth().currentUser;

    const unsubscribe = firestore()
      .collection("trees")
      .where("trackedById", "==", currentUser.uid)
      .where("status", "in", [
        "verified",
        "harvest-ready",
        "harvested",
        "not-ready",
      ])
      .onSnapshot(
        (querySnapshot) => {
          const data = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setTrees(data);
          setIsLoading(false);
        },
        () => setIsLoading(false)
      );

    return () => unsubscribe();
  }, []);


  const filteredTrees = useMemo(() => {
    let data =
      statusFilter === "All"
        ? [...trees]
        : trees.filter((tree) => tree.status === statusFilter);

    data.sort((a, b) =>
      sortOrder === "asc"
        ? a.treeID.localeCompare(b.treeID)
        : b.treeID.localeCompare(a.treeID)
    );

    return data;
  }, [trees, statusFilter, sortOrder]);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>

      {/* APPBAR */}
      <Appbar.Header style={{ backgroundColor: cardColor }}>

        {/* ✅ BACK BUTTON ADDED HERE */}
        <Appbar.BackAction
          color={textColor}
          onPress={() => navigation.goBack()}
        />

        <Appbar.Content
          title="Tree List"
          titleStyle={{ color: textColor }}
        />

        <Appbar.Action
          icon="sort-ascending"
          color={sortOrder === "asc" ? primary : textColor}
          onPress={() => setSortOrder("asc")}
        />

        <Appbar.Action
          icon="sort-descending"
          color={sortOrder === "desc" ? primary : textColor}
          onPress={() => setSortOrder("desc")}
        />

      </Appbar.Header>


      {/* FILTER BAR */}
      <View
        style={[
          styles.filterWrapper,
          { backgroundColor: cardColor },
        ]}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {["All", "verified", "harvest-ready", "harvested", "not-ready"].map(
            (status) => (
              <Chip
                key={status}
                mode="outlined"
                selected={statusFilter === status}
                onPress={() => setStatusFilter(status)}
                style={{
                  marginHorizontal: 6,
                  borderColor: primary,
                  backgroundColor:
                    statusFilter === status ? primary : cardColor,
                }}
                textStyle={{
                  color: statusFilter === status ? "#fff" : primary,
                }}
              >
                {status === "All"
                  ? "All"
                  : status.replace("-", " ").replace(/\b\w/g, (l) =>
                      l.toUpperCase()
                    )}
              </Chip>
            )
          )}
        </ScrollView>
      </View>

      {/* LIST */}
      <FlatList
        data={filteredTrees}
        keyExtractor={(item) => item.id || item.treeID}
        contentContainerStyle={{ padding: 12, paddingTop: 60 }}
        renderItem={({ item }) => (
          <TreeListItem
            tree={item}
            onCardPress={() =>
              navigation.navigate("TreeDetailsScreen", { treeId: item.id })
            }
            onEditPress={() =>
              navigation.navigate("EditTree", {
                docId: item.id,
                treeID: item.treeID,
              })
            }
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

  filterWrapper: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingVertical: 8,
  },

  card: {
    borderRadius: 14,
    elevation: 3,
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

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
