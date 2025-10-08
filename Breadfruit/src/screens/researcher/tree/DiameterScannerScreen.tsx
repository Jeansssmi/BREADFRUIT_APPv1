import React, { useEffect, useState, useRef } from 'react';
import {
  BackHandler,
  ActivityIndicator,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Tflite from 'tflite-react-native';

// Use two separate Tflite instances
const classifier = new Tflite();
const diameterModel = new Tflite();

export default function DiameterScannerScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const [imageUri, setImageUri] = useState<string | null>(route.params?.imageUri || null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (imageUri) {
      runAnalysis(imageUri);
    }
    return () => {
      classifier.close();
      diameterModel.close();
    };
  }, []);

  useEffect(() => {
    const handleBackPress = () => {
      navigation.goBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [navigation]);

  const runAnalysis = async (uri: string) => {
    setLoading(true);
    setResult(null);
    setError(null);
    setImageUri(uri);

    try {
      // Step 1: Load the classifier
      await new Promise<void>((resolve, reject) => {
        classifier.loadModel({ model: 'classifier_model.tflite', labels: 'treelabels.txt' }, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      // Run the classifier with the CORRECT parameters
      const classificationResult: any[] = await new Promise((resolve, reject) => {
        classifier.runModelOnImage(
          {
            path: uri,
            numResults: 2, // Ask for top 2 results
            threshold: 0.0,
            imageMean: 0.0, // CRITICAL: Match the working code's pre-processing
            imageStd: 1.0,  // CRITICAL: Match the working code's pre-processing
          },
          (err, res) => (err ? reject(err) : resolve(res as any[]))
        );
      });

      console.log('Classifier Raw Result:', JSON.stringify(classificationResult, null, 2));

      if (!classificationResult || classificationResult.length === 0) {
        throw new Error('Classifier returned no results.');
      }

      // Manually find the top result for robustness, just like the working code
      const topResult = classificationResult.reduce((max, item) =>
        item.confidence > max.confidence ? item : max
      );

      const accuracy = topResult.confidence || 0;
      const isBreadfruit = topResult.label.toLowerCase().trim() === 'breadfruit';

      console.log(`Top result is '${topResult.label}' with accuracy ${accuracy}. Is breadfruit: ${isBreadfruit}`);

      if (!isBreadfruit) {
        setResult({ predictedLabel: 'not a breadfruit' });
        setLoading(false);
        return;
      }

      // Step 2: Load and run the diameter model
      await new Promise<void>((resolve, reject) => {
        diameterModel.loadModel({ model: 'diameter_breadfruit_model.tflite' }, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      const diameterResult: any[] = await new Promise((resolve, reject) => {
        diameterModel.runModelOnImage({ path: uri, numResults: 2 }, (err, res) =>
          err ? reject(err) : resolve(res as any[])
        );
      });

      console.log('Diameter Result:', JSON.stringify(diameterResult, null, 2));

      const diameterInCm = parseFloat(diameterResult[0]?.confidence?.toFixed(4));
      if (isNaN(diameterInCm)) throw new Error('Invalid diameter value from model.');

      const finalDiameterInM = (diameterInCm * 0.70);

      setResult({
        predictedLabel: 'breadfruit',
        diameter: finalDiameterInM,
        accuracy: accuracy,
      });

    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };



  const handleDone = () => {
    if (result?.diameter) {
      // @ts-ignore
      navigation.navigate('AddTree', { diameter: result.diameter });
    } else {
      navigation.goBack();
    }
  };

  const renderResult = () => {
    if (loading) return <ActivityIndicator size="large" color="#2ecc71" />;
    if (error) return <Text style={styles.errorText}>{error}</Text>;
    if (!result) return null;

    if (result.predictedLabel !== 'breadfruit') {
      return <Text style={styles.resultText}>Not a breadfruit tree.</Text>;
    }

    return (
      <>
        <Text style={styles.resultTitle}>Accuracy:</Text>
        <Text style={styles.resultValue}>{`${(result.accuracy * 100).toFixed(2)}%`}</Text>

        <Text style={styles.resultTitle}>Estimated Diameter:</Text>
        <Text style={styles.resultValue}>{`${result.diameter.toFixed(4)} m`}</Text>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Image Processing</Text>

        {imageUri && <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />}

        <View style={styles.resultContainer}>{renderResult()}</View>

        {!loading && (
          <View style={styles.buttonContainer}>

            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleDone}>
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

     <Modal
       visible={modalVisible}
       transparent
       animationType="slide"
       onRequestClose={() => setModalVisible(false)} // for Android back button
     >
       <TouchableOpacity
         style={styles.modalContainer}
         activeOpacity={1}
         onPressOut={() => setModalVisible(false)} // close when tapping outside
       >

       </TouchableOpacity>
     </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  image: { width: 320, height: 320, borderRadius: 12, marginBottom: 20, backgroundColor: '#f0f0f0' },
  errorText: { fontSize: 16, color: 'red', fontWeight: 'bold', textAlign: 'center' },
  resultContainer: {
    alignItems: 'center',
    padding: 20,
    marginVertical: 10,
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    minHeight: 100,
    justifyContent: 'center',
  },
  resultTitle: { fontSize: 16, color: '#6c757d', marginTop: 10 },
  resultValue: { fontSize: 22, fontWeight: 'bold', color: '#007bff', marginBottom: 5 },
  resultText: { fontSize: 16, textAlign: 'center', color: '#333' },
  buttonContainer: { width: '100%', marginTop: 'auto', paddingTop: 20 },
  button: {
    backgroundColor: '#6c757d',
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButton: { backgroundColor: '#2ecc71' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 5,
  },
  modalButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  cancelButton: { backgroundColor: '#6c757d' },
});