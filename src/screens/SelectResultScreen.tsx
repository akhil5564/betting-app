import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';

const timeOptions = ['DEAR 1PM', 'KERALA 3PM', 'DEAR 6PM', 'DEAR 8PM'];

const ResultScreen = () => {
  const [selectedTime, setSelectedTime] = useState(timeOptions[0]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [prizes, setPrizes] = useState<string[]>([]);
  const [entries, setEntries] = useState<string[]>([]);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]; // "2025-07-15"
  };

  const handleGenerate = async () => {
    try {
      const formattedDate = formatDate(selectedDate);
      const url = `https://manu-netflix.onrender.com/getResult?date=${formattedDate}&time=${encodeURIComponent(selectedTime)}`;

      const res = await axios.get(url);
      const data = res.data.results[formattedDate][0][selectedTime];

      setPrizes(data.prizes);
      setEntries(data.entries.map((e: any) => e.result));
    } catch (err) {
      console.error(err);
      setPrizes([]);
      setEntries([]);
      alert('No result found or network error');
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

      <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
        <Text style={styles.generateText}>Generate Result</Text>
      </TouchableOpacity>

      {/* Prize Results */}
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

      {/* Entries Grid */}
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
    marginTop :30,
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
  generateButton: {
    backgroundColor: 'blue',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 16,
    elevation: 3,
  },
  generateText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
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
  justifyContent: 'flex-start',
  width: '100%',
  overflow: 'hidden',
},

cell: {
  width: '33.33%', // Exactly 3 columns
  paddingVertical: 12,
  alignItems: 'center',

  backgroundColor: '#a5e9d2',
},

  cellText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
});

export default ResultScreen;
