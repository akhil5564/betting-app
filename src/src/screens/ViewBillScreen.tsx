import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';

type Entry = {
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

  const fetchBill = async () => {
    try {
      const res = await fetch(`https://manu-netflix.onrender.com/entries?billNo=${billId}`);
      const text = await res.text();

      try {
        const data = JSON.parse(text);

        if (!Array.isArray(data) || data.length === 0) {
          alert('⚠️ No data found for this bill number.');
          return;
        }

        const parsedEntries = data.map((entry: any) => ({
          number: entry.num || entry.number || '',
          count: entry.cnt || entry.count || 0,
          type: entry.type || '',
        }));

        setEntries(parsedEntries);

        setBillMeta({
          createdBy: data[0].createdBy || '',
          billNo: data[0].billNo || '',
          timeLabel: data[0].timeLabel || '',
          timeCode: data[0].timeCode || '',
          createdAt: data[0].createdAt || '',
        });
      } catch (jsonError) {
        console.error('❌ JSON Parse Error:', jsonError);
        alert('❌ Failed to load bill data. Try again.');
      }
    } catch (error) {
      console.error('❌ Network Error:', error);
      alert('❌ Failed to fetch bill data. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBill();
  }, []);

  const renderItem = ({ item }: { item: Entry }) => (
    <View style={styles.entryRow}>
      <Text style={styles.cell}>{item.number}</Text>
      <Text style={styles.cell}>{item.count}</Text>
      <Text style={styles.cell}>{item.type}</Text>
    </View>
  );

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
          
        </View>
      )}

      <View style={styles.tableHeader}>
        <Text style={[styles.cell, styles.header]}>Number</Text>
        <Text style={[styles.cell, styles.header]}>Count</Text>
        <Text style={[styles.cell, styles.header]}>Type</Text>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(_, index) => index.toString()}
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
    marginTop :40,
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
    borderBottomWidth: 1,
    paddingBottom: 6,
    borderColor: '#ddd',
  },
  entryRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    color: '#000',
  },
  header: {
    fontWeight: 'bold',
    color: '#f85a8f',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ViewBillScreen;
