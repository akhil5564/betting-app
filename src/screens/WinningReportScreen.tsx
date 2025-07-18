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
  const [showFrom, setShowFrom] = useState(false);
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

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
  };

  const handleGenerate = async () => {
    try {
      const formattedDate = formatDate(fromDate);

      const resultUrl = `https://manu-netflix.onrender.com/getResult?date=${formattedDate}&time=${encodeURIComponent(selectedTime)}`;
      const resultRes = await fetch(resultUrl);
      const resultData = await resultRes.json();

      const entriesRes = await fetch('https://manu-netflix.onrender.com/entries');
      const entriesData = await entriesRes.json();

      const prizes = resultData?.results?.[formattedDate]
        ?.find(r => Object.keys(r)[0] === selectedTime)?.[selectedTime]?.prizes || [];

      const entries = entriesData || [];

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

      const matchedEntries = [];

      for (const prize of prizes) {
        const digits = prize.split('');

        const results = entries
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
              return { number, type, count, username, amount, super: superAmt, total };
            }

            return null;
          })
          .filter(Boolean);

        matchedEntries.push(...results);
      }

      navigation.navigate('winningdetailed', {
        date: formattedDate,
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
        <Text style={styles.headerText}>Winning Report</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <Ionicons name="home" size={24} color="red" />
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        {/* Ticket Number Input */}
        <Text style={styles.label}>🎫 Ticket Number</Text>
        <TextInput
          value={ticketNumber}
          onChangeText={setTicketNumber}
          placeholder="Enter Ticket Number"
          style={styles.input}
        />

        {/* Group Picker */}
        <Text style={styles.label}>👥 Group</Text>
        <Picker
          selectedValue={selectedGroup}
          onValueChange={setSelectedGroup}
          style={styles.picker}
        >
          <Picker.Item label="Select Group" value="" />
          <Picker.Item label="Group 1" value="1" />
          <Picker.Item label="Group 2" value="2" />
          <Picker.Item label="Group 3" value="3" />
        </Picker>

        {/* Mode Picker */}
        <Text style={styles.label}>⚙️ Mode</Text>
        <Picker
          selectedValue={selectedMode}
          onValueChange={setSelectedMode}
          style={styles.picker}
        >
          <Picker.Item label="Select Mode" value="" />
          <Picker.Item label="Manual" value="manual" />
          <Picker.Item label="Auto" value="auto" />
        </Picker>

        {/* Time Picker */}
        <Text style={styles.label}>⏰ Time</Text>
        <Picker
          selectedValue={selectedTime}
          onValueChange={(value) => setSelectedTime(value)}
          style={styles.picker}
        >
          <Picker.Item label="DEAR 1 PM" value="DEAR 1PM" />
          <Picker.Item label="LSK 3 PM" value="LSK 3PM" />
          <Picker.Item label="DEAR 6 PM" value="DEAR 6PM" />
          <Picker.Item label="DEAR 8 PM" value="DEAR 8PM" />
        </Picker>

        {/* Date Picker */}
        <Text style={styles.label}>📅 Date</Text>
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

        {/* Agent Picker */}
        <Text style={styles.label}>🙋 Agent</Text>
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

        {/* Generate Button */}
        <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
          <Text style={styles.generateButtonText}>Generate Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2', marginTop: 30 },
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
  },
  headerText: { fontSize: 18, fontWeight: 'bold' },
  form: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 10,
    elevation: 2,
  },
  label: { fontSize: 13, marginBottom: 4, fontWeight: 'bold' },
  picker: {
    backgroundColor: '#f4f4f4',
    borderRadius: 5,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 5,
    marginBottom: 12,
  },
  generateButton: {
    backgroundColor: '#ff2e63',
    padding: 14,
    borderRadius: 5,
    marginTop: 10,
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
