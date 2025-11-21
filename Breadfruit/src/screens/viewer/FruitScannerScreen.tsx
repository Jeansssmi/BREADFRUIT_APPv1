import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import Tflite from "tflite-react-native";
import { Button } from "react-native-paper";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import Geolocation from "react-native-geolocation-service";


// ✅ TFLite instance
const tflite = new Tflite();

export default function FruitScannerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { treeID } = route.params as { treeID: string };

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null); // ✅ DISTANCE STATE

  const currentUser = auth().currentUser;
  const viewerId = currentUser?.uid;

  // ✅ Distance formula (Haversine)
  function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ✅ Load TFLite model
  useEffect(() => {
    tflite.loadModel(
      {
        model: "fruit_model.tflite",
        labels: "labels.txt",
        numThreads: 1,
      },
      (err) => {
        if (err) {
          console.error("Model Load Error:", err);
          setError("Failed to load detection model.");
        }
      }
    );
    return () => tflite.close();
  }, []);

const handleSelectSource = async () => {
  const treeDoc = await firestore().collection("trees").doc(treeID).get();
  const tree = treeDoc.data();
  if (!tree || !tree.coordinates) {
    Alert.alert("Error", "Tree has no saved location.");
    return;
  }

  const treeLat = tree.coordinates.latitude;
  const treeLon = tree.coordinates.longitude;

  console.log("✅ Tree Coordinates:", treeLat, treeLon);

  Geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      const dist = getDistanceMeters(latitude, longitude, treeLat, treeLon);

      console.log("📍 Distance:", dist, "m");
      setDistance(dist);

      if (dist > 200) {
        Alert.alert(
          "Too far from tree",
          `Move closer.\nCurrent distance: ${dist.toFixed(1)} meters`,
        );
        return;
      }

      Alert.alert("Select Source", "Choose input method", [
        { text: "Camera", onPress: handleCaptureFruit },
        { text: "Gallery", onPress: handlePickFromGallery },
        { text: "Cancel", style: "cancel" },
      ]);
    },
    (error) => {
      console.log("GPS ERROR:", error);
      Alert.alert(
        "GPS Error",
        "Please enable location / go outside for a better signal."
      );
    },
    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 5000,
    }
  );
};


  // ✅ Scan result unchanged
  const runFruitScanner = (uri: string) => {
    setLoading(true);
    setResult(null);
    setError(null);
    setImageUri(uri);

    tflite.runModelOnImage(
      {
        path: uri,
        imageMean: 127.5,
        imageStd: 127.5,
        threshold: 0.1,
      },
      (err, res) => {
        setLoading(false);
        if (err || !res) {
          setError("Error analyzing image");
          return;
        }
        setResult(res[0]);
      }
    );
  };

  const handleCaptureFruit = async () => {
    launchCamera({ mediaType: "photo", quality: 1 }, (response) => {
      if (!response.didCancel) {
        const uri = response.assets?.[0]?.uri;
        if (uri) runFruitScanner(uri);
      }
    });
  };

  const handlePickFromGallery = () => {
    launchImageLibrary({ mediaType: "photo", quality: 1 }, (response) => {
      if (!response.didCancel) {
        const uri = response.assets?.[0]?.uri;
        if (uri) runFruitScanner(uri);
      }
    });
  };

  // ✅ Send Ripe Alert + Notification (unchanged)
  const handleSendNotification = async () => {
    if (!result || result.label !== "ripe") {
      Alert.alert("Not Allowed", "Can only notify when fruit is ripe.");
      return;
    }

    const treeDoc = await firestore().collection("trees").doc(treeID).get();
    const tree = treeDoc.data();
    if (!tree) return;

    const researcherId =
      tree.trackedById ?? tree.ownerId ?? tree.userId ?? null;

    if (!researcherId) {
      Alert.alert("Error", "Missing assigned researcher.");
      return;
    }

    try {
      const alertRef = await firestore().collection("ripeAlert").add({
        treeId: treeID,
        detectedBy: viewerId,
        researcherId: researcherId,
        fruitStatus: "ripe",
        confidence: result.confidence ?? null,
        viewerDistance: distance?.toFixed(1) ?? null, // ✅ Save distance
        timestamp: firestore.FieldValue.serverTimestamp(),
      });

      await firestore().collection("notification").add({
        type: "tree-ripe",
        message: `Tree ${treeID} has ripe fruit detected 🍈`,

        // ✅ Required by your rules
        recipientID: researcherId,
        recipientRole: "researcher",
        relatedTreeID: treeID,

        read: false,
        seen: false,

        // ✅ Still included
        timestamp: firestore.FieldValue.serverTimestamp(),
      });

    // ✅ Also Notify Admin
       await firestore().collection("notification").add({
         type: "tree-ripe",
         message: `Viewer detected ripe fruit on tree ${treeID}.`,
         recipientRole: "Admin",
         lat: tree.coordinates.latitude,
         lng: tree.coordinates.longitude,
         relatedTreeID: treeID,
         reporterName: currentUser?.displayName || "Viewer",
         read: false,
         seen: false,
         timestamp: firestore.FieldValue.serverTimestamp(),
       });

    // 📝 Log activity
       await firestore().collection("activityLog").add({
             actionType: "ripe-alert",
             description: `Viewer reported ripe fruit on tree ${treeID}.`,
             treeID: treeID,
             uid: viewerId,
             userRole: "viewer",
             timestamp: firestore.FieldValue.serverTimestamp(),
           });



      Alert.alert(
        "🍈 Ripe Alert Sent!",
        "Researcher has been notified.",
        [
          {
            text: "OK",
            onPress: () => {
              setImageUri(null);
              setResult(null);
              setDistance(null);

              navigation.navigate("TreeDetails", { treeID });
            }
          }
        ]
      );

    } catch (err) {
      console.error("Notification Error:", err);
      Alert.alert("Error", "Failed to send notification.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Fruit Ripeness Scanner</Text>
        <Text style={styles.subtitle}>Tree ID: {treeID}</Text>

        {distance !== null && (
          <Text style={{ fontSize: 16, color: "#000", marginBottom: 10 }}>
            📍 Distance from tree: {distance.toFixed(1)} meters
          </Text>
        )}

        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Button
              mode="contained"
              onPress={handleSelectSource}
              style={styles.primaryButton}
              icon="camera"
            >
              Scan Fruit
            </Button>
          </View>
        )}

        <View style={styles.resultContainer}>
          {loading && <ActivityIndicator size="large" color="#2ecc71" />}
          {error && <Text style={styles.errorText}>{error}</Text>}

          {result && (
            <>
              <Text style={styles.resultLabel}>Status:</Text>
              <Text style={styles.resultValue}>{result.label}</Text>

              <Text style={styles.resultLabel}>Confidence:</Text>
              <Text style={styles.resultValue}>
                {(result.confidence * 100).toFixed(1)}%
              </Text>
            </>
          )}

          {!result && !loading && (
            <Text style={styles.resultText}>Scan a fruit to see the result</Text>
          )}
        </View>

        {imageUri && !loading && (
          <View style={styles.buttonContainer}>
            <Button mode="outlined" onPress={handleSelectSource} style={styles.button}>
              Scan Another
            </Button>

            <Button
              mode="contained"
              onPress={handleSendNotification}
              style={[styles.button, { backgroundColor: "#27ae60" }]}
            >
              Notify Researcher
            </Button>

            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.button}
            >
              Back
            </Button>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ✅ Styles unchanged
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { flexGrow: 1, alignItems: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#333" },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 20 },
  image: {
    width: 320,
    height: 320,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: "#f0f0f0",
  },
  imagePlaceholder: {
    width: 320,
    height: 320,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#eee",
  },
  resultContainer: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 20,
    width: "100%",
  },
  resultText: { fontSize: 16, color: "#666" },
  resultLabel: { fontSize: 16, color: "#333", marginTop: 10 },
  resultValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#27ae60",
    textTransform: "capitalize",
  },
  errorText: { color: "#e74c3c", fontSize: 16 },
  buttonContainer: { width: "100%", marginTop: 20 },
  button: { marginTop: 10, borderRadius: 25 },
  primaryButton: {
    backgroundColor: "#2ecc71",
    borderRadius: 25,
  },
});
