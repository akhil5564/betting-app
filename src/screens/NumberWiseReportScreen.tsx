import React, { useState, useEffect } from 'react';
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
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Domain } from './NetPayScreen';

const NumberWiseReportScreen = () => {
  const navigation = useNavigation<any>();

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [groupWithoutName, setGroupWithoutName] = useState(false);
  const [selectedTime, setSelectedTime] = useState('ALL');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [loggedInUser, setLoggedInUser] = useState(''); // ✅ Add this

  useEffect(() => {
    const loadUserAndUsers = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('username');
        if (storedUser) {
          setLoggedInUser(storedUser);

          const response = await fetch(`${Domain}/users`);
          const data = await response.json();

          if (response.ok && Array.isArray(data)) {
            const filteredUsers = data
              .filter((u: any) => u.createdBy === storedUser)
              .map((u: any) => u.username)
              .filter((username: any) => typeof username === 'string' && username.trim() !== '');

            // Optionally include the logged-in user in the agent list
            setAllUsers([storedUser, ...filteredUsers]);
          } else {
            console.error('Invalid data format from API');
          }
        }
      } catch (err) {
        console.error('❌ Error loading users:', err);
      }
    };

    loadUserAndUsers();
  }, []);

  const handleGenerateReport = async () => {
    try {
      const formattedDate = date.toISOString().split('T')[0];
      let url = `${Domain}/report/count?date=${formattedDate}`;

      if (selectedTime !== 'ALL') url += `&time=${encodeURIComponent(selectedTime)}`;
      if (ticketNumber.trim()) url += `&number=${ticketNumber.trim()}`;
      if (selectedAgent.trim()) url += `&agent=${selectedAgent.trim()}`;
      if (groupWithoutName) url += `&group=true`;
console.log("aaaaaaaaaaaaaaaaaa",url);

      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data)) {
        navigation.navigate('NumberWiseReportResult', {
          data,
          filters: {
            agent: selectedAgent,
            date: formattedDate,
            time: selectedTime,
            noGroupName:groupWithoutName,
          },
        });
      } else {
        alert(data.message || 'No data found');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Failed to fetch report');
    }
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
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
        <Text style={styles.label}>Draw Time</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={selectedTime} onValueChange={setSelectedTime} style={styles.picker}>
            <Picker.Item label="ALL" value="ALL" color="#000000" />
            <Picker.Item label="DEAR 1PM" value="DEAR 1 PM" color="#000000" />
            <Picker.Item label="KERALA 3PM" value="LSK 3 PM" color="#000000" />
            <Picker.Item label="DEAR 6PM" value="DEAR 6 PM" color="#000000" />
            <Picker.Item label="DEAR 8PM" value="DEAR 8 PM" color="#000000" />
          </Picker>
        </View>

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
              placeholderTextColor="#00000081"
              style={styles.input}
              value={ticketNumber}
              onChangeText={setTicketNumber}
            />
          </View>
        </View>

        <Text style={styles.label}>Agent</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={selectedAgent} onValueChange={setSelectedAgent} style={styles.picker}>
            <Picker.Item label="Select Agent" value="" color="#000000" />
            {allUsers.map((user, i) => (
              <Picker.Item key={i} label={user} value={user} color="#000000" />
            ))}
          </Picker>
        </View>

        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setGroupWithoutName(!groupWithoutName)}
          >
            <Ionicons
              name={groupWithoutName ? 'checkbox' : 'square-outline'}
              size={20}
              color="#0f0e0eff"
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
  container: { flex: 1, backgroundColor: '#f4f4f4', marginTop: 30 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff',
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#000000' },
  body: {
    padding: 20, backgroundColor: '#fff', margin: 10, borderRadius: 8,
  },
  label: { fontSize: 14, marginBottom: 4, color: '#0a0808ff', fontWeight: 'bold' },
  input: {
    backgroundColor: '#f2f2f2', borderRadius: 6, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#ddd', color: '#0a0a0aff', fontWeight: 'bold',
  },
  boldText: { fontWeight: 'bold', color: '#000000ff' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  column: { flex: 1, marginRight: 8 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  checkbox: { flexDirection: 'row', alignItems: 'center' },
  checkboxLabel: { marginLeft: 8, color: '#000000', fontWeight: 'bold' },
  button: {
    backgroundColor: '#f92659', padding: 16, borderRadius: 8, alignItems: 'center', elevation: 2,
  },
  buttonText: { color: '#f8ededff', fontWeight: 'bold', fontSize: 16 },
  pickerWrapper: {
    backgroundColor: '#f2f2f2', borderRadius: 6, marginBottom: 16,
    borderWidth: 1, borderColor: '#ddd',
  },
  picker: { height: 50, width: '100%' },
});
