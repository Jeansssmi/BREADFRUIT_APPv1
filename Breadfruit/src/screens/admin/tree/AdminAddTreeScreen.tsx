
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
import { Provider, Button, Text, TextInput, Menu } from "react-native-paper";

import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Geolocation from "react-native-geolocation-service";
import { useNavigation, useRoute } from "@react-navigation/native";
import { launchCamera } from "react-native-image-picker";
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
   const [showCoordinateNotice, setShowCoordinateNotice] = useState(!!route.params?.coordinates);
    const isFromMap = !!route.params?.coordinates;


  const [image, setImage] = useState<string | null>(route.params?.imageUri || null);
  const [diameterInput, setDiameterInput] = useState(route.params?.diameter?.toString() || "");

   const coordinates = route.params?.coordinates; // read coordinates passed from MapScreen

    const [latitudeInput, setLatitudeInput] = useState<string>(
      coordinates?.latitude ? coordinates.latitude.toString() : ""
    );
    const [longitudeInput, setLongitudeInput] = useState<string>(
      coordinates?.longitude ? coordinates.longitude.toString() : ""
    );

  const [city, setCity] = useState("");
  const [barangay, setBarangay] = useState("");
  const [fruitStatus, setFruitStatus] = useState("none");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

 const [isCityMenuVisible, setCityMenuVisible] = useState(false);
   const [isBarangayMenuVisible, setBarangayMenuVisible] = useState(false);
   const [isStatusMenuVisible, setStatusMenuVisible] = useState(false);

   const toggleCityMenu = () => {
       setCityMenuVisible((prev) => !prev);
       setBarangayMenuVisible(false);
       setStatusMenuVisible(false);
     };

     const toggleBarangayMenu = () => {
       setBarangayMenuVisible((prev) => !prev);
       setCityMenuVisible(false);
       setStatusMenuVisible(false);
     };

     const toggleStatusMenu = () => {
       setStatusMenuVisible((prev) => !prev);
       setCityMenuVisible(false);
       setBarangayMenuVisible(false);
     };


     const BARANGAY_OPTIONS = barangayData[city] || [];

  useEffect(() => {
    if (route.params?.diameter) {
      setDiameterInput(route.params.diameter.toString());
    }
  }, [route.params?.diameter]);

   useEffect(() => {
      if (showCoordinateNotice) {
        const timer = setTimeout(() => setShowCoordinateNotice(false), 4000); // hide after 4 seconds
        return () => clearTimeout(timer);
      }
    }, [showCoordinateNotice]);

    useEffect(() => {
      if (route.params?.coordinates) {
        const { latitude, longitude } = route.params.coordinates;
        setLatitudeInput(latitude.toString());
        setLongitudeInput(longitude.toString());
      }
    }, [route.params?.coordinates]);



  const handleNavigateToScanner = () => { if (!image) { Alert.alert("Image Required", "Please select an image first."); return; } navigation.navigate("DiameterScannerScreen", { imageUri: image }); };

  // 📸 Select Image
  // 📸 Capture Image Only (no gallery)
  const handleImageSelection = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert("Permission Required", "Camera access is required to capture a photo.");
        return;
      }

      launchCamera(
        { mediaType: "photo", quality: 0.9 },
        handleImageResponse
      );
    } catch (err) {
      console.log("Camera error:", err);
    }
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
    let treeStatus = "verified";

    if (fruitStatus === "ripe") treeStatus = "harvest-ready";
    else if (fruitStatus === "unripe") treeStatus = "not-ready";
    else treeStatus = "verified";

    if (userRole === "researcher") treeStatus = "pending";

    // 📸 Upload image if available
    let imageUrl = "";
    if (image) {
      const fileName = `images/trees/${currentUser.uid}_${Date.now()}.jpg`;
      const reference = storage().ref(fileName);
      const filePath = image.startsWith("file://")
        ? image.replace("file://", "")
        : image;
      await reference.putFile(filePath);
      imageUrl = await reference.getDownloadURL();
    }

    // 🕒 Generate unique ID
    const year = new Date().getFullYear();
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
      if (!isNaN(lastNum)) newNumber = lastNum + 1;
    }

    const newTreeID = `BFT-${year}-${String(newNumber).padStart(6, "0")}`;
    const formattedDate = new Date().toISOString().split("T")[0];

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

    // ✅ Record to activity log for dashboard
    await firestore().collection("activityLog").add({
      type: "create",
      description: `New tree ${newTreeID} added by Admin.`,
      timestamp: firestore.FieldValue.serverTimestamp(),
    });

    // 🧹 Reset inputs
    setImage(null);
    setDiameterInput("");
    setLatitudeInput("");
    setLongitudeInput("");
    setCity("");
    setBarangay("");
    setFruitStatus("none");

   Alert.alert(
     "Success",
     "Tree added successfully!",
     [
       {
         text: "OK",
         onPress: () => {
           navigation.replace("Map", {
             focusTree: {
               treeID: newTreeID,
               latitude: parseFloat(latitudeInput),
               longitude: parseFloat(longitudeInput),
               zoomIn: true,
             },
           });
         },
       },
     ]
   );


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
                <Text style={styles.imageLabel}>Capture  Picture</Text>
              </View>
            )}
          </TouchableOpacity>


         <View style={styles.row}>
           <View style={styles.halfWidth}>
             <Menu
               visible={isCityMenuVisible}
               onDismiss={() => setCityMenuVisible(false)}
               anchor={
                 <TouchableOpacity onPress={toggleCityMenu}>
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
                     setCityMenuVisible(false);
                   }}
                   title={option}
                 />
               ))}
             </Menu>
           </View>

           <View style={styles.halfWidth}>
             <Menu
               visible={isBarangayMenuVisible}
               onDismiss={() => setBarangayMenuVisible(false)}
               anchor={
                 <TouchableOpacity onPress={toggleBarangayMenu} disabled={!city}>
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
                     setBarangayMenuVisible(false);
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
               visible={isStatusMenuVisible}
               onDismiss={() => setStatusMenuVisible(false)}
               anchor={
                 <TouchableOpacity onPress={toggleStatusMenu}>
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
                     setStatusMenuVisible(false);
                   }}
                   title={option.charAt(0).toUpperCase() + option.slice(1)}
                 />
               ))}
             </Menu>
           </View>
         </View>


           {/* 📍 Location */}
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

                        {/* ✅ Add this small confirmation text here */}
                        {showCoordinateNotice && (
                          <Text style={{ color: "#2ecc71", textAlign: "center", marginBottom: 10, fontWeight: "600" }}>
                            Coordinates loaded from map.
                          </Text>
                        )}


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
