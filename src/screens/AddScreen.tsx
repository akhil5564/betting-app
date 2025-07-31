import React, { useEffect, useState, useRef } from 'react';
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
  type:keyof typeof rates;
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
const focusNumberInput = () => {
  numberInputRef.current?.focus();
};

const AddScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Add'>>();
const [modalVisible, setModalVisible] = useState(false);
const [users, setUsers] = useState<string[]>([]);
const [allUsers, setAllUsers] = useState<string[]>([]);
const [selectedAgent, setSelectedAgent] = useState('');
const [loggedInUser, setLoggedInUser] = useState('');

const [selectedColor, setSelectedColor] = useState('#f15b87');
const [selectedTime, setSelectedTime] = useState('LSK 3 PM');
const [selectedCode, setSelectedCode] = useState('LSK3');
const numberInputRef = useRef<TextInput>(null);
const [assignedRates, setAssignedRates] = useState<Record<string, number>>({});
const [rates, setRates] = useState<number[]>([]);
const [billNumber, setBillNumber] = useState('');

  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [rangeCount, setRangeCount] = useState('');
  const [number, setNumber] = useState('');
  const countInputRef = React.useRef<RNTextInput>(null);
const [successModalVisible, setSuccessModalVisible] = useState(false);

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
const labelMap = ['SUPER', 'BOX', 'AB', 'BC', 'AC', 'A', 'B', 'C'];

  const toggleCheckbox = (key: string) => {
    setCheckboxes({ ...checkboxes, [key as keyof typeof checkboxes]: !checkboxes[key as keyof typeof checkboxes] });
  };

useEffect(() => {
  const load = async () => {
    const stored = await AsyncStorage.getItem('user');
    const parsed = stored ? JSON.parse(stored) : null;
    const username = parsed?.username || null;
    fetchAndShowRates(username);
  };

  load();
}, []);


useEffect(() => {
  const getUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    const parsed = userData ? JSON.parse(userData) : null;
    setLoggedInUser(parsed?.username || null);
  };

  getUser();
}, []);

  useEffect(() => {
    if (loggedInUser) {
      fetchAndShowRates(loggedInUser);
    }
  }, [loggedInUser]);

const isWithinAllowedTime = (code: string) => {
  const now = new Date();
  const today = now.toISOString().split('T')[0]; // yyyy-mm-dd

  const blockTime = drawBlockTimes[code];
  if (!blockTime) return true; // If no block time, allow

  const [hour, minute] = blockTime.split(':').map(Number);
  const blockDate = new Date(`${today}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`);

  return now < blockDate;
};

  const fetchAndShowRates = async (user: string | null) => {
  try {
    const draw = 'DEAR 1 PM';

    if (!user || !draw) {
      console.log('⚠️ Missing user or draw info');
      return;
    }

    const response = await fetch(
      `https://manu-netflix.onrender.com/rateMaster?user=${encodeURIComponent(user)}&draw=${encodeURIComponent(draw)}`
    );

    const data = await response.json();
    console.log('🌐 Full API Response:', data);

    const labelMap = ['super', 'box', 'ab', 'bc', 'ac', 'a', 'b', 'c'];

    let ratesArray = [];

    if (data && Array.isArray(data.rates)) {
      ratesArray = data.rates.map((r) => r.rate);
    } else {
      ratesArray = new Array(8).fill(0);
    }

    setRates(ratesArray); // <-- Save to state

  } catch (error) {
    console.error('❌ Error fetching rates:', error);
  }
};




useEffect(() => {
  if (loggedInUser) {
    fetchAndShowRates(loggedInUser);
  }
}, [loggedInUser]);


  
useEffect(() => {
  const loadUserAndUsers = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('username');
      if (storedUser) {
        setLoggedInUser(storedUser);

        const response = await fetch('https://manu-netflix.onrender.com/users');
        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
          const filteredUsers = data.filter(
            (u: any) => u.createdBy === storedUser
          );

          const usernames = filteredUsers
            .map((u: any) => u.username)
            .filter((username: any) => typeof username === 'string' && username.trim() !== '');

          setAllUsers(usernames);
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

useEffect(() => {
  fetchAndShowRates();
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
const getRate = (type: string): number => {
  const found = rates.find(r => r.label.toLowerCase() === type.toLowerCase());
  return found?.rate ?? 0;
};
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
const finalCount = parseInt(count || '1');
pushEntry(num, finalCount, `${selectedCode}SUPER`);

const boxCount = box ? parseInt(box) : finalCount;
pushEntry(num, boxCount, `${selectedCode}BOX`);

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
const checkAndFilterEntries = async () => {
  const dateStr = selectedDate.toISOString().split('T')[0];

  // 1. Group entries by number
  const numberCounts: Record<string, number> = {};
  entries.forEach((entry) => {
    numberCounts[entry.number] = (numberCounts[entry.number] || 0) + 1;
  });

  const allNumbers = Object.keys(numberCounts);

  // 2. Get existing counts from DB
  const res = await fetch('https://manu-netflix.onrender.com/countByNumber', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      numbers: allNumbers,
      date: dateStr,
      timeLabel: selectedTime,
    }),
  });

  const existingCounts = await res.json(); // e.g., { "123": 48 }

  // 3. Filter entries that won't exceed limit
  const maxLimit = 50;
  const filteredEntries: any[] = [];
  const tempCounts = { ...existingCounts }; // current DB count

  for (const entry of entries) {
    const currentDBCount = tempCounts[entry.number] || 0;
    if (currentDBCount < maxLimit) {
      filteredEntries.push(entry);
      tempCounts[entry.number] = currentDBCount + 1; // update temp count
    }
  }

  return filteredEntries;
};


const handleSave = async () => {
  const drawBlockTimes: Record<string, string> = {
    'DEAR 1 PM': '12:57',
    'LSK 3 PM': '15:02',
    'DEAR 6 PM': '17:57',
    'DEAR 8 PM': '19:57',
  };

  const isWithinAllowedTime = (label: string) => {
    const block = drawBlockTimes[label];
    if (!block) return true;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const [h, m] = block.split(':').map(Number);
    const blockTime = new Date(`${todayStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
    return now <= blockTime;
  };

  if (!isWithinAllowedTime(selectedTime)) {
    alert('⛔ Entry time is over for this draw!');
    return;
  }

  // ✅ Step 1: Group total new count by number
  const newNumberTotalCounts: Record<string, number> = {};
  entries.forEach(entry => {
    const count = entry.count || 1;
    newNumberTotalCounts[entry.number] = (newNumberTotalCounts[entry.number] || 0) + count;
  });

  const todayDateStr = new Date().toISOString().split('T')[0];
  const numbersToCheck = Object.keys(newNumberTotalCounts);

  // ✅ Step 2: Fetch existing DB counts
  let existingCounts: Record<string, number> = {};
  try {
    const res = await fetch('https://manu-netflix.onrender.com/countByNumber', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numbers: numbersToCheck,
        date: todayDateStr,
        timeLabel: selectedTime,
      }),
    });
console.log('📨 Checking counts for:', {
  numbers: numbersToCheck,
  date: todayDateStr,
  timeLabel: selectedTime,
});

    existingCounts = await res.json();
  } catch (err) {
    alert('❌ Failed to check number limits. Please try again.');
    return;
  }

  // ✅ Step 3: Allow entries if total count per number is within limit
  const maxCount = 50;
  const totalSoFar: Record<string, number> = { ...existingCounts };
  const validEntries: any[] = [];

  for (const entry of entries) {
    const num = entry.number;
    const count = entry.count || 1;
    const currentTotal = totalSoFar[num] || 0;

    // Only allow if new count won't push it beyond 50
    if (currentTotal + count <= maxCount) {
      validEntries.push(entry);
      totalSoFar[num] = currentTotal + count;
    }
  }

  if (validEntries.length === 0) {
    alert('⛔ All entries exceed the 50-count limit for some numbers.');
    return;
  }

  // ✅ Step 4: Proceed to save
  const payload = {
    entries: validEntries,
    timeLabel: selectedTime,
    timeCode: selectedCode,
    selectedAgent: selectedAgent || loggedInUser,
    createdBy: selectedAgent || loggedInUser,
    toggleCount: toggleCount,
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
      setSuccessModalVisible(true);
      setEntries([]);
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
    navigation.navigate('ViewBill', { billId: billNumber });
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
    ref={numberInputRef} // 👈 attaches the ref

        style={styles.input}
        placeholder="Number"
        value={number}
        onChangeText={(text) => {
          const clean = text.replace(/[^0-9]/g, '');
          const limited = clean.slice(0, toggleCount);
          setNumber(limited);

          if (limited.length === toggleCount) {
            countInputRef.current?.focus(); // 👈 jump focus
          }
        }}
        keyboardType="numeric"
        autoFocus={true}
      />

      <TextInput
        ref={countInputRef}
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
onPress={focusNumberInput}<Text style={styles.actionText}>{selectedCode}A</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#9C27B0' }]} onPress={() => handleAddEntry(`${selectedCode}-B`)}>
<Text style={styles.actionText}>{selectedCode}B</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#3F51B5' }]} onPress={() => handleAddEntry(`${selectedCode}-C`)}>
<Text style={styles.actionText}>{selectedCode}C</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#007AFF' }]} onPress={() => handleAddEntry('ALL')}>
      onPress={focusNumberInput}  <Text style={styles.actionText}>ALL</Text>
      </TouchableOpacity>
    </>
  ) : toggleCount === 2 ? (
    <>
<TouchableOpacity style={[styles.actionButton, { backgroundColor: '#FF9800' }]} onPress={() => handleAddEntry(`${selectedCode}AB`)}>
onPress={focusNumberInput}  <Text style={styles.actionText}>{selectedCode}AB</Text>
</TouchableOpacity>
<TouchableOpacity style={[styles.actionButton, { backgroundColor: '#795548' }]} onPress={() => handleAddEntry(`${selectedCode}AC`)}>
 onPress={focusNumberInput} <Text style={styles.actionText}>{selectedCode}AC</Text>
</TouchableOpacity>
<TouchableOpacity style={[styles.actionButton, { backgroundColor: '#03A9F4' }]} onPress={() => handleAddEntry(`${selectedCode}BC`)}>
 onPress={focusNumberInput} <Text style={styles.actionText}>{selectedCode}BC</Text>
</TouchableOpacity>
<TouchableOpacity style={[styles.actionButton, { backgroundColor: '#007AFF' }]} onPress={() => handleAddEntry('ALL')}>
onPress={focusNumberInput}  <Text style={styles.actionText}>ALL</Text>
</TouchableOpacity>

    </>
  ) : (
    <>
      <TouchableOpacity onPress={() => handleAdd('super')} style={[styles.actionButton, { backgroundColor: '#4CAF50' }]} onPress={() => handleAddEntry(`${selectedCode}SUPER`)}>
       onPress={focusNumberInput} <Text style={styles.actionText}>{selectedCode}SUPER</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#9C27B0' }]} onPress={() => handleAddEntry(`${selectedCode}BOX`)}>
      onPress={focusNumberInput}  <Text style={styles.actionText}>{selectedCode}BOX</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#007AFF' }]} onPress={() => handleAddEntry('ALL')}>
       onPress={focusNumberInput} <Text style={styles.actionText}>ALL</Text>
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
