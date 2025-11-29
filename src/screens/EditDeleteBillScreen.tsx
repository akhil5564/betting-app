import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Domain } from './NetPayScreen';

const EditDeleteBillScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { billNo: routeBillNo } = route.params || {};

  const [billNo, setBillNo] = useState(routeBillNo || '');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingCount, setEditingCount] = useState('');

  // Block time related states
  const [timeLabel, setTimeLabel] = useState(null);
  const [blockTime, setBlockTime] = useState(null);
  const [entryDate, setEntryDate] = useState(null);
  const [isBlocked, setIsBlocked] = useState(true); // ✅ Start DISABLED by default
  const [userType, setUserType] = useState('');
  const [blockCheckLoading, setBlockCheckLoading] = useState(false);
  const [timeCheckCompleted, setTimeCheckCompleted] = useState(false); // ✅ Track if time check done

  // ✅ Load user type from AsyncStorage
  useEffect(() => {
    const loadUserType = async () => {
      try {
        const storedUserType = await AsyncStorage.getItem('usertype');
        setUserType(storedUserType || 'sub');
        console.log('👤 Loaded user type:', storedUserType);
      } catch (error) {
        console.error('❌ Error loading user type:', error);
        setUserType('sub');
      }
    };
    loadUserType();
  }, []);

  // ✅ Fetch block time when timeLabel or userType changes
  useEffect(() => {
    if (timeLabel && userType) {
      setTimeCheckCompleted(false); // ✅ Mark time check as not done yet
      fetchBlockTime(timeLabel, userType);
    } else {
      setBlockTime(null);
      setIsBlocked(true); // ✅ Keep disabled until time check passes
      setTimeCheckCompleted(false);
    }
  }, [timeLabel, userType]);

  // ✅ Search bill entries when route param changes
  useEffect(() => {
    if (routeBillNo) {
      handleSearch(routeBillNo);
    }
  }, [routeBillNo]);

  // ✅ Check block status whenever blockTime or entryDate changes
  useEffect(() => {
    if (blockTime && entryDate) {
      checkIfBlocked();
      const interval = setInterval(checkIfBlocked, 30000); // refresh every 30s
      return () => clearInterval(interval);
    } else {
      setIsBlocked(false);
    }
  }, [blockTime, entryDate]);

  // ✅ Fetch blockTime data from server for a timeLabel and userType
  const fetchBlockTime = async (timeLabelParam, userTypeParam) => {
    try {
      setBlockCheckLoading(true);
      
      const drawKeyMap = {
        'LSK 3 PM': 'LSK3',
        'KERALA 3 PM': 'LSK3',
        'DEAR 1 PM': 'DEAR1',
        'DEAR 6 PM': 'DEAR6',
        'DEAR 8 PM': 'DEAR8',
      };

      const drawKey = drawKeyMap[timeLabelParam] || 'LSK3';
      const role = userTypeParam.toLowerCase();

      console.log('🔍 Fetching block time for:', { drawKey, role, timeLabel: timeLabelParam });

      const res = await fetch(`${Domain}/blockTime/${encodeURIComponent(drawKey)}/${encodeURIComponent(role)}`);
      
      if (!res.ok) {
        console.log('⚠️ No block time found, editing allowed');
        setBlockTime(null);
        setIsBlocked(false);
        return;
      }

      const data = await res.json();
      console.log('✅ Fetched blockTime:', data);

      if (data?.blockTime && data?.unblockTime) {
        setBlockTime(data);
      } else {
        setBlockTime(null);
        setIsBlocked(false);
      }
    } catch (err) {
      console.error('❌ Error fetching block time:', err);
      setBlockTime(null);
      setIsBlocked(false);
    } finally {
      setBlockCheckLoading(false);
    }
  };

  // ✅ UPDATED: Permanent blocking based on entry date + block time
  const checkIfBlocked = () => {
    if (!blockTime || !blockTime.blockTime || !entryDate) {
      setIsBlocked(true); // ✅ Keep disabled if no time check available
      setTimeCheckCompleted(true);
      return;
    }

    try {
      const now = new Date();
      
      // Parse entryDate (format: "YYYY-MM-DD")
      const [year, month, day] = entryDate.split('-').map(Number);
      const [blockH, blockM] = blockTime.blockTime.split(':').map(Number);

      // ✅ Create the exact block deadline: Entry Date + Block Time
      const blockDeadline = new Date(year, month - 1, day, blockH, blockM, 0, 0);

      console.log('⏰ Permanent Block Check:', {
        entryDate,
        blockTime: blockTime.blockTime,
        blockDeadline: blockDeadline.toString(),
        currentTime: now.toString(),
        isPastDeadline: now >= blockDeadline
      });

      // ✅ RULE: If current time has passed the block deadline, PERMANENTLY block
      const isPermanentlyBlocked = now >= blockDeadline;
      
      console.log(`🔒 Block Decision: ${isPermanentlyBlocked ? 'BLOCKED' : 'ALLOWED'}`);
      setIsBlocked(isPermanentlyBlocked);
      setTimeCheckCompleted(true); // ✅ Mark time check as done

    } catch (error) {
      console.error('❌ Error checking block time:', error);
      setIsBlocked(true); // ✅ Keep disabled on error for security
      setTimeCheckCompleted(true);
    }
  };

  // ✅ Fetch entries by billNo and update timeLabel and entryDate
  const handleSearch = async (searchBillNo = billNo) => {
    if (!searchBillNo) {
      Alert.alert('Error', 'Please enter a bill number');
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Searching for bill:', searchBillNo);

      const res = await fetch(`${Domain}/entries?billNo=${searchBillNo}`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log('📦 Found entries:', data.length);

      setEntries(data);

      if (data.length > 0) {
        // Extract timeLabel and date from first entry
        if (data[0].timeLabel) {
          setTimeLabel(data[0].timeLabel);
          console.log('🕐 Time label:', data[0].timeLabel);
        }

        // ✅ Use 'date' field first, fallback to 'createdAt'
        if (data[0].date) {
          const dt = new Date(data[0].date);
          const yyyy = dt.getFullYear();
          const mm = String(dt.getMonth() + 1).padStart(2, '0');
          const dd = String(dt.getDate()).padStart(2, '0');
          const formattedDate = `${yyyy}-${mm}-${dd}`;
          
          setEntryDate(formattedDate);
          console.log('📅 Entry date set to:', formattedDate);
        } else if (data[0].createdAt) {
          const dt = new Date(data[0].createdAt);
          const yyyy = dt.getFullYear();
          const mm = String(dt.getMonth() + 1).padStart(2, '0');
          const dd = String(dt.getDate()).padStart(2, '0');
          const formattedDate = `${yyyy}-${mm}-${dd}`;
          
          setEntryDate(formattedDate);
          console.log('📅 Entry date from createdAt:', formattedDate);
        } else {
          setEntryDate(null);
        }
      } else {
        setTimeLabel(null);
        setEntryDate(null);
        setBlockTime(null);
        setIsBlocked(false);
        Alert.alert('No Results', 'No entries found for this bill number');
      }
    } catch (err) {
      console.error('❌ Error fetching bill:', err);
      Alert.alert('Error', 'Failed to fetch entries. Please try again.');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: Get meaningful block message
  const getBlockMessage = () => {
    if (!blockTime || !entryDate) {
      return 'Editing is currently blocked.';
    }

    const [year, month, day] = entryDate.split('-').map(Number);
    const [blockH, blockM] = blockTime.blockTime.split(':').map(Number);
    const blockDeadline = new Date(year, month - 1, day, blockH, blockM, 0, 0);

    const formattedDeadline = blockDeadline.toLocaleDateString('en-GB') + ' ' + blockTime.blockTime;

    return `🔒 This bill from ${entryDate} is permanently locked. Editing/deleting was only allowed until ${formattedDeadline}.`;
  };

  // ✅ Delete all entries with permanent block check
  const handleDelete = () => {
    if (isBlocked) {
      Alert.alert('🔒 Permanently Blocked', getBlockMessage(), [{ text: 'OK', style: 'default' }]);
      return;
    }

    if (!billNo || entries.length === 0) {
      Alert.alert('Error', 'No bill to delete');
      return;
    }

    Alert.alert(
      'Confirm Delete', 
      `Delete all ${entries.length} entries in bill ${billNo}?`, 
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const res = await fetch(`${Domain}/deleteEntriesByBillNo/${billNo}`, {
                method: 'DELETE',
              });
              
              if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
              }

              const result = await res.json();
              
              Alert.alert('Success', 'All entries deleted successfully');
              setEntries([]);
              setBillNo('');
              setTimeLabel(null);
              setEntryDate(null);
              setBlockTime(null);
              setIsBlocked(false);
            } catch (error) {
              console.error('❌ Delete error:', error);
              Alert.alert('Error', error.message || 'Error deleting entries');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // ✅ Confirm delete for single entry, with permanent block check
  const confirmDeleteEntry = (id) => {
    if (isBlocked) {
      Alert.alert('🔒 Permanently Blocked', getBlockMessage(), [{ text: 'OK', style: 'default' }]);
      return;
    }

    Alert.alert('Confirm Delete', 'Delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteEntryById(id),
      },
    ]);
  };

  // ✅ Delete single entry by id
  const deleteEntryById = async (id) => {
    try {
      setLoading(true);
      
      const res = await fetch(`${Domain}/deleteEntryById/${id}/${userType}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }

      const result = await res.json();
      
      setEntries((prev) => prev.filter((entry) => entry._id !== id));
      Alert.alert('Success', 'Entry deleted successfully');
    } catch (error) {
      console.error('❌ Delete entry error:', error);
      Alert.alert('Error', error.message || 'Error deleting entry');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Save edited count with permanent block check
  const saveEditedCount = async (id) => {
    if (isBlocked) {
      Alert.alert('🔒 Permanently Blocked', getBlockMessage(), [{ text: 'OK', style: 'default' }]);
      return;
    }

    const newCount = parseInt(editingCount);
    if (isNaN(newCount) || newCount <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid count greater than 0');
      return;
    }

    try {
      setLoading(true);
      
      const res = await fetch(`${Domain}/updateEntryCount/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          count: newCount,
          userType: userType
        }),
      });

      const result = await res.json();

      if (res.ok) {
        setEntries((prev) =>
          prev.map((entry) =>
            entry._id === id ? { ...entry, count: newCount } : entry
          )
        );
        setEditingId(null);
        setEditingCount('');
        Alert.alert('Success', 'Count updated successfully');
      } else {
        Alert.alert('Error', result.message || 'Failed to update count');
      }
    } catch (error) {
      console.error('❌ Error updating count:', error);
      Alert.alert('Error', 'Error saving changes');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Start editing with permanent block check
  const startEditing = (id, currentCount) => {
    if (isBlocked) {
      Alert.alert('🔒 Permanently Blocked', getBlockMessage(), [{ text: 'OK', style: 'default' }]);
      return;
    }

    setEditingId(id);
    setEditingCount(String(currentCount));
  };

  // ✅ Calculate amount based on entry rate or fallback to count * 8
  const calculateAmount = (entry, displayCount) => {
    const count = parseInt(displayCount || '0');
    if (entry.rate && typeof entry.rate === 'number') {
      const ratePerUnit = entry.rate / (entry.count || 1);
      return (count * ratePerUnit).toFixed(2);
    }
    return (count * 8).toFixed(2);
  };

  // ✅ Render entry row
  const renderEntry = ({ item }) => {
    const isEditing = editingId === item._id;
    const displayCount = isEditing ? editingCount : item.count;
    const totalAmount = calculateAmount(item, displayCount);

    return (
      <View style={styles.entryTableRow}>
        <Text style={styles.cell}>{item.type}</Text>
        <Text style={styles.cell}>{item.number}</Text>

        {isEditing ? (
          <TextInput
            style={[styles.cell, styles.editInput]}
            value={editingCount}
            onChangeText={setEditingCount}
            keyboardType="numeric"
            editable={!isBlocked}
            autoFocus
          />
        ) : (
          <Text style={styles.cell}>{item.count}</Text>
        )}

        <Text style={styles.cell}>₹{totalAmount}</Text>

        {isEditing ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.iconBtn, { marginRight: 8 }]}
              onPress={() => saveEditedCount(item._id)}
              disabled={isBlocked || loading || blockCheckLoading || !timeCheckCompleted}
            >
              <Ionicons name="checkmark" size={22} color={(isBlocked || loading || blockCheckLoading || !timeCheckCompleted) ? 'gray' : 'green'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => {
                setEditingId(null);
                setEditingCount('');
              }}
              disabled={isBlocked || loading || blockCheckLoading || !timeCheckCompleted}
            >
              <Ionicons name="close" size={20} color={(isBlocked || loading || blockCheckLoading || !timeCheckCompleted) ? 'gray' : 'red'} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.iconBtn, { marginRight: 8 }]}
              onPress={() => startEditing(item._id, item.count)}
              disabled={isBlocked || loading || blockCheckLoading || !timeCheckCompleted}
            >
              <MaterialCommunityIcons
                name="pencil"
                size={20}
                color={(isBlocked || loading || blockCheckLoading || !timeCheckCompleted) ? 'gray' : '#333'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => confirmDeleteEntry(item._id)}
              disabled={isBlocked || loading || blockCheckLoading || !timeCheckCompleted}
            >
              <Ionicons name="trash" size={20} color={(isBlocked || loading || blockCheckLoading || !timeCheckCompleted) ? 'gray' : 'red'} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // ✅ Calculate total amount properly
  const calculateTotalAmount = () => {
    return entries.reduce((sum, entry) => {
      if (entry.rate && typeof entry.rate === 'number') {
        return sum + entry.rate;
      }
      return sum + (entry.count * 8);
    }, 0);
  };

  // ✅ UPDATED: Get time remaining until block
  const getTimeUntilBlock = () => {
    if (!blockTime || !entryDate) return null;
    
    const now = new Date();
    const [year, month, day] = entryDate.split('-').map(Number);
    const [blockH, blockM] = blockTime.blockTime.split(':').map(Number);
    const blockDeadline = new Date(year, month - 1, day, blockH, blockM, 0, 0);
    
    if (now >= blockDeadline) return null;
    
    const timeLeft = blockDeadline - now;
    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours: hoursLeft, minutes: minutesLeft };
  };

  const timeUntilBlock = getTimeUntilBlock();

  return (
    <View style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Edit & Delete Bill</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <Ionicons name="home" size={24} color="red" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <Text style={styles.title}>Bill No</Text>
        <TextInput
          style={[styles.input, isBlocked && { backgroundColor: '#f0f0f0', color: '#999' }]}
          placeholder="Enter Bill No"
          value={billNo}
          onChangeText={setBillNo}
          placeholderTextColor="#999"
          keyboardType="numeric"
          editable={!loading}
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.searchBtn, loading && { backgroundColor: '#aaa' }]}
            onPress={() => handleSearch()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.btnText}>Search</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteBtn, (isBlocked || entries.length === 0 || loading || blockCheckLoading) && { backgroundColor: '#aaa' }]}
            onPress={handleDelete}
            disabled={isBlocked || entries.length === 0 || loading || blockCheckLoading || !timeCheckCompleted}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : blockCheckLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.btnText}>Delete All</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ UPDATED: Enhanced Block Status Indicators */}
      {blockCheckLoading && (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="small" color="#ff2e63" />
          <Text style={styles.statusText}>Checking block deadline...</Text>
        </View>
      )}

      {isBlocked && blockTime && entryDate && (
        <View style={styles.permanentBlockContainer}>
          <Text style={styles.permanentBlockText}>
            🔒 PERMANENTLY BLOCKED
          </Text>
          <Text style={styles.blockDetailsText}>
            Bill Date: {entryDate} | Block Time: {blockTime.blockTime}
          </Text>
          <Text style={styles.blockDetailsText}>
            Deadline passed - No further editing allowed
          </Text>
        </View>
      )}

      {!isBlocked && timeUntilBlock && blockTime && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ Editing will be blocked in {timeUntilBlock.hours}h {timeUntilBlock.minutes}m
          </Text>
          <Text style={styles.warningDetailsText}>
            Deadline: {entryDate} at {blockTime.blockTime}
          </Text>
        </View>
      )}

      {timeLabel && !isBlocked && !timeUntilBlock && (
        <View style={styles.allowedContainer}>
          <Text style={styles.allowedText}>
            ✅ Editing allowed for {timeLabel} ({userType} user)
          </Text>
        </View>
      )}

      {loading && entries.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff2e63" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : entries.length > 0 ? (
        <>
          <View style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <Text style={styles.billText}>Bill #{billNo}</Text>
              {timeLabel && <Text style={styles.timeText}>{timeLabel}</Text>}
              {entryDate && <Text style={styles.dateText}>Date: {entryDate}</Text>}
            </View>
            <View style={styles.summaryRight}>
              <Text style={styles.summaryLine}>Count: {entries.length}</Text>
              <Text style={styles.summaryLine}>
                Amount: ₹{calculateTotalAmount().toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.entryTableHeader}>
            <Text style={styles.headerCell}>Ticket</Text>
            <Text style={styles.headerCell}>No</Text>
            <Text style={styles.headerCell}>Count</Text>
            <Text style={styles.headerCell}>Amount</Text>
            <Text style={styles.headerCell}>Actions</Text>
          </View>
          <FlatList
            data={entries}
            keyExtractor={(item) => item._id}
            renderItem={renderEntry}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : billNo && !loading ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No entries found for Bill #{billNo}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    elevation: 4,
    backgroundColor: '#fff',
    marginTop: 30,
  },
  headerText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'black',
  },
  container: {
    marginTop: 20,
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 4,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    fontSize: 16,
    paddingVertical: 8,
    marginBottom: 16,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  searchBtn: {
    flex: 1,
    backgroundColor: '#ff2e63',
    paddingVertical: 12,
    borderRadius: 6,
    marginRight: 8,
    alignItems: 'center',
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#ff6f61',
    paddingVertical: 12,
    borderRadius: 6,
    marginLeft: 8,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
  },
  statusText: {
    marginLeft: 8,
    color: '#1976d2',
    fontSize: 14,
  },
  // ✅ NEW: Permanent block styling
  permanentBlockContainer: {
    backgroundColor: '#ffebee',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 6,
    borderLeftColor: '#d32f2f',
    alignItems: 'center',
  },
  permanentBlockText: {
    color: '#d32f2f',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  blockDetailsText: {
    color: '#d32f2f',
    fontSize: 12,
    textAlign: 'center',
  },
  // ✅ NEW: Warning before block
  warningContainer: {
    backgroundColor: '#fff3e0',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  warningText: {
    color: '#ff9800',
    fontSize: 14,
    fontWeight: 'bold',
  },
  warningDetailsText: {
    color: '#ff9800',
    fontSize: 12,
    marginTop: 2,
  },
  allowedContainer: {
    backgroundColor: '#e8f5e8',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#388e3c',
  },
  allowedText: {
    color: '#388e3c',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 2,
  },
  summaryLeft: {},
  summaryRight: {
    alignItems: 'flex-end',
  },
  billText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  dateText: {
    fontSize: 11,
    color: '#999',
    marginTop: 1,
  },
  summaryLine: {
    fontSize: 14,
    color: '#333',
  },
  entryTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#8e44ad',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginHorizontal: 16,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerCell: {
    flex: 1,
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },
  entryTableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    color: '#333',
    textAlign: 'center',
    fontSize: 14,
  },
  editInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#ff2e63',
    paddingVertical: 4,
    textAlign: 'center',
  },
  actionButtons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
});

export default EditDeleteBillScreen;