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

const EditDeleteBillScreen = () => {
  const route = useRoute();
  const { billNo: routeBillNo } = route.params || {};

  const [billNo, setBillNo] = useState(routeBillNo || '');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingCount, setEditingCount] = useState('');

  useEffect(() => {
    if (routeBillNo) {
      handleSearch(routeBillNo);
    }
  }, [routeBillNo]);

  const handleSearch = async (searchBillNo = billNo) => {
    if (!searchBillNo) return;
    try {
      setLoading(true);
      const res = await fetch(`https://manu-netflix.onrender.com/entries?billNo=${searchBillNo}`);
      const data = await res.json();
      setEntries(data);
    } catch (err) {
      console.error('❌ Error fetching bill:', err);
      alert('Failed to fetch entries');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Confirm Delete', `Delete all entries in bill ${billNo}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`https://manu-netflix.onrender.com/deleteEntriesByBillNo/${billNo}`, {
              method: 'DELETE',
            });
            const result = await res.json();
            if (res.ok) {
              alert('Deleted successfully');
              setEntries([]);
              setBillNo('');
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

  const confirmDeleteEntry = (id) => {
    Alert.alert('Confirm Delete', 'Delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteEntryById(id),
      },
    ]);
  };

  const deleteEntryById = async (id) => {
    try {
      const res = await fetch(`https://manu-netflix.onrender.com/deleteEntryById/${id}`, {
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

  const saveEditedCount = async (id) => {
    try {
      const res = await fetch(`https://manu-netflix.onrender.com/updateEntryCount/${id}`, {
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

  const renderEntry = ({ item }) => {
    const isEditing = editingId === item._id;
    const displayCount = isEditing ? editingCount : item.count;
    const totalAmount = (parseInt(displayCount || '0') * 8).toFixed(2);

    return (
      <View style={styles.entryTableRow}>
        <Text style={styles.cell}>{item.timeLabel}</Text>
        <Text style={styles.cell}>{item.number}</Text>

        {isEditing ? (
          <TextInput
            style={[styles.cell, { borderBottomWidth: 1, color: '#000' }]}
            value={editingCount}
            onChangeText={setEditingCount}
            keyboardType="numeric"
          />
        ) : (
          <Text style={styles.cell}>{item.count}</Text>
        )}

        <Text style={styles.cell}>{totalAmount}</Text>

        {isEditing ? (
          <TouchableOpacity style={styles.iconBtn} onPress={() => saveEditedCount(item._id)}>
            <Ionicons name="checkmark" size={22} color="green" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              setEditingId(item._id);
              setEditingCount(String(item.count));
            }}
          >
            <MaterialCommunityIcons name="pencil" size={20} color="#333" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => confirmDeleteEntry(item._id)}
        >
          <Ionicons name="trash" size={20} color="red" />
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
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.searchBtn} onPress={() => handleSearch()}>
            <Text style={styles.btnText}>Search</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.btnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

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
    marginTop: 30,
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
