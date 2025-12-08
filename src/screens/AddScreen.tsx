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
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { TextInput as RNTextInput, } from 'react-native';
import { Domain } from './NetPayScreen';
import { formatDateIST } from '../utils/dateUtils';

// ✅ Get screen dimensions
const { width, height } = Dimensions.get('window');

// ✅ Calculate responsive dimensions with 20px bottom space
const FOOTER_HEIGHT = 70; // Fixed footer height
const SAFE_AREA_BOTTOM = Platform.OS === 'ios' ? 34 : 0; // iPhone safe area
const BOTTOM_FREE_SPACE = 40; // ✅ Added 40px free space at bottom

type Entry = {
  number: string;
  count: number;
  type: string;
  timeLabel?: string;
  name?: string; 
  shortCode?: string;
  rate?: number;
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

const TIME_SHORTCODES: { [key: string]: string } = {
  'LSK 3 PM': 'LSK3',
  'DEAR 1 PM': 'D-1-',
  'DEAR 6 PM': 'D-6-', 
  'DEAR 8 PM': 'D-8-'
};

const AddScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Add'>>();
  const [modalVisible, setModalVisible] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState('');
  const [loggedInUserType, setLoggedInUserType] = useState('sub');
  const [selection, setSelection] = useState('');
  const startInputRef = useRef<TextInput>(null);

  const focusFirstEmptyInput = () => {
    if (checkboxes.range || checkboxes.hundred || checkboxes.tripleOne) {
      if (!rangeStart) {
        startInputRef.current?.focus();
      } else if (!rangeEnd) {
        endInputRef.current?.focus();
      } else if (!rangeCount) {
        countInputRefRange.current?.focus();
      }
    } else {
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
  const [isSaving, setIsSaving] = useState(false);

  // Whenever name changes, update all entries in the table to use the current name
  useEffect(() => {
    setEntries(prev => prev.map(e => ({ ...e, name })));
  }, [name]);

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
    // Make 'range', 'hundred', and 'tripleOne' mutually exclusive
    if (key === 'range' || key === 'hundred' || key === 'tripleOne') {
      setCheckboxes(prev => ({
        ...prev,
        range: key === 'range' ? !prev.range : false,
        hundred: key === 'hundred' ? !prev.hundred : false,
        tripleOne: key === 'tripleOne' ? !prev.tripleOne : false,
        set: prev.set, // Keep set checkbox unchanged
      }));
    } else {
      setCheckboxes(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
    }
  };

  useEffect(() => {
    const load = async () => {
      const username = await AsyncStorage.getItem('username');
      const userType = await AsyncStorage.getItem('usertype');
      
      console.log('📱 Loaded from AsyncStorage:', { username, userType });
      
      setLoggedInUser(username || '');
      setLoggedInUserType(userType || 'sub');
      
      if (username) {
        fetchAndShowRates(username);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (loggedInUser) {
      fetchAndShowRates(loggedInUser);
    }
  }, [loggedInUser]);

  const mapLabelToDrawKey = (label: string): 'LSK3' | 'DEAR1' | 'DEAR6' | 'DEAR8' => {
    const mapping: Record<string, 'LSK3' | 'DEAR1' | 'DEAR6' | 'DEAR8'> = {
      'LSK 3 PM': 'LSK3',
      'KERALA 3 PM': 'LSK3',
      'DEAR 1 PM': 'DEAR1',
      'DEAR 6 PM': 'DEAR6',
      'DEAR 8 PM': 'DEAR8',
    };
    
    return mapping[label] || 'LSK3';
  };

  const checkBlockedDate = async (drawKey: string): Promise<boolean> => {
    try {
      console.log('🔍 Checking blocked date for:', drawKey);
      const res = await fetch(`${Domain}/get-blocked-dates`);
      const data = await res.json();
      const today = formatDateIST(new Date());
      
      const blocked = Array.isArray(data)
        ? data.some((item: any) => {
            const matchesDate = item?.date === today;
            const matchesTicket = item?.ticket === 'ALL' || item?.ticket === drawKey;
            console.log('📅 Checking block:', { 
              itemDate: item?.date, 
              today, 
              itemTicket: item?.ticket, 
              drawKey, 
              matchesDate, 
              matchesTicket 
            });
            return matchesDate && matchesTicket;
          })
        : false;
        
      if (blocked) {
        alert(`⛔ Entries are blocked today for ${drawKey}.`);
        return true;
      }
      return false;
    } catch (err) {
      console.error('❌ Error checking blocked date:', err);
      return false;
    }
  };

  const fetchBlockWindow = async (
    drawKey: 'LSK3' | 'DEAR1' | 'DEAR6' | 'DEAR8',
    role: string
  ): Promise<{ blockTime?: string; unblockTime?: string } | null> => {
    try {
      console.log('🔍 Fetching block window for:', { drawKey, role });
      
      const urls = [
        `${Domain}/blockTime/${encodeURIComponent(drawKey)}/${encodeURIComponent(role)}`,
        `${Domain}/blockTime/${encodeURIComponent(drawKey)}/${encodeURIComponent(role.toLowerCase())}`,
        `${Domain}/blockTime/${encodeURIComponent(drawKey)}/${encodeURIComponent(role.toUpperCase())}`,
      ];
      
      for (const url of urls) {
        try {
          console.log('🌐 Trying URL:', url);
          const resp = await fetch(url);
          
          if (resp.ok) {
            const json = await resp.json();
            console.log('✅ Block window response:', json);
            return { blockTime: json?.blockTime, unblockTime: json?.unblockTime };
          } else {
            console.log('⚠️ Response not OK:', resp.status, resp.statusText);
          }
        } catch (urlError) {
          console.log('❌ URL failed:', url, urlError);
          continue;
        }
      }
      
      console.log('❌ All URLs failed for block window');
      return null;
    } catch (error) {
      console.error('❌ Error fetching block window:', error);
      return null;
    }
  };

  const isNowWithin = (startHHmm?: string, endHHmm?: string): boolean => {
    if (!startHHmm || !endHHmm) return false;
    
    console.log('⏰ Checking time window:', { startHHmm, endHHmm });
    
    const now = new Date();
    const [sh, sm] = startHHmm.split(':').map(Number);
    const [eh, em] = endHHmm.split(':').map(Number);
    const start = new Date(now);
    start.setHours(sh || 0, sm || 0, 0, 0);
    const end = new Date(now);
    end.setHours(eh || 0, em || 0, 0, 0);

    console.log('🕐 Time comparison:', {
      now: now.toTimeString(),
      start: start.toTimeString(),
      end: end.toTimeString()
    });

    if (end > start) {
      const isWithin = now >= start && now < end;
      console.log('📊 Is within window:', isWithin);
      return isWithin;
    }
    const isWithin = now >= start || now < end;
    console.log('📊 Is within overnight window:', isWithin);
    return isWithin;
  };

  const canProceedToSave = async (): Promise<boolean> => {
    const drawKey = mapLabelToDrawKey(selectedTime);

    console.log('🔍 Checking time block for:', {
      selectedTime,
      drawKey,
      loggedInUserType,
      loggedInUser
    });

    if (await checkBlockedDate(drawKey)) return false;

    const userRole = loggedInUserType || 'sub';
    console.log('👤 User role for time check:', userRole);
    
    const bw = await fetchBlockWindow(drawKey, userRole.toLowerCase());
    console.log('⏰ Block window response:', bw);
    
    if (bw && bw.blockTime && bw.unblockTime) {
      const isBlocked = isNowWithin(bw.blockTime, bw.unblockTime);
      console.log('🚫 Is currently blocked?', isBlocked);
      
      if (isBlocked) {
        alert(`⛔ Entry time is blocked for ${selectedTime} (${bw.blockTime} - ${bw.unblockTime}) for ${userRole} users.`);
        return false;
      }
    } else {
      console.log('⚠️ No block window from API, using fallback');
      const fallback = {
        'LSK3': '15:00',
        'D-1-': '13:00',
        'D-6-': '18:00',
        'D-8-': '20:00',
      } as Record<string, string>;
      
      const endTime = fallback[drawKey];
      if (endTime) {
        const [eh, em] = endTime.split(':').map(Number);
        const now = new Date();
        const endDate = new Date();
        endDate.setHours(eh || 0, em || 0, 0, 0);
        
        if (now >= endDate) {
          alert(`⛔ Entry time is blocked for ${selectedTime} after ${endTime}.`);
          return false;
        }
      }
    }

    console.log('✅ Time check passed, allowing entry');
    return true;
  };

  useEffect(() => {
    if (selection) {
      fetchAndShowRates(selection);
    }
  }, [selection, selectedTime]);

  const fetchAndShowRates = async (user: string | null) => {
    try {
      if (!user || !selectedTime) {
        console.log('⚠️ Missing user or draw info');
        return;
      }
      let url = `${Domain}/ratemaster?user=${encodeURIComponent(user)}&draw=${encodeURIComponent(selectedTime)}`

      const response = await fetch(url);
      const data = await response.json();
      console.log('🌐 Full API Response:', data);

      // Create a map of label -> rate for easy lookup
      const rateMap: Record<string, number> = {};
      
      if (data && Array.isArray(data.rates)) {
        // Map each rate to its label in a case-insensitive way
        data.rates.forEach((rateItem: any) => {
          if (rateItem.label && !isNaN(Number(rateItem.rate))) {
            // Store uppercase keys for consistent comparison
            rateMap[rateItem.label.toUpperCase()] = Number(rateItem.rate);
          }
        });
        
        console.log('📊 Parsed rate map:', rateMap);
      }
      
      // Convert to array matching labelMap order
      const ratesArray = labelMap.map(label => 
        rateMap[label] || 0
      );
      
      console.log('📊 Final rates array:', ratesArray);
      setRates(ratesArray);
      
      // Also store the raw rate map for direct lookup
      setAssignedRates(rateMap);
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

  const getRate = (type: string, number: string = ''): number => {
    let baseType = '';

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
    
    // First check the rate in assignedRates map - faster and more reliable
    if (baseType in assignedRates && assignedRates[baseType] > 0) {
      return assignedRates[baseType];
    }
    
    // Fallback to rates array
    const rateIndex = labelMap.indexOf(baseType);
    if (rateIndex >= 0 && rateIndex < rates.length && rates[rateIndex] > 0) {
      return rates[rateIndex];
    }

    // Final fallback to length-based rate
    let numberToCheck = number;
    if (!numberToCheck && type.includes('-')) {
      const parts = type.split('-');
      if (parts.length > 1) {
        numberToCheck = parts[parts.length - 1];
      }
    }
    
    // For A, B, C types: single digit = 12, 2-digit = 10, 3-digit = 10
    if (['A', 'B', 'C'].includes(baseType)) {
      return numberToCheck && numberToCheck.length === 1 ? 12 : 10;
    }
    
    return numberToCheck && numberToCheck.length === 1 ? 12 : 10;
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
    setNumber(''); // Clear number input when toggle changes
    
    // Focus number input after clearing
    setTimeout(() => {
      numberInputRef.current?.focus();
    }, 50); // Small timeout to ensure state updates complete first
  };

  const handleAddEntry = (type: string) => {
    const newEntries: Entry[] = [];

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
  newEntries.push({ number: numberStr, count: cnt, type: entryType, name });
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
      if (toggleCount === 3) {
        const countVal = useRange ? rangeC : singleC;
        const boxVal = useRange ? rangeC : boxC;

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
      if (useRange) {
        if (checkboxes.range) {
          if (isNaN(parsedStart) || isNaN(parsedEnd) || isNaN(parsedRangeC)) return;
          for (let i = start; i <= end; i++) {
            addWithSetCheck(formatNumberForWidth(i), rangeC, type);
          }
        }

        if (checkboxes.hundred) {
          for (let i = 100; i <= 900; i += 100) {
            if (i >= start && i <= end) {
              addWithSetCheck(formatNumberForWidth(i), rangeC, type);
            }
          }
        }

        if (checkboxes.tripleOne) {
          for (let i = 0; i <= 999; i += 111) {
            if (i >= start && i <= end) {
              addWithSetCheck(formatNumberForWidth(i), rangeC, type);
            }
          }
        }
      } else {
        if (!number || isNaN(singleC)) return;
        addWithSetCheck(number, singleC, type);
      }
    }

    // prepend new entries (keeps older entries after)
  // Only set name for new entries, keep previous entries as is
  setEntries(prev => [...newEntries.map(e => ({ ...e, name })), ...prev]);

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


  const handleSave = async () => {
    // Prevent duplicate saves
    if (isSaving) {
      console.log('Save already in progress — ignoring duplicate request');
      return;
    }

    // Optional: check pre-save conditions (time blocks, etc.)
    const canSave = await canProceedToSave();
    if (!canSave) return;

    try {
      setIsSaving(true);

      // const encodedLabel = encodeURIComponent(selectedTime);
      // console.log("sdddddddddd",encodedLabel);

      const res = await fetch(`${Domain}/entries/saveValidated`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries, selectedAgent: selection || loggedInUser, createdBy: selection || loggedInUser, timeLabel: selectedTime, timeCode: selectedCode, toggleCount, loggedInUserType,loggedInUser }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Show a friendly dialog summarizing remaining vs attempted
        const msg = data?.message || 'Limit exceeded. Nothing was saved.';
        setIsSaving(false);
        return alert(`⛔ ${msg}`);
      }

      setBillNumber(data.billNo || '000000');
      setSuccessModalVisible(true);
      setEntries([]);

      if (data.exceeded?.length > 0) {
        alert(`⚠️ Some entries were adjusted:\n${data.exceeded.map((e: any) => `${e.type}: remaining ${e.remaining}, attempted ${e.attempted}, saved ${e.willAdd}`).join('\n')}`);
      }


      // Clear the name input after saving and focus number input
      setName('');
      setTimeout(() => {
        numberInputRef.current?.focus();
      }, 100);

    } catch (err) {
      console.error(err);
      alert('❌ Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };






  const handleDeleteEntry = (indexToDelete: number) => {
  setEntries((prev) => prev.filter((_, index) => index !== indexToDelete));
  };

  useEffect(() => {
    const returnedSelectedTime = route?.params?.selectedTime;
    
    if (returnedSelectedTime && returnedSelectedTime !== selectedTime) {
      setSelectedTime(returnedSelectedTime);
      const timeOption = timeOptions.find(option => option.label === returnedSelectedTime);
      if (timeOption) {
        setSelectedColor(timeOption.color);
        setSelectedCode(timeOption.shortCode);
      }
    }
  }, [route?.params?.selectedTime]);

  useEffect(() => {
    setEntries([]);
  }, [selectedTime]);

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

      if (cleaned.startsWith('abc')) {
        const parts = cleaned.split(/[\s_\-=\+\/\.,\*]+/);
        if (parts.length === 3) {
          const number = parts[1];
          const count = parseInt(parts[2]);
          if (!isNaN(count)) {
            ['A', 'B', 'C'].forEach((type) => {
              newEntries.push({ number, count, type, timeLabel: selectedTime });
            });
          }
          continue;
        }
      }

      const parts = cleaned.split(/[\s_\-=\+\/\.,\*]+/);
      if (['a', 'b', 'c'].includes(parts[0]) && parts.length === 3) {
        const type = parts[0].toUpperCase();
        const number = parts[1];
        const count = parseInt(parts[2]);
        if (!isNaN(count)) {
          newEntries.push({ number, count, type, timeLabel: selectedTime });
        }
        continue;
      }

      const abcCompact = cleaned.match(/^([abc])(\d+)[\s_\-=\+\/\.,\*]+(\d+)$/);
      if (abcCompact) {
        const [, type, number, countStr] = abcCompact;
        const count = parseInt(countStr);
        if (!isNaN(count)) {
          newEntries.push({ number, count, type: type.toUpperCase(), timeLabel: selectedTime });
        }
        continue;
      }

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
            newEntries.push({ number, count: superCount, type: 'SUPER', timeLabel: selectedTime });
          }
          if (boxCount !== null && !isNaN(boxCount)) {
            newEntries.push({ number, count: boxCount, type: 'BOX', timeLabel: selectedTime });
          }
          continue;
        }
      }
    }

  setEntries((prev) => [...newEntries.map(e => ({ ...e, name })), ...prev.map(e => ({ ...e, name }))]);
  }, [route?.params?.pastedText]);

  useEffect(() => {
    if (route.params?.pastedText) {
      try {
        console.log('Raw pasted data:', route.params.pastedText);
        
        const pastedEntries = JSON.parse(route.params.pastedText);
        console.log('Parsed entries:', pastedEntries);
        
        const currentShortCode = TIME_SHORTCODES[selectedTime] || 'LSK3';
        console.log('Current shortcode:', currentShortCode);

        const processedEntries = pastedEntries.map((entry: any) => {
          let processedEntry;
          
          // For single digit numbers with A, B, C type
          if (entry.number.length === 1 && ['A', 'B', 'C'].includes(entry.type)) {
            processedEntry = {
              ...entry,
              timeLabel: selectedTime,
              shortCode: currentShortCode, // Add shortcode to entry
              rate: getRate(entry.type, entry.number) // Add rate calculation
            };
            console.log('Processing single digit:', {
              ...processedEntry,
              shortCode: currentShortCode
            });
            return processedEntry;
          }

          // For 2-digit numbers with A, B, C type
          if (entry.number.length === 2 && ['A', 'B', 'C'].includes(entry.type)) {
            processedEntry = {
              ...entry,
              timeLabel: selectedTime,
              shortCode: currentShortCode, // Add shortcode to entry
              rate: getRate(entry.type, entry.number) // Add rate calculation
            };
            console.log('Processing 2-digit with ABC type:', {
              ...processedEntry,
              shortCode: currentShortCode
            });
            return processedEntry;
          }

          // For other numbers (2-digit and 3-digit with SUPER/BOX)
          // Check if entry type already has shortcode prefix to avoid double-prefixing
          let finalType = entry.type;
          if (!entry.type.includes(currentShortCode)) {
            if (entry.type.includes('BOX')) {
              finalType = `${currentShortCode}BOX`;
            } else if (entry.type.includes('SUPER')) {
              finalType = entry.type; // Keep as is if already has SUPER
            } else {
              finalType = `${currentShortCode}SUPER`; // Default fallback
            }
          }
          
          processedEntry = {
            ...entry,
            type: finalType,
            timeLabel: selectedTime,
            shortCode: currentShortCode, // Add shortcode to entry
            rate: getRate(
              entry.type.includes('BOX') ? 'BOX' : 'SUPER', 
              entry.number
            ) // Add rate calculation
          };
          console.log('Processing other digit:', {
            originalType: entry.type,
            finalType: finalType,
            isBOX: entry.type.includes('BOX'),
            rate: processedEntry.rate,
            shortCode: currentShortCode
          });
          return processedEntry;
        });

        console.log('Final processed entries:', processedEntries.map((entry: any) => ({
          ...entry,
          shortCode: currentShortCode
        })));
        
  setEntries(prev => [...processedEntries.map((e: any) => ({ ...e, name })), ...prev.map((e: any) => ({ ...e, name }))]);

      } catch (error) {
        console.error('Error processing pasted data:', error);
      }
    }
  }, [route.params?.pastedText, selectedTime]);

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: selectedColor }]}>
      {/* ✅ Main Content Container with proper padding bottom for footer */}
      <View style={styles.contentContainer}>
        <View style={styles.scrollContainer}>
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

            <TouchableOpacity
              style={[styles.saveButton, isSaving ? styles.saveButtonDisabled : null]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#1C1C1C" />
                  <Text style={[styles.saveButtonText, { marginLeft: 8 }]}>Saving...</Text>
                </View>
              ) : (
                <Text style={styles.saveButtonText}>SAVE</Text>
              )}
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
              .filter(({ key }) => !(toggleCount === 1 && key === 'set'))
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
                  placeholderTextColor="#666666" // Added placeholder color

                value={rangeStart}
                keyboardType="numeric"
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '');
                  const limited = cleaned.slice(0, toggleCount);
                  setRangeStart(limited);

                  if (limited.length === toggleCount) {
                    endInputRef.current?.focus();
                  }
                }}
              />

              <TextInput
                ref={endInputRef}
                style={styles.input}
                placeholder="End"
                  placeholderTextColor="#666666" // Added placeholder color

                value={rangeEnd}
                keyboardType="numeric"
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '');
                  const limited = cleaned.slice(0, toggleCount);
                  setRangeEnd(limited);

                  if (limited.length === toggleCount) {
                    countInputRefRange.current?.focus();
                  }
                }}
              />

              <TextInput
                ref={countInputRefRange}
                style={styles.input}
                placeholder="Count"
                  placeholderTextColor="#666666" // Added placeholder color

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
                  placeholderTextColor="#666666" // Added placeholder color

                value={number}
                keyboardType="numeric"
                blurOnSubmit={false}
                returnKeyType="next"
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '');
                  const limited =
                    toggleCount === 1 ? cleaned.slice(0, 1)
                      : toggleCount === 2 ? cleaned.slice(0, 2)
                        : cleaned.slice(0, 3);

                  setNumber(limited);

                  if (limited.length === toggleCount) {
                    countInputRef.current?.focus();
                  }
                }}
                onSubmitEditing={() => {
                  countInputRef.current?.focus();
                }}
              />

              <TextInput
                ref={countInputRef}
                style={styles.input}
                placeholder="Count"
                  placeholderTextColor="#666666" // Added placeholder color

                value={count}
                onChangeText={(text) => setCount(text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
              />

              {toggleCount === 3 && (
                <TextInput
                  style={styles.input}
                  placeholder="Box"
                    placeholderTextColor="#666666" // Added placeholder color

                  value={box}
                  onChangeText={setBox}
                  keyboardType="numeric"
                />
              )}
            </View>
          )}

          <TextInput style={styles.namedInput} placeholder="Name"   placeholderTextColor="#666666" // Added placeholder color
 value={name} onChangeText={setName} />
          
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

          {/* ✅ Updated Entry Section - Now Scrollable */}
          <View style={styles.entrySection}>
            <View style={styles.statsRow}>
              <Text style={styles.statsText}>Count: {entries.reduce((sum, e) => sum + e.count, 0)}</Text>
              <Text style={styles.statsText}>Total Collect: ₹{entries.reduce((sum, e) => sum + e.count * getRate(e.type), 0).toFixed(2)}</Text>
            </View>

            {/* ✅ Scrollable Table Container */}
            <ScrollView style={styles.tableContainer} contentContainerStyle={styles.tableContentContainer} scrollEnabled={true} showsVerticalScrollIndicator={true}>
              {entries.map((entry, index) => (
                <View
  key={index}
  style={[
    styles.tableRow,
    { backgroundColor: index % 2 === 0 ? '#ffffff' : '#e3ecd4' },
  ]}
>
  <Text style={styles.tableCell}>
      {entry.type === 'A' || entry.type === 'B' || entry.type === 'C' 
        ? `${entry.shortCode || selectedCode}${entry.type}`
        : entry.type}
    </Text>
    <Text style={styles.tableCell}>{entry.number}</Text>
    <Text style={styles.tableCell}>{entry.count}</Text>
    <Text style={[styles.tableCell, styles.amountCell]}>
      {(entry.count * (entry.number.length === 1 ? 12 : 10)).toFixed(2)}
    </Text>
    <Text style={[styles.tableCell, styles.amountCell]}>
      {(entry.count * getRate(entry.type, entry.number)).toFixed(2)}
    </Text>
    <TouchableOpacity
      onPress={() => handleDeleteEntry(index)}
      style={styles.deleteButton}
    >
      <Icon name="trash" size={20} color="black" />
    </TouchableOpacity>
              </View>
              ))}
            </ScrollView>

            <View style={styles.tableFooter}>
              <Text style={styles.footerText}>
                Total Pay: ₹{entries.reduce((sum, e) => sum + e.count * getRate(e.type), 0).toFixed(2)}
              </Text>
            </View>
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
  </View>
      </View>

      {/* ✅ Fixed Footer Row - Always at bottom, no overlap */}
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
          <Icon name="logo-whatsapp" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AddScreen;

// ✅ Updated Styles with scrollable entry section
const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  // ✅ Content container that leaves space for footer + 20px free space
  contentContainer: {
    flex: 1,
  paddingBottom: FOOTER_HEIGHT + SAFE_AREA_BOTTOM + BOTTOM_FREE_SPACE, // ✅ Added 40px space
  },
  // ✅ ScrollView content styling with reduced top padding
  scrollContainer: {
    paddingTop: 5, // ✅ Reduced padding
  paddingBottom: 40, // Increased free space at bottom
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12, // ✅ Reduced from 15
    marginBottom: 5, // ✅ Reduced from 15
    marginTop: 29, // ✅ Reduced from 10
  },
  saveButton: {
    backgroundColor: '#FFD700',
    width: width * 0.28,
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#1C1C1C',
    fontWeight: 'bold',
    fontSize: 13,
  },
  headerBtn: {
    backgroundColor: '#FFFFFF',
    width: width * 0.28,
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
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
    marginBottom: 8, // ✅ Reduced from 10
    paddingHorizontal: 8, // ✅ Reduced from 10
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
    marginRight: 6, // ✅ Reduced from 8
    backgroundColor: '#c3f7ce',
  },
  namedInput: {
    backgroundColor: '#fff',
    paddingHorizontal: 10, // ✅ Reduced from 12
    paddingVertical: 8, // ✅ Reduced from 10
    marginBottom: 10, // ✅ Reduced from 15
    height: 40, // ✅ Reduced from 42
    marginHorizontal: 8, // ✅ Reduced from 10
    borderRadius: 6,
    fontSize: 14,
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
    fontSize: 13,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8, // ✅ Reduced from 10
    marginHorizontal: 6, // ✅ Reduced from 8
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 3, // ✅ Reduced from 4
    paddingHorizontal: 8, // ✅ Reduced from 10
    paddingVertical: 8, // ✅ Reduced from 10
    fontSize: 14,
    borderRadius: 6,
    height: 40, // ✅ Reduced from 42
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6, // ✅ Reduced from 8
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10, // ✅ Reduced from 12
    marginHorizontal: 3, // ✅ Reduced from 4
    alignItems: 'center',
    borderRadius: 6,
    minHeight: 40, // ✅ Reduced from 44
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  // ✅ Entry section - INCREASED HEIGHT with reduced margins
  entrySection: {
    backgroundColor: '#F2F2F2',
    borderRadius: 8, // ✅ Reduced from 10
    width: '100%',
    overflow: 'hidden',
    marginTop: 8, // ✅ Reduced from 10
    minHeight: 420, // ⬆️ Increased minHeight for entry section
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#e3ecd7',
    paddingHorizontal: 10, // ✅ Reduced from 12
    paddingVertical: 6, // ✅ Reduced from 8
    marginTop: 3, // ✅ Reduced from 6
  },
  statsText: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 13,
  },
  // ✅ Scrollable table container with INCREASED HEIGHT
  tableContainer: {
    flex: 1, // ✅ Take available space
    marginHorizontal: 3, // ✅ Reduced from 4
  },
  // ✅ Content container for scrollable table
  tableContentContainer: {
    paddingBottom: 1, // ✅ Minimal padding
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff', // Fixed white background
    paddingVertical: 6, // ✅ Reduced from 8
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc', // Fixed border color
    paddingHorizontal: 3, // ✅ Reduced from 4
    alignItems: 'center',
    minHeight: 28, // ✅ Reduced from 30
  },
  tableCell: {
    flex: 1,
    fontSize: 11 ,
    textAlign: 'center',
    fontWeight: '900',
    color: '#000000', // Fixed black color
    paddingVertical: 2,
  },
  typeCell: {
    flex: 1.2, // More space for type
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#000000', // Fixed black color
    paddingVertical: 2,
  },
  numberCell: {
    flex: 0.8, // Less space for number
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#000000', // Fixed black color
    paddingVertical: 2,
  },
  amountCell: {
    flex: 1,
    color: '#000000', // Fixed black color
    textAlign: 'right',
    paddingRight: 8,
  },
  actionCell: {
    flex: 0.8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ✅ Delete button styling
  deleteButton: {
    flex: 0.8,
    alignItems: 'center',
    paddingVertical: 2, // ✅ Reduced from 8
    paddingHorizontal: 2, // ✅ Reduced from 4
  },
  // ✅ Fixed footer positioning with 20px free space at bottom
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10, // ✅ Reduced from 12
    paddingVertical: 2, // ✅ Reduced from 10
    position: 'absolute', // ✅ Absolute positioning
    bottom: SAFE_AREA_BOTTOM + BOTTOM_FREE_SPACE, // ✅ Added 20px free space
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.05)', // ✅ Slight background for visibility
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  footerBtn: {
    flex: 1,
    paddingVertical: 10, // ✅ Reduced from 12
    marginHorizontal: 4, // ✅ Reduced from 6
    alignItems: 'center',
    borderRadius: 8,
    minHeight: 30, // ✅ Reduced from 44
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
    paddingVertical: 16,
    paddingHorizontal: 12,
    width: '75%',
    elevation: 10,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalItem: {
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: 4,
    borderRadius: 8,
  },
  modalItemText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  successBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  billText: {
    fontSize: 16,
    marginBottom: 20,
  },
  successBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  successBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tableFooter: {
    backgroundColor: '#fff',
    paddingVertical: 8, // ✅ Reduced from 10
    marginTop: 5, // ✅ Reduced from 10
    borderRadius: 6, // ✅ Reduced from 8
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'flex-end',
    marginHorizontal: 6, // ✅ Reduced from 8
  },
  footerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    paddingHorizontal: 10, // ✅ Reduced from 12
  },
  rateCell: {
    color: '#0066CC',  // Blue color to highlight rate
    fontWeight: '600',
  },
  totalCell: {
    color: '#006400',  // Dark green for amount
    fontWeight: 'bold',
  },
});