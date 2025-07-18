import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { useRoute } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// 🎉 Emoji options for variety
const emojiOptions = ['🎉', '🎊', '✨', '💥', '🧨'];

export default function WinningDetailed() {
  const route = useRoute();
  const { date, time, matchedEntries } = route.params || {};

  const groupedEntries = matchedEntries?.reduce((acc, entry) => {
    if (!acc[entry.username]) acc[entry.username] = [];
    acc[entry.username].push(entry);
    return acc;
  }, {}) || {};

  const grandTotal = matchedEntries?.reduce((sum, entry) => sum + (entry.total || 0), 0);

  // Confetti animation setup
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
      <ScrollView style={styles.container}>
        <Text style={styles.heading}>🎯 Winning Report</Text>
        <Text style={styles.subheading}>🗓 {date} | ⏰ {time}</Text>
        <Text style={styles.grandTotal}>🏆 Grand Total: ₹{grandTotal}</Text>

        {Object.keys(groupedEntries).length === 0 ? (
          <Text style={styles.noData}>No matched entries found.</Text>
        ) : (
          Object.entries(groupedEntries).map(([username, entries]) => (
            <View key={username} style={styles.userSection}>
              <Text style={styles.usernameHeader}>{username}</Text>

              <View style={styles.tableHeader}>
                <Text style={styles.headerCell}>Number</Text>
                <Text style={styles.headerCell}>Type</Text>
                <Text style={styles.headerCell}>Count</Text>
                <Text style={styles.headerCell}>Super</Text>
                <Text style={styles.headerCell}>Total</Text>
              </View>

              {entries.map((entry, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.entryRow,
                    idx % 2 === 0 ? styles.oddRow : null,
                  ]}
                >
                  <Text style={styles.cell}>{entry.number}</Text>
                  <Text style={styles.cell}>{entry.type}</Text>
                  <Text style={styles.cell}>{entry.count}</Text>
                  <Text style={styles.cell}>₹{entry.super}</Text>
                  <Text style={styles.cellTotal}>₹{entry.total}</Text>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* 🎊 Confetti rain */}
      {confettis.map((item, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.confetti,
            {
              top: item.top,
              left: item.left,
            },
          ]}
        >
          {item.emoji}
        </Animated.Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    paddingTop: 6,
    marginTop: 40,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003366',
    textAlign: 'center',
  },
  subheading: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
    marginBottom: 6,
  },
  grandTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#cc0000',
    marginBottom: 8,
  },
  noData: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 20,
  },
  userSection: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#003366',
    borderRadius: 6,
    overflow: 'hidden',
  },
  usernameHeader: {
    backgroundColor: '#003366',
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 4,
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0066cc',
    paddingVertical: 4,
  },
  headerCell: {
    flex: 1,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
  entryRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  oddRow: {
    backgroundColor: '#e6f0ff',
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  cellTotal: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 'bold',
    color: '#b30000',
  },
  confetti: {
    position: 'absolute',
    fontSize: 22,
  },
});
