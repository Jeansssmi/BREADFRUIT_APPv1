import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid,
  Alert,
  ActionSheetIOS,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, TextInput, Menu } from "react-native-paper";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Geolocation from "react-native-geolocation-service";
import { useNavigation, useRoute } from "@react-navigation/native";
import { fireStore as db, storage, functions } from "../../../firebaseConfig";
import { httpsCallable } from "firebase/functions";
import { getAuth } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import barangayData from "@/constants/barangayData";

const FRUIT_STATUS_OPTIONS = ["none", "unripe", "ripe"];
const CITY_OPTIONS = Object.keys(barangayData);

export default function AddTreeScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const [image, setImage] = useState<string | null>(route.params?.imageUri || null);
  const [diameterInput, setDiameterInput] = useState(route.params?.diameter?.toString() || "");
  const [latitudeInput, setLatitudeInput] = useState<string>("");
  const [longitudeInput, setLongitudeInput] = useState<string>("");

  const [city, setCity] = useState("");
  const [barangay, setBarangay] = useState("");
  const [fruitStatus, setFruitStatus] = useState("none");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [cityOptionsMenuVisible, setCityOptionsMenuVisible] = useState(false);
  const [barangayOptionsMenuVisible, setBarangayOptionsMenuVisible] = useState(false);

  const BARANGAY_OPTIONS = barangayData[city] || [];

  useEffect(() => {
    if (route.params?.diameter) {
      setDiameterInput(route.params.diameter.toString());
    }
  }, [route.params?.diameter]);

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "App needs access to your location.",
            buttonPositive: "OK",
            buttonNegative: "Cancel",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const getLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert("Permission Denied", "Location permission is required.");
      return;
    }
    setLoading(true);
    Geolocation.getCurrentPosition(
      (position) => {
        setLatitudeInput(position.coords.latitude.toString());
        setLongitudeInput(position.coords.longitude.toString());
        setLoading(false);
      },
      (error) => {
        console.error("Location error:", error);
        Alert.alert("Error", "Failed to get location. Please turn on GPS and try again.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleImageSelection = () => {
    const options = { mediaType: 'photo' as const, quality: 0.8 };
    Alert.alert("Select Image", "Choose an option", [
      { text: "Take Photo", onPress: () => launchCamera(options, handleImageResponse) },
      { text: "Choose from Gallery", onPress: () => launchImageLibrary(options, handleImageResponse) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleImageResponse = (response: any) => {
    if (response.didCancel) return;
    if (response.errorCode) {
      console.error("ImagePicker Error: ", response.errorMessage);
      return;
    }
    if (response.assets && response.assets.length > 0) {
      setImage(response.assets[0].uri || null);
    }
  };

 const handleRemoveImage = () => setImage(null);

const uploadImageAndGetURL = async (uri: string): Promise<string | null> => {
  if (!uri.startsWith('file://')) {
    // If it's already a web URL, no need to re-upload
    return uri;
  }

  const response = await fetch(uri);
  const blob = await response.blob();

  const fileName = `trees/${Date.now()}.jpg`;
  const storageRef = ref(storage, fileName);

  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
};
  // --- THIS IS THE CORRECT AND ONLY 'handleSave' FUNCTION ---
const handleSave = async () => {
  if (!city || !barangay || !diameterInput || !latitudeInput || !longitudeInput) {
    Alert.alert("Validation Error", "Please fill all required fields before saving.");
    return;
  }

  setSaving(true);

  try {
    const authInstance = getAuth();
    const currentUser = authInstance.currentUser;
    if (!currentUser) {
      Alert.alert("Authentication Required", "You must be logged in.");
      setSaving(false);
      return;
    }

    // 1️⃣ Upload image (if available)
    let imageUrl: string | null = null;
    if (image) {
      imageUrl = await uploadImageAndGetURL(image);
    }

    // 2️⃣ Prepare data for request
    const treeData = {
      city,
      barangay,
      diameter: parseFloat(diameterInput),
      dateTracked: new Date().toISOString(),
      fruitStatus,
      coordinates: {
        latitude: parseFloat(latitudeInput),
        longitude: parseFloat(longitudeInput),
      },
      image: imageUrl,
      status: "verified",
      trackedBy: currentUser.uid,
    };

    console.log("📤 Sending to Cloud Function:", treeData);

    // 3️⃣ Get Auth token (optional, but recommended if your function requires auth)
    const token = await currentUser.getIdToken();

    // 4️⃣ Call Cloud Function using fetch()
    const response = await fetch(
      "https://us-central1-breadfruit-tracker.cloudfunctions.net/addNewTree",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // include auth token for security
        },
        body: JSON.stringify({ data: treeData }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const result = await response.json();
    console.log("✅ Cloud Function result:", result);

    // Firebase v2 functions return { result: { ... } } or { data: { ... } }
    const success = result?.data?.success || result?.result?.success;

    if (success) {
      Alert.alert("Success", "Tree added successfully!");
      navigation.goBack();
    } else {
      const message =
        result?.data?.message ||
        result?.error?.message ||
        "An unexpected server error occurred.";
      Alert.alert("Error", message);
    }
  } catch (error: any) {
    console.error("❌ Error saving tree:", error);

    let errorMessage = "Failed to save tree data.";
    if (error.message?.includes("resource-exhausted")) {
      errorMessage = "Cannot save tree. The maximum ID limit for the year has been reached.";
    } else if (error.message?.includes("invalid-argument")) {
      errorMessage = "Invalid tree data. Please check your inputs.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    Alert.alert("Error", errorMessage);
  } finally {
    setSaving(false);
  }
};



  const handleNavigateToScanner = () => {
    if (!image) {
      Alert.alert("Image Required", "Please select an image first.");
      return;
    }
    navigation.navigate("DiameterScannerScreen", { imageUri: image });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Log New Breadfruit Tree</Text>

          <TouchableOpacity style={styles.imageContainer} onPress={handleImageSelection}>
            {image ? (
              <>
                <Image source={{ uri: image }} style={styles.image} />
                <Button mode="contained" onPress={handleRemoveImage} style={styles.removeButton} labelStyle={{fontSize: 12}}>
                  Change
                </Button>
              </>
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialIcons name="add-a-photo" size={40} color="#2ecc71" />
                <Text style={styles.imageLabel}>Capture or Upload Picture</Text>
                <Text style={styles.imageHint}>Tap to choose</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Menu
                visible={cityOptionsMenuVisible}
                onDismiss={() => setCityOptionsMenuVisible(false)}
                anchor={
                  <TouchableOpacity onPress={() => setCityOptionsMenuVisible(true)}>
                    <TextInput
                      label="City/Municipality"
                      value={city}
                      editable={false}
                      right={<TextInput.Icon icon="menu-down" />}
                      style={styles.menuInput}
                      mode="outlined"
                    />
                  </TouchableOpacity>
                }
              >
                {CITY_OPTIONS.map((option) => (
                  <Menu.Item
                    key={option}
                    onPress={() => { setCity(option); setBarangay(""); setCityOptionsMenuVisible(false); }}
                    title={option}
                  />
                ))}
              </Menu>
            </View>
            <View style={styles.halfWidth}>
              <Menu
                visible={barangayOptionsMenuVisible}
                onDismiss={() => setBarangayOptionsMenuVisible(false)}
                anchor={
                  <TouchableOpacity onPress={() => setBarangayOptionsMenuVisible(true)} disabled={!city}>
                    <TextInput
                      label="Barangay"
                      value={barangay}
                      editable={false}
                      right={<TextInput.Icon icon="menu-down" />}
                      style={styles.menuInput}
                      mode="outlined"
                      disabled={!city}
                    />
                  </TouchableOpacity>
                }
              >
                {BARANGAY_OPTIONS.map((option) => (
                  <Menu.Item
                    key={option}
                    onPress={() => { setBarangay(option); setBarangayOptionsMenuVisible(false); }}
                    title={option}
                  />
                ))}
              </Menu>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <TextInput
                label="Diameter (cm)"
                value={diameterInput}
                editable={false}
                placeholder="Scan to get value"
                style={styles.input}
                mode="outlined"
              />
            </View>
            <View style={styles.halfWidth}>
              <Menu
                visible={showStatusMenu}
                onDismiss={() => setShowStatusMenu(false)}
                anchor={
                  <TouchableOpacity onPress={() => setShowStatusMenu(true)}>
                    <TextInput
                      label="Fruit Status"
                      value={fruitStatus}
                      editable={false}
                      right={<TextInput.Icon icon="menu-down" />}
                      style={styles.menuInput}
                      mode="outlined"
                    />
                  </TouchableOpacity>
                }
              >
                {FRUIT_STATUS_OPTIONS.map((option) => (
                  <Menu.Item
                    key={option}
                    onPress={() => { setFruitStatus(option); setShowStatusMenu(false); }}
                    title={option.charAt(0).toUpperCase() + option.slice(1)}
                  />
                ))}
              </Menu>
            </View>
          </View>

          <View style={styles.coordinateGroup}>
            <View style={styles.row}>
              <TextInput
                label="Latitude"
                value={latitudeInput}
                editable={false}
                style={[styles.input, styles.halfWidth]}
                mode="outlined"
              />
              <TextInput
                label="Longitude"
                value={longitudeInput}
                editable={false}
                style={[styles.input, styles.halfWidth]}
                mode="outlined"
              />
            </View>
            <TouchableOpacity onPress={getLocation} disabled={loading}>
              <Text style={styles.useLocationText}>
                {loading ? "Getting Location..." : "Get Current Location"}
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            label="Date Tracked"
            value={new Date().toLocaleDateString()}
            editable={false}
            style={styles.input}
            mode="outlined"
          />

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleNavigateToScanner}
              style={styles.primaryButton}
            >
              Image Processing
            </Button>
             <Button
              mode="contained"
              onPress={handleSave}
              style={styles.secondaryButton}
              loading={saving}
            >
              {saving ? "Saving..." : "Save Tree"}
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  scrollContainer: { padding: 20, flexGrow: 1 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#333", textAlign: 'center' },
  imageContainer: {
    height: 200,
    borderRadius: 12,
    marginBottom: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    backgroundColor: "#f9f9f9",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  removeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  imagePlaceholder: { justifyContent: "center", alignItems: "center", gap: 8 },
  imageLabel: { color: "#2ecc71", fontSize: 16, fontWeight: "600" },
  imageHint: { fontSize: 12, color: "#666" },
  row: { flexDirection: "row", gap: 15, marginBottom: 10 },
  halfWidth: { flex: 1 },
  input: { backgroundColor: "#fff" },
  menuInput: { backgroundColor: "#fff" },
  coordinateGroup: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginVertical: 10,
  },
  useLocationText: {
    color: "#2ecc71",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
    textAlign: "right",
  },
  buttonContainer: {
    marginTop: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#2ecc71",
    paddingVertical: 8,
  },
  secondaryButton: {
    backgroundColor: "#34495e",
    paddingVertical: 8,
  },
});