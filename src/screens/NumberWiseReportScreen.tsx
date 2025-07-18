import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';

const NumberWiseReportScreen = () => {
  const navigation = useNavigation<any>();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [ticket] = useState('ALL');
  const [ticketNumber, setTicketNumber] = useState('');
  const [groupWithoutName, setGroupWithoutName] = useState(false);

  const handleGenerateReport = async () => {
    try {
      const formattedDate = date.toISOString().split('T')[0];
      let url = `https://manu-netflix.onrender.com/report/count`;
      if (ticketNumber.trim() !== '') {
        url += `&number=${ticketNumber.trim()}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data)) {
        navigation.navigate('NumberWiseReportResult', { data });
      } else {
        alert(data.message || 'No data found');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Failed to fetch report');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatDate = (date: Date) =>
    `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Number Wise Report</Text>
        <TouchableOpacity>
          <Ionicons name="home" size={24} color="red" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.label}>Ticket</Text>
        <TextInput style={styles.input} value={ticket} editable={false} />

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
              <Text style={styles.boldText}>{formatDate(date)}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Ticket Number</Text>
            <TextInput
              placeholder="Ticket Number"
              style={styles.input}
              value={ticketNumber}
              onChangeText={setTicketNumber}
            />
          </View>
        </View>

        <Text style={styles.label}>Agent</Text>
        <TextInput placeholder="Agent" style={styles.input} />

        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setGroupWithoutName(!groupWithoutName)}
          >
            <Ionicons
              name={groupWithoutName ? 'checkbox' : 'square-outline'}
              size={20}
              color="#000"
            />
            <Text style={styles.checkboxLabel}>Group without ticket name</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleGenerateReport}>
          <Text style={styles.buttonText}>Generate Report</Text>
        </TouchableOpacity>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
    </SafeAreaView>
  );
};

export default NumberWiseReportScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    marginTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  body: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f2f2f2',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  boldText: {
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    marginRight: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: 8,
  },
  button: {
    backgroundColor: '#f92659',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
