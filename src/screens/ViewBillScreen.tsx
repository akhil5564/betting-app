import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { Domain } from './NetPayScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Entry = {
  _id: string;
  number: string;
  count: number;
  type: string;
};

type BillMeta = {
  createdBy: string;
  billNo: number;
  timeLabel: string;
  timeCode: string;
  createdAt: string;
};

const ViewBillScreen = () => {
  const route = useRoute<any>();
  const billId = route.params?.billId;

  const [entries, setEntries] = useState<Entry[]>([]);
  const [billMeta, setBillMeta] = useState<BillMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCount, setEditingCount] = useState<string>('');
  const [actionsBlocked, setActionsBlocked] = useState(false);

  const sortEntries = (entries: Entry[]) => {
    return [...entries].sort((a, b) => {
      if (a.type.toLowerCase() < b.type.toLowerCase()) return -1;
      if (a.type.toLowerCase() > b.type.toLowerCase()) return 1;
      if (a.count > b.count) return -1;
      if (a.count < b.count) return 1;
      if (a.number < b.number) return -1;
      if (a.number > b.number) return 1;
      return 0;
    });
  };

  const fetchBill = async () => {
    try {
      const res = await fetch(`${Domain}/entries?billNo=${billId}`);
      const text = await res.text();

      try {
        const data = JSON.parse(text);

        if (!Array.isArray(data) || data.length === 0) {
          Alert.alert('No Data', '⚠️ No data found for this bill number.');
          return;
        }

        const parsedEntries = data.map((entry: any) => ({
          _id: entry._id || String(Math.random()),
          number: entry.num || entry.number || '',
          count: entry.cnt || entry.count || 0,
          type: entry.type || '',
        }));

        setEntries(sortEntries(parsedEntries));

        setBillMeta({
          createdBy: data[0].createdBy || '',
          billNo: data[0].billNo || '',
          timeLabel: data[0].timeLabel || '',
          timeCode: data[0].timeCode || '',
          createdAt: data[0].createdAt || '',
        });
      } catch (jsonError) {
        console.error('❌ JSON Parse Error:', jsonError);
        Alert.alert('Error', '❌ Failed to load bill data. Try again.');
      }
    } catch (error) {
      console.error('❌ Network Error:', error);
      Alert.alert('Network', '❌ Failed to fetch bill data. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBill();
  }, []);

  // After block time, sub users cannot edit/delete
  useEffect(() => {
    const checkBlock = async () => {
      try {
        const userType = await AsyncStorage.getItem('usertype');
        if (userType !== 'sub') {
          setActionsBlocked(false);
          return;
        }
        const timeLabel = billMeta?.timeLabel;
        if (!timeLabel) return;

        const res = await fetch(`${Domain}/getBlockTime/${encodeURIComponent(timeLabel)}`);
        if (!res.ok) return;
        const data = await res.json();
        const blockTimeStr: string | undefined = data?.blockTime;
        if (!blockTimeStr) return;

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const [bh, bm] = blockTimeStr.split(':').map((v: string) => parseInt(v, 10));
        const blockTime = new Date(`${todayStr}T${String(bh).padStart(2, '0')}:${String(bm).padStart(2, '0')}:00`);
        setActionsBlocked(now >= blockTime);
      } catch (e) {
        // fail-open (no block) on error
        setActionsBlocked(false);
      }
    };

    checkBlock();
  }, [billMeta?.timeLabel]);

  const startEditing = (id: string, currentCount: number) => {
    if (actionsBlocked) {
      Alert.alert('Blocked', 'Editing is disabled after block time for sub users.');
      return;
    }
    setEditingId(id);
    setEditingCount(String(currentCount));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingCount('');
  };

  const saveCountEdit = async (id: string) => {
    const newCount = parseInt(editingCount);
    if (isNaN(newCount) || newCount < 0) {
      Alert.alert('Invalid', 'Please enter a valid count');
      return;
    }

    try {
      const res = await fetch(`${Domain}/updateEntryCount/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: newCount }),
      });

      if (res.ok) {
        setEntries((prev) =>
          sortEntries(
            prev.map((entry) =>
              entry._id === id ? { ...entry, count: newCount } : entry
            )
          )
        );
        cancelEditing();
        Alert.alert('Success', 'Count updated successfully');
      } else {
        const result = await res.json();
        Alert.alert('Error', result.message || 'Failed to update count');
      }
    } catch (error) {
      console.error('❌ Error updating count:', error);
      Alert.alert('Error', 'Error saving changes');
    }
  };

  const confirmDeleteEntry = (id: string) => {
    if (actionsBlocked) {
      Alert.alert('Blocked', 'Deleting is disabled after block time for sub users.');
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

  const deleteEntryById = async (id: string) => {
    try {
      const res = await fetch(`${Domain}/deleteEntryById/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setEntries((prev) => prev.filter((entry) => entry._id !== id));
        Alert.alert('Deleted', 'Deleted entry successfully');
      } else {
        const result = await res.json();
        Alert.alert('Error', result.message || 'Failed to delete entry');
      }
    } catch (error) {
      console.error('❌ Delete entry error:', error);
      Alert.alert('Error', 'Error deleting entry');
    }
  };

  const renderItem = ({ item }: { item: Entry }) => {
    const isEditing = editingId === item._id;

    let bgColor = '#fff';
    if (item.type.toLowerCase() === 'super') bgColor = '#fdebd0';
    else if (item.type.toLowerCase() === 'box') bgColor = '#d1f2eb';
    else if (item.type.toLowerCase() === 'single') bgColor = '#f9e79f';
    else if (item.type.toLowerCase() === 'double') bgColor = '#fadbd8';

    return (
      <View style={[styles.entryRow, { backgroundColor: bgColor }]}>
        <Text style={[styles.cell, styles.typeCell]}>{item.type}</Text>
        <Text style={[styles.cell, styles.numberCell]}>{item.number}</Text>

        {isEditing ? (
          <TextInput
            style={[styles.cell, styles.editInput, styles.countCell]}
            value={editingCount}
            onChangeText={setEditingCount}
            keyboardType="numeric"
          />
        ) : (
          <Text style={[styles.cell, styles.countCell]}>{item.count}</Text>
        )}

        <View style={[styles.actionButtons, styles.actionsCell]}>
          {actionsBlocked ? (
            <Text style={{ color: '#999', fontWeight: 'bold' }}>Blocked</Text>
          ) : isEditing ? (
            <>
              <TouchableOpacity onPress={() => saveCountEdit(item._id)} style={styles.iconBtn}>
                <Ionicons name="checkmark" size={24} color="green" />
              </TouchableOpacity>
              <TouchableOpacity onPress={cancelEditing} style={styles.iconBtn}>
                <Ionicons name="close" size={24} color="red" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={() => startEditing(item._id, item.count)} style={styles.iconBtn}>
                <Ionicons name="pencil" size={22} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDeleteEntry(item._id)} style={styles.iconBtn}>
                <Ionicons name="trash" size={22} color="red" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#f85a8f" />
        <Text style={{ marginTop: 10 }}>Loading Bill #{billId}...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {billMeta && (
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>🧾 Bill No: {billMeta.billNo}</Text>
          <Text style={styles.metaText}>Created By: {billMeta.createdBy}</Text>
          <Text style={styles.metaText}>Time: {billMeta.timeLabel}</Text>
        </View>
      )}

      <View style={styles.tableHeader}>
        <Text style={[styles.cell, styles.header, styles.typeCell]}>Type</Text>
        <Text style={[styles.cell, styles.header, styles.numberCell]}>Number</Text>
        <Text style={[styles.cell, styles.header, styles.countCell]}>Count</Text>
        <Text style={[styles.cell, styles.header, styles.actionsCell]}>Actions</Text>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        scrollEnabled={false}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    marginTop: 40,
  },
  metaContainer: {
    marginBottom: 16,
    backgroundColor: '#f4f4f4',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f85a8f',
  },
  metaText: {
    fontSize: 15,
    marginBottom: 4,
    color: '#333',
  },
  tableHeader: {
    flexDirection: 'row',
    marginBottom: 6,
    borderBottomWidth: 2,
    paddingBottom: 8,
    borderColor: '#f85a8f',
    backgroundColor: '#fef0f3',
    borderRadius: 6,
  },
  entryRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
    alignItems: 'center',
    borderRadius: 6,
    marginVertical: 2,
    elevation: 1,
  },
  cell: {
    textAlign: 'center',
    fontSize: 15,
    color: '#000',
    paddingHorizontal: 8,
  },
  header: {
    fontWeight: 'bold',
    color: '#d6336c',
  },
  editInput: {
    borderBottomWidth: 2,
    borderColor: '#d6336c',
    color: '#000',
    paddingVertical: 0,
    paddingHorizontal: 6,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  iconBtn: {
    marginHorizontal: 8,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeCell: {
    flex: 2,
    fontWeight: 'bold',
  },
  numberCell: {
    flex: 1.7,
    fontWeight: 'bold',
  },
  countCell: {
    flex: 1.3,
    fontWeight: 'bold',
  },
  actionsCell: {
    flex: 1.7,
  },
});

export default ViewBillScreen;