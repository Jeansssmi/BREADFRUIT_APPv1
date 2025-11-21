import React, { useState, useEffect } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Text, Appbar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { LoadingAlert, NotificationAlert } from '@/components/NotificationModal';

// ⭐ Your ThemeContext
import { useTheme } from "../../../context/ThemeContext";

export default function PendingDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { treeID } = route.params;

  const { dark } = useTheme(); // ⭐ YOUR DARK MODE

  const appbarBg = dark ? "#000000" : "#ffffff";
  const appbarText = dark ? "#ffffff" : "#333333";
  const bgColor = dark ? "#000000" : "#ffffff";
  const cardColor = dark ? "#111111" : "#ffffff";
  const textColor = dark ? "#ffffff" : "#333333";
  const textSub = dark ? "#bbbbbb" : "#666666";
  const placeholderBg = dark ? "#1a1a1a" : "#f9f9f9";
  const primary = "#2ecc71";
  const [imageLoaded, setImageLoaded] = useState(false);


  const [tree, setTree] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('info');

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('trees')
      .doc(treeID)
      .onSnapshot((doc) => {
        if (doc.exists) {
          const data = { id: doc.id, ...doc.data() };
          setTree(data);
        }
        setLoading(false);
      });

    return () => unsubscribe();
  }, [treeID]);

  const safeToFixed = (value: any, digits = 6) =>
    typeof value === 'number' ? value.toFixed(digits) : 'N/A';

  const formatTrackedDate = (dateTracked: any) => {
    if (!dateTracked) return 'N/A';
    if (dateTracked.toDate) return dateTracked.toDate().toLocaleDateString();
    if (typeof dateTracked === 'string') {
      const parsed = new Date(dateTracked);
      return isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString();
    }
    return 'N/A';
  };

  const handleCancelSubmission = () => {
    Alert.alert(
      "Cancel Submission",
      "Are you sure you want to cancel this submission?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const currentUID = auth().currentUser.uid;

              // researcher name
              const userDoc = await firestore().collection("users").doc(currentUID).get();
              const userName = userDoc.data()?.name || "Unknown User";

              // create record
              await firestore().collection("treeCancelled").add({
                treeID,
                researcherID: currentUID,
                researcherName: userName,
                status: "cancelled",
                timestamp: firestore.FieldValue.serverTimestamp(),
              });

              // update tree
              await firestore().collection("trees").doc(treeID).update({
                status: "cancelled",
              });

              // log
              await firestore().collection("activityLog").add({
                treeID,
                action: "Cancelled Submission",
                description: "You cancelled a tree submission.",
                uid: currentUID,
                userName,
                role: "researcher",
                timestamp: firestore.FieldValue.serverTimestamp(),
              });

              setNotificationMessage("Submission cancelled successfully.");
              setNotificationType("success");
              setNotificationVisible(true);

            } catch (error) {
              setNotificationMessage("Failed to cancel submission.");
              setNotificationType("error");
              setNotificationVisible(true);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

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
        <Text style={{ color: textColor }}>No tree data found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: bgColor }}>
      <View style={[styles.container, { backgroundColor: bgColor }]}>

      <Appbar.Header
        style={{
          backgroundColor: appbarBg,
          elevation: 2,
        }}
      >
        <Appbar.BackAction
          color={appbarText}
          onPress={() => navigation.goBack()}
        />
        <Appbar.Content title="Pending Details" color={appbarText} />
      </Appbar.Header>

        <LoadingAlert visible={loading} message="Please wait..." />

        <NotificationAlert
          visible={notificationVisible}
          message={notificationMessage}
          type={notificationType}
          onClose={() => {
            setNotificationVisible(false);
            if (notificationType === 'success') navigation.goBack();
          }}
        />


        {tree.image ? (
          <View style={{ position: "relative" }}>
            {/* 🔥 Glow Border */}
            <View
              style={[
                styles.glowBorder,
                {
                  borderColor: primary,
                  opacity: imageLoaded ? 1 : 0, // Only show glow after image loads
                },
              ]}
            />

            {/* 📌 Loading placeholder */}
            {!imageLoaded && (
              <View style={styles.imageLoader}>
                <ActivityIndicator size="large" color={primary} />
              </View>
            )}

            <Image
              source={{ uri: tree.image }}
              style={styles.treeImage}
              resizeMode="cover"
              onLoad={() => setImageLoaded(true)}
            />
          </View>
        ) : (
          <View style={[styles.treeImage, styles.imagePlaceholder]}>
            <MaterialIcons name="no-photography" size={40} color={textSub} />
          </View>
        )}



        <Card style={[styles.detailsCard, { backgroundColor: cardColor }]}>
          <Card.Content>
            <Text variant="titleLarge" style={[styles.title, { color: primary }]}>
              {tree.treeID}
            </Text>

            <View style={styles.detailRow}>
              <MaterialIcons name="location-on" size={20} color={primary} />
              <Text style={[styles.detailText, { color: textColor }]}>
                {tree.city}, {tree.barangay}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="tag" size={20} color={primary} />
              <Text style={[styles.detailText, { color: textColor }]}>
                {tree.trackedBy || 'Unknown User'}
              </Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={[styles.statItem, { backgroundColor: placeholderBg, borderColor: dark ? "#2ecc71" : "#dddddd",}]}>
                <Text style={[styles.statLabel, { color: textSub }]}>Diameter</Text>
                <Text style={[styles.statValue, { color: textColor }]}>
                  {tree.diameter?.toFixed(2) || 'N/A'} m
                </Text>
              </View>

              <View style={[styles.statItem, { backgroundColor: placeholderBg , borderColor: dark ? "#2ecc71" : "#dddddd",}]}>
                <Text style={[styles.statLabel, { color: textSub }]}>Fruit Status</Text>
                <Text style={[styles.statValue, { color: textColor }]}>
                  {tree.fruitStatus || 'N/A'}
                </Text>
              </View>

              <View style={[styles.statItem, { backgroundColor: placeholderBg , borderColor: dark ? "#2ecc71" : "#dddddd",}]}>
                <Text style={[styles.statLabel, { color: textSub }]}>Tracked Date</Text>
                <Text style={[styles.statValue, { color: textColor }]}>
                  {formatTrackedDate(tree.dateTracked)}
                </Text>
              </View>
            </View>

            <View style={styles.coordinateContainer}>
              <MaterialIcons name="map" size={20} color={primary} />
              <Text style={[styles.coordinateText, { color: textSub }]}>
                {safeToFixed(tree.coordinates?.latitude)}, {safeToFixed(tree.coordinates?.longitude)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleCancelSubmission}
          style={[styles.button, { backgroundColor: "#e74c3c" }]}
        >
          Cancel Submission
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  treeImage: { height: 300, borderRadius: 12, marginBottom: 16 },

  detailsCard: { borderRadius: 12, marginBottom: 16, elevation: 2 },

  title: { marginBottom: 20, fontWeight: 'bold' },

  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },

  detailText: { fontSize: 16 },

  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 16, gap: 12 },

  statItem: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 8 , borderWidth: 1},

  statLabel: { fontSize: 14, marginBottom: 4 },

  statValue: { fontSize: 16, fontWeight: '600' },

  coordinateContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },

  coordinateText: { fontSize: 14, fontFamily: 'monospace' },

  button: { borderRadius: 25, marginTop: 20 },
  glowBorder: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 16,
    borderWidth: 3,
    zIndex: 2,
    shadowColor: "#2ecc71",
    shadowOpacity: 0.9,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },

  imageLoader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },

});
