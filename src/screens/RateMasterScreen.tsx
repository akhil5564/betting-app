import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import Checkbox from 'expo-checkbox';
import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect } from 'react'; // <-- ✅ Add useEffect here
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Domain } from './NetPayScreen';

const initialData = [
  { name: 'SUPER', rate: '0', assignRate: '0' },
  { name: 'BOX', rate: '0', assignRate: '0' },
  { name: 'AB', rate: '0', assignRate: '0' },
  { name: 'BC', rate: '0', assignRate: '0' },
  { name: 'AC', rate: '0', assignRate: '0' },
  { name: 'A', rate: '0', assignRate: '0' },
  { name: 'B', rate: '0', assignRate: '0' },
  { name: 'C', rate: '0', assignRate: '0' },
];

const RateMasterScreen = () => {
  const navigation = useNavigation();
  const [selectedDraw, setSelectedDraw] = useState('DEAR 1 PM');
  const [selectedUser, setSelectedUser] = useState('Fr');
  const [editAll, setEditAll] = useState(false);
  const [ticketData, setTicketData] = useState(initialData);
  const [checkedItems, setCheckedItems] = useState(initialData.map(() => true));
const [userList, setUserList] = useState<string[]>([]);

  const handleCheckboxChange = (index: number) => {
    const updated = [...checkedItems];
    updated[index] = !updated[index];
    setCheckedItems(updated);
  };



const handleAssignRateChange = (text: string, index: number) => {
  const updated = [...ticketData];
  updated[index].assignRate = text;
  updated[index].rate = text; // 👈 update rate as well
  setTicketData(updated);
};

useEffect(() => {
  const fetchAndFilterUsers = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('username'); // get logged in user
      if (!storedUsername) return;

      const res = await fetch(`${Domain}/users`);
      const data = await res.json();

      // Filter users by createdBy === loggedInUser
      const filteredUsers = data.filter((user: any) => user.createdBy === storedUsername);
      const usernames = filteredUsers.map((user: any) => user.username);

      setUserList(usernames);
      if (usernames.length > 0) {
        setSelectedUser(usernames[0]);
      }
    } catch (error) {
      console.error('Error fetching usernames:', error);
    }
  };

  fetchAndFilterUsers();
}, []);

const handleSave = async () => {
  try {
    // Convert ticketData to expected backend format
    const modifiedRates = ticketData.map((item) => ({
      label: item.name.toUpperCase(),
      rate: Number(item.rate),
    }));

    const payload = {
      user: selectedUser,
      draw: selectedDraw,
      rates: modifiedRates,
    };

    await saveRateData(payload);
  } catch (error) {
    console.error('Error in handleSave:', error);
  }
};

const saveRateData = async (payload) => {
  try {
    const response = await fetch(`${Domain}/ratemaster`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Rate data saved successfully');
      console.log('👤 User:', data.data?.user);
      console.log('🕐 Draw:', data.data?.draw);
      console.log('📊 Rates:', data.data?.rates);
      alert('✅ Rate data saved successfully');
    } else {
      console.error('❌ Failed to save rate data:', data);
      alert('❌ Failed to save rate data');
    }
  } catch (error) {
    console.error('❌ Error saving rate data:', error);
    alert('❌ An error occurred while saving');
  }
};

  const renderRow = ({ item, index }: any) => (
    <View style={styles.row}>
      <View style={styles.cellWithBorder}>
        <Checkbox
          value={checkedItems[index]}
          onValueChange={() => handleCheckboxChange(index)}
          color={checkedItems[index] ? '#10b981' : undefined}
        />
      </View>

      <View style={styles.cellWithBorder}>
        <Text style={styles.cellText}>{item.name}</Text>
      </View>

      <View style={styles.cellWithBorder}>
        <Text style={styles.cellText}>{item.rate}</Text>
      </View>

      <View style={styles.lastCell}>
        <TextInput
          value={item.assignRate}
          onChangeText={(text) => handleAssignRateChange(text, index)}
          style={styles.input}
          keyboardType="decimal-pad"
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Master</Text>
       <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
  <Text style={styles.saveText}>SAVE</Text>
</TouchableOpacity>

      </View>

      {/* Filter card */}
      <View style={styles.card}>
        <View style={styles.pickerBox}>
          <Picker selectedValue={selectedDraw} onValueChange={setSelectedDraw}>
            <Picker.Item label="DEAR 1 PM" value="DEAR 1 PM" />
            <Picker.Item label="KERALA 3 PM" value="KERALA 3 PM" />
            <Picker.Item label="DEAR 6 PM" value="DEAR 6 PM" />
            <Picker.Item label="DEAR 8 PM" value="DEAR 8 PM" />
             <Picker.Item label="All" value="All" />

          </Picker>
        </View>

        <View style={styles.pickerBox}>
          <Picker
  selectedValue={selectedUser}
  onValueChange={(itemValue) => setSelectedUser(itemValue)}
  style={styles.picker}
>
  {userList.map((username) => (
    <Picker.Item key={username} label={username} value={username} />
  ))}
</Picker>

        </View>

        <View style={styles.editAllRow}>
          <Checkbox value={editAll} onValueChange={setEditAll} />
          <Text style={styles.editAllText}>Edit all Dear tickets</Text>
        </View>
      </View>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <View style={styles.cellWithBorder}>
          <Text style={styles.headerText}></Text>
        </View>
        <View style={styles.cellWithBorder}>
          <Text style={styles.headerText}>Ticket Name</Text>
        </View>
        <View style={styles.cellWithBorder}>
          <Text style={styles.headerText}>Rate</Text>
        </View>
        <View style={styles.lastCell}>
          <Text style={styles.headerText}>Assign Rate</Text>
        </View>
      </View>

      {/* Table Rows */}
      <FlatList
        data={ticketData}
        renderItem={renderRow}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

export default RateMasterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#facc15',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
  },
  saveText: {
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'white',
    margin: 12,
    borderRadius: 8,
    padding: 10,
    elevation: 2,
  },
  pickerBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 10,
  },
  editAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1d5c9',
    padding: 10,
    borderRadius: 4,
  },
  editAllText: {
    marginLeft: 8,
    fontWeight: 'bold',
    color: '#333',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f7254e',
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    backgroundColor: 'white',
    alignItems: 'center',
    borderBottomColor: '#e5e7eb',
    borderBottomWidth: 1,
  },
  cellWithBorder: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 10,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lastCell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 14,
    color: '#000',
  },
  input: {
    fontSize: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
    textAlign: 'center',
    color: '#000',
    backgroundColor: 'transparent',
  },
});
