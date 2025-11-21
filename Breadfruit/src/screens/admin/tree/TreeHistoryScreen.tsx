import React, { useEffect, useState, useMemo } from "react";
import { View, StyleSheet, ActivityIndicator, ScrollView, TextInput } from "react-native";
import { Appbar, Card, Divider, Text, useTheme, Chip, IconButton } from "react-native-paper";
import firestore from "@react-native-firebase/firestore";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function TreeHistoryScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { treeID } = route.params;

  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        let approvalQuery = firestore().collection("treeApproval");
        let rejectedQuery = firestore().collection("treeRejected");

        if (treeID !== "all") {
          approvalQuery = approvalQuery.where("treeID", "==", treeID);
          rejectedQuery = rejectedQuery.where("treeID", "==", treeID);
        }

        const [approvedSnap, rejectedSnap] = await Promise.all([
          approvalQuery.get(),
          rejectedQuery.get(),
        ]);

        const approvedData = approvedSnap.docs.map((doc) => ({
          id: doc.id,
          type: "approval",
          ...doc.data(),
        }));

        const rejectedData = rejectedSnap.docs.map((doc) => ({
          id: doc.id,
          type: "rejected",
          ...doc.data(),
        }));

        const combined = [...approvedData, ...rejectedData].sort((a, b) => {
          const timeA = a.timestamp?.toDate?.()?.getTime?.() || 0;
          const timeB = b.timestamp?.toDate?.()?.getTime?.() || 0;
          return timeB - timeA;
        });

        setHistory(combined);
      } catch (err) {
        console.error("Error loading tree history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [treeID]);

  // ✅ Apply search filter (only when treeID === "all")
  const filteredHistory = useMemo(() => {
    if (treeID !== "all" || searchQuery.trim() === "") return history;

    const query = searchQuery.toLowerCase();
    return history.filter(
      (item) =>
        item.treeID?.toLowerCase().includes(query) ||
        item.researcherID?.toLowerCase().includes(query) ||
        item.adminID?.toLowerCase().includes(query)
    );
  }, [searchQuery, history, treeID]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* ✅ Header */}


      {/* ✅ Search Bar for All Mode */}
      {treeID === "all" && (
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search by Tree ID or Researcher..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <IconButton
              icon="close"
              size={20}
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            />
          )}
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {filteredHistory.length === 0 ? (
            <Text style={styles.noData}>
              {treeID === "all"
                ? "No records found."
                : "No approval or rejection history found."}
            </Text>
          ) : (
            filteredHistory.map((item) => (
              <Card
                key={item.id}
                style={[
                  styles.card,
                  {
                    borderLeftColor:
                      item.type === "approval" ? "#2ecc71" : "#e74c3c",
                    borderLeftWidth: 4,
                  },
                ]}
              >
                <Card.Content>
                  <View style={styles.rowBetween}>
                    <Text style={styles.title}>
                      {item.type === "approval"
                        ? "✅ Tree Approved"
                        : "❌ Tree Rejected"}
                    </Text>
                    <Chip
                      mode="outlined"
                      textStyle={{
                        color:
                          item.type === "approval" ? "#2ecc71" : "#e74c3c",
                        fontWeight: "600",
                      }}
                    >
                      {item.approvedStatus || item.status || "N/A"}
                    </Chip>
                  </View>

                  <Divider style={{ marginVertical: 6 }} />

                  <Text>
                    {item.type === "approval"
                      ? `Approved by: ${item.adminID || "Admin"}`
                      : `Rejected by: ${item.adminID || "Admin"}`}
                  </Text>

                  {treeID === "all" && (
                    <Text>Tree ID: {item.treeID}</Text>
                  )}

                  <Text>
                    Researcher:{" "}
                    {item.researcherID
                      ? item.researcherID
                      : "Unknown Researcher"}
                  </Text>

                  <Text>
                    Date:{" "}
                    {item.timestamp?.toDate
                      ? item.timestamp.toDate().toLocaleString()
                      : "N/A"}
                  </Text>
                </Card.Content>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: "#333",
  },
  clearButton: {
    marginRight: -6,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noData: {
    textAlign: "center",
    color: "#888",
    marginTop: 40,
    fontSize: 15,
  },
});
