import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Modal, SafeAreaView, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Tflite from 'tflite-react-native';
import { Button } from 'react-native-paper';

// ✅ Correct import for react-native-firebase
import firestore from '@react-native-firebase/firestore';

// TFLite instance
const tflite = new Tflite();

export default function FruitScannerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { treeID } = route.params as { treeID: string };

  const [modalVisible, setModalVisible] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    tflite.loadModel(
      {
        model: 'fruit_model.tflite',
        labels: 'labels.txt',
        numThreads: 1,
      },
      (err, res) => {
        if (err) {
          console.error('TFLite Load Error:', err);
          setError('Failed to load TFLite model.');
        } else {
          console.log('TFLite fruit model loaded:', res);
        }
      }
    );

    return () => {
      tflite.close();
    };
  }, []);

  const runFruitScanner = async (uri: string) => {
    setLoading(true);
    setResult(null);
    setError(null);
    setImageUri(uri);

    try {
      const classificationResult: any[] = await new Promise((resolve, reject) => {
        tflite.runModelOnImage(
          {
            path: uri,
            imageMean: 127.5,
            imageStd: 127.5,
            numResults: 3,
            threshold: 0.1,
          },
          (err, res) => (err ? reject(err) : resolve(res as any[]))
        );
      });

      if (!classificationResult || classificationResult.length === 0) {
        throw new Error('No classification result returned from the model.');
      }

      const topResult = classificationResult.reduce(
        (max, item) => (item.confidence > max.confidence ? item : max),
        classificationResult[0]
      );

      setResult(topResult);

    } catch (e: any) {
      setError(e.message || 'Unexpected error during analysis.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaPick = (useCamera: boolean) => {
    setModalVisible(false);
    const picker = useCamera ? launchCamera : launchImageLibrary;
    picker({ mediaType: 'photo', quality: 1 }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        setError(`Image picker error: ${response.errorMessage}`);
        return;
      }
      const uri = response.assets?.[0]?.uri;
      if (uri) runFruitScanner(uri);
    });
  };

  const handleUpdateStatus = async () => {
    if (!result?.label) {
      Alert.alert('No Result', 'Cannot update status without a prediction.');
      return;
    }
    setIsUpdating(true);
    try {
      // ✅ Correct syntax for react-native-firebase
            const docRef = firestore().collection('trees').doc(treeID);
            await docRef.update({ fruitStatus: result.label });

            Alert.alert('Success', `Fruit status updated to: ${result.label}`, [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
    } catch (error) {
      console.error('Update failed:', error);
      Alert.alert('Error', 'Failed to update fruit status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const renderResult = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2ecc71" />
          <Text style={styles.loadingText}>Analyzing Fruit...</Text>
        </View>
      );
    }
    if (error) return <Text style={styles.errorText}>{error}</Text>;
    if (!result) return <Text style={styles.resultText}>Scan an image to see the result.</Text>;

    return (
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle}>Ripeness Status:</Text>
        <Text style={styles.finalPrediction}>{result.label}</Text>
        <Text style={styles.resultTitle}>Confidence:</Text>
        <Text style={styles.resultValue}>
          {(result.confidence * 100).toFixed(1)} %
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Fruit Ripeness Scanner</Text>
        <Text style={styles.subtitle}>Tree ID: {treeID}</Text>

        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
             <Button
                mode="contained"
                onPress={() => setModalVisible(true)}
                style={styles.primaryButton}
                icon="camera"
              >
                Scan Fruit
              </Button>
          </View>
        )}

        <View style={styles.resultContainer}>{renderResult()}</View>

        {/* ✅ Conditionally render buttons */}
        {!loading && imageUri && (
          <View style={styles.buttonContainer}>
            {result && (
              <Button
                mode="contained"
                onPress={handleUpdateStatus}
                style={styles.primaryButton}
                disabled={isUpdating}
                loading={isUpdating}
              >
                Update Tree Status
              </Button>
            )}

            <Button
              mode="outlined"
              onPress={() => setModalVisible(true)}
              style={styles.button}
              disabled={isUpdating}
            >
              Scan Another
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.goBack()}
              style={styles.button}
            >
              Back
            </Button>
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Image Source</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleMediaPick(true)}
            >
              <Text style={styles.modalButtonText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleMediaPick(false)}
            >
              <Text style={styles.modalButtonText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  image: {
    width: 320,
    height: 320,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
  },
  imagePlaceholder: {
    width: 320,
    height: 320,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#eee'
  },
  centered: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
  errorText: { fontSize: 16, color: 'red', fontWeight: 'bold', textAlign: 'center' },
  resultContainer: {
    alignItems: 'center',
    padding: 20,
    marginVertical: 10,
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    minHeight: 120,
    justifyContent: 'center',
  },
  resultContent: {
    alignItems: 'center',
  },
  resultText: {
    fontSize: 16,
    color: '#555',
  },
  resultTitle: { fontSize: 16, color: '#6c757d', marginTop: 10 },
  finalPrediction: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2ecc71',
    textTransform: 'capitalize',
    marginBottom: 10,
  },
  resultValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
    marginVertical: 3,
  },
  buttonContainer: { width: '100%', marginTop: 20 },
  button: { marginTop: 10, borderRadius: 25 },
  primaryButton: { backgroundColor: '#2ecc71', borderRadius: 25, marginBottom: 10, paddingVertical: 5 },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalButton: { backgroundColor: '#007bff', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginVertical: 5 },
  modalButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  cancelButton: { backgroundColor: '#6c757d' },
});