import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Share,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Domain } from './NetPayScreen';

const timeOptions = ['DEAR 1PM', 'KERALA 3PM', 'DEAR 6PM', 'DEAR 8PM'];

const ResultScreen = () => {
  const [selectedTime, setSelectedTime] = useState(timeOptions[0]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [prizes, setPrizes] = useState<string[]>([]);
  const [entries, setEntries] = useState<string[]>([]);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleGenerate = async () => {
    try {
      const formattedDate = formatDate(selectedDate);
      const url = `${Domain}/getResult?date=${formattedDate}&time=${encodeURIComponent(selectedTime)}`;
      const res = await axios.get(url);
      const data = res.data.results[formattedDate][0][selectedTime];
      setPrizes(data.prizes);
      setEntries(data.entries.map((e: any) => e.result).slice(0, 30)); // Limit to 30 entries
    } catch (err) {
      console.error(err);
      setPrizes([]);
      setEntries([]);
      alert('No result found or network error');
    }
  };

  const buildResultText = () => {
    return [
      `🎯 ${selectedTime} Result (${selectedDate.toLocaleDateString('en-GB')})`,
      '',
      ...prizes.map((p, i) => `${i + 1}: ${p}`),
      '',
      'Entries:',
      ...entries,
    ].join('\n');
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(buildResultText());
    alert('Result copied to clipboard!');
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: buildResultText() });
    } catch (error) {
      alert('Failed to share result');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Results</Text>

      <View style={styles.row}>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedTime}
            onValueChange={(itemValue) => setSelectedTime(itemValue)}
            style={styles.picker}
            dropdownIconColor="#333"
          >
            {timeOptions.map((t) => (
              <Picker.Item key={t} label={t} value={t} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={styles.dateButton}
        >
          <Text style={styles.dateText}>
            {selectedDate.toLocaleDateString('en-GB')}
          </Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.actionButton} onPress={handleGenerate}>
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={styles.buttonText}>Generate</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleCopy}>
          <Ionicons name="copy-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Copy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Share</Text>
        </TouchableOpacity>
      </View>

      {prizes.length > 0 && (
        <View style={styles.prizeContainer}>
          {prizes.map((prize, index) => (
            <View
              key={index}
              style={[
                styles.prizeRow,
                { backgroundColor: index % 2 === 0 ? '#a5e9d2' : '#add4ff' },
              ]}
            >
              <Text style={styles.prizeText}>{index + 1} : {prize}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.grid}>
        {entries.map((entry, i) => (
          <View
            key={i}
            style={[
              styles.cell,
              { backgroundColor: i % 2 === 0 ? '#a5e9d2' : '#add4ff' },
            ]}
          >
            <Text style={styles.cellText}>{entry}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f7fb',
    alignItems: 'center',
    flexGrow: 1,
    marginTop: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerWrapper: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 10,
  },
  picker: {
    height: 48,
    width: '100%',
  },
  dateButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
    marginBottom: 16,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  prizeContainer: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  prizeRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  prizeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    marginTop: 10,
  },
  cell: {
    width: '33.33%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  cellText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
});

export default ResultScreen;
