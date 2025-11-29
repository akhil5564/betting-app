import { Alert } from 'react-native';

// This is the old API logic for result entry
export const handleSaveOldApi = async (date: Date, time: string, prizes: string[], numbers: string[]) => {
  const formattedDate = date.toISOString().split('T')[0];
  // Old API expects a different payload structure (example, adjust as needed)
  const payload = {
    date: formattedDate,
    draw: time,
    prizes: prizes.filter(p => /^\d{3}$/.test(p)),
    results: numbers
      .map((num, index) => ({
        ticket: (index + 1).toString(),
        result: num.trim(),
      }))
      .filter(entry => /^\d{3}$/.test(entry.result)),
  };

  try {
    const response = await fetch('https://www.muralibajaj.site/addResultOld', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const resData = await response.json();
    if (response.ok) {
      Alert.alert('Success', 'Result (old API) saved successfully.');
    } else {
      console.error('❌ Old API server error:', resData);
      Alert.alert('Error', resData.message || 'Failed to save (old API).');
    }
  } catch (err) {
    console.error('⚠️ Old API request error:', err);
    Alert.alert('Error', 'Network or server error (old API).');
  }
};
