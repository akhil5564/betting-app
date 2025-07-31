import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';

const EditUserScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const selectedUser = route.params?.user;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [percentage, setPercentage] = useState('');
  const [scheme, setScheme] = useState('Scheme 1');
  const [allowSubStockist, setAllowSubStockist] = useState(false);
  const [allowAgents, setAllowAgents] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (selectedUser) {
      setUsername(selectedUser.username || '');
      setPassword(selectedUser.password || '');
      setPercentage(selectedUser.percentage?.toString() || '0');
      setScheme(selectedUser.scheme || 'Scheme 1');
      setAllowSubStockist(selectedUser.allowSubStockist || false);
      setAllowAgents(selectedUser.allowAgents || false);
      setBlocked(selectedUser.blocked || false);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (blocked) {
      console.log(`🔒 User ${username} has been blocked.`);
    } else {
      console.log(`✅ User ${username} is unblocked.`);
    }
  }, [blocked]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Users</Text>
      </View>

      <View style={[styles.card, blocked && styles.blockedCard]}>
        <View style={styles.topBar}>
          <Text style={styles.topBarText}>Edit User</Text>
        </View>

        <Text style={styles.label}>User Name</Text>
        <TextInput style={styles.input} value={username} editable={false} />

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} />

        <Text style={styles.label}>Percentage</Text>
        <TextInput
          style={styles.input}
          value={percentage}
          onChangeText={setPercentage}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Scheme</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={scheme} onValueChange={setScheme} style={styles.picker}>
            <Picker.Item label="Scheme 1" value="Scheme 1" />
            <Picker.Item label="Scheme 2" value="Scheme 2" />
            <Picker.Item label="Scheme 3" value="Scheme 3" />
          </Picker>
        </View>

        <Text style={styles.label}>Permissions</Text>
        <View style={styles.checkboxRow}>
          <Switch value={allowSubStockist} onValueChange={setAllowSubStockist} />
          <Text style={styles.checkboxLabel}>Allow create sub stockists</Text>
        </View>
        <View style={styles.checkboxRow}>
          <Switch value={allowAgents} onValueChange={setAllowAgents} />
          <Text style={styles.checkboxLabel}>Allow create agents</Text>
        </View>

        <View style={styles.checkboxRow}>
          <Switch value={blocked} onValueChange={setBlocked} />
          <Text style={styles.checkboxLabel}>Block this user</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, blocked ? styles.blockedButton : styles.saveButton]}
          >
            <Text style={styles.buttonText}>{blocked ? 'SalesBlock' : 'Save'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: '#f1f1f1',
    flexGrow: 1,
    marginTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    marginLeft: 15,
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
    paddingBottom: 20,
  },
  blockedCard: {
    backgroundColor: '#ffe5e5', // light red tint when blocked
  },
  topBar: {
    backgroundColor: '#f36',
    padding: 12,
  },
  topBarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 15,
    marginLeft: 15,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#aaa',
    marginHorizontal: 15,
    paddingVertical: 6,
    fontSize: 16,
  },
  pickerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#aaa',
    marginHorizontal: 15,
  },
  picker: {
    fontSize: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
    marginTop: 10,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    marginHorizontal: 15,
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 4,
  },
  saveButton: {
    backgroundColor: '#f36',
  },
  blockedButton: {
    backgroundColor: '#d00', // dark red for SalesBlock
  },
  cancelButton: {
    backgroundColor: '#888',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default EditUserScreen;
