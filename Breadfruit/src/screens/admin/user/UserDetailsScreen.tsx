import React, { useState, useEffect } from "react";
import { Alert, Image, ScrollView, StyleSheet, View, TouchableOpacity } from "react-native";
import { ActivityIndicator, Appbar, Card, Text, Chip, useTheme } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import firestore from "@react-native-firebase/firestore";
import functions from "@react-native-firebase/functions";

import { LoadingAlert, NotificationAlert } from "@/components/NotificationModal";
import { useUserData } from "@/hooks/useUserData";

export default function UserDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const theme = useTheme(); // ✅ added theme
  // @ts-ignore

     const { userID } = route.params || {};

     const [user, setUser] = useState<any>(null);
     const [isLoading, setIsLoading] = useState(true);
     const [loading, setLoading] = useState(false);

  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState<"success" | "info" | "error">("info");

 // ✅ Real-time listener (auto-loads + updates instantly)
  useEffect(() => {
    const unsubscribe = firestore()
      .collection("users")
      .doc(userID.toString())
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            setUser({ uid: doc.id, ...doc.data() });
          } else {
            setUser(null);
          }
          setIsLoading(false);
        },
        (error) => {
          console.error("Error fetching user:", error);
          setIsLoading(false);
        }
      );

    return () => unsubscribe();
  }, [userID]);
  const handleDelete = (uid: string) => {
    Alert.alert("Confirm Reject/Delete", "Are you sure you want to reject and delete this user?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            const deleteUser = functions().httpsCallable("deleteUser");
            await deleteUser({ uid });
            setNotificationMessage("User deleted successfully.");
            setNotificationType("success");
            setNotificationVisible(true);
          } catch (error) {
            console.error(error);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleApprove = (uid: string) => {
    Alert.alert("Confirm Approval", "Are you sure you want to approve this user?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        onPress: async () => {
          setLoading(true);
          try {
            const docRef = firestore().collection("users").doc(uid);
            await docRef.update({ status: "verified" });
            setNotificationMessage("Successfully approved!");
            setNotificationType("success");
            setNotificationVisible(true);
          } catch (error) {
            console.error(error);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>User not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <LoadingAlert visible={loading} message="Please wait..." />
        <NotificationAlert
          visible={notificationVisible}
          message={notificationMessage}
          type={notificationType}
          onClose={() => {
            setNotificationVisible(false);
            if (notificationType === "success") navigation.goBack();
          }}
        />

        {/* 🧍 Profile Section */}
        <View style={styles.profileSection}>
          <View
            style={[
              styles.avatarCircle,
              {
                backgroundColor: theme.dark ? "#1e1e1e" : "#eafaf1",
                borderColor: theme.colors.primary,
              },
            ]}
          >
            {user?.image ? (
              <Image source={{ uri: user.image }} style={styles.avatarImage} />
            ) : (
              <MaterialCommunityIcons name="account" size={60} color={theme.colors.primary} />
            )}
          </View>
          <Text style={[styles.userName, { color: theme.colors.text }]}>{user?.name}</Text>
          <Chip
            style={[styles.roleChip, { backgroundColor: theme.colors.primary }]}
            textStyle={styles.roleChipText}
          >
            {user?.role}
          </Chip>
        </View>

        {/* 📋 User Details Card */}
        <Card style={[styles.detailsCard, { backgroundColor: theme.colors.card }]}>
          <Card.Content>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="email-outline" size={24} color={theme.colors.primary} />
              <Text style={[styles.detailText, { color: theme.colors.text }]}>{user?.email}</Text>
            </View>

            <View style={styles.detailItem}>
              <MaterialCommunityIcons
                name="account-cog-outline"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={[styles.detailText, { color: theme.colors.text }]}>{user?.role}</Text>
            </View>

            <View style={styles.detailItem}>
              <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={[styles.detailText, { color: theme.colors.text }]}>
                {user.status === "pending" ? "Requested:" : "Joined:"}{" "}
                {user.joined?.toDate
                  ? user.joined.toDate().toLocaleDateString()
                  : new Date(user.joined).toLocaleDateString()}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* 🔘 Bottom Buttons */}
      <View
        style={[
          styles.buttonContainer,
          {
            backgroundColor: theme.colors.card,
            borderTopColor: theme.dark ? "#333" : "#eee",
          },
        ]}
      >
        {user.status === "pending" ? (
          <>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={() => handleApprove(userID.toString())}
            >
              <Text style={styles.buttonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.dark ? "#444" : "#333" }]}
              onPress={() => handleDelete(userID.toString())}
            >
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate("EditUser", { userID: user.uid })}
            >
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.dark ? "#444" : "#333" }]}
              onPress={() => handleDelete(userID.toString())}
            >
              <Text style={styles.buttonText}>Delete User</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  profileSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    marginBottom: 16,
    marginTop: 20,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
  },
  roleChip: {
    marginTop: 8,
  },
  roleChipText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
    textTransform: "uppercase",
  },
  detailsCard: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  detailText: {
    fontSize: 15,
    textTransform: "capitalize",
  },
  buttonContainer: {
    padding: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 12,
  },
  button: {
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
    elevation: 2,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
