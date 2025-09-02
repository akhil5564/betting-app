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
import axios from 'axios';

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
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  // Debug: Watch ticketData changes
  useEffect(() => {
    console.log('📝 ticketData state changed:', ticketData);
  }, [ticketData]);

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

// Add function to fetch existing rates
const fetchExistingRates = async (user: string, draw: string) => {
  try {
    if (!user || !draw) {
      console.log('⚠️ Missing user or draw info');
      return;
    }

    setIsLoadingRates(true);
    console.log('🔄 Starting to fetch rates for:', user, draw);

    if (draw === 'All') {
      // For "All" selection, show default values (zeros) since we don't want to fetch a specific draw
      console.log('🔄 "All" selected - showing default values');
      setTicketData([...initialData]);
      setIsLoadingRates(false);
      return;
    }

    const url = `${Domain}/rateMaster?user=${encodeURIComponent(user)}&draw=${encodeURIComponent(draw)}`;
    console.log('🔗 Fetching from URL:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('🌐 Fetched rates for', user, draw, ':', data);
    console.log('📊 Response status:', response.status);
    console.log('📋 Data type:', typeof data);
    console.log('📋 Data structure:', Object.keys(data || {}));

    // Handle different possible response formats and validate the data
    let ratesArray = [];
    let responseUser = '';
    let responseDraw = '';
    
    // Check if response indicates no data found
    if (data && data.message === 'No rate found') {
      console.log('❌ Backend returned: No rate found');
      console.log('🔄 Resetting to initial data (all zeros)');
      setTicketData([...initialData]);
      setIsLoadingRates(false);
      return;
    }
    
    if (data && Array.isArray(data.rates)) {
      ratesArray = data.rates;
      responseUser = data.user || '';
      responseDraw = data.draw || '';
      console.log('✅ Found rates array:', ratesArray);
      console.log('👤 Response user:', responseUser);
      console.log('🕐 Response draw:', responseDraw);
    } else if (data && Array.isArray(data)) {
      ratesArray = data;
      console.log('✅ Found direct rates array:', ratesArray);
    } else if (data && data.data && Array.isArray(data.data.rates)) {
      ratesArray = data.data.rates;
      responseUser = data.data.user || '';
      responseDraw = data.data.draw || '';
      console.log('✅ Found rates in data.rates:', ratesArray);
      console.log('👤 Response user:', responseUser);
      console.log('🕐 Response draw:', responseDraw);
    } else {
      console.log('❌ No rates found in response, using defaults');
      console.log('🔄 Resetting to initial data (all zeros)');
      setTicketData([...initialData]); // Create a fresh copy
      setIsLoadingRates(false);
      return;
    }

    // Validate that the response matches the requested user and draw
    if (responseUser && responseUser !== user) {
      console.log('❌ Response user mismatch!');
      console.log('  Requested user:', user);
      console.log('  Response user:', responseUser);
      console.log('🔄 Resetting to initial data (all zeros)');
      setTicketData([...initialData]);
      setIsLoadingRates(false);
      return;
    }

    if (responseDraw && responseDraw !== draw) {
      console.log('❌ Response draw mismatch!');
      console.log('  Requested draw:', draw);
      console.log('  Response draw:', responseDraw);
      console.log('🔄 Resetting to initial data (all zeros)');
      setTicketData([...initialData]);
      setIsLoadingRates(false);
      return;
    }

    // Check if ratesArray is empty
    if (ratesArray.length === 0) {
      console.log('❌ Rates array is empty, using defaults');
      console.log('🔄 Resetting to initial data (all zeros)');
      setTicketData([...initialData]); // Create a fresh copy
      setIsLoadingRates(false);
      return;
    }

    // Map the fetched rates to our ticketData format
    const updatedTicketData = initialData.map((item) => {
      console.log(`🔍 Looking for rate matching: ${item.name}`);
      console.log(`📋 Available rates:`, ratesArray.map((r: any) => ({ label: r.label, rate: r.rate })));
      
      const matchingRate = ratesArray.find((r: any) => {
        const rateLabel = (r.label || r.name || '').toLowerCase();
        const itemName = item.name.toLowerCase();
        console.log(`  Comparing: "${rateLabel}" with "${itemName}"`);
        return rateLabel === itemName;
      });
      
      const rateValue = matchingRate ? matchingRate.rate.toString() : '0';
      console.log(`  Found rate for ${item.name}: ${rateValue}`);
      
      return {
        ...item,
        rate: rateValue,
        assignRate: rateValue,
      };
    });
    
    console.log('📝 Updated ticket data:', updatedTicketData);
    setTicketData(updatedTicketData);
    console.log('✅ Rates loaded successfully');
    
  } catch (error) {
    console.error('❌ Error fetching rates:', error);
    console.log('🔄 Resetting to initial data due to error');
    setTicketData(initialData);
  } finally {
    setIsLoadingRates(false);
  }
};

// Function to manually clear rates (reset to zeros)
const clearRates = () => {
  console.log('🧹 Manually clearing rates to zeros');
  const freshInitialData = initialData.map(item => ({...item}));
  setTicketData(freshInitialData);
};

// Function to check what's in the database for current user/draw
const checkDatabaseRates = async () => {
  try {
    console.log('🔍 Checking database for:', selectedUser, selectedDraw);
    const url = `${Domain}/rateMaster?user=${encodeURIComponent(selectedUser)}&draw=${encodeURIComponent(selectedDraw)}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log('📊 Database response:', data);
    console.log('📋 Response keys:', Object.keys(data || {}));
  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
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

// Add useEffect to fetch rates when user or draw changes
useEffect(() => {
  if (selectedUser && selectedDraw) {
    console.log('🔄 User or draw changed, fetching rates for:', selectedUser, selectedDraw);
    console.log('📊 Current ticketData before reset:', ticketData);
    
    // First reset to initial data to avoid showing stale data
    const freshInitialData = initialData.map(item => ({...item}));
    console.log('🔄 Resetting to fresh initial data:', freshInitialData);
    setTicketData(freshInitialData);
    
    // Small delay to ensure state is updated before fetching
    setTimeout(() => {
      fetchExistingRates(selectedUser, selectedDraw);
    }, 100);
  }
}, [selectedUser, selectedDraw]);

const handleSave = async () => {
  try {
    // Convert ticketData to expected backend format
    const modifiedRates = ticketData.map((item) => ({
      label: item.name.toUpperCase(),
      rate: Number(item.rate),
    }));

    if (selectedDraw === 'All') {
      // Save rates to all draws
      const allDraws = ['DEAR 1 PM', 'KERALA 3 PM', 'DEAR 6 PM', 'DEAR 8 PM'];
      console.log('🔄 Saving rates to all draws:', allDraws);
      
      const savePromises = allDraws.map(draw => {
        const payload = {
          user: selectedUser,
          draw: draw,
          rates: modifiedRates,
        };
        return saveRateData(payload);
      });

      await Promise.all(savePromises);
      alert('✅ Rate data saved successfully to all draws');
    } else {
      // Save to single draw
      const payload = {
        user: selectedUser,
        draw: selectedDraw,
        rates: modifiedRates,
      };
      await saveRateData(payload);
    }
  } catch (error) {
    console.error('Error in handleSave:', error);
    alert('❌ Error saving rate data');
  }
};

const saveRateData = async (payload: any) => {
  console.log("payload",payload);
  
  try {
    const response = await axios.post(`${Domain}/ratemaster`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.data;
    console.log("response",data);

    if (data.status === 200) {
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

        {/* Show warning when "All" is selected */}
        {selectedDraw === 'All' && (
          <View style={styles.allDrawsWarning}>
            <Text style={styles.allDrawsWarningText}>
              ⚠️ "All" selected - Rates will be applied to all draws (DEAR 1 PM, KERALA 3 PM, DEAR 6 PM, DEAR 8 PM)
            </Text>
          </View>
        )}

        {/* Debug buttons */}
        <View style={styles.debugButtonsContainer}>
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={() => fetchExistingRates(selectedUser, selectedDraw)}
          >
            <Text style={styles.debugButtonText}>🔄 Refresh Rates</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.debugButton, styles.clearButton]} 
            onPress={clearRates}
          >
            <Text style={styles.debugButtonText}>🧹 Clear Rates</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.debugButton, styles.checkButton]} 
            onPress={checkDatabaseRates}
          >
            <Text style={styles.debugButtonText}>🔍 Check DB</Text>
          </TouchableOpacity>
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

      {/* Loading indicator */}
      {isLoadingRates && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading rates for {selectedUser} - {selectedDraw}...</Text>
        </View>
      )}

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
  picker: {
    height: 50,
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
  loadingContainer: {
    backgroundColor: '#fef3c7',
    padding: 12,
    marginHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  loadingText: {
    color: '#92400e',
    fontWeight: 'bold',
    fontSize: 14,
  },
  debugButton: {
    backgroundColor: '#3b82f6',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  debugButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  debugButtonsContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  clearButton: {
    backgroundColor: '#ef4444',
  },
  checkButton: {
    backgroundColor: '#10b981',
  },
  allDrawsWarning: {
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 4,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  allDrawsWarningText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
