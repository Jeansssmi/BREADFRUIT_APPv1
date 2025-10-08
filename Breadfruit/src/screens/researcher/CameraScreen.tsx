import { useNavigation } from '@react-navigation/native';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import ImageResizer from 'react-native-image-resizer';
import { launchImageLibrary } from 'react-native-image-picker';
import { Button, Image, Text } from 'react-native-paper';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

export default function CameraScreen() {
  const navigation = useNavigation();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const camera = useRef<Camera>(null);
  const [uri, setUri] = useState<string | null>(null);

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to use the camera</Text>
        <Button mode="contained" onPress={requestPermission}>Grant permission</Button>
      </View>
    );
  }

  const handleAddTree = async () => {
    if (!uri) return;
    // Navigate to the AddTree form within the Trees stack, passing the image URI
    navigation.navigate('Trees', { 
      screen: 'AddTree', 
      params: { imageUri: uri } 
    });
  };

  const pickImage = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 1 });
      if (result.didCancel || !result.assets || result.assets.length === 0) return;
      setUri(result.assets[0].uri);
    } catch (error) {
      console.log('Error picking image:', error);
    }
  };

  const takePicture = async () => {
    if (camera.current == null) return;
    try {
      const photo = await camera.current.takePhoto();
      const resizedImage = await ImageResizer.createResizedImage(
        `file://${photo.path}`, 800, 600, 'JPEG', 80,
      );
      setUri(resizedImage.uri);
    } catch (error) {
      console.log('Error taking picture:', error);
    }
  };

  const renderCamera = () => {
    if (device == null) return <View style={styles.permissionContainer}><Text>No camera device found.</Text></View>;
    return (
      <View style={styles.cameraContainer}>
        <Camera ref={camera} style={StyleSheet.absoluteFill} device={device} isActive={true} photo={true} />
        <View style={styles.controlsContainer}>
          <Pressable onPress={pickImage} style={styles.iconButton}>
            <MaterialIcons name="photo-library" size={32} color="#2ecc71" />
          </Pressable>
          <Pressable onPress={takePicture}>
            {({ pressed }) => (
              <View style={[styles.shutterBtn, { opacity: pressed ? 0.5 : 1 }]}>
                <View style={styles.shutterBtnInner} />
              </View>
            )}
          </Pressable>
          <Pressable style={styles.iconButton}>
            <FontAwesome6 name="rotate-left" size={32} color="#2ecc71" />
          </Pressable>
        </View>
      </View>
    );
  };

  const renderPicture = () => {
    return (
      <View style={styles.pictureContainer}>
        <Image source={{ uri: uri ?? '' }} style={styles.imagePreview} />
        <View style={styles.optionsContainer}>
          <Button mode="contained" onPress={handleAddTree} style={styles.actionButton}>Add Tree</Button>
          <Button mode="contained" onPress={() => setUri(null)} style={styles.retakeButton}>Take Another</Button>
        </View>
      </View>
    );
  };

  return <View style={styles.container}>{uri ? renderPicture() : renderCamera()}</View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' }, 
  cameraContainer: { flex: 1, position: 'relative', backgroundColor: '#000' },
  controlsContainer: { position: 'absolute', bottom: 55, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 20 }, 
  shutterBtn: { borderWidth: 5, borderColor: "#2ecc71", width: 85, height: 85, borderRadius: 45, alignItems: "center", justifyContent: "center" }, 
  shutterBtnInner: { width: 70, height: 70, borderRadius: 50, backgroundColor: '#2ecc71' }, 
  iconButton: { padding: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24 },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#ffffff' }, 
  permissionText: { textAlign: 'center', marginBottom: 20, fontSize: 16, color: '#333' }, 
  pictureContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 20 }, 
  imagePreview: { width: '100%', flex: 1, borderRadius: 10, marginBottom: 30 }, 
  optionsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 20 }, 
  actionButton: { flex: 1, marginHorizontal: 5, backgroundColor: '#2ecc71' },
  retakeButton: { flex: 1, marginHorizontal: 5, backgroundColor: '#333' },
});