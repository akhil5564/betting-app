import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRoute } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const emojiOptions = ['🎉', '🎊', '✨', '💥', '🧨'];

export default function WinningDetailed() {
  const route = useRoute();
  const {
    fromDate,
    toDate,
    time,
    matchedEntries = [],
  } = route.params || {};

  const winningAmount = matchedEntries.reduce(
    (sum, entry) => sum + (entry.total || 0),
    0
  );

  const totalSuper = matchedEntries.reduce(
    (sum, entry) => sum + (entry.super * entry.count || 0),
    0
  );

  const totalAmount = winningAmount - totalSuper;

  const groupedEntries = matchedEntries.reduce((acc, entry) => {
    if (!acc[entry.username]) acc[entry.username] = [];
    acc[entry.username].push(entry);
    return acc;
  }, {});

  const [selectedUser, setSelectedUser] = useState('All');
  const usernames = Object.keys(groupedEntries);
  const displayedEntries =
    selectedUser === 'All'
      ? groupedEntries
      : { [selectedUser]: groupedEntries[selectedUser] };

  const confettis = Array.from({ length: 20 }).map(() => ({
    top: useRef(new Animated.Value(-50)).current,
    left: Math.random() * width,
    emoji: emojiOptions[Math.floor(Math.random() * emojiOptions.length)],
  }));

  useEffect(() => {
    confettis.forEach(({ top }) => {
      Animated.timing(top, {
        toValue: height + 100,
        duration: 4000,
        useNativeDriver: false,
      }).start();
    });
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <Text style={styles.subheading}>
            📅 {fromDate} → {toDate}   |  ⏰ {time}
          </Text>
        </View>

        {/* Summary Box */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ticket</Text>
            <Text style={styles.summaryValue}>: {time}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.summaryValue}>: ₹{totalAmount}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Super</Text>
            <Text style={styles.summaryValue}>: ₹{totalSuper}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: '#b71c1c' }]}>Grand Total</Text>
            <Text style={[styles.summaryValue, { color: '#b71c1c' }]}>: ₹{winningAmount}</Text>
          </View>
        </View>

        {/* User Filter */}
        {usernames.length > 1 && (
          <View style={styles.pickerBox}>
            <Text style={styles.pickerLabel}>Filter by user:</Text>
            <Picker
              selectedValue={selectedUser}
              onValueChange={(value) => setSelectedUser(value)}
              style={styles.picker}
            >
              <Picker.Item label="All Users" value="All" />
              {usernames.map((name) => (
                <Picker.Item key={name} label={name} value={name} />
              ))}
            </Picker>
          </View>
        )}

        {/* Table Section */}
        {Object.keys(displayedEntries).length === 0 ? (
          <Text style={styles.noData}>No matched entries found.</Text>
        ) : (
          Object.entries(displayedEntries).map(([username, entries]) => {
            const userTotal = entries.reduce((sum, e) => sum + (e.total || 0), 0);
            return (
              <View key={username} style={styles.tableWrapper}>
                <Text style={styles.userTitle}>{username}</Text>
                <View style={styles.tableRowHeader}>
                  <Text style={styles.tableHeaderCell}>Number</Text>
                  <Text style={styles.tableHeaderCell}>Type</Text>
                  <Text style={styles.tableHeaderCell}>Qty</Text>
                  <Text style={styles.tableHeaderCell}>Super</Text>
                  <Text style={styles.tableHeaderCell}>Total</Text>
                </View>
                {entries.map((entry, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.tableRow,
                      idx % 2 !== 0 ? styles.altRow : {},
                    ]}
                  >
                    <Text style={styles.cell}>{entry.number}</Text>
                    <Text style={styles.cell}>{entry.type}</Text>
                    <Text style={styles.cell}>{entry.count}</Text>
                    <Text style={styles.cell}>₹{entry.super * entry.count}</Text>
                    <Text style={[styles.cell, { color: '#b71c1c', fontWeight: 'bold' }]}>
                      ₹{entry.total}
                    </Text>
                  </View>
                ))}
                <Text style={styles.userTotal}> Total: ₹{userTotal}</Text>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Confetti */}
      {confettis.map((item, index) => (
        <Animated.Text
          key={index}
          style={[styles.confetti, { top: item.top, left: item.left }]}
        >
          {item.emoji}
        </Animated.Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginTop: 30,
  },
  header: {
    alignItems: 'center',
    padding: 12,
  },
  subheading: {
    fontSize: 14,
    color: '#444',
    fontWeight: 'bold',
  },
  summaryBox: {
    backgroundColor: '#f9f9f9',
    marginHorizontal: 0,
    padding: 14,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222',
  },
  pickerBox: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  picker: {
    height: 44,
  },
  tableWrapper: {
    paddingBottom: 10,
  },
  userTitle: {
    backgroundColor: '#b71c1c',
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 8,
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#c62828',
    paddingVertical: 10,
  },
  tableHeaderCell: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  altRow: {
    backgroundColor: '#fdecea',
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 13,
    color: '#000',
  },
  userTotal: {
    textAlign: 'right',
    padding: 8,
    fontWeight: 'bold',
    color: '#1b5e20',
    backgroundColor: '#e8f5e9',
  },
  confetti: {
    position: 'absolute',
    fontSize: 20,
  },
  noData: {
    textAlign: 'center',
    padding: 20,
    color: '#999',
    fontWeight: '600',
  },
});

