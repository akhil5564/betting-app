import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const PasteScreen: React.FC = () => {
  const [text, setText] = useState('');
  const navigation = useNavigation();

  const handlePaste = async () => {
    const clipboardText = await Clipboard.getStringAsync();
    setText(clipboardText);
  };

  const handleSubmit = () => {
    if (!text.trim()) {
      Alert.alert('Empty Input', 'Please paste or scan something first.');
      return;
    }

    navigation.navigate('Add', { pastedText: text }); // Send to AddScreen
    setText('');
  };

  const handleCancel = () => {
    setText('');
  };

  const handleScan = () => {
    const matches = text.match(/\b\d{3}\b/g);
    const result = matches || [];
    Alert.alert('Scan Complete', `Found ${result.length} numbers:\n\n${result.join(', ')}`);
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
      formData.append('apikey', 'helloworld'); // Replace with your own key
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
  scanButton: {
    backgroundColor: '#FF9800',
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
