import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

const TicketLimitScreen = () => {
  const [group1, setGroup1] = useState<{ A: string; B: string; C: string }>({
    A: '',
    B: '',
    C: '',
  });
  const [group2, setGroup2] = useState<{ AB: string; BC: string; AC: string }>({
    AB: '',
    BC: '',
    AC: '',
  });
  const [group3, setGroup3] = useState<{ SUPER: string; BOX: string }>({
    SUPER: '',
    BOX: '',
  });

const handleSave = async () => {
  const payload = {
    group1,
    group2,
    group3,
    createdBy: 'admin', // or fetch from AsyncStorage if needed
  };

  try {
    const response = await fetch('https://manu-netflix.onrender.com/ticket-limit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (response.ok) {
      alert('Ticket limits saved successfully!');
    } else {
      alert(result.message || 'Failed to save');
    }
  } catch (error) {
    console.error('Save error:', error);
    alert('Error saving data');
  }
};


  const renderInputRow = <T extends Record<string, string>>(
    groupLabel: string,
    fields: (keyof T)[],
    values: T,
    setValues: React.Dispatch<React.SetStateAction<T>>
  ) => (
    <View style={styles.group}>
      <Text style={styles.label}>{groupLabel}</Text>
      <View style={styles.inputRow}>
        {fields.map((field) => (
          <TextInput
            key={field as string}
            style={styles.input}
            placeholder={field as string}
            keyboardType="numeric"
            value={values[field]}
            onChangeText={(text) =>
              setValues((prev) => ({ ...prev, [field]: text }))
            }
          />
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Ticket Limit</Text>

      {renderInputRow('Group 1', ['A', 'B', 'C'], group1, setGroup1)}
      {renderInputRow('Group 2', ['AB', 'BC', 'AC'], group2, setGroup2)}
      {renderInputRow('Group 3', ['SUPER', 'BOX'], group3, setGroup3)}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default TicketLimitScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#f4f4f4',
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  group: {
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    marginBottom: 8,
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    flex: 1,
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
