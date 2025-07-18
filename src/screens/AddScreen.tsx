import React, { useEffect, useState,  } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
    Modal,
     TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, NavigationProp} from '@react-navigation/native';
import { TextInput as RNTextInput, } from 'react-native';

type Entry = {
  number: string;
  count: number;
  type: string;
};

type RootStackParamList = {
  Add: { pastedText?: string };
  Paste: undefined;
};

const checkboxOptions = [
  { key: 'range', label: 'Range' },
  { key: 'set', label: 'Set' },
  { key: 'hundred', label: '100' },
  { key: 'tripleOne', label: '111' },
];
const timeOptions = [
  { label: 'LSK 3 PM', color: '#f15b87', shortCode: 'LSK3' },
  { label: 'DEAR 1 PM', color: '#1fb9cc', shortCode: 'D-1-' },
  { label: 'DEAR 6 PM', color: '#113d57', shortCode: 'D-6-' },
  { label: 'DEAR 8 PM', color: '#3c6248', shortCode: 'D-8-' },
];

const AddScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Add'>>();
const [modalVisible, setModalVisible] = useState(false);
const [users, setUsers] = useState<string[]>([]);
const [allUsers, setAllUsers] = useState<string[]>([]);
const [selectedAgent, setSelectedAgent] = useState('');
const [loggedInUser, setLoggedInUser] = useState('');

const [selectedColor, setSelectedColor] = useState('#f15b87');
const [selectedTime, setSelectedTime] = useState('LSK');
const [selectedCode, setSelectedCode] = useState('LSK3');

  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [rangeCount, setRangeCount] = useState('');
  const [number, setNumber] = useState('');
  const countInputRef = React.useRef<RNTextInput>(null);
const [successModalVisible, setSuccessModalVisible] = useState(false);
const [billNumber, setBillNumber] = useState('');

  const [count, setCount] = useState('');
  const [box, setBox] = useState('');
  const [name, setName] = useState('');
  
  const [toggleCount, setToggleCount] = useState(3);
  const [checkboxes, setCheckboxes] = useState({
    range: false,
    set: false,
    hundred: false,
    tripleOne: false,
  });
  const [entries, setEntries] = useState<Entry[]>([]);

  const toggleCheckbox = (key: string) => {
    setCheckboxes({ ...checkboxes, [key as keyof typeof checkboxes]: !checkboxes[key as keyof typeof checkboxes] });
  };

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


  const handleClear = () => {
    setNumber('3');
    setCount('');
    setBox('');
    setName('');
    setRangeStart('');
    setRangeEnd('');
    setRangeCount('');
    setCheckboxes({ range: false, set: false, hundred: false, tripleOne: false });
    setEntries([]);
  };
const getPermutations = (str: string): string[] => {
  if (str.length <= 1) return [str];
  const result = new Set<string>();

  const permute = (arr: string[], m = '') => {
    if (arr.length === 0) {
      result.add(m);
    } else {
      for (let i = 0; i < arr.length; i++) {
        const copy = arr.slice();
        const next = copy.splice(i, 1);
        permute(copy, m + next);
      }
    }
  };

  permute(str.split(''));
  return Array.from(result);
};

  const handleTogglePress = () => {
    setToggleCount((prev) => (prev === 3 ? 2 : prev === 2 ? 1 : 3));
  };
const handleAddEntry = (type: string) => {
  const newEntries: Entry[] = [];

  const start = parseInt(rangeStart);
  const end = parseInt(rangeEnd);
  const rangeC = parseInt(rangeCount);
  const singleC = parseInt(count || '1');
  const boxC = parseInt(box || '0');

  const pushEntry = (number: string, count: number, entryType: string) => {
    newEntries.push({ number, count, type: entryType });
  };

  const useRange = checkboxes.range || checkboxes.hundred || checkboxes.tripleOne;

  // 🟩 When ALL is pressed
  if (type === 'ALL') {
    if (toggleCount === 3) {
      if (useRange) {
        if (isNaN(start) || isNaN(end) || isNaN(rangeC)) return;
        for (let i = start; i <= end; i++) {
          const num = i.toString().padStart(3, '0');
          pushEntry(num, rangeC, `${selectedCode}SUPER`);
          pushEntry(num, rangeC, `${selectedCode}BOX`);
        }
      } else {
        if (!number || (!count && !box)) return;
        const num = number.padStart(3, '0');
        if (count) pushEntry(num, parseInt(count), `${selectedCode}SUPER`);
        if (box) pushEntry(num, parseInt(box), `${selectedCode}BOX`);
      }
    } else if (toggleCount === 2) {
      if (useRange) {
        if (isNaN(start) || isNaN(end) || isNaN(rangeC)) return;
        for (let i = start; i <= end; i++) {
          const num = i.toString().padStart(3, '0');
          pushEntry(num, rangeC, `${selectedCode}AB`);
          pushEntry(num, rangeC, `${selectedCode}BC`);
          pushEntry(num, rangeC, `${selectedCode}AC`);
        }
      } else {
        if (!number || isNaN(singleC)) return;
        const num = number.padStart(3, '0');
        pushEntry(num, singleC, `${selectedCode}AB`);
        pushEntry(num, singleC, `${selectedCode}BC`);
        pushEntry(num, singleC, `${selectedCode}AC`);
      }
    } else if (toggleCount === 1) {
      if (useRange) {
        if (isNaN(start) || isNaN(end) || isNaN(rangeC)) return;
        for (let i = start; i <= end; i++) {
          const num = i.toString().padStart(3, '0');
          pushEntry(num, rangeC, `${selectedCode}-A`);
          pushEntry(num, rangeC, `${selectedCode}-B`);
          pushEntry(num, rangeC, `${selectedCode}-C`);
        }
      } else {
        if (!number || isNaN(singleC)) return;
        const num = number.padStart(3, '0');
        pushEntry(num, singleC, `${selectedCode}-A`);
        pushEntry(num, singleC, `${selectedCode}-B`);
        pushEntry(num, singleC, `${selectedCode}-C`);
      }
    }
  } else {
    // 🟦 Normal entries (not ALL)
    if (useRange) {
      if (isNaN(start) || isNaN(end) || isNaN(rangeC)) return;

      if (checkboxes.range) {
        for (let i = start; i <= end; i++) {
          const num = i.toString().padStart(3, '0');
          pushEntry(num, rangeC, type);
        }
      }

      if (checkboxes.hundred) {
        for (let i = start; i <= end; i += 100) {
          const num = i.toString().padStart(3, '0');
          pushEntry(num, rangeC, type);
        }
      }

      if (checkboxes.tripleOne) {
        for (let i = 111; i <= 999; i += 111) {
          if (i >= start && i <= end) {
            const num = i.toString();
            pushEntry(num, rangeC, type);
          }
        }
      }
    } else {
      if (!number || isNaN(singleC)) return;
const num = number;

      if (checkboxes.set) {
        const perms = getPermutations(num);
        const uniquePerms = [...new Set(perms)];
        for (const perm of uniquePerms) {
          pushEntry(perm, singleC, type);
        }
      } else {
        pushEntry(num, singleC, type);
      }
    }
  }

  setEntries(prev => [...prev, ...newEntries]);
  setNumber('');
  setCount('');
  setBox('');
  setRangeStart('');
  setRangeEnd('');
  setRangeCount('');
};
const handleSave = async () => {

const payload = {
  entries,
  timeLabel: selectedTime,
  timeCode: selectedCode,
  createdBy: name || 'guest',
  toggleCount: toggleCount, // ✅ send toggle count
  selectedAgent: selectedAgent || loggedInUser, // ✅ optionally send selected user
};



  try {
    console.log('📤 Sending payload:', payload);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch('https://manu-netflix.onrender.com/addEntries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const text = await response.text();
    console.log('📥 Response:', text);

    const data = JSON.parse(text);
    if (response.ok) {
      setBillNumber(data?.billNo || '000000');
      setSuccessModalVisible(true); // ✅ show modal
      setEntries([]); // clear table
    } else {
      alert('❌ Error saving: ' + data.message);
    }
  } catch (err: any) {
    console.error('❌ Save error:', err.message || err);
    alert('❌ Network error. Please try again.');
  }
};



  const handleDeleteEntry = (indexToDelete: number) => {
    setEntries((prev) => prev.filter((_, index) => index !== indexToDelete));
  };

  useEffect(() => {
    const pasted = route?.params?.pastedText;
    if (pasted) {
      const lines = pasted.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const newEntries: Entry[] = [];
      for (const line of lines) {
        const cleaned = line.replace(/[^0-9\s-]/g, '').trim();
        const parts = cleaned.split(/[-\s]+/);
        if (parts.length >= 1) {
          const number = parts[0].trim();
          const count = parts[1] ? parseInt(parts[1].trim()) : 1;
          if (/^\d{3}$/.test(number) && !isNaN(count)) {
            newEntries.push({ number, count, type: 'LSK3-SUPER' });
          }
        }
      }
      setEntries((prev) => [...prev, ...newEntries]);
    }
  }, [route?.params?.pastedText]);


  return (
<View style={[styles.page, { backgroundColor: selectedColor }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
<TouchableOpacity
  style={styles.headerBtn}
  onPress={() => setModalVisible(true)}
>
  <Text style={[styles.headerBtnText, { color: selectedColor }]}>
    {selectedTime}
  </Text>
</TouchableOpacity>


          <TouchableOpacity style={styles.headerBtn} onPress={handleTogglePress}>
  <Text style={[styles.headerBtnText, { color: selectedColor }]}>
    {toggleCount}
  </Text>
</TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
  <Text style={styles.saveButtonText}>SAVE</Text>
</TouchableOpacity>

        </View>
<View style={styles.nameInput}>
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


</View>

<Modal visible={successModalVisible} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.successBox}>
      <Text style={styles.successIcon}>😎</Text>
      <Text style={styles.successText}>Success</Text>
      <Text style={styles.billText}>Bill No #{billNumber}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.successBtn, { backgroundColor: '#f85a8f' }]}
          onPress={() => {
            setSuccessModalVisible(false);
            // Navigate or view bill
          }}
        >
          <Text style={styles.successBtnText}>View Bill</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.successBtn, { backgroundColor: '#d2f0df' }]}
          onPress={() => setSuccessModalVisible(false)}
        >
          <Text style={[styles.successBtnText, { color: '#000' }]}>Ok</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>


       <View style={styles.checkboxRow}>
  {checkboxOptions
    .filter(({ key }) => !(toggleCount === 1 && key === 'set')) // 👈 filter out 'set' if toggleCount is 2
    .map(({ key, label }) => (
      <TouchableOpacity key={key} style={styles.checkboxItem} onPress={() => toggleCheckbox(key)}>
        <View style={[styles.checkboxBox, checkboxes[key as keyof typeof checkboxes] && styles.checkboxChecked]}>
          {checkboxes[key as keyof typeof checkboxes] && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>{label}</Text>
      </TouchableOpacity>
  ))}
</View>
{checkboxes.range || checkboxes.hundred || checkboxes.tripleOne ? (
  <View style={styles.inputRow}>
    <TextInput
      style={styles.input}
      placeholder="Start"
      value={rangeStart}
      onChangeText={(text) => setRangeStart(text.replace(/[^0-9]/g, ''))}
      keyboardType="numeric"
    />
    <TextInput
      style={styles.input}
      placeholder="End"
      value={rangeEnd}
      onChangeText={(text) => setRangeEnd(text.replace(/[^0-9]/g, ''))}
      keyboardType="numeric"
    />
    <TextInput
      style={styles.input}
      placeholder="Count"
      value={rangeCount}
      onChangeText={(text) => setRangeCount(text.replace(/[^0-9]/g, ''))}
      keyboardType="numeric"
    />
 
  </View>
) : (
  <View style={styles.inputRow}>
 <TextInput
  style={styles.input}
  placeholder="Number"
  value={number}
  onChangeText={(text) => {
    const clean = text.replace(/[^0-9]/g, ''); // remove non-numeric
    const limited = clean.slice(0, toggleCount); // limit by toggleCount
    setNumber(limited);
  }}
  keyboardType="numeric"
/>

 <TextInput
  ref={countInputRef} // this connects the input to the ref
  style={styles.input}
  placeholder="Count"
  value={count}
  onChangeText={(text) => setCount(text.replace(/[^0-9]/g, ''))}
  keyboardType="numeric"
/>

    {toggleCount === 3 && (
      <TextInput
        style={styles.input}
        placeholder="Box"
        value={box}
        onChangeText={setBox}
              keyboardType="numeric"

      />
    )}
  </View>
)}

        <TextInput style={styles.namedInput} placeholder="Name" value={name} onChangeText={setName} />
<View style={styles.buttonRow}>
  {toggleCount === 1 ? (
    <>
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#E91E63' }]} onPress={() => handleAddEntry(`${selectedCode}-A`)}>
<Text style={styles.actionText}>{selectedCode}A</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#9C27B0' }]} onPress={() => handleAddEntry(`${selectedCode}-B`)}>
<Text style={styles.actionText}>{selectedCode}B</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#3F51B5' }]} onPress={() => handleAddEntry(`${selectedCode}-C`)}>
<Text style={styles.actionText}>{selectedCode}C</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#007AFF' }]} onPress={() => handleAddEntry('ALL')}>
        <Text style={styles.actionText}>ALL</Text>
      </TouchableOpacity>
    </>
  ) : toggleCount === 2 ? (
    <>
<TouchableOpacity style={[styles.actionButton, { backgroundColor: '#FF9800' }]} onPress={() => handleAddEntry(`${selectedCode}AB`)}>
  <Text style={styles.actionText}>{selectedCode}AB</Text>
</TouchableOpacity>
<TouchableOpacity style={[styles.actionButton, { backgroundColor: '#795548' }]} onPress={() => handleAddEntry(`${selectedCode}AC`)}>
  <Text style={styles.actionText}>{selectedCode}AC</Text>
</TouchableOpacity>
<TouchableOpacity style={[styles.actionButton, { backgroundColor: '#03A9F4' }]} onPress={() => handleAddEntry(`${selectedCode}BC`)}>
  <Text style={styles.actionText}>{selectedCode}BC</Text>
</TouchableOpacity>
<TouchableOpacity style={[styles.actionButton, { backgroundColor: '#007AFF' }]} onPress={() => handleAddEntry('ALL')}>
  <Text style={styles.actionText}>ALL</Text>
</TouchableOpacity>

    </>
  ) : (
    <>
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#4CAF50' }]} onPress={() => handleAddEntry(`${selectedCode}SUPER`)}>
        <Text style={styles.actionText}>{selectedCode}SUPER</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#9C27B0' }]} onPress={() => handleAddEntry(`${selectedCode}BOX`)}>
        <Text style={styles.actionText}>{selectedCode}BOX</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#007AFF' }]} onPress={() => handleAddEntry('ALL')}>
        <Text style={styles.actionText}>ALL</Text>
      </TouchableOpacity>
    </>
  )}
</View>

<View style={styles.entrySection}>
  <View style={styles.statsRow}>
    <Text style={styles.statsText}>Count: {entries.length}</Text>
    <Text style={styles.statsText}>Total Collect: ₹{entries.reduce((sum, e) => sum + e.count * 10, 0).toFixed(2)}</Text>
  </View>

 <View style={{ height: 340 }}>
  <ScrollView
    contentContainerStyle={{ paddingBottom: 12 }}
    showsVerticalScrollIndicator={true}
  >
    {entries.map((entry, index) => (
      <View
        key={index}
        style={[
          styles.tableRow,
          { backgroundColor: index % 2 === 0 ? '#ffffff' : '#e3ecd4' },
        ]}
      >
        <Text style={styles.tableCell}>{entry.type}</Text>
        <Text style={styles.tableCell}>{entry.number}</Text>
        <Text style={styles.tableCell}>{entry.count}</Text>
        <Text style={styles.tableCell}>{(entry.count * 8).toFixed(2)}</Text>
        <Text style={styles.tableCell}>{(entry.count * 10).toFixed(2)}</Text>
        <TouchableOpacity
          onPress={() => handleDeleteEntry(index)}
          style={{ flex: 0.8, alignItems: 'center' }}
        >
          <Ionicons name="trash" size={20} color="red" />
        </TouchableOpacity>
      </View>
    ))}
  </ScrollView>
</View>
<Modal
  transparent
  visible={modalVisible}
  animationType="fade"
  onRequestClose={() => setModalVisible(false)}
>
  <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
    <View style={styles.modalOverlay}>
      <TouchableWithoutFeedback>
        <View style={styles.modalBox}>
          {timeOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.modalItem, { backgroundColor: option.color }]}
              onPress={() => {
                setSelectedTime(option.label);
                setSelectedCode(option.shortCode);
                setSelectedColor(option.color);
                setModalVisible(false);
              }}
            >
              <Text style={styles.modalItemText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableWithoutFeedback>
    </View>
  </TouchableWithoutFeedback>
</Modal>



  <View style={styles.tableFooter}>
    <Text style={styles.footerText}>
      Total Pay: ₹{entries.reduce((sum, e) => sum + e.count * 10, 0).toFixed(2)}
    </Text>
  </View>
</View>

  </ScrollView>

      <View style={styles.footerRow}>
        <TouchableOpacity style={[styles.footerBtn, { backgroundColor: '#ccc' }]} onPress={handleClear}>
          <Text style={styles.footerBtnText}>CLEAR</Text>
        </TouchableOpacity>
<TouchableOpacity
  style={[styles.footerBtn, { backgroundColor: '#FF3B30' }]}
  onPress={() => navigation.navigate('Main')}
>
  <Text style={styles.footerBtnText}>MENU</Text>
</TouchableOpacity>

        <TouchableOpacity style={[styles.footerBtn, { backgroundColor: '#34C759' }]} onPress={() => navigation.navigate('Paste')}>
          <Ionicons name="logo-whatsapp" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AddScreen;
// Your imports and component logic remains the same from above...

// Append the styles at the end of your file
const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  container: {
    padding: 16,
    marginTop: 30,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#FFD700',
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#1C1C1C',
    fontWeight: 'bold',
  },
  headerBtn: {
    backgroundColor: '#FFFFFF',
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 12,
  },
  headerBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'red',
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: '#c3f7ce',
  },
  namedInput: {
  backgroundColor: '#fff',
  paddingHorizontal: 10,
  paddingVertical: 0,
  borderRadius: 8,
  marginBottom: 16,
  justifyContent: 'center',
  height : 40,
},

  checkboxChecked: {
    backgroundColor: '#fff',
  },
  checkmark: {
    color: '#FF476F',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#fff',
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    padding: 10,
    borderRadius: 8,
  },
 nameInput: {
  backgroundColor: '#fff',
  paddingHorizontal: 10,
  paddingVertical: 0,
  borderRadius: 8,
  marginBottom: 16,
  justifyContent: 'center',
},

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  actionButton: {
    flex: 1,
    padding: 14,
    marginHorizontal: 4,
    alignItems: 'center',
    borderRadius: 8,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
  },
entrySection: {
  backgroundColor: '#F2F2F2',
  borderRadius: 8,
  marginTop: 12,
  height: 386, // Fixed height total
  width: 365,
  marginLeft: -7,
  overflow: 'hidden',
},

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#e3ecd7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
  },
  statsText: {
    fontWeight: 'bold',
    color: '#333',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 3,
  },
  tableCell: {
    flex: 1,
    fontSize: 11,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#000',
    height: 19,
  },
  tableFooter: {
    padding: 30,
    backgroundColor: '#e3ecd4',
    alignItems: 'flex-end',
  },
  footerText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparant',
    padding: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    marginBottom: 20,
  },
  footerBtn: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderRadius: 8,
  },
  footerBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.83)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalBox: {
  backgroundColor: 'transparent',
  borderRadius: 12,
  paddingVertical: 16,
  paddingHorizontal: 10,
  width: '75%',
  elevation: 10,
  shadowColor: 'black',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
},
modalItem: {
  paddingVertical: 18,
  alignItems: 'center',
  marginVertical: 5,
  borderRadius: 8,
},
modalItemText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
},

  textStyle: {
    color: 'black',
    fontWeight: 'bold',
  },

modalItem0: { backgroundColor: '#f15b87' },
modalItem1: { backgroundColor: '#1fb9cc' },
modalItem2: { backgroundColor: '#113d57' },
modalItem3: { backgroundColor: '#3c6248' },
modalItemText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
},
successBox: {
  width: '80%',
  backgroundColor: '#fff',
  borderRadius: 10,
  padding: 20,
  alignItems: 'center',
},
successIcon: {
  fontSize: 30,
  marginBottom: 10,
},
successText: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 5,
},
billText: {
  fontSize: 16,
  marginBottom: 20,
},
successBtn: {
  flex: 1,
  paddingVertical: 12,
  borderRadius: 8,
  marginHorizontal: 5,
  alignItems: 'center',
},
successBtnText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 14,
},


});
