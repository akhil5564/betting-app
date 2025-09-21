import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { Domain } from './NetPayScreen';

const EditDeleteBillScreen = () => {
  const route = useRoute();
  const { billNo: routeBillNo } = route.params || {};

  const [billNo, setBillNo] = useState(routeBillNo || '');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingCount, setEditingCount] = useState('');

  // Current timeLabel to fetch blockTime
  const [timeLabel, setTimeLabel] = useState(null);

  // Block time info from backend
  const [blockTime, setBlockTime] = useState(null);

  // Date of the entry (expected format: "YYYY-MM-DD")
  const [entryDate, setEntryDate] = useState(null);

  // Is editing/deleting blocked currently?
  const [isBlocked, setIsBlocked] = useState(false);

  // Fetch block time when timeLabel changes
  useEffect(() => {
    if (timeLabel) {
      fetchBlockTime(timeLabel);
    } else {
      setBlockTime(null);
      setIsBlocked(false);
    }
  }, [timeLabel]);

  // Search bill entries when route param changes
  useEffect(() => {
    if (routeBillNo) {
      handleSearch(routeBillNo);
    }
  }, [routeBillNo]);

  // Check block status whenever blockTime or entryDate changes
  useEffect(() => {
    if (blockTime && entryDate) {
      checkIfBlocked();
      const interval = setInterval(checkIfBlocked, 30000); // refresh every 30s
      return () => clearInterval(interval);
    } else {
      setIsBlocked(false);
    }
  }, [blockTime, entryDate]);

  // Fetch blockTime data from server for a timeLabel
  const fetchBlockTime = async (timeLabelParam) => {
    try {
      const encodedLabel = encodeURIComponent(timeLabelParam);
      const res = await fetch(`${Domain}/getBlockTime/${encodedLabel}`);
      if (!res.ok) throw new Error('Failed to fetch block time');
      const data = await res.json();

      console.log('Fetched blockTime:', data);

      setBlockTime(data);
    } catch (err) {
      console.error('Error fetching block time:', err);
      setBlockTime(null);
      setIsBlocked(false);
    }
  };

  // Updated block check: block if current datetime >= entry date + block time
  const checkIfBlocked = () => {
    if (!blockTime || !blockTime.blockTime || !entryDate) {
      setIsBlocked(false);
      return;
    }

    const now = new Date();

    // Parse entryDate expected format: "YYYY-MM-DD"
    const [year, month, day] = entryDate.split('-').map(Number);
    const [blockH, blockM] = blockTime.blockTime.split(':').map(Number);

    const blockDateTime = new Date(year, month - 1, day, blockH, blockM, 0, 0);

    // Debug logs
    console.log('Now:', now.toString());
    console.log('Entry Date + Block Time:', blockDateTime.toString());
    console.log('Blocked?', now >= blockDateTime);

    // Block if current datetime is after or equal to block datetime
    setIsBlocked(now >= blockDateTime);
  };

  // Fetch entries by billNo and update timeLabel and entryDate
  const handleSearch = async (searchBillNo = billNo) => {
    if (!searchBillNo) return;
    try {
      setLoading(true);
      const res = await fetch(`${Domain}/entries?billNo=${searchBillNo}`);
      const data = await res.json();
      setEntries(data);

      if (data.length > 0) {
        if (data[0].timeLabel) setTimeLabel(data[0].timeLabel);

        // Assume each entry has a 'createdAt' field - convert to "YYYY-MM-DD"
        if (data[0].createdAt) {
          const dt = new Date(data[0].createdAt);
          const yyyy = dt.getFullYear();
          const mm = String(dt.getMonth() + 1).padStart(2, '0');
          const dd = String(dt.getDate()).padStart(2, '0');
          setEntryDate(`${yyyy}-${mm}-${dd}`);
        } else {
          setEntryDate(null);
        }
      } else {
        setTimeLabel(null);
        setEntryDate(null);
        setBlockTime(null);
        setIsBlocked(false);
      }
    } catch (err) {
      console.error('❌ Error fetching bill:', err);
      alert('Failed to fetch entries');
    } finally {
      setLoading(false);
    }
  };

  // Delete all entries of bill, only if not blocked
  const handleDelete = () => {
    if (isBlocked) {
      alert('Editing and deleting entries is blocked at this time.');
      return;
    }
    Alert.alert('Confirm Delete', `Delete all entries in bill ${billNo}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${Domain}/deleteEntriesByBillNo/${billNo}`, {
              method: 'DELETE',
            });
            const result = await res.json();
            if (res.ok) {
              alert('Deleted successfully');
              setEntries([]);
              setBillNo('');
              setTimeLabel(null);
              setEntryDate(null);
              setBlockTime(null);
              setIsBlocked(false);
            } else {
              alert(result.message || 'Failed to delete');
            }
          } catch (error) {
            console.error(error);
            alert('Error deleting entries');
          }
        },
      },
    ]);
  };

  // Confirm delete for single entry, blocked check included
  const confirmDeleteEntry = (id) => {
    if (isBlocked) {
      alert('Editing and deleting entries is blocked at this time.');
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

  // Delete single entry by id
  const deleteEntryById = async (id) => {
    try {
      const res = await fetch(`${Domain}/deleteEntryById/${id}`, {
        method: 'DELETE',
      });

      const text = await res.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error('❌ Server did not return JSON:', text);
        alert('Unexpected server response');
        return;
      }

      if (res.ok) {
        setEntries((prev) => prev.filter((entry) => entry._id !== id));
        alert('Deleted entry successfully');
      } else {
        alert(result.message || 'Failed to delete entry');
      }
    } catch (error) {
      console.error('❌ Delete entry error:', error);
      alert('Error deleting entry');
    }
  };

  // Save edited count for entry, only if not blocked
  const saveEditedCount = async (id) => {
    if (isBlocked) {
      alert('Editing and deleting entries is blocked at this time.');
      return;
    }
    try {
      const res = await fetch(`${Domain}/updateEntryCount/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: parseInt(editingCount) }),
      });

      const result = await res.json();

      if (res.ok) {
        setEntries((prev) =>
          prev.map((entry) =>
            entry._id === id ? { ...entry, count: parseInt(editingCount) } : entry
          )
        );
        setEditingId(null);
        setEditingCount('');
      } else {
        alert(result.message || 'Failed to update count');
      }
    } catch (error) {
      console.error('❌ Error updating count:', error);
      alert('Error saving changes');
    }
  };

  // Render entry row with editing disabled if blocked
  const renderEntry = ({ item }) => {
    const isEditing = editingId === item._id;
    const displayCount = isEditing ? editingCount : item.count;
    const totalAmount = (parseInt(displayCount || '0') * 8).toFixed(2);

    return (
      <View style={styles.entryTableRow}>
        <Text style={styles.cell}>{item.type}</Text>
        <Text style={styles.cell}>{item.number}</Text>

        {isEditing ? (
          <TextInput
            style={[styles.cell, { borderBottomWidth: 1, color: '#000' }]}
            value={editingCount}
            onChangeText={setEditingCount}
            keyboardType="numeric"
            editable={!isBlocked}
          />
        ) : (
          <Text style={styles.cell}>{item.count}</Text>
        )}

        <Text style={styles.cell}>{totalAmount}</Text>

        {isEditing ? (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => saveEditedCount(item._id)}
            disabled={isBlocked}
          >
            <Ionicons name="checkmark" size={22} color={isBlocked ? 'gray' : 'green'} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              if (isBlocked) {
                alert('Editing and deleting entries is blocked at this time.');
                return;
              }
              setEditingId(item._id);
              setEditingCount(String(item.count));
            }}
          >
            <MaterialCommunityIcons
              name="pencil"
              size={20}
              color={isBlocked ? 'gray' : '#333'}
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => confirmDeleteEntry(item._id)}
          disabled={isBlocked}
        >
          <Ionicons name="trash" size={20} color={isBlocked ? 'gray' : 'red'} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Edit</Text>
      </View>

      <View style={styles.container}>
        <Text style={styles.title}>Bill No</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Bill No"
          value={billNo}
          onChangeText={setBillNo}
          placeholderTextColor="#999"
          keyboardType="numeric"
          editable={!isBlocked}
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.searchBtn, isBlocked && { backgroundColor: '#aaa' }]}
            onPress={() => handleSearch()}
            disabled={isBlocked}
          >
            <Text style={styles.btnText}>Search</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteBtn, isBlocked && { backgroundColor: '#aaa' }]}
            onPress={handleDelete}
            disabled={isBlocked}
          >
            <Text style={styles.btnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isBlocked && (
        <Text
          style={{
            textAlign: 'center',
            marginTop: 8,
            color: 'red',
            fontWeight: 'bold',
          }}
        >
          Editing and deleting entries is blocked at this time.
        </Text>
      )}

      {loading ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading...</Text>
      ) : entries.length > 0 ? (
        <>
          <View style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <Text style={styles.billText}>Bill #{billNo}</Text>
            </View>
            <View style={styles.summaryRight}>
              <Text style={styles.summaryLine}>Count: {entries.length}</Text>
              <Text style={styles.summaryLine}>
                Amount: ₹{entries.reduce((sum, e) => sum + e.count * 8, 0)}
              </Text>
            </View>
          </View>

          <View style={styles.entryTableHeader}>
            <Text style={styles.cell}>Ticket</Text>
            <Text style={styles.cell}>No</Text>
            <Text style={styles.cell}>Count</Text>
            <Text style={styles.cell}>Amount</Text>
            <Text style={styles.cell}></Text>
            <Text style={styles.cell}></Text>
          </View>
          <FlatList
            data={entries}
            keyExtractor={(item) => item._id}
            renderItem={renderEntry}
          />
        </>
      ) : billNo && !loading ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>No entries found.</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 4,
    backgroundColor: '#fff',
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
  },
  summaryLine: {
    fontSize: 14,
    color: '#333',
  },
  entryTableHeader: {
    flexDirection: 'row',
    backgroundColor: 'violet',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  entryTableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  cell: {
    flex: 1,
    color: '#000',
    textAlign: 'center',
    fontSize: 14,
  },
  iconBtn: {
    paddingHorizontal: 4,
  },
});

export default EditDeleteBillScreen;
