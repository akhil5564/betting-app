import { Alert, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export const getShortCode = (t: string) => {
  if (t === 'KERALA 3 PM') return 'LSK';
  if (t === 'DEAR 1 PM') return 'D-1';
  if (t === 'DEAR 6 PM') return 'D-6';
  if (t === 'DEAR 8 PM') return 'D-8';
  return 'CODE';
};

export const handleNumberChange = (numbers: string[], setNumbers: (n: string[]) => void, index: number, value: string) => {
  const updated = [...numbers];
  updated[index] = value;
  setNumbers(updated);
};

export const handlePrizeChange = (prizes: string[], setPrizes: (p: string[]) => void, index: number, value: string) => {
  const updated = [...prizes];
  updated[index] = value;
  setPrizes(updated);
};

export const handleDateChange = (setShowDatePicker: (b: boolean) => void, setDate: (d: Date) => void) => (_event: DateTimePickerEvent, selectedDate?: Date) => {
  setShowDatePicker(false);
  if (selectedDate) setDate(selectedDate);
};

export const handleSave = async (date: Date, time: string, prizes: string[], numbers: string[]) => {
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

  try {
    const payload = {
      results: {
        [formattedDate]: [
          {
            [time]: {
              prizes: prizeEntries,
              entries: resultEntries
            }
          }
        ]
      }
    };

    console.log('📤 Sending REPLACEMENT payload:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://www.muralibajaj.site/addResult', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const resData = await response.json();

    if (response.ok) {
      Alert.alert('Success', 'Result replaced successfully.');
    } else {
      console.error('❌ Server error:', resData);
      Alert.alert('Error', resData.message || 'Failed to save.');
    }
  } catch (err) {
    console.error('⚠️ Request error:', err);
    Alert.alert('Error', 'Network or server error.');
  }
};

export const openCamera = async () => {
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

export const openGallery = async () => {
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

export const handlePaste = async (
  setTime: (t: string) => void,
  setDate: (d: Date) => void,
  setPrizes: (p: string[]) => void,
  setNumbers: (n: string[]) => void
) => {
  try {
    const text = await Clipboard.getStringAsync();
    const lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    let parsedTime = 'DEAR 1 PM';
    let parsedDate = new Date();

    // Try to detect draw & date
    const matchFormat1 = text.match(/(DEAR\s*1|DEAR\s*6|DEAR\s*8|KERALA\s*3)\s*(?:PM)?/i);
    if (matchFormat1) {
      const game = matchFormat1[1].replace(/\s+/g, ' ').toUpperCase();
      if (game.includes('KERALA 3')) parsedTime = 'KERALA 3 PM';
      else if (game.includes('DEAR 1')) parsedTime = 'DEAR 1 PM';
      else if (game.includes('DEAR 6')) parsedTime = 'DEAR 6 PM';
      else if (game.includes('DEAR 8')) parsedTime = 'DEAR 8 PM';
    }

    const dateMatch = text.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch) parsedDate = new Date(dateMatch[0]);

    // Extract ALL 3-digit numbers
    const allNumbers = text.match(/\b\d{3}\b/g) || [];

    if (allNumbers.length < 1) {
      Alert.alert('Invalid format', 'No 3-digit numbers found.');
      return;
    }

    // First 5 → prizes
    const parsedPrizes = allNumbers.slice(0, 5);
    const parsedNumbers = allNumbers.slice(5, 35); // up to 30 normal entries

    const filledPrizes = [...parsedPrizes, ...Array(5 - parsedPrizes.length).fill('')];
    const filledNumbers = [...parsedNumbers, ...Array(30 - parsedNumbers.length).fill('')];

    setTime(parsedTime);
    setDate(parsedDate);
    setPrizes(filledPrizes);
    setNumbers(filledNumbers);

    console.log('📋 Paste Results:', { parsedTime, parsedDate, filledPrizes, filledNumbers });
    Alert.alert('Success', 'Results pasted successfully.');
  } catch (error) {
    console.error('Paste error:', error);
    Alert.alert('Error', 'Failed to paste data.');
  }
};
