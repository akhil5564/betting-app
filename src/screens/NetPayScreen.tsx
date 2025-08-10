import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
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
  const [selectedTime, setSelectedTime] = useState('DEAR 6PM');
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [loggedInUser, setLoggedInUser] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedMode, setSelectedMode] = useState('');

  useEffect(() => {
    const loadUserAndUsers = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('username');
        if (storedUser) {
          setLoggedInUser(storedUser);

          const response = await fetch('https://manu-netflix.onrender.com/users');
          const data = await response.json();

          if (response.ok && Array.isArray(data)) {
            const usernames = data
              .filter((u: any) => u.createdBy === storedUser)
              .map((u: any) => u.username)
              .filter((username: any) => typeof username === 'string' && username.trim() !== '');

            // Include the logged-in user at the top
            setAllUsers([storedUser, ...usernames]);
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

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleGenerate = async () => {
    try {
      const entriesRes = await fetch('https://manu-netflix.onrender.com/entries');
      const entriesData = await entriesRes.json();
      const entries = entriesData || [];

      const matchedEntries: any[] = [];
      const schemeRates = {
        A: { amount: 100, super: 0 },
        B: { amount: 100, super: 0 },
        C: { amount: 100, super: 0 },
        AB: { amount: 700, super: 30 },
        AC: { amount: 700, super: 30 },
        BC: { amount: 700, super: 30 },
        BOX: { amount: 800, super: 0 },
        SUPER: { amount: 5000, super: 400 },
      };

      const drawTimes = selectedTime === 'ALL'
        ? ['DEAR 1PM', 'LSK 3PM', 'DEAR 6PM', 'DEAR 8PM']
        : [selectedTime];

      let dateCursor = new Date(fromDate);
      while (dateCursor <= toDate) {
        const formattedDate = formatDate(dateCursor);

        for (const drawTime of drawTimes) {
          const resultUrl = `https://manu-netflix.onrender.com/getResult?date=${formattedDate}&time=${encodeURIComponent(drawTime)}`;
          const resultRes = await fetch(resultUrl);
          const resultData = await resultRes.json();

          const prizes = resultData?.results?.[formattedDate]
            ?.find(r => Object.keys(r)[0] === drawTime)?.[drawTime]?.prizes || [];

          for (const prize of prizes) {
            const digits = prize.split('');

            const results = entries
              .filter(entry => {
                const entryDate = formatDate(new Date(entry.createdAt));
                if (entryDate !== formattedDate) return false;

                if (selectedAgent && entry.username !== selectedAgent) return false;
                if (selectedGroup && entry.group !== selectedGroup) return false;
                if (selectedMode && entry.mode !== selectedMode) return false;
                if (ticketNumber && entry.ticket !== ticketNumber) return false;

                return true;
              })
              .map(entry => {
                const { number, type, count = 0, username } = entry;
                if (!type || typeof type !== 'string') return null;

                const baseType = type.replace(/^.*?(-|)(A|B|C|AB|AC|BC|BOX|SUPER)$/, '$2');

                let isMatch = false;
                switch (baseType) {
                  case 'A': isMatch = number === digits[0]; break;
                  case 'B': isMatch = number === digits[1]; break;
                  case 'C': isMatch = number === digits[2]; break;
                  case 'AB': isMatch = number === digits[0] + digits[1]; break;
                  case 'AC': isMatch = number === digits[0] + digits[2]; break;
                  case 'BC': isMatch = number === digits[1] + digits[2]; break;
                  case 'BOX':
                  case 'SUPER': isMatch = number === prize; break;
                }

                if (isMatch) {
                  const { amount, super: superAmt } = schemeRates[baseType] || { amount: 0, super: 0 };
                  const total = (amount + superAmt) * count;
                  return {
                    number,
                    type,
                    count,
                    username,
                    amount,
                    super: superAmt,
                    total,
                    date: formattedDate,
                    drawTime,
                  };
                }

                return null;
              })
              .filter(Boolean);

            matchedEntries.push(...results);
          }
        }

        dateCursor.setDate(dateCursor.getDate() + 1);
      }

      navigation.navigate('netdetailed', {
        fromDate: formatDate(fromDate),
        toDate: formatDate(toDate),
        time: selectedTime,
        matchedEntries,
      });
    } catch (error) {
      console.error('❌ Error generating report:', error);
      Alert.alert('Error fetching data');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Netpay Report</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <Ionicons name="home" size={24} color="#c62828" />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Ticket Number</Text>
        <TextInput
          placeholder="Enter Ticket Number"
          value={ticketNumber}
          onChangeText={setTicketNumber}
          style={styles.input}
        />

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Group</Text>
            <Picker selectedValue={selectedGroup} onValueChange={setSelectedGroup} style={styles.picker}>
              <Picker.Item label="Select Group" value="" />
              <Picker.Item label="Group 1" value="1" />
              <Picker.Item label="Group 2" value="2" />
              <Picker.Item label="Group 3" value="3" />
            </Picker>
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Mode</Text>
            <Picker selectedValue={selectedMode} onValueChange={setSelectedMode} style={styles.picker}>
              <Picker.Item label="Select Mode" value="" />
              <Picker.Item label="Manual" value="manual" />
              <Picker.Item label="Auto" value="auto" />
            </Picker>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Draw Time</Text>
        <Picker selectedValue={selectedTime} onValueChange={setSelectedTime} style={styles.picker}>
          <Picker.Item label="ALL" value="ALL" />
          <Picker.Item label="DEAR 1 PM" value="DEAR 1PM" />
          <Picker.Item label="LSK 3 PM" value="LSK 3PM" />
          <Picker.Item label="DEAR 6 PM" value="DEAR 6PM" />
          <Picker.Item label="DEAR 8 PM" value="DEAR 8PM" />
        </Picker>

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>From Date</Text>
            <TouchableOpacity onPress={() => setShowFrom(true)} style={styles.input}>
              <Text>{fromDate.toLocaleDateString()}</Text>
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

          <View style={styles.column}>
            <Text style={styles.sectionTitle}>To Date</Text>
            <TouchableOpacity onPress={() => setShowTo(true)} style={styles.input}>
              <Text>{toDate.toLocaleDateString()}</Text>
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

        <Text style={styles.sectionTitle}>Agent</Text>
        <Picker selectedValue={selectedAgent} onValueChange={setSelectedAgent} style={styles.picker}>
          <Picker.Item label="Select Agent" value="" />
          {allUsers.map((username, i) => (
            <Picker.Item key={i} label={username} value={username} />
          ))}
        </Picker>

        <TouchableOpacity style={styles.button} onPress={handleGenerate}>
          <Text style={styles.buttonText}>Generate Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  card: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#b71c1c',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f1f3f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  picker: {
    backgroundColor: '#f1f3f5',
    borderRadius: 8,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    marginRight: 8,
  },
  button: {
    backgroundColor: '#c62828',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },
});



