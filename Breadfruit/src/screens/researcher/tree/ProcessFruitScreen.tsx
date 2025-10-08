import { useTreeData } from '@/hooks/useTreeData';
import { useRoute } from '@react-navigation/native';
import { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Button, Text, TextInput } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function ProcessTreeFruit() {
  const route = useRoute();
  const { treeID } = route.params;

  // Fetch the specific tree's data
  const { trees, isLoading } = useTreeData({ mode: 'single', treeID: treeID.toString() });
  const tree = trees[0];

  const [image, setImage] = useState('');

  const pickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });
      if (result.didCancel || !result.assets) return;
      setImage(result.assets[0].uri || '');
    } catch (error) {
      console.log('Image picker error:', error);
      alert('Failed to pick image.');
    }
  };

  const handleSubmit = () => {
    if (!image) {
      alert('Please choose an image to process.');
      return;
    }
    console.log('Processing fruit image for tree:', treeID);
    // Add your image processing and update logic here
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2ecc71" /></View>;
  }

  if (!tree) {
    return <View style={styles.center}><Text>Tree not found.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialIcons name="add-a-photo" size={40} color="#2ecc71" />
            <Text style={styles.imageLabel}>Choose an Image</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput
        label="Breadfruit ID"
        value={tree.treeID}
        style={styles.input}
        editable={false}
      />
      <TextInput
        label="Location"
        value={tree.city}
        style={styles.input}
        editable={false}
      />
      <TextInput
        label="Diameter"
        value={`${tree.diameter.toFixed(2)}m`}
        style={styles.input}
        editable={false}
      />
      <TextInput
        label="Fruit Status"
        value={tree.fruitStatus}
        style={styles.input}
        editable={false}
      />

      <View style={styles.buttonGroup}>
        <Button 
          mode="contained" 
          onPress={handleSubmit}
          style={styles.secondaryButton}
          icon="image-auto-adjust"
        >
          Process Fruit Image
        </Button>
        <Button 
          mode="contained" 
          onPress={() => console.log('Send result logic here')}
          style={styles.primaryButton}
          icon="content-save"
        >
          Send Result
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  input: {
    backgroundColor: '#f8f8f8',
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  buttonGroup: {
    gap: 12,
    marginTop: 25,
  },
  primaryButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 25,
    //paddingVertical: 4,
  },
  secondaryButton: {
    backgroundColor: '#333',
    borderRadius: 25,
    //paddingVertical: 4,
  },
  buttonLabel: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  imageContainer: {
    height: 200,
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#eee',
    backgroundColor: '#f8f8f8',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    borderStyle: 'dashed',
    borderColor: '#2ecc71',
  },
  imageLabel: {
    color: '#2ecc71',
    fontSize: 16,
    fontWeight: '500',
  },
  roleButton: {
    width: '100%',
    borderColor: '#2ecc71',
    marginBottom: 16,
  },
});