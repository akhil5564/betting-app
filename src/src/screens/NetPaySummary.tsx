import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
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

  const [salesAmount, setSalesAmount] = useState(0);
  const [entryCount, setEntryCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const winningAmount = matchedEntries.reduce(
    (sum, entry) => sum + (entry.total || 0),
    0
  );

  const totalSuper = matchedEntries.reduce(
    (sum, entry) => sum + (entry.super * entry.count || 0),
    0
  );

  const totalAmount = winningAmount - totalSuper;

  const totalEntryAmount = matchedEntries.reduce(
    (sum, entry) => sum + (entry.count || 0) * 10,
    0
  );

  const groupedEntries = matchedEntries.reduce((acc, entry) => {
    if (!acc[entry.username]) acc[entry.username] = [];
    acc[entry.username].push(entry);
    return acc;
  }, {});

  const [selectedUser, setSelectedUser] = useState('All');
  const usernames = Object.keys(groupedEntries);

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

  useEffect(() => {
    const fetchSalesAmount = async () => {
      try {
        const res = await fetch(`https://manu-netflix.onrender.com/entries?fromDate=${fromDate}&toDate=${toDate}}`);
        const data = await res.json();

        const total = data.reduce((sum, entry) => {
          return sum + (entry.count || 0) ;
        }, 0);

        const totalCount = data.reduce((sum, entry) => {
          return sum + (entry.count || 0);
        }, 0);

        setSalesAmount(total);
        setEntryCount(totalCount);
      } catch (err) {
        console.error('Error fetching sales amount:', err);
        setSalesAmount(0);
        setEntryCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesAmount();
  }, [fromDate, toDate, time]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
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
          </View>
          <View style={styles.summaryRow}>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sales Amount</Text>
            <Text style={styles.summaryValue}>: ₹{loading ? '...' : salesAmount}</Text>
          </View>
          <View style={styles.summaryRow}>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: '#b71c1c' }]}>Total Winning</Text>
            <Text style={[styles.summaryValue, { color: '#b71c1c' }]}>: ₹{winningAmount}</Text>
          </View>
        </View>

        {/* Optional User Filter */}
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
      </ScrollView>

      {/* Confetti Animation */}
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
  confetti: {
    position: 'absolute',
    fontSize: 20,
  },
});
