import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Domain } from './NetPayScreen';

const CreateUserScreen = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedScheme, setSelectedScheme] = useState('Scheme 1');
  const [isMaster, setIsMaster] = useState(false); // <-- new checkbox state

  const handleSave = async () => {
    if (!username || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const createdBy = await AsyncStorage.getItem('username');
    const payload = {
      username,
      password,
      scheme: selectedScheme,
      createdBy: createdBy || 'Unknown',
  usertype: isMaster ? 'master' : 'sub', // <-- key line
    };

    try {
      const response = await fetch(`${Domain}/newuser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'User created successfully');
        navigation.goBack();
      } else {
        Alert.alert('Failed', result.message || 'Something went wrong');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create user');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Create Users</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Role Label */}
      <Text style={styles.roleLabel}>AGENT</Text>

      {/* Inputs */}
      <TextInput
        placeholder="User Name"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        placeholderTextColor="#888"
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        placeholderTextColor="#888"
      />
      <TextInput
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={styles.input}
        placeholderTextColor="#888"
        
      />

      {/* Picker */}
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedScheme}
          onValueChange={(itemValue) => setSelectedScheme(itemValue)}
          style={styles.picker}>
          <Picker.Item label="Scheme 1" value="Scheme 1" />
          <Picker.Item label="Scheme 2" value="Scheme 2" />
          <Picker.Item label="Scheme 3" value="Scheme 3" />
          <Picker.Item label="Scheme 4" value="Scheme 4" />
          <Picker.Item label="Scheme 5" value="Scheme 5" />
        </Picker>
      </View>

<TouchableOpacity
  style={styles.customCheckboxContainer}
  onPress={() => setIsMaster(!isMaster)}
  activeOpacity={0.8}
>
  <View style={[styles.customCheckbox, isMaster && styles.customCheckboxChecked]}>
    {isMaster && <Text style={styles.checkmark}>✓</Text>}
  </View>
  <Text style={styles.checkboxLabel}>Allow to create user</Text>
</TouchableOpacity>


      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CreateUserScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    marginTop: Platform.OS === 'ios' ? 50 : 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  roleLabel: {
    alignSelf: 'center',
    color: '#F7B801',
    fontWeight: 'bold',
    marginVertical: 10,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    fontSize: 16,
    paddingVertical: 10,
    marginBottom: 20,
  },
  pickerWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    marginBottom: 30,
  },
  picker: {
    width: '100%',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#f7254e',
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
  },
  customCheckboxContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 20,
},

customCheckbox: {
  width: 22,
  height: 22,
  borderWidth: 2,
  borderColor: '#999',
  borderRadius: 4,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#fff',
},

customCheckboxChecked: {
  backgroundColor: '#f7254e',
  borderColor: '#f7254e',
},

checkmark: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 14,
},

  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
