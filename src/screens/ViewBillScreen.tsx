import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';

type BillRouteProp = RouteProp<{ params: { billNo: string } }, 'params'>;

const ViewBillScreen = () => {
  const route = useRoute<BillRouteProp>();
  const { billNo } = route.params;
  const [billData, setBillData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const res = await fetch(`https://manu-netflix.onrender.com/bill/${billNo}`);
        const data = await res.json();
        setBillData(data);
      } catch (error) {
        console.error('❌ Fetch bill error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBill();
  }, [billNo]);

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Bill No: {billNo}</Text>
      {billData?.entries?.map((entry: any, index: number) => (
        <View key={index} style={styles.row}>
          <Text style={styles.cell}>{entry.type}</Text>
          <Text style={styles.cell}>{entry.number}</Text>
          <Text style={styles.cell}>{entry.count}</Text>
          <Text style={styles.cell}>₹{entry.count * 10}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

export default ViewBillScreen;

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cell: { fontSize: 14, width: '25%' },
});
