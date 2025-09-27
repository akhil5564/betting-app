import React, { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

import UserPickerRow from "./UserPickerRow";

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
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { TextInput as RNTextInput, } from 'react-native';
import { Domain } from './NetPayScreen';
const { width, height } = Dimensions.get('window');

type Entry = {
  number: string;
  count: number;
  type: string;
  timeLabel?: string;
};

type RootStackParamList = {
  Add: { pastedText?: string; selectedTime?: string };
  Paste: { selectedTime?: string };
  ViewBill: { billId: string };
  Main: undefined;
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
  const [loggedInUser, setLoggedInUser] = useState('');
  const [selection, setSelection] = useState('');
  const startInputRef = useRef<TextInput>(null);

  const focusFirstEmptyInput = () => {
    if (checkboxes.range || checkboxes.hundred || checkboxes.tripleOne) {
      // For range mode, focus on the first empty field
      if (!rangeStart) {
        startInputRef.current?.focus();
      } else if (!rangeEnd) {
        endInputRef.current?.focus();
      } else if (!rangeCount) {
        countInputRefRange.current?.focus();
      }
    } else {
      // For single number mode, focus on the first empty field
      if (!number) {
        numberInputRef.current?.focus();
      } else if (!count) {
        countInputRef.current?.focus();
      }
    }
  };

  const [selectedColor, setSelectedColor] = useState('#f15b87');
  const [selectedTime, setSelectedTime] = useState('LSK 3 PM');
  const [selectedCode, setSelectedCode] = useState('LSK3');
  const numberInputRef = useRef<TextInput | null>(null);
const rangeStartRef = useRef<TextInput>(null);
  const rangeEndRef = useRef<TextInput>(null);

  const focusNumberInput = () => {
    numberInputRef.current?.focus();
  };
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const drawBlockTimes: Record<string, string> = {
    'LSK3': '15:00',
    'D-1-': '13:00',
    'D-6-': '18:00',
    'D-8-': '20:00'
  };

  const labelMap = ['SUPER', 'BOX', 'AB', 'BC', 'AC', 'A', 'B', 'C'];

  const toggleCheckbox = (key: string) => {
    setCheckboxes({ ...checkboxes, [key as keyof typeof checkboxes]: !checkboxes[key as keyof typeof checkboxes] });
  };

  useEffect(() => {
    const load = async () => {
      const username = await AsyncStorage.getItem('username');
      fetchAndShowRates(username);
    };

    load();
  }, []);
  


  useEffect(() => {
    const getUser = async () => {
      const username = await AsyncStorage.getItem('username');
      setLoggedInUser(username || '');
    };

    getUser();
  }, []);

  useEffect(() => {
    if (loggedInUser) {
      fetchAndShowRates(loggedInUser);
    }
  }, [loggedInUser]);

  // Map UI label to backend draw key
  const mapLabelToDrawKey = (label: string): 'LSK3' | 'DEAR1' | 'DEAR6' | 'DEAR8' => {
    switch (label) {
      case 'LSK 3 PM':
        return 'LSK3';
      case 'DEAR 1 PM':
        return 'DEAR1';
      case 'DEAR 6 PM':
        return 'DEAR6';
      case 'DEAR 8 PM':
        return 'DEAR8';
      default:
        return 'LSK3';
    }
  };

  // Check if today is blocked for this draw
  const checkBlockedDate = async (drawKey: string): Promise<boolean> => {
    try {
      const res = await fetch(`${Domain}/get-blocked-dates`);
      const data = await res.json();
      const today = new Date().toISOString().split('T')[0];
      const blocked = Array.isArray(data)
        ? data.some((item: any) => item?.date === today && (item?.ticket === 'ALL' || item?.ticket === drawKey))
        : false;
      if (blocked) {
        alert(`⛔ Entries are blocked today for ${drawKey}.`);
        return true;
      }
      return false;
    } catch (err) {
      // If API fails, do not block by date
      return false;
    }
  };

  // Fetch block window for role and draw
  const fetchBlockWindow = async (
    drawKey: 'LSK3' | 'DEAR1' | 'DEAR6' | 'DEAR8',
    role: string
  ): Promise<{ blockTime?: string; unblockTime?: string } | null> => {
    try {
      const resp = await fetch(`${Domain}/blockTime/${encodeURIComponent(drawKey)}/${encodeURIComponent(role)}`);
      if (!resp.ok) return null;
      const json = await resp.json();
      return { blockTime: json?.blockTime, unblockTime: json?.unblockTime };
    } catch {
      return null;
    }
  };

  // Decide if current time is within the blocked window HH:mm - HH:mm
  const isNowWithin = (startHHmm?: string, endHHmm?: string): boolean => {
    if (!startHHmm || !endHHmm) return false;
    const now = new Date();
    const [sh, sm] = startHHmm.split(':').map(Number);
    const [eh, em] = endHHmm.split(':').map(Number);
    const start = new Date(now);
    start.setHours(sh || 0, sm || 0, 0, 0);
    const end = new Date(now);
    end.setHours(eh || 0, em || 0, 0, 0);

    // Normal same-day window
    if (end > start) {
      return now >= start && now < end;
    }
    // Overnight window (rare for draws, but handle gracefully)
    return now >= start || now < end;
  };

  // Preflight checks before save
  const canProceedToSave = async (): Promise<boolean> => {
    const drawKey = mapLabelToDrawKey(selectedTime);

    // 1) Block-date check
    if (await checkBlockedDate(drawKey)) return false;

    // 2) Block-time check for user role; fallback to local map on failure
    const userRole = typeof loggedInUser === 'string' ? loggedInUser : (loggedInUserType || 'sub');
    const bw = await fetchBlockWindow(drawKey, userRole.toLowerCase());
    if (bw && isNowWithin(bw.blockTime, bw.unblockTime)) {
      alert(`⛔ Entry time is blocked for ${selectedTime} (${bw.blockTime} - ${bw.unblockTime}).`);
      return false;
    }

    // Fallback to static times if API missing
    if (!bw) {
      const fallback = {
        LSK3: '15:00',
        DEAR1: '13:00',
        DEAR6: '18:00',
        DEAR8: '20:00',
      } as Record<'LSK3' | 'DEAR1' | 'DEAR6' | 'DEAR8', string>;
      const end = fallback[drawKey];
      if (end) {
        const [eh, em] = end.split(':').map(Number);
        const now = new Date();
        const endDate = new Date();
        endDate.setHours(eh || 0, em || 0, 0, 0);
        if (now >= endDate) {
          alert(`⛔ Entry time is blocked for ${selectedTime}.`);
          return false;
        }
      }
    }

    return true;
  };
  useEffect(() => {
    if (selection) {
      fetchAndShowRates(selection);
    }
  }, [selection, selectedTime]);





  const fetchAndShowRates = async (user: string | null) => {
    try {
      // const draw = 'DEAR 1 PM';
      if (!user || !selectedTime) {
        console.log('⚠️ Missing user or draw info');
        return;
      }
      let url = `${Domain}/ratemaster?user=${encodeURIComponent(user)}&draw=${encodeURIComponent(selectedTime)}`

      const response = await fetch(url);

      const data = await response.json();
      console.log('🌐 Full API Response:', data);

      const labelMap = ['super', 'box', 'ab', 'bc', 'ac', 'a', 'b', 'c'];

      let ratesArray: number[] = [];

      if (data && Array.isArray(data.rates)) {
        ratesArray = data.rates.map((r: any) => Number(r.rate));
      } else {
        ratesArray = new Array(8).fill(0);
      }

      setRates(ratesArray); // <-- Save to state

    } catch (error) {
      console.error('❌ Error fetching rates:', error);
    }
  };




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
  const getRate = (type: string): number => {
    // Extract the base type from the full type (e.g., "LSK3SUPER" -> "SUPER")
    // Handle different patterns: LSK3SUPER, D-1-A, etc.
    let baseType = '';

    // For patterns like LSK3SUPER, D-1-AB, etc.
    if (type.includes('SUPER')) {
      baseType = 'SUPER';
    } else if (type.includes('BOX')) {
      baseType = 'BOX';
    } else if (type.includes('AB')) {
      baseType = 'AB';
    } else if (type.includes('BC')) {
      baseType = 'BC';
    } else if (type.includes('AC')) {
      baseType = 'AC';
    } else if (type.includes('-A') || type.endsWith('A')) {
      baseType = 'A';
    } else if (type.includes('-B') || type.endsWith('B')) {
      baseType = 'B';
    } else if (type.includes('-C') || type.endsWith('C')) {
      baseType = 'C';
    }
    const rateIndex = labelMap.indexOf(baseType);

    // If rate index is valid and the rate is greater than 0, use it
    if (rateIndex >= 0 && rateIndex < rates.length && rates[rateIndex] > 0) {
      return rates[rateIndex];
    }

    // Otherwise, default to 10
    return 10;
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

  const formatNumberForWidth = (value: number): string => {
    const width = toggleCount === 1 ? 1 : toggleCount === 2 ? 2 : 3;
    return String(value).padStart(width, '0');
  };

const handleTogglePress = () => {
  setToggleCount((prev) => (prev === 3 ? 1 : prev + 1));
};



const handleAddEntry = (type: string) => {
  const newEntries: Entry[] = [];

  // safe parses with defaults
  const parsedStart = parseInt(rangeStart || '', 10);
  const parsedEnd = parseInt(rangeEnd || '', 10);
  const start = isNaN(parsedStart) ? 0 : parsedStart;
  const end = isNaN(parsedEnd) ? 999 : parsedEnd;

  const parsedRangeC = parseInt(rangeCount || '', 10);
  const rangeC = isNaN(parsedRangeC) ? 1 : parsedRangeC;

  const singleC = (() => {
    const p = parseInt((count ?? '1') || '1', 10);
    return isNaN(p) ? 1 : p;
  })();

  const parsedBox = parseInt(box || '', 10);
  const boxC = isNaN(parsedBox) ? singleC : parsedBox;

  const pushEntry = (numberStr: string, cnt: number, entryType: string) => {
    newEntries.push({ number: numberStr, count: cnt, type: entryType });
  };

  const useRange = !!(checkboxes.range || checkboxes.hundred || checkboxes.tripleOne);

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
    // ALL logic with different toggleCounts
    if (toggleCount === 3) {
      const countVal = useRange ? rangeC : singleC;
      const boxVal = useRange ? rangeC : boxC;

      const loop = () => {
        let numbers: number[] = [];

        if (checkboxes.hundred) {
          // 100, 200, ..., 900
          numbers = Array.from({ length: 9 }, (_, idx) => (idx + 1) * 100);
        } else if (checkboxes.tripleOne) {
          // 000, 111, 222, ..., 999 -> numeric values 0,111,222...
          numbers = Array.from({ length: 10 }, (_, idx) => idx * 111);
        } else {
          // General numeric range
          if (end < start) return;
          numbers = Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
        }

        numbers.forEach(n => {
          if (n >= start && n <= end) {
            const formatted = formatNumberForWidth(n); // ensures padding like '003'
            addWithSetCheck(formatted, countVal, `${selectedCode}SUPER`);
            addWithSetCheck(formatted, boxVal, `${selectedCode}BOX`);
          }
        });
      };

      if (useRange) {
        if (isNaN(parsedRangeC)) return;
        loop();
      } else {
        if (!number) return;
        addWithSetCheck(number, countVal, `${selectedCode}SUPER`);
        addWithSetCheck(number, boxVal, `${selectedCode}BOX`);
      }
    } else if (toggleCount === 2) {
      const labels = ['AB', 'BC', 'AC'];

      const loop = () => {
        let numbers: number[] = [];
        if (checkboxes.hundred) {
          numbers = Array.from({ length: 9 }, (_, idx) => (idx + 1) * 100);
        } else if (checkboxes.tripleOne) {
          numbers = Array.from({ length: 10 }, (_, idx) => idx * 111);
        } else {
          if (end < start) return;
          numbers = Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
        }

        numbers.forEach(n => {
          if (n >= start && n <= end) {
            const formatted = formatNumberForWidth(n);
            labels.forEach(lab => addWithSetCheck(formatted, rangeC, `${selectedCode}${lab}`));
          }
        });
      };

      if (useRange) {
        if (isNaN(parsedRangeC)) return;
        loop();
      } else {
        if (!number || isNaN(singleC)) return;
        labels.forEach(lab => addWithSetCheck(number, singleC, `${selectedCode}${lab}`));
      }
    } else if (toggleCount === 1) {
      const labels = ['A', 'B', 'C'];

      const loop = () => {
        let numbers: number[] = [];
        if (checkboxes.hundred) {
          numbers = Array.from({ length: 9 }, (_, idx) => (idx + 1) * 100);
        } else if (checkboxes.tripleOne) {
          numbers = Array.from({ length: 10 }, (_, idx) => idx * 111);
        } else {
          if (end < start) return;
          numbers = Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
        }

        numbers.forEach(n => {
          if (n >= start && n <= end) {
            const formatted = formatNumberForWidth(n);
            labels.forEach(lab => addWithSetCheck(formatted, rangeC, `${selectedCode}-${lab}`));
          }
        });
      };

      if (useRange) {
        if (isNaN(parsedRangeC)) return;
        loop();
      } else {
        if (!number || isNaN(singleC)) return;
        labels.forEach(lab => addWithSetCheck(number, singleC, `${selectedCode}-${lab}`));
      }
    }
  } else {
    // Non-ALL types
    if (useRange) {
      // If user selected explicit range checkbox, require proper inputs
      if (checkboxes.range) {
        if (isNaN(parsedStart) || isNaN(parsedEnd) || isNaN(parsedRangeC)) return;
        for (let i = start; i <= end; i++) {
          addWithSetCheck(formatNumberForWidth(i), rangeC, type);
        }
      }

      // hundred: 100..900 (respect start/end limits)
      if (checkboxes.hundred) {
        for (let i = 100; i <= 900; i += 100) {
          if (i >= start && i <= end) {
            addWithSetCheck(formatNumberForWidth(i), rangeC, type);
          }
        }
      }

      // tripleOne: 000,111,222,...999
      if (checkboxes.tripleOne) {
        for (let i = 0; i <= 999; i += 111) {
          if (i >= start && i <= end) {
            addWithSetCheck(formatNumberForWidth(i), rangeC, type);
          }
        }
      }
    } else {
      // single number add
      if (!number || isNaN(singleC)) return;
      addWithSetCheck(number, singleC, type);
    }
  }

  // prepend new entries (keeps older entries after)
  setEntries(prev => [...newEntries, ...prev]);

  // clear inputs
  setNumber('');
  setCount('');
  setBox('');
  setRangeStart('');
  setRangeEnd('');
  setRangeCount('');

  // focus appropriate input
  setTimeout(() => {
    if (checkboxes.range || checkboxes.hundred || checkboxes.tripleOne) {
      startInputRef.current?.focus();
    } else {
      numberInputRef.current?.focus();
    }
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

    // 3. Filter entries that won't exceed limit
    const maxLimit = 100;
    const filteredEntries: any[] = [];
    const tempCounts: Record<string, number> = {}; // current DB count

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
      // Check block date/time before saving
      const allowed = await canProceedToSave();
      if (!allowed) return;
      // const encodedLabel = encodeURIComponent(selectedTime);
      // console.log("sdddddddddd",encodedLabel);

      const res = await fetch(`${Domain}/entries/saveValidated`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries, selectedAgent: selection || loggedInUser, createdBy: selection || loggedInUser, timeLabel: selectedTime, timeCode: selectedCode, toggleCount }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Show a friendly dialog summarizing remaining vs attempted
        const msg = data?.message || 'Limit exceeded. Nothing was saved.';
        return alert(`⛔ ${msg}`);
      }

      setBillNumber(data.billNo || '000000');
      setSuccessModalVisible(true);
      setEntries([]);

      if (data.exceeded?.length > 0) {
        alert(`⚠️ Some entries were adjusted:\n${data.exceeded.map((e: any) => `${e.type}: remaining ${e.remaining}, attempted ${e.attempted}, saved ${e.willAdd}`).join('\n')}`);
      }

    } catch (err) {
      console.error(err);
      alert('❌ Network error. Please try again.');
    }
  };




  const handleDeleteEntry = (indexToDelete: number) => {
    setEntries((prev) => prev.filter((_, index) => index !== indexToDelete));
  };
  // Handle time changes from PasteScreen
  useEffect(() => {
    const returnedSelectedTime = route?.params?.selectedTime;
    
    // If selectedTime is returned from PasteScreen, update the current selectedTime
    if (returnedSelectedTime && returnedSelectedTime !== selectedTime) {
      setSelectedTime(returnedSelectedTime);
      // Also update the corresponding color and code
      const timeOption = timeOptions.find(option => option.label === returnedSelectedTime);
      if (timeOption) {
        setSelectedColor(timeOption.color);
        setSelectedCode(timeOption.shortCode);
      }
    }
  }, [route?.params?.selectedTime]);

  // Clear entries table when draw time changes
  useEffect(() => {
    setEntries([]);
  }, [selectedTime]);

  // Handle pasted text separately
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

    setEntries((prev) => [...newEntries, ...prev]);
  }, [route?.params?.pastedText]);



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

        <View>
          <UserPickerRow
            onUserChange={(user) => {
              console.log("Selected user:", user);
              setSelection(user || '');
            }}
          />
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
  ref={startInputRef}
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
            <Text style={styles.statsText}>Count: {entries.reduce((sum, e) => sum + e.count, 0)}</Text>
            <Text style={styles.statsText}>Total Collect: ₹{entries.reduce((sum, e) => sum + e.count * getRate(e.type), 0).toFixed(2)}</Text>
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
                  <Text style={styles.tableCell}>{(getRate(entry.type)).toFixed(2)}</Text>
                  <Text style={styles.tableCell}>{(entry.count * getRate(entry.type)).toFixed(2)}</Text>
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
              Total Pay: ₹{entries.reduce((sum, e) => sum + e.count * getRate(e.type), 0).toFixed(2)}
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

        <TouchableOpacity style={[styles.footerBtn, { backgroundColor: '#34C759' }]} onPress={() => navigation.navigate('Paste', { selectedTime })}>
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
    paddingTop: 12,
    paddingBottom: 16,
    marginTop: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
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
    paddingHorizontal: 10,
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
    marginHorizontal: 9,

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
    marginHorizontal: 5,


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
    paddingVertical: 0,
    marginBottom: 10,
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
    paddingHorizontal: 8,

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
    minHeight: height * 0.51,
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
    paddingHorizontal: 8,
    paddingVertical: 8,
    position: 'absolute',
    bottom: 10,
    left: 8,
    right: 8,
    backgroundColor: 'transparent', // or '#fff' if you want visible bg
    marginBottom: 14,
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
    marginTop: 26,
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