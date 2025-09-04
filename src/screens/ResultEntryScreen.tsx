import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Domain } from './NetPayScreen';

const ResultEntryScreen: React.FC = () => {
  const [time, setTime] = useState<string>('DEAR 6PM');
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [prizes, setPrizes] = useState<string[]>(['', '', '', '', '']);
  const [numbers, setNumbers] = useState<string[]>(Array(30).fill(''));

  const prizeRefs = useRef([]);
  const numberRefs = useRef([]);

  const handleNumberChange = (index: number, value: string) => {
    const updated = [...numbers];
    updated[index] = value;
    setNumbers(updated);
  };

  const handlePrizeChange = (index: number, value: string) => {
    const updated = [...prizes];
    updated[index] = value;
    setPrizes(updated);
  };

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const getShortCode = (t: string) => {
    if (t === 'KERALA 3PM') return 'LSK';
    if (t === 'DEAR 1PM') return 'D-1';
    if (t === 'DEAR 6PM') return 'D-6';
    if (t === 'DEAR 8PM') return 'D-8';
    return 'CODE';
  };

  const handleSave = async () => {
    const formattedDate = date.toISOString().split('T')[0];
    const shortCode = getShortCode(time);

    const prizeEntries = prizes.filter(p => /^\d{3}$/.test(p));
    const resultEntries = numbers
      .map((num, index) => ({
        ticket: (index + 1).toString(),
        result: num.trim(),
      }))
      .filter(entry => /^\d{3}$/.test(entry.result));

    if (resultEntries.length === 0 && prizeEntries.length === 0) {
      Alert.alert('Missing Data', 'Enter at least one result or prize.');
      return;
    }

    const payload = {
      results: {
        [formattedDate]: [
          {
            [time]: {
              prizes: prizeEntries,
              entries: resultEntries,
            },
          },
        ],
      },
    };

    console.log('Sending payload:', JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(`${Domain}/addResult`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Result saved successfully.');
      } else {
        console.error('Server error:', resData);
        Alert.alert('Error', resData.message || 'Failed to save.');
      }
    } catch (err) {
      console.error('Request error:', err);
      Alert.alert('Error', 'Network or server error.');
    }
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Camera access is required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      // handleImageRecognition(result.assets[0].uri)
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Gallery access is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      // handleImageRecognition(result.assets[0].uri)
    }
  };

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      const lines = text.trim().split('\n').map(line => line.trim()).filter(Boolean);

      if (lines.length < 6) {
        Alert.alert('Invalid format', 'Not enough data in clipboard.');
        return;
      }

      let parsedTime = 'DEAR 6PM';
      let parsedDate = new Date();
      let startIndex = 0;

      const matchFormat1 = lines[0].match(/^(DEAR\d)\s+(\d{4}-\d{2}-\d{2})$/i);
      if (matchFormat1) {
        const game = matchFormat1[1].toUpperCase();
        const dateStr = matchFormat1[2];
        parsedTime = game === 'DEAR1' ? 'DEAR 1PM' : game === 'DEAR6' ? 'DEAR 6PM' : game === 'DEAR8' ? 'DEAR 8PM' : game;
        parsedDate = new Date(dateStr);
        startIndex = 1;
      }

      const matchFormat2 = lines[0].match(/^Results\s+(\d{1,2}:\d{2}\s*(?:AM|PM))$/i);
      if (matchFormat2) {
        const timeStr = matchFormat2[1].trim();
        if (timeStr === '1:00 PM') parsedTime = 'DEAR 1PM';
        else if (timeStr === '6:00 PM') parsedTime = 'DEAR 6PM';
        else if (timeStr === '8:00 PM') parsedTime = 'DEAR 8PM';
        startIndex = 1;
      }

      const parsedPrizes = lines
        .slice(startIndex, startIndex + 5)
        .map(line => line.slice(0, 3))
        .filter(n => /^\d{3}$/.test(n));

      const numberLines = lines.slice(startIndex + 5);
      const parsedNumbers = numberLines
        .flatMap(line => line.split(/\s+/))
        .map(n => n.trim())
        .filter(n => /^\d{3}$/.test(n))
        .slice(0, 30);

      const filledNumbers = [...parsedNumbers, ...Array(30 - parsedNumbers.length).fill('')];
      const filledPrizes = [...parsedPrizes, ...Array(5 - parsedPrizes.length).fill('')];

      setTime(parsedTime);
      setDate(parsedDate);
      setPrizes(filledPrizes);
      setNumbers(filledNumbers);

      Alert.alert('Success', 'Results pasted successfully.');
    } catch (error) {
      console.error('Paste error:', error);
      Alert.alert('Error', 'Failed to paste data.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color="black" />
        <Text style={styles.title}>Results</Text>
        <View style={styles.iconRow}>
          <TouchableOpacity onPress={handlePaste} style={styles.iconButton}>
            <Ionicons name="clipboard-outline" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={openCamera} style={styles.iconButton}>
            <Ionicons name="camera-outline" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={openGallery} style={styles.iconButton}>
            <Ionicons name="image-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.row}>
        <Picker style={styles.picker} selectedValue={time} onValueChange={setTime}>
          <Picker.Item label="DEAR 1PM" value="DEAR 1PM" />
          <Picker.Item label="KERALA 3PM" value="KERALA 3PM" />
          <Picker.Item label="DEAR 6PM" value="DEAR 6PM" />
          <Picker.Item label="DEAR 8PM" value="DEAR 8PM" />
        </Picker>
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
          <Text>{date.toLocaleDateString()}</Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {prizes.map((val, idx) => (
        <View
          key={idx}
          style={[styles.prizeRow, { backgroundColor: idx % 2 === 0 ? '#C2F0E1' : '#B6D8F2' }]}
        >
          <Text style={styles.prizeLabel}>{idx + 1} :</Text>
          <TextInput
            ref={(ref) => (prizeRefs.current[idx] = ref)}
            style={styles.prizeInput}
            value={val}
            onChangeText={(text) => {
              handlePrizeChange(idx, text);
              if (text.length === 3 && idx < prizes.length - 1) {
                prizeRefs.current[idx + 1]?.focus();
              }
            }}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && val.length === 0 && idx > 0) {
                prizeRefs.current[idx - 1]?.focus();
              }
            }}
            keyboardType="number-pad"
            maxLength={3}
          />
        </View>
      ))}

      <View style={styles.gridContainer}>
        {numbers.map((num, idx) => (
          <TextInput
            key={idx}
            ref={(ref) => (numberRefs.current[idx] = ref)}
            style={[styles.gridItem, { backgroundColor: idx % 2 === 0 ? '#C2F0E1' : '#B6D8F2' }]}
            value={num}
            onChangeText={(text) => {
              handleNumberChange(idx, text);
              if (text.length === 3 && idx < numbers.length - 1) {
                numberRefs.current[idx + 1]?.focus();
              }
            }}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && num.length === 0 && idx > 0) {
                numberRefs.current[idx - 1]?.focus();
              }
            }}
            keyboardType="number-pad"
            maxLength={3}
            returnKeyType="next"
          />
        ))}
      </View>

      <Text style={styles.codeDisplay}>
        Code: {getShortCode(time)}
      </Text>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Result</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ResultEntryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 30,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconRow: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  picker: {
    flex: 1,
    backgroundColor: '#f1f1f1',
  },
  dateInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#f1f1f1',
    justifyContent: 'center',
    borderRadius: 4,
  },
  prizeRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 2,
    alignItems: 'center',
  },
  prizeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 30,
  },
  prizeInput: {
    borderBottomWidth: 1,
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  gridItem: {
    width: '30%',
    margin: '1.5%',
    textAlign: 'center',
    paddingVertical: 10,
    fontSize: 16,
    borderRadius: 5,
  },
  saveButton: {
    backgroundColor: '#f36',
    padding: 14,
    marginTop: 20,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  codeDisplay: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
});
