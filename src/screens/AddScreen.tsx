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
  Dimensions,
    Modal,
     TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, NavigationProp} from '@react-navigation/native';
import { TextInput as RNTextInput, } from 'react-native';
const { width, height } = Dimensions.get('window');

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
type User = {
  username: string;
  usertype: string;
  // add other fields if needed
};

const [allUsers, setAllUsers] = useState<User[]>([]);
const [selectedAgent, setSelectedAgent] = useState(loggedInUser || '');
const [loggedInUser, setLoggedInUser] = useState('');
const [selectedMaster, setSelectedMaster] = useState('');
const [selectedSub, setSelectedSub] = useState('');
const masterUsers = allUsers.filter((u) => u.usertype === 'master');
const subUsers = allUsers.filter((u) => u.usertype === 'sub');
const [ticketLimits, setTicketLimits] = useState(null);
const numberRefs = useRef<TextInput[]>([]);

const focusFirstEmptyNumber = () => {
  const firstEmptyIndex = numbers.findIndex(n => n.trim() === '');
  if (firstEmptyIndex >= 0) {
    numberRefs.current[firstEmptyIndex]?.focus();
  }
};

const [selectedColor, setSelectedColor] = useState('#f15b87');
const [selectedTime, setSelectedTime] = useState('LSK 3 PM');
const [selectedCode, setSelectedCode] = useState('LSK3');
const numberInputRef = useRef<TextInput | null>(null);

const [assignedRates, setAssignedRates] = useState<Record<string, number>>({});
const [rates, setRates] = useState<number[]>([]);
const [billNumber, setBillNumber] = useState('');
const { width, height } = Dimensions.get('window');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [rangeCount, setRangeCount] = useState('');
  const [number, setNumber] = useState('');
  const countInputRef = React.useRef<RNTextInput>(null);
const [successModalVisible, setSuccessModalVisible] = useState(false);
const endInputRef = useRef<TextInput>(null);
const countInputRefRange = useRef<TextInput>(null);

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
  axios.get('https://manu-netflix.onrender.com/getticketLimit')
    .then((res) => setTicketLimits(res.data))
    .catch((err) => console.error('Error loading ticket limits:', err));
}, []);


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
        const result = await response.json();
        console.log('👀 Full /users API response:', result); // Add this!

        if (response.ok && Array.isArray(result)) {
          const otherUsers = result.filter((user) => user.username !== storedUser);

          const masters = otherUsers.filter((user) => user.usertype === 'master' && !user.blocked);
          const subs = otherUsers.filter((user) => user.usertype === 'sub' && !user.blocked);

          console.log('👑 Master Users:', masters.map((u) => u.username));
          console.log('👥 Sub Users:', subs.map((u) => u.username));

          setAllUsers(result);
        } else {
          console.error('❌ Invalid response format from /users API');
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
    setNumber('');
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
  const boxC = isNaN(parseInt(box)) ? singleC : parseInt(box); // ✅ fallback to count

  const pushEntry = (number: string, count: number, entryType: string) => {
    newEntries.push({ number, count, type: entryType });
  };

  const useRange = checkboxes.range || checkboxes.hundred || checkboxes.tripleOne;

  const addWithSetCheck = (num: string, countVal: number, entryType: string) => {
    if (checkboxes.set) {
      const perms = getPermutations(num);
      const unique = [...new Set(perms)];
      unique.forEach(perm => pushEntry(perm, countVal, entryType));
    } else {
      pushEntry(num, countVal, entryType);
    }
  };

  if (type === 'ALL') {
    if (toggleCount === 3) {
      const countVal = useRange ? rangeC : singleC;
      const boxVal = useRange ? rangeC : boxC;

      const loop = () => {
        let numbers: number[] = [];
        if (checkboxes.hundred) {
          numbers = Array.from({ length: 9 }, (_, idx) => (idx + 1) * 100);
        } else if (checkboxes.tripleOne) {
          numbers = Array.from({ length: 9 }, (_, idx) => (idx + 1) * 111);
        } else {
          numbers = Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
        }
        numbers.forEach(i => {
          if (i >= start && i <= end) {
const num = type === 'ALL' ? i.toString() : i.toString();
            addWithSetCheck(num, countVal, `${selectedCode}SUPER`);
            addWithSetCheck(num, boxVal, `${selectedCode}BOX`);
          }
        });
      };

      if (useRange) {
        if (isNaN(start) || isNaN(end) || isNaN(rangeC)) return;
        loop();
      } else {
        if (!number) return;
        const num = number;
        addWithSetCheck(num, countVal, `${selectedCode}SUPER`);
        addWithSetCheck(num, boxVal, `${selectedCode}BOX`);
      }

    } else if (toggleCount === 2) {
      const labels = ['AB', 'BC', 'AC'];

      const loop = () => {
        let numbers: number[] = [];
        if (checkboxes.hundred) {
          numbers = Array.from({ length: 9 }, (_, idx) => (idx + 1) * 100);
        } else if (checkboxes.tripleOne) {
          numbers = Array.from({ length: 9 }, (_, idx) => (idx + 1) * 111);
        } else {
          numbers = Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
        }
        numbers.forEach(i => {
          if (i >= start && i <= end) {
            const num = i.toString();
            labels.forEach(lab => addWithSetCheck(num, rangeC, `${selectedCode}${lab}`));
          }
        });
      };

      if (useRange) {
        if (isNaN(start) || isNaN(end) || isNaN(rangeC)) return;
        loop();
      } else {
        if (!number || isNaN(singleC)) return;
        const num = number;
        labels.forEach(lab => addWithSetCheck(num, singleC, `${selectedCode}${lab}`));
      }

    } else if (toggleCount === 1) {
      const labels = ['A', 'B', 'C'];

      const loop = () => {
        let numbers: number[] = [];
        if (checkboxes.hundred) {
          numbers = Array.from({ length: 9 }, (_, idx) => (idx + 1) * 100);
        } else if (checkboxes.tripleOne) {
          numbers = Array.from({ length: 9 }, (_, idx) => (idx + 1) * 111);
        } else {
          numbers = Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
        }
        numbers.forEach(i => {
          if (i >= start && i <= end) {
            const num = i.toString();
            labels.forEach(lab => addWithSetCheck(num, rangeC, `${selectedCode}-${lab}`));
          }
        });
      };

      if (useRange) {
        if (isNaN(start) || isNaN(end) || isNaN(rangeC)) return;
        loop();
      } else {
        if (!number || isNaN(singleC)) return;
        const num = number;
        labels.forEach(lab => addWithSetCheck(num, singleC, `${selectedCode}-${lab}`));
      }
    }

  } else {
    if (useRange) {
      if (isNaN(start) || isNaN(end) || isNaN(rangeC)) return;

      if (checkboxes.range) {
        for (let i = start; i <= end; i++) {
          addWithSetCheck(i.toString(), rangeC, type);
        }
      }
      if (checkboxes.hundred) {
        for (let i = start; i <= end; i += 100) {
          addWithSetCheck(i.toString(), rangeC, type);
        }
      }
      if (checkboxes.tripleOne) {
        for (let i = 111; i <= 999; i += 111) {
          if (i >= start && i <= end) {
            addWithSetCheck(i.toString(), rangeC, type);
          }
        }
      }
    } else {
      if (!number || isNaN(singleC)) return;
      addWithSetCheck(number, singleC, type);
    }
  }

  setEntries(prev => [...prev, ...newEntries]);
  setNumber('');
  setCount('');
  setBox('');
  setRangeStart('');
  setRangeEnd('');
  setRangeCount('');
  setTimeout(() => {
    numberInputRef.current?.focus();
      }, 50); 

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
  try {
    // Step 1: Get block/unblock time for draw
    const blockRes = await fetch(`https://manu-netflix.onrender.com/getBlockTime/${encodeURIComponent(selectedTime)}`);
    if (!blockRes.ok) throw new Error('Block time not set for this draw');
    const blockData = await blockRes.json();
    const { blockTime: blockTimeStr, unblockTime: unblockTimeStr } = blockData;
    if (!blockTimeStr || !unblockTimeStr) throw new Error('Block or unblock time missing');

    // Step 2: Check current time against block window
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const [bh, bm] = blockTimeStr.split(':').map(Number);
    const [uh, um] = unblockTimeStr.split(':').map(Number);
    const blockTime = new Date(`${todayStr}T${String(bh).padStart(2, '0')}:${String(bm).padStart(2, '0')}:00`);
    const unblockTime = new Date(`${todayStr}T${String(uh).padStart(2, '0')}:${String(um).padStart(2, '0')}:00`);
    if (now >= blockTime && now < unblockTime) {
      alert('⛔ Entry time is blocked for this draw!');
      return;
    }

    // Step 3: Fetch ticket limits (group1, group2, group3)
    const limitsRes = await fetch('https://manu-netflix.onrender.com/getticketLimit');
    if (!limitsRes.ok) throw new Error('Failed to fetch ticket limits');
    const ticketLimits = await limitsRes.json();

    // Merge groups for easier access: { A: '1000', AB: '100', SUPER: '150', ... }
    const allLimits = {
      ...ticketLimits.group1,
      ...ticketLimits.group2,
      ...ticketLimits.group3,
    };

    // Step 4: Sum counts per [type-number] from new entries
    const newTotalByNumberType = {};
    entries.forEach((entry) => {
      // Normalize type (remove selectedCode and dashes, uppercase)
      const rawType = entry.type.replace(selectedCode, '').replace(/-/g, '').toUpperCase();
      const key = `${rawType}-${entry.number}`;
      newTotalByNumberType[key] = (newTotalByNumberType[key] || 0) + (entry.count || 1);
    });

    const numbersToCheck = Object.keys(newTotalByNumberType);

    // Step 5: Fetch existing counts from backend
    const countRes = await fetch('https://manu-netflix.onrender.com/countByNumber', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numbers: numbersToCheck,
        date: todayStr,
        timeLabel: selectedTime,
      }),
    });
    if (!countRes.ok) throw new Error('Failed to fetch counts');
    const existingCounts = await countRes.json();

    // Step 6: Validate entries using limits + existing counts
    const totalSoFar = { ...existingCounts };
    const validEntries = [];
    const exceededEntries = [];

    for (const entry of entries) {
      const count = entry.count || 1;
      const rawType = entry.type.replace(selectedCode, '').replace(/-/g, '').toUpperCase();
      const key = `${rawType}-${entry.number}`;
      const maxLimit = parseInt(allLimits[rawType] || '9999', 10);
      const currentTotal = totalSoFar[key] || 0;

      // Calculate how many counts can still be added without exceeding limit
      const allowedCount = maxLimit - currentTotal;

      if (allowedCount <= 0) {
        // Already reached limit, skip this entry completely
        exceededEntries.push({ key, attempted: count, limit: maxLimit, existing: currentTotal, added: 0 });
        continue;
      }

      if (count <= allowedCount) {
        // Can add entire count
        validEntries.push(entry);
        totalSoFar[key] = currentTotal + count;
        exceededEntries.push({ key, attempted: count, limit: maxLimit, existing: currentTotal, added: count });
      } else {
        // Can only add partial count up to allowedCount
        validEntries.push({ ...entry, count: allowedCount });
        totalSoFar[key] = currentTotal + allowedCount;
        exceededEntries.push({ key, attempted: count, limit: maxLimit, existing: currentTotal, added: allowedCount });
      }
    }

    if (validEntries.length === 0) {
      alert('⛔ All entries exceed the allowed limit for some numbers.');
      return;
    }
    if (exceededEntries.length > 0) {
      const exceededMsg = exceededEntries
        .map(e => `${e.key}: Limit ${e.limit}, Existing ${e.existing}, Attempted ${e.attempted}, Added ${e.added}`)
        .join('\n');
      alert(`⚠️ Some entries were partially or fully skipped due to limits:\n${exceededMsg}`);
    }

    // Step 7: Save valid entries
    const payload = {
      entries: validEntries,
      timeLabel: selectedTime,
      timeCode: selectedCode,
      selectedAgent: selectedAgent || loggedInUser,
      createdBy: selectedAgent || loggedInUser,
      toggleCount: toggleCount,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const saveRes = await fetch('https://manu-netflix.onrender.com/addEntries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const saveData = await saveRes.json();

    if (saveRes.ok) {
      setBillNumber(saveData?.billNo || '000000');
      setSuccessModalVisible(true);
      setEntries([]);
    } else {
      alert('❌ Error saving: ' + (saveData?.message || 'Unknown error'));
    }
  } catch (err) {
    console.error('❌ Save error:', err.message || err);
    alert('❌ Network error. Please try again.');
  }
};




  const handleDeleteEntry = (indexToDelete: number) => {
    setEntries((prev) => prev.filter((_, index) => index !== indexToDelete));
  };
useEffect(() => {
  const pasted = route?.params?.pastedText;
  if (!pasted) return;

  const lines = pasted.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const newEntries: Entry[] = [];

  for (let line of lines) {
    const cleaned = line
      .toLowerCase()
      .trim()
      .replace(/[!@#$%^&(){}\[\];:'"<>\?\\|~`]+/g, '');

    // Case 1: abc 5 10 → A, B, C
    if (cleaned.startsWith('abc')) {
      const parts = cleaned.split(/[\s_\-=\+\/\.,\*]+/);
      if (parts.length === 3) {
        const number = parts[1];
        const count = parseInt(parts[2]);
        if (!isNaN(count)) {
          ['A', 'B', 'C'].forEach((type) => {
            newEntries.push({ number, count, type, timeLabel: selectedTime }); // ✅ timeLabel added
          });
        }
        continue;
      }
    }

    // Case 2: a 5 10
    const parts = cleaned.split(/[\s_\-=\+\/\.,\*]+/);
    if (['a', 'b', 'c'].includes(parts[0]) && parts.length === 3) {
      const type = parts[0].toUpperCase();
      const number = parts[1];
      const count = parseInt(parts[2]);
      if (!isNaN(count)) {
        newEntries.push({ number, count, type, timeLabel: selectedTime }); // ✅
      }
      continue;
    }

    // Case 3: a5=10 or b6-15
    const abcCompact = cleaned.match(/^([abc])(\d+)[\s_\-=\+\/\.,\*]+(\d+)$/);
    if (abcCompact) {
      const [, type, number, countStr] = abcCompact;
      const count = parseInt(countStr);
      if (!isNaN(count)) {
        newEntries.push({ number, count, type: type.toUpperCase(), timeLabel: selectedTime }); // ✅
      }
      continue;
    }

    // Case 4: 3-digit = 2.1 or 345.1+1
    const numberMatch = cleaned.match(/^(\d{3})/);
    if (numberMatch) {
      const number = numberMatch[1];
      const after = cleaned.slice(number.length);
      const nums = after.match(/(\d+)/g);
      if (nums) {
        const [superCountStr, boxCountStr] = nums;
        const superCount = parseInt(superCountStr);
        const boxCount = boxCountStr ? parseInt(boxCountStr) : null;

        if (!isNaN(superCount)) {
          newEntries.push({ number, count: superCount, type: 'SUPER', timeLabel: selectedTime }); // ✅
        }
        if (boxCount !== null && !isNaN(boxCount)) {
          newEntries.push({ number, count: boxCount, type: 'BOX', timeLabel: selectedTime }); // ✅
        }
        continue;
      }
    }
  }

  setEntries((prev) => [...prev, ...newEntries]);
}, [route?.params?.pastedText, selectedTime]);



  return (
<View style={[styles.page, { backgroundColor: selectedColor }]}>
<ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="always" style={styles.page}>
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
  
 <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: .3 }}>
  <View style={{ flex: 1, marginRight: 8 }}>
    <Picker
      selectedValue={selectedMaster}
      onValueChange={setSelectedMaster}
      style={{ backgroundColor: '#fff' }}
    >
      {masterUsers.map((user) => (
        <Picker.Item key={user._id} label={user.username} value={user.username} />
      ))}
    </Picker>
  </View>

  <View style={{ flex: 1, marginLeft: 8 }}>
    <Picker
      selectedValue={selectedSub}
      onValueChange={setSelectedSub}
      style={{ backgroundColor: '#fff' }}
    >
      {subUsers.map((user) => (
        <Picker.Item key={user._id} label={user.username} value={user.username} />
      ))}
    </Picker>
  </View>
</View>






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
  keyboardType="numeric"
  onChangeText={(text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const limited = cleaned.slice(0, toggleCount);
    setRangeStart(limited);

    // Auto focus End input when expected digits reached
    if (limited.length === toggleCount) {
      endInputRef.current?.focus();
    }
  }}
/>


<TextInput
  ref={endInputRef}
  style={styles.input}
  placeholder="End"
  value={rangeEnd}
  keyboardType="numeric"
  onChangeText={(text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const limited = cleaned.slice(0, toggleCount);
    setRangeEnd(limited);

    // 👇 Auto-focus Count when End reaches desired length
    if (limited.length === toggleCount) {
      countInputRefRange.current?.focus();
    }
  }}
/>



  <TextInput
  ref={countInputRefRange}
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
  ref={numberInputRef}
  style={styles.input}
  placeholder="Number"
  value={number}
  keyboardType="numeric"
  blurOnSubmit={false}        // keep keyboard when pressing enter
  returnKeyType="next"
  onChangeText={(text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const limited =
      toggleCount === 1 ? cleaned.slice(0, 1)
      : toggleCount === 2 ? cleaned.slice(0, 2)
      : cleaned.slice(0, 3);

    setNumber(limited);

    if (limited.length === toggleCount) {
      countInputRef.current?.focus(); // auto-focus next
    }
  }}
  onSubmitEditing={() => {
    countInputRef.current?.focus(); // when keyboard "Next" is pressed
  }}
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
    <Text style={styles.statsText}>Count: {entries.reduce((sum, e) => sum + e.count, 0)}</Text>
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
        <Text style={styles.tableCell}>{(entry.count * 10).toFixed(2)}</Text>
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

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#FFD700',
    width: width * 0.22,
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: 10,
  },
  saveButtonText: {
    color: '#1C1C1C',
    fontWeight: 'bold',
    fontSize: 13,
  },
  headerBtn: {
    backgroundColor: '#FFFFFF',
    width: width * 0.22,
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: 10,
  },
  
  headerBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: 'red',
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 18,
    height: 18,
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
    paddingHorizontal: 8,
    paddingVertical: 0,
    marginBottom: 12,
    justifyContent: 'center',
    height: 36,
  },
  checkboxChecked: {
    backgroundColor: '#fff',
  },
  checkmark: {
    color: '#FF476F',
    fontSize: 13,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    padding: 8,
    fontSize: 13,
  },
  nameInput: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 0,
    marginBottom: 10,
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderRadius: 4,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
entrySection: {
  backgroundColor: '#F2F2F2',
  borderRadius: 8,
  marginTop: 10,
  minHeight: height * 0.57,
  width: '100%',
  overflow: 'hidden',
},

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#e3ecd7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  statsText: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 13,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
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
    height: 18,
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 8,
    position: 'absolute',
    bottom: 10,
    left: 8,
    right: 8,
    marginBottom: 0,
  },
  footerBtn: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    alignItems: 'center',
    borderRadius: 8,
  },
  footerBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
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
    paddingVertical: 14,
    paddingHorizontal: 10,
    width: '75%',
    elevation: 10,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalItem: {
    paddingVertical: 14,
    alignItems: 'center',
    marginVertical: 4,
    borderRadius: 8,
  },
  modalItemText: {
    color: '#fff',
    fontSize: 15,
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
  successBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  billText: {
    fontSize: 14,
    marginBottom: 16,
  },
  successBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  successBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
   tableFooter: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    marginTop: 29,
    borderRadius: 8,
    elevation: 3,  // subtle shadow for Android
    shadowColor: '#000',  // iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'flex-end',
  },

  footerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
});
