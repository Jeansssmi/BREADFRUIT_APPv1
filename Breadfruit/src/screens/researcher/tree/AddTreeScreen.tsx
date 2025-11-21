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
import {
  Provider,
  Button,
  Text,
  TextInput,
  Menu,
} from "react-native-paper";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Geolocation from "react-native-geolocation-service";
import { useNavigation, useRoute } from "@react-navigation/native";
import { launchCamera } from "react-native-image-picker";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import barangayData from "@/constants/barangayData";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";   // ⭐ ADDED

const FRUIT_STATUS_OPTIONS = ["none", "unripe", "ripe"];
const CITY_OPTIONS = Object.keys(barangayData);

export default function AddTreeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user: currentUser } = useAuth();
 const { dark } = useTheme();
 const placeholderBg = dark ? "#1a1a1a" : "#f9f9f9";
 const cardColor = dark ? "#111" : "#fff";
 const bgColor = dark ? "#000000" : "#ffffff";
 const textColor = dark ? "#ffffff" : "#000000";
 const subText = dark ? "#aaaaaa" : "#666666";
 const inputBg = dark ? "#111111" : "#ffffff";
 const inputBorder = dark ? "#2ecc71" : "#cccccc";
 const borderColor = dark ? "#333" : "#e0e0e0";
 const placeholder = dark ? "#888888" : "#999999";
 const primary = "#2ecc71";

  const [showCoordinateNotice, setShowCoordinateNotice] = useState(
    !!route.params?.coordinates
  );
  const isFromMap = !!route.params?.coordinates;

  const [image, setImage] = useState(
    route.params?.imageUri || null
  );
  const [diameterInput, setDiameterInput] = useState(
    route.params?.diameter?.toString() || ""
  );

  const coordinates = route.params?.coordinates;

  const [latitudeInput, setLatitudeInput] = useState(
    coordinates?.latitude?.toString() || ""
  );
  const [longitudeInput, setLongitudeInput] = useState(
    coordinates?.longitude?.toString() || ""
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
      const timer = setTimeout(
        () => setShowCoordinateNotice(false),
        4000
      );
      return () => clearTimeout(timer);
    }
  }, [showCoordinateNotice]);

  useEffect(() => {
    if (route.params?.coordinates) {
      setLatitudeInput(route.params.coordinates.latitude.toString());
      setLongitudeInput(route.params.coordinates.longitude.toString());
    }
  }, [route.params?.coordinates]);


  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: dark ? "#000000" : "#ffffff",
      },
      headerTitleStyle: {
        color: dark ? "#ffffff" : "#000000",
        fontWeight: "600",
      },
      headerTintColor: dark ? "#ffffff" : "#000000",
    });
  }, [dark]);



  const handleImageSelection = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert("Permission Required", "Camera access is required.");
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

  const handleImageResponse = (response) => {
    if (response.didCancel) return;
    if (response.errorCode) {
      console.error("ImagePicker Error:", response.errorMessage);
      return;
    }
    if (response.assets?.length > 0) {
      setImage(response.assets[0].uri);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
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
      () => {
        Alert.alert("Error", "Failed to get location.");
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleNavigateToScanner = () => {
    if (!image) {
      Alert.alert("Image Required", "Please select an image first.");
      return;
    }
    navigation.navigate("DiameterScannerScreen", {
      imageUri: image,
    });
  };

  const handleSaveTree = async () => {
    try {
      setSaving(true);

      if (!currentUser) {
        Alert.alert("Authentication Error", "You must be logged in.");
        setSaving(false);
        return;
      }

      const userRole = currentUser.role?.toLowerCase() || "researcher";

      // 🌳 Set tree status
      let treeStatus = userRole === "admin" ? "verified" : "pending";

      // 📸 Upload image (if any)
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

      // 🆔 Generate new Tree ID
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

      // 🌳 Build Tree Object
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
        trackedBy: currentUser.name || currentUser.displayName || "Unknown",
        treeID: newTreeID,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      // 🌳 Store tree
      await treesRef.doc(newTreeID).set(newTree);

      // 📝 Log activity
      await firestore().collection("activityLog").add({
        actionType: "create",
        description: `${currentUser.displayName || "Researcher"} added a new tree (${newTreeID})`,
        uid: currentUser.uid,
        userRole,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });

      // 🔔 Notify admin
      await firestore().collection("notification").add({
        type: "tree-added",
        message: `${currentUser.displayName || "A researcher"} added a new tree in ${barangay ||
          "Unknown Barangay"}, ${city || "Unknown City"}.`,
        lat: parseFloat(latitudeInput) || 0,
        lng: parseFloat(longitudeInput) || 0,
        recipientRole: "Admin",
        reporterName: currentUser.displayName || "Researcher",
        seen: false,
        read: false,
        archived: false,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });

      // Success Alert
      Alert.alert(
        "Success",
        userRole === "researcher"
          ? "Tree submitted successfully, wait for admin approval!"
          : "Tree added successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              const cameFrom = route.params?.from;

              if (cameFrom === "PendingTrees") {
                navigation.replace("PendingTrees", {
                  researcherId: currentUser.uid,
                });
              } else {
                navigation.replace("PendingTrees", {
                  researcherId: currentUser.uid,
                });
              }
            },
          },
        ]
      );

      // Reset form
      setImage(null);
      setDiameterInput("");
      setLatitudeInput("");
      setLongitudeInput("");
      setCity("");
      setBarangay("");
      setFruitStatus("none");
    } catch (error) {
      console.error("Error saving tree:", error);
      Alert.alert("Error", error.message || "Failed to save tree.");
    } finally {
      setSaving(false);
    }
  };


  return (
    <Provider>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <SafeAreaView
          style={[styles.safeArea, { backgroundColor: bgColor }]}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContainer,
              { backgroundColor: bgColor },
            ]}
          >
            {/* 📸 IMAGE BOX */}
            <TouchableOpacity
              style={[
                styles.imageContainer,
                {
                  backgroundColor: placeholderBg,
                  borderColor: primary,
                },
              ]}
              onPress={handleImageSelection}
            >
              {image ? (
                <>
                  <Image source={{ uri: image }} style={styles.image} />
                  <Button
                    mode="contained"
                    onPress={() => setImage(null)}
                    style={styles.removeButton}
                  >
                    Change
                  </Button>
                </>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <MaterialIcons name="add-a-photo" size={40} color={primary} />
                  <Text style={[styles.imageLabel, { color: primary }]}>
                    Capture Picture
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* 🏙 CITY + BARANGAY */}
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
                       mode="outlined"
                       style={[styles.menuInput, {
                         backgroundColor: inputBg,
                         borderColor: inputBorder
                       }]}
                       outlineStyle={{ borderColor: inputBorder }}  // ⭐ important
                       textColor={textColor}
                       theme={{
                         colors: {
                           primary: primary,
                           text: textColor,
                           placeholder: placeholder,
                           outline: inputBorder,
                         }
                       }}
                     />


                    </TouchableOpacity>
                  }
                >
                  <ScrollView style={{ maxHeight: 250 }}>
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
                  </ScrollView>
                </Menu>
              </View>

              <View style={styles.halfWidth}>
                <Menu
                  visible={isBarangayMenuVisible}
                  onDismiss={() => setBarangayMenuVisible(false)}
                  anchor={
                    <TouchableOpacity
                      onPress={toggleBarangayMenu}
                      disabled={!city}
                    >
                      <TextInput
                        label="Barangay"
                        value={barangay}
                        editable={false}
                        right={<TextInput.Icon icon="menu-down" />}
                          mode="outlined"
                           style={[styles.menuInput, {
                             backgroundColor: inputBg,
                             borderColor: inputBorder
                           }]}
                           outlineStyle={{ borderColor: inputBorder }}  // ⭐ important
                           textColor={textColor}
                           theme={{
                             colors: {
                               primary: primary,
                               text: textColor,
                               placeholder: placeholder,
                               outline: inputBorder,
                             }
                           }}
                         />
                    </TouchableOpacity>
                  }
                >
                  <ScrollView style={{ maxHeight: 250 }}>
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
                  </ScrollView>
                </Menu>
              </View>
            </View>

            {/* 🍎 FRUIT STATUS + DIAMETER */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <TextInput
                  label="Diameter (m)"
                  value={diameterInput}
                  onChangeText={setDiameterInput}
                    mode="outlined"
                     style={[styles.menuInput, {
                       backgroundColor: inputBg,
                       borderColor: inputBorder
                     }]}
                     outlineStyle={{ borderColor: inputBorder }}  // ⭐ important
                     textColor={textColor}
                     theme={{
                       colors: {
                         primary: primary,
                         text: textColor,
                         placeholder: placeholder,
                         outline: inputBorder,
                       }
                     }}
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
                          mode="outlined"
                           style={[styles.menuInput, {
                             backgroundColor: inputBg,
                             borderColor: inputBorder
                           }]}
                           outlineStyle={{ borderColor: inputBorder }}  // ⭐ important
                           textColor={textColor}
                           theme={{
                             colors: {
                               primary: primary,
                               text: textColor,
                               placeholder: placeholder,
                               outline: inputBorder,
                             }
                           }}
                         />
                    </TouchableOpacity>
                  }
                >
                  <ScrollView style={{ maxHeight: 200 }}>
                    {FRUIT_STATUS_OPTIONS.map((option) => (
                      <Menu.Item
                        key={option}
                        title={option}
                        onPress={() => {
                          setFruitStatus(option);
                          setStatusMenuVisible(false);
                        }}
                      />
                    ))}
                  </ScrollView>
                </Menu>
              </View>
            </View>

            {/* 📍 COORDINATES */}
            <View
              style={[
                styles.coordinateGroup,
                {
                  backgroundColor: placeholderBg,
                  borderColor: borderColor,
                },
              ]}
            >
             {/* ⭐ Latitude + Longitude Equal Size */}
             <View style={{ flexDirection: "row", marginBottom: 10 }}>

               {/* LATITUDE */}
               <TextInput
                 label="Latitude"
                 value={latitudeInput}
                 editable={false}
                 mode="outlined"
                 style={[
                   styles.menuInput,
                   {
                     backgroundColor: inputBg,
                     borderColor: inputBorder,
                     flex: 1,
                     marginRight: 7.5, // half of 15 gap
                   },
                 ]}
                 outlineStyle={{ borderColor: inputBorder }}
                 textColor={textColor}
                 theme={{
                   colors: {
                     primary: primary,
                     text: textColor,
                     placeholder: placeholder,
                     outline: inputBorder,
                   },
                 }}
               />

               {/* LONGITUDE */}
               <TextInput
                 label="Longitude"
                 value={longitudeInput}
                 editable={false}
                 mode="outlined"
                 style={[
                   styles.menuInput,
                   {
                     backgroundColor: inputBg,
                     borderColor: inputBorder,
                     flex: 1,
                     marginLeft: 7.5, // equal spacing opposite side
                   },
                 ]}
                 outlineStyle={{ borderColor: inputBorder }}
                 textColor={textColor}
                 theme={{
                   colors: {
                     primary: primary,
                     text: textColor,
                     placeholder: placeholder,
                     outline: inputBorder,
                   },
                 }}
               />

             </View>


              {/* Coordinate Notice */}
              {showCoordinateNotice && (
                <Text
                  style={{
                    color: primary,
                    textAlign: "center",
                    marginBottom: 10,
                    fontWeight: "600",
                  }}
                >
                  Coordinates loaded from map.
                </Text>
              )}

              {/* GET LOCATION */}
              <TouchableOpacity onPress={getLocation} disabled={loading}>
                <Text
                  style={[
                    styles.useLocationText,
                    { color: primary },
                  ]}
                >
                  {loading ? "Getting Location..." : "Get Current Location"}
                </Text>
              </TouchableOpacity>
            </View>


            <TextInput
              label="Date Tracked"
              value={new Date().toLocaleDateString()}
              editable={false}
               mode="outlined"
                style={[styles.menuInput, {
                  backgroundColor: inputBg,
                  borderColor: inputBorder
                }]}
                outlineStyle={{ borderColor: inputBorder }}  // ⭐ important
                textColor={textColor}
                theme={{
                  colors: {
                    primary: primary,
                    text: textColor,
                    placeholder: placeholder,
                    outline: inputBorder,
                  }
                }}
              />

            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleNavigateToScanner}
                style={[styles.primaryButton, { backgroundColor: primary }]}
              >
                Scan Diameter
              </Button>

              <Button
                mode="contained"
                onPress={handleSaveTree}
                loading={saving}
                style={[
                  styles.secondaryButton,
                  { backgroundColor: dark ? "#222" : "#333" },
                ]}
              >
                {saving ? "Saving..." : "Save Tree"}
              </Button>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContainer: { padding: 20, flexGrow: 1 },

  imageContainer: {
    height: 200,
    borderRadius: 12,
    marginBottom: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    overflow: "hidden",
  },

  image: { width: "100%", height: "100%" },
  removeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  imagePlaceholder: { justifyContent: "center", alignItems: "center" },
  imageLabel: { fontSize: 16, fontWeight: "600" },

  row: { flexDirection: "row", gap: 15, marginBottom: 10 },
  halfWidth: { flex: 1 },

  input: {},
  menuInput: {},

  coordinateGroup: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 10,
  },

  useLocationText: { fontSize: 14, fontWeight: "600", marginTop: 10, textAlign: "right" },

  buttonContainer: { marginTop: 20 },
  primaryButton: {
    paddingVertical: 8,
    borderRadius: 100,
    marginBottom: 10,
  },
  secondaryButton: {
    paddingVertical: 8,
    borderRadius: 100,
  },
});
