import React, { useState } from 'react';
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

const initialData = [
  { name: 'DEAR1-SUPER', rate: '8', assignRate: '8' },
  { name: 'DEAR1-BOX', rate: '8', assignRate: '8' },
  { name: 'DEAR1-AB', rate: '8', assignRate: '8' },
  { name: 'DEAR1-BC', rate: '8', assignRate: '8' },
  { name: 'DEAR1-AC', rate: '8', assignRate: '8' },
  { name: 'DEAR1-A', rate: '10.6', assignRate: '10.6' },
  { name: 'DEAR1-B', rate: '10.6', assignRate: '10.6' },
  { name: 'DEAR1-C', rate: '10.6', assignRate: '10.6' },
];

const RateMasterScreen = () => {
  const navigation = useNavigation();
  const [selectedDraw, setSelectedDraw] = useState('DEAR 1 PM');
  const [selectedUser, setSelectedUser] = useState('Fr');
  const [editAll, setEditAll] = useState(false);
  const [ticketData, setTicketData] = useState(initialData);
  const [checkedItems, setCheckedItems] = useState(initialData.map(() => true));

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
        <TouchableOpacity style={styles.saveButton}>
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
          <Picker selectedValue={selectedUser} onValueChange={setSelectedUser}>
            <Picker.Item label="Fr" value="Fr" />
            <Picker.Item label="user1" value="user1" />
            <Picker.Item label="user2" value="user2" />
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
