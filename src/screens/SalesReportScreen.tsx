import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SalesReportScreen() {
  const navigation = useNavigation();
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [loggedInUser, setLoggedInUser] = useState('');

  useEffect(() => {
    const loadUserAndUsers = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('username');
        if (storedUser) setLoggedInUser(storedUser);

        const response = await fetch('https://manu-netflix.onrender.com/users');
        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
          const usernames = data
            .map((u: any) => u.username)
            .filter((username: any) => typeof username === 'string' && username.trim() !== '');

          setAllUsers(usernames);
        } else {
          console.error('Invalid data format from API');
        }
      } catch (err) {
        console.error('❌ Error loading users:', err);
      }
    };

    loadUserAndUsers();
  }, []);

  const handleGenerateReport = async () => {
    try {
      const formattedDate = fromDate.toLocaleDateString('en-GB');
      const response = await fetch(`https://manu-netflix.onrender.com/entries?createdBy=${selectedAgent}&createdAt=${formattedDate}`);
      const data = await response.json();

      console.log('📦 API data:', JSON.stringify(data, null, 2));

      let totalCount = 0;

      data.forEach((entry) => {
        const count = Number(entry.count);
        if (!isNaN(count)) {
          totalCount += count;
        }
      });

      const amount = totalCount * 10;

      console.log('✅ Count:', totalCount, 'Amount:', amount);

      navigation.navigate('SalesReportSummery', {
        count: totalCount,
        amount,
        date: formattedDate,
      });
    } catch (error) {
      console.error('❌ Error generating report:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Sales Report</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <Ionicons name="home" size={24} color="red" />
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Picker style={styles.picker}>
          <Picker.Item label="ALL" value="all" />
          <Picker.Item label="DEAR 1 PM" value="1 PM" />
          <Picker.Item label="LSK 3 PM" value="3 PM" />
          <Picker.Item label="DEAR 6 PM" value="6 PM" />
          <Picker.Item label="DEAR 8 PM" value="8 PM" />
        </Picker>

        <View style={styles.row}>
          <View style={styles.dateInput}>
            <Text style={styles.label}>From</Text>
            <TouchableOpacity onPress={() => setShowFrom(true)}>
              <Text style={styles.dateText}>{fromDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showFrom && (
              <DateTimePicker
                value={fromDate}
                mode="date"
                display="default"
                onChange={(e, date) => {
                  setShowFrom(false);
                  if (date) setFromDate(date);
                }}
              />
            )}
          </View>

          <View style={styles.equalBox}>
            <Text style={styles.equalText}>=</Text>
          </View>

          <View style={styles.dateInput}>
            <Text style={styles.label}>To</Text>
            <TouchableOpacity onPress={() => setShowTo(true)}>
              <Text style={styles.dateText}>{toDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showTo && (
              <DateTimePicker
                value={toDate}
                mode="date"
                display="default"
                onChange={(e, date) => {
                  setShowTo(false);
                  if (date) setToDate(date);
                }}
              />
            )}
          </View>
        </View>

        <TextInput
          placeholder="Ticket Number"
          placeholderTextColor="#999"
          style={styles.input}
        />

        <View style={styles.row}>
          <Picker style={styles.halfPicker}>
            <Picker.Item label="Select" value="" />
            <Picker.Item label="1" value="1" />
            <Picker.Item label="2" value="2" />
            <Picker.Item label="3" value="3" />
          </Picker>
          <Picker style={styles.halfPicker}>
            <Picker.Item label="Mode" value="" />
          </Picker>
        </View>

        <Picker
          selectedValue={selectedAgent}
          onValueChange={(value) => setSelectedAgent(value)}
          style={styles.picker}
        >
          <Picker.Item label={`Logged in: ${loggedInUser}`} value="" enabled={false} />
          {allUsers.map((username, index) => (
            <Picker.Item key={index} label={username} value={username} />
          ))}
        </Picker>

        <TouchableOpacity style={styles.generateButton} onPress={handleGenerateReport}>
          <Text style={styles.generateButtonText}>Generate Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    marginTop: 30,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  form: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 10,
    elevation: 2,
  },
  picker: {
    backgroundColor: '#f4f4f4',
    borderRadius: 5,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 5,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  dateInput: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  dateText: {
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  equalBox: {
    width: 40,
    height: 40,
    backgroundColor: '#ff2e63',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 16,
  },
  equalText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  halfPicker: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    borderRadius: 5,
  },
  generateButton: {
    backgroundColor: '#ff2e63',
    padding: 14,
    borderRadius: 5,
    marginTop: 20,
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
