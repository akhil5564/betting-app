import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  EditDeleteBill: { billNo: string };
  Main: undefined;
};

interface EntryItem {
  _id: string;
  billNo?: string;
  game?: string;
  timeLabel?: string;
  number: string;
  count: number;
  createdAt?: string;
  createdBy?: string;
  time?: string;
}

interface GroupedEntry {
  billNo: string;
  createdAt?: string;
  createdBy?: string;
  timeLabel?: string;
  items: EntryItem[];
}

const SalesReportDetailedAll = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [groupedEntries, setGroupedEntries] = useState<GroupedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch('https://manu-netflix.onrender.com/entries');
        const data: EntryItem[] = await res.json();

        const grouped: { [key: string]: GroupedEntry } = {};

        data.forEach((entry) => {
          const key = entry.billNo || entry._id;
          if (!grouped[key]) {
            grouped[key] = {
              billNo: key,
              createdAt: entry.createdAt,
              createdBy: entry.createdBy,
              timeLabel: entry.timeLabel,
              items: [],
            };
          }
          grouped[key].items.push(entry);
        });

        setGroupedEntries(Object.values(grouped));
      } catch (err) {
        console.error('❗ Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const renderGroupedEntry = ({ item }: { item: GroupedEntry }) => {
    const totalCount = item.items.reduce((sum, i) => sum + i.count, 0);
    const totalAmount = totalCount * 10;

    return (
      <View style={styles.billContainer}>
        <TouchableOpacity
          onLongPress={() => navigation.navigate('Edit', { billNo: item.billNo })}
          style={styles.billHeader}
        >
          <View style={styles.billRowTop}>
            <Text style={styles.billText}>
              Bill <Text style={styles.boldText}>{item.billNo}</Text>,
            </Text>
            <Text style={styles.boldText}>{item.timeLabel}</Text>
            <Text style={styles.boldText}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : ''}
            </Text>
            <Text style={styles.boldText}>
              {item.createdAt
                ? new Date(item.createdAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })
                : ''}
            </Text>
          </View>
          <View style={styles.billRowBottom}>
            <Text style={styles.billText}>
              Count: <Text style={styles.boldText}>{totalCount}</Text>
            </Text>
            <Text style={styles.billText}>
              Price: <Text style={styles.boldText}>{totalAmount.toFixed(2)}</Text>
            </Text>
          </View>
          <Text style={styles.billText}>
            A: <Text style={styles.boldText}>{item.createdBy}</Text>
          </Text>
        </TouchableOpacity>

        {item.items.map((entry, idx) => (
          <View style={styles.itemRow} key={entry._id + idx}>
            <Text style={styles.itemCell}>{entry.timeLabel}</Text>
            <Text style={styles.itemCell}>{entry.number}</Text>
            <Text style={styles.itemCell}>{entry.count}</Text>
            <Text style={styles.itemCell}>{(entry.count * 10).toFixed(2)}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Sales Report Entries</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <AntDesign name="home" size={24} color="red" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Loading entries...</Text>
      ) : groupedEntries.length === 0 ? (
        <Text style={styles.loadingText}>No entries found.</Text>
      ) : (
        <FlatList
          data={groupedEntries}
          keyExtractor={(item) => item.billNo}
          renderItem={renderGroupedEntry}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eeeeee',
    padding: 10,
    marginTop: 30,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#555',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 0.8,
    borderColor: '#ccc',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  billContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 6,
    overflow: 'hidden',
  },
  billHeader: {
    backgroundColor: '#f02b61',
    padding: 10,
  },
  billRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  billRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  billText: {
    color: '#fff',
    fontSize: 13,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#fff',
  },
  itemRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  itemCell: {
    flex: 1,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default SalesReportDetailedAll;
