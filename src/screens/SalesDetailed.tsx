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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  EditDeleteBill: { billNo: string };
  Main: undefined;
  SalesReportDetailedAll: {
    fromDate: string;
    toDate: string;
    createdBy?: string;
    timeLabel?: string;
    entries?: EntryItem[];
  };
};

type SalesReportRouteProp = RouteProp<RootStackParamList, 'SalesReportDetailedAll'>;

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
  const route = useRoute<SalesReportRouteProp>();
  const { fromDate, toDate, createdBy, timeLabel, entries } = route.params || {};

  const [groupedEntries, setGroupedEntries] = useState<GroupedEntry[]>([]);
  const [loading, setLoading] = useState(true);
const [rateLookup, setRateLookup] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const fetchFilteredEntries = async () => {
      try {
        if (entries && Array.isArray(entries)) {
          groupAndSet(entries);
          setLoading(false);
          return;
        }

        const query = new URLSearchParams({
          fromDate,
          toDate,
          createdBy: createdBy || '',
          timeLabel: timeLabel && timeLabel !== 'all' ? timeLabel : '',
        }).toString();

        const res = await fetch(`https://manu-netflix.onrender.com/entries?${query}`);
        const data: EntryItem[] = await res.json();

        console.log('📦 Query URL:', `https://manu-netflix.onrender.com/entries?${query}`);
        groupAndSet(data);
      } catch (err) {
        console.error('❗ Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    const groupAndSet = (data: EntryItem[]) => {
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
    };

    fetchFilteredEntries();
  }, [fromDate, toDate, createdBy, timeLabel, entries]);

  const renderGroupedEntry = ({ item }: { item: GroupedEntry }) => {
    const getBetType = (type: string) => {
    if (!type) return 'SUPER'; // default
    const parts = type.split('-');
    return parts[parts.length - 1]; // e.g., SUPER, AB, etc.
  };

  let totalCount = 0;
  let totalAmount = 0;

  item.items.forEach((entry) => {
    const count = Number(entry.count) || 0;
    const betType = getBetType(entry.type);
    const rate = rateLookup[betType] ?? 10; // fallback
    totalCount += count;
    totalAmount += count * rate;
  });

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

       {item.items.map((entry, idx) => {
  const betType = getBetType(entry.type);
  const rate = rateLookup[betType] ?? 10;
  return (
    <View style={styles.itemRow} key={entry._id + idx}>
      <Text style={styles.itemCell}>{entry.timeLabel}</Text>
      <Text style={styles.itemCell}>{entry.number}</Text>
      <Text style={styles.itemCell}>{entry.count}</Text>
      <Text style={styles.itemCell}>{(entry.count * rate).toFixed(2)}</Text>
    </View>
  );
})}

      </View>
    );
  };
useEffect(() => {
  const fetchRates = async () => {
    try {
      if (!createdBy || !timeLabel || timeLabel === 'all') return;

      const rateRes = await fetch(
        `https://manu-netflix.onrender.com/rateMaster?user=${encodeURIComponent(createdBy)}&draw=${encodeURIComponent(timeLabel)}`
      );
      const rateData = await rateRes.json();
      const lookup: { [key: string]: number } = {};
      (rateData?.rates || []).forEach((r: any) => {
        lookup[r.label] = Number(r.rate) || 10; // fallback to 10
      });
      setRateLookup(lookup);
      console.log('Rate lookup:', lookup);
    } catch (err) {
      console.error('❌ Error fetching rates:', err);
    }
  };

  fetchRates();
}, [createdBy, timeLabel]);
useEffect(() => {
  if (groupedEntries.length && Object.keys(rateLookup).length) {
    setGroupedEntries(prev =>
      prev.map(group => ({
        ...group,
        items: [...group.items], // forces re-render
      }))
    );
  }
}, [rateLookup]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Filtered Sales Report</Text>
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
