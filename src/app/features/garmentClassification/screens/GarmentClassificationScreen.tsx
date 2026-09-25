import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type ClassificationResult = {
  category: string;
  type: string;
  garment: string;
  confidence: number;
};

export default function GarmentClassificationScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);

  const takePhoto = async () => {
    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const photo = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!photo.canceled) {
      setImageUri(photo.assets[0].uri);
      setResult(null);
    }
  };

  const pickImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setResult(null);
    }
  };

  const analyzeGarment = async () => {
    if (!imageUri) {
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    // Temporary mock result.
    // This will be replaced with the backend API call.
    setTimeout(() => {
      setResult({
        category: 'CLOTHING',
        type: 'TOP',
        garment: 'T-shirt',
        confidence: 0.94,
      });

      setIsAnalyzing(false);
    }, 1500);
  };

 return (
  <ScrollView
    style={styles.container}
    contentContainerStyle={styles.contentContainer}
  >
      <Text style={styles.title}>Garment Classification</Text>

      <Text style={styles.subtitle}>
        Take a photo or choose a garment from your gallery.
      </Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={takePhoto}
        >
          <Text style={styles.secondaryButtonText}>
            Take Photo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={pickImage}
        >
          <Text style={styles.secondaryButtonText}>
            Gallery
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.placeholderText}>
            Your garment photo will appear here
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.analyzeButton,
          !imageUri && styles.disabledButton,
        ]}
        onPress={analyzeGarment}
        disabled={!imageUri || isAnalyzing}
      >
        <Text style={styles.analyzeButtonText}>
          {isAnalyzing ? 'Analyzing...' : 'Analyze Garment'}
        </Text>
      </TouchableOpacity>

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Result</Text>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Category</Text>
            <Text style={styles.resultValue}>
              {result.category}
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Type</Text>
            <Text style={styles.resultValue}>
              {result.type}
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Garment</Text>
            <Text style={styles.resultValue}>
              {result.garment}
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Confidence</Text>
            <Text style={styles.resultValue}>
              {Math.round(result.confidence * 100)}%
            </Text>
          </View>
        </View>
      )}
    

   </ScrollView>
);
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#FFFFFF',
  },

  contentContainer: {
  paddingBottom: 40,
},

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 40,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },

  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  imageContainer: {
    width: '100%',
    height: 360,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  placeholderText: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  analyzeButton: {
    marginTop: 20,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  disabledButton: {
    backgroundColor: '#CCCCCC',
  },

  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  resultContainer: {
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },

  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },

  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  resultLabel: {
    fontSize: 15,
    color: '#666666',
  },

  resultValue: {
    fontSize: 15,
    fontWeight: '600',
  },
});