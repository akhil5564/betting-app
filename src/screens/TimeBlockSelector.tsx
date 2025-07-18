// screens/TimeBlockInputScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const TimeBlockInputScreen = () => {
  const navigation = useNavigation();
  const [selectedTime, setSelectedTime] = useState('1 PM');
  const [timeInputs, setTimeInputs] = useState({
    '1 PM': '',
    '3 PM': '',
    '6 PM': '',
    '8 PM': '',
  });

  const handleInputChange = (text: string) => {
    setTimeInputs((prev) => ({
      ...prev,
      [selectedTime]: text,
    }));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Set Time Block Input</Text>

      <TimeBlockSelector selectedTime={selectedTime} onSelect={setSelectedTime} />

      <Text style={styles.label}>Input for {selectedTime}</Text>
      <TextInput
        style={styles.input}
        placeholder={`Enter value for ${selectedTime}`}
        value={timeInputs[selectedTime]}
        onChangeText={handleInputChange}
        keyboardType="numeric"
      />

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Summary</Text>
        {Object.entries(timeInputs).map(([time, value]) => (
          <Text key={time} style={styles.summaryItem}>
            {time}: {value || '—'}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
};

export default TimeBlockInputScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  summary: {
    marginTop: 24,
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  summaryItem: {
    fontSize: 14,
    paddingVertical: 2,
  },
});
