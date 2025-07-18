import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function SalesReportScreen() {
  const navigation = useNavigation();
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Sales Report</Text>
<TouchableOpacity onPress={() => navigation.navigate('Main')}>
  <Ionicons name="home" size={24} color="red" />
</TouchableOpacity>
      </View>

      {/* Form Card */}
      <View style={styles.form}>
        <Picker style={styles.picker}>
          <Picker.Item label="ALL" value="all" />
        </Picker>

        {/* Date Range Row */}
        <View style={styles.row}>
          <View style={styles.dateInput}>
            <Text style={styles.label}>From</Text>
            <TouchableOpacity onPress={() => setShowFrom(true)}>
              <Text style={styles.dateText}>
                {fromDate.toLocaleDateString()}
              </Text>
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
              <Text style={styles.dateText}>
                {toDate.toLocaleDateString()}
              </Text>
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

        {/* Ticket Number */}
        <TextInput
          placeholder="Ticket Number"
          placeholderTextColor="#999"
          style={styles.input}
        />

        {/* Group & Mode */}
        <View style={styles.row}>
          <Picker style={styles.halfPicker}>
            <Picker.Item label="Select" value="" />
          </Picker>
          <Picker style={styles.halfPicker}>
            <Picker.Item label="Mode" value="" />
          </Picker>
        </View>

        {/* Agent */}
        <Picker style={styles.picker}>
          <Picker.Item label="Agent" value="" />
        </Picker>

        {/* Generate Report Button */}
        <TouchableOpacity style={styles.generateButton}>
          <Text style={styles.generateButtonText}>Generate Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Styles
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
