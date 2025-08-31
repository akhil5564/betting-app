import React, { useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  Add: { pastedText?: string; selectedTime?: string };
  Paste: { selectedTime?: string };
};

const PasteScreen: React.FC = () => {
  const [text, setText] = useState('');
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Paste'>>();

  const handlePaste = async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      if (clipboardContent) {
        // Clean content: remove names, phone numbers, and unrelated lines
        const cleaned = clipboardContent
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => {
            if (!line) return false;
            if (/^[a-zA-Z\s]+$/.test(line)) return false; // only letters = name
            if (/\b\d{10,}\b/.test(line)) return false; // 10+ digit = mobile
            const lower = line.toLowerCase();
            if (
              lower.includes('submitted') ||
              lower.includes('agent') ||
              lower.includes('name') ||
              lower.includes('mobile') ||
              lower.includes('thanks')
            ) return false;
            return true;
          })
          .join('\n');

        setText(cleaned.trim());
        Alert.alert('Paste', 'Only valid betting content pasted.');
      } else {
        Alert.alert('Paste', 'Clipboard is empty.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to access clipboard.');
    }
  };

  const handleSubmit = () => {
    if (!text.trim()) {
      Alert.alert('Empty Input', 'Please paste or scan something first.');
      return;
    }

    navigation.navigate('Add', { pastedText: text, selectedTime: route.params?.selectedTime });
    setText('');
  };

  const handleCancel = () => {
    setText('');
    navigation.navigate('Add', { selectedTime: route.params?.selectedTime }); // Navigate to Add screen on cancel
  };

  const handleCameraScan = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera permission is needed to scan.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 1 });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      await uploadToOcrSpace(uri);
    }
  };

  const uploadToOcrSpace = async (imageUri: string) => {
    try {
      const formData = new FormData();
      formData.append('apikey', 'helloworld'); // Replace with actual key
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');

      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      // @ts-ignore
      formData.append('file', {
        uri: imageUri,
        name: filename,
        type,
      });

      const res = await axios.post('https://api.ocr.space/parse/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const parsedText = res.data?.ParsedResults?.[0]?.ParsedText || '';
      if (parsedText) {
        setText(parsedText);
        Alert.alert('OCR Success', 'Text extracted from image.');
      } else {
        Alert.alert('OCR Failed', 'No text recognized.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'OCR request failed.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        style={styles.textArea}
        placeholder="Paste your result here..."
        value={text}
        onChangeText={setText}
        multiline
      />

      <TouchableOpacity style={styles.pasteButton} onPress={handlePaste}>
        <Text style={styles.buttonText}>Paste</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cameraButton} onPress={handleCameraScan}>
        <Text style={styles.buttonText}>Scan</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default PasteScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 30,
  },
  textArea: {
    height: 300,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  pasteButton: {
    backgroundColor: '#00897B',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  cameraButton: {
    backgroundColor: '#9C27B0',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#1976D2',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#BDBDBD',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});
