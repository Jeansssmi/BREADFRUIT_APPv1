
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, TextInput, Menu } from "react-native-paper";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Geolocation from "react-native-geolocation-service";
import { useNavigation, useRoute } from "@react-navigation/native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import barangayData from "@/constants/barangayData";
import { useAuth } from "@/context/AuthContext";

const FRUIT_STATUS_OPTIONS = ["none", "unripe", "ripe"];
const CITY_OPTIONS = Object.keys(barangayData);

export default function AddTreeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user: currentUser } = useAuth();

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

  const handleNavigateToScanner = () => { if (!image) { Alert.alert("Image Required", "Please select an image first."); return; } navigation.navigate("DiameterScannerScreen", { imageUri: image }); };

  // 📸 Select Image
  const handleImageSelection = () => {
    const options = { mediaType: "photo" as const, quality: 0.8 };
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

  // 📍 Location Permission
  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
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

const handleSaveTree = async () => {
  try {
    setSaving(true);
    if (!currentUser) {
      Alert.alert("Authentication Error", "You must be logged in.");
      setSaving(false);
      return;
    }

    const userRole = currentUser.role || "verifier";
    let treeStatus = "";

    // 🌳 Auto set tree status based on fruitStatus
    if (fruitStatus === "ripe") {
      treeStatus = "harvest-ready";
    } else if (fruitStatus === "unripe") {
      treeStatus = "not-ready";
    } else if (fruitStatus === "none") {
      treeStatus = "verified";
    }

    // 🔄 Researchers still go to pending if required by your approval logic
    if (userRole === "researcher") {
      // researcher trees start as pending no matter what fruit status is
      treeStatus = "pending";
    }

    // 📸 Upload image if available
    let imageUrl = "";
    if (image) {
      const fileName = `images/trees/${currentUser.uid}_${Date.now()}.jpg`;
      const reference = storage().ref(fileName);
      const filePath = image.startsWith("file://") ? image.replace("file://", "") : image;
      await reference.putFile(filePath);
      imageUrl = await reference.getDownloadURL();
    }

    // 🕒 Current year
    const year = new Date().getFullYear();

    // 🔢 Get latest tree for the same year
    const treesRef = firestore().collection("trees");
    const lastDoc = await treesRef
      .where("treeID", ">=", `BFT-${year}-000000`)
      .where("treeID", "<=", `BFT-${year}-999999`)
      .orderBy("treeID", "desc")
      .limit(1)
      .get();

    let newNumber = 1;
    if (!lastDoc.empty) {
      const lastTreeID = lastDoc.docs[0].data().treeID;
      const lastNum = parseInt(lastTreeID.split("-")[2], 10);
      if (!isNaN(lastNum)) {
        newNumber = lastNum + 1;
      }
    }

    const newTreeID = `BFT-${year}-${String(newNumber).padStart(6, "0")}`;
    const formattedDate = new Date().toISOString().split("T")[0];

    // 🌳 Create the tree data
    const newTree = {
      barangay: barangay.trim().toLowerCase(),
      city: city.trim().toLowerCase(),
      coordinates: {
        latitude: parseFloat(latitudeInput) || 0,
        longitude: parseFloat(longitudeInput) || 0,
      },
      dateTracked: formattedDate,
      diameter: parseFloat(diameterInput) || 0,
      fruitStatus,
      image: imageUrl,
      status: treeStatus,
      trackedById: currentUser.uid,
      treeID: newTreeID,
    };

    await treesRef.doc(newTreeID).set(newTree);

    Alert.alert("Success", "Tree added successfully!");

    // 🧹 Reset fields
    setImage(null);
    setDiameterInput("");
    setLatitudeInput("");
    setLongitudeInput("");
    setCity("");
    setBarangay("");
    setFruitStatus("none");

    // 🔁 Navigation logic
    if (userRole !== "researcher") {
      navigation.navigate("Map", {
        lat: parseFloat(latitudeInput),
        lng: parseFloat(longitudeInput),
        treeID: newTreeID,
      });
    } else {
      navigation.navigate("PendingTrees");
    }

  } catch (error) {
    console.error("Error saving tree:", error);
    Alert.alert("Error", error.message);
  } finally {
    setSaving(false);
  }
};


  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.imageContainer} onPress={handleImageSelection}>
            {image ? (
              <>
                <Image source={{ uri: image }} style={styles.image} />
                <Button mode="contained" onPress={() => setImage(null)} style={styles.removeButton}>
                  Change
                </Button>
              </>
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialIcons name="add-a-photo" size={40} color="#2ecc71" />
                <Text style={styles.imageLabel}>Capture or Upload Picture</Text>
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
                    onPress={() => {
                      setCity(option);
                      setBarangay("");
                      setCityOptionsMenuVisible(false);
                    }}
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
                    onPress={() => {
                      setBarangay(option);
                      setBarangayOptionsMenuVisible(false);
                    }}
                    title={option}
                  />
                ))}
              </Menu>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <TextInput
                label="Diameter (m)"
                value={diameterInput}
                onChangeText={setDiameterInput}
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
                    onPress={() => {
                      setFruitStatus(option);
                      setShowStatusMenu(false);
                    }}
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
          <Button mode="contained" onPress={handleNavigateToScanner} style={styles.primaryButton} > Scan Diameter </Button>
            <Button mode="contained" onPress={handleSaveTree} loading={saving} style={styles.secondaryButton}>
              {saving ? "Saving..." : "Add Tree"}
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
  removeButton: { position: "absolute", top: 10, right: 10, backgroundColor: "rgba(0,0,0,0.5)" },
  imagePlaceholder: { justifyContent: "center", alignItems: "center" },
  imageLabel: { color: "#2ecc71", fontSize: 16, fontWeight: "600" },
  row: { flexDirection: "row", gap: 15, marginBottom: 10 },
  halfWidth: { flex: 1 },
  input: { backgroundColor: "#fff" },
  menuInput: { backgroundColor: "#fff" },
  coordinateGroup: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginVertical: 10,
  },
  useLocationText: {
    color: "#2ecc71",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
    textAlign: "right",
  },
  buttonContainer: { marginTop: 20 },
  primaryButton: { backgroundColor: "#2ecc71", paddingVertical: 8, borderRadius: 100, marginBottom:10 },
  secondaryButton: { backgroundColor: "#333", paddingVertical: 8, borderRadius: 100 },
});
