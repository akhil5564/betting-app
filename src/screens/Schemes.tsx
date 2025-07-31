import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Scheme 1 (default)
const scheme1 = [
  {
    group: 'Group 1',
    items: [
      { name: 'DEAR1-A', rate: 10.6, data: [{ position: 1, count: 1, amount: 100, super: 0 }] },
      { name: 'DEAR1-B', rate: 10.6, data: [{ position: 1, count: 1, amount: 100, super: 0 }] },
      { name: 'DEAR1-C', rate: 10.6, data: [{ position: 1, count: 1, amount: 100, super: 0 }] },
    ],
  },
  {
    group: 'Group 2',
    items: [
      { name: 'DEAR1-AB', rate: 8, data: [{ position: 1, count: 1, amount: 700, super: 30 }] },
      { name: 'DEAR1-BC', rate: 8, data: [{ position: 1, count: 1, amount: 700, super: 30 }] },
      { name: 'DEAR1-AC', rate: 8, data: [{ position: 1, count: 1, amount: 700, super: 30 }] },
    ],
  },
  {
    group: 'Group 3',
    items: [
      {
        name: 'DEAR1-SUPER',
        rate: 8,
        data: [
          { position: 1, count: 1, amount: 5000, super: 400 },
          { position: 2, count: 1, amount: 500, super: 50 },
          { position: 3, count: 1, amount: 250, super: 20 },
          { position: 4, count: 1, amount: 100, super: 20 },
          { position: 5, count: 1, amount: 50, super: 20 },
          { position: 6, count: 30, amount: 20, super: 10 },
        ],
      },
      {
        name: 'DEAR1-BOX',
        rate: 8,
        data: [{ position: 1, count: 1, amount: 3000, super: 300 }],
      },
    ],
  },
];

// Scheme 2
const scheme2 = [
  {
    group: 'Group 2',
    items: [
      { name: 'DEAR1-AB', rate: 8, data: [{ position: 1, count: 1, amount: 700, super: 15 }] },
      { name: 'DEAR1-BC', rate: 8, data: [{ position: 1, count: 1, amount: 700, super: 15 }] },
      { name: 'DEAR1-AC', rate: 8, data: [{ position: 1, count: 1, amount: 700, super: 15 }] },
    ],
  },
  {
    group: 'Group 1',
    items: [
      { name: 'DEAR1-A', rate: 10.6, data: [{ position: 1, count: 1, amount: 100, super: 0 }] },
      { name: 'DEAR1-B', rate: 10.6, data: [{ position: 1, count: 1, amount: 100, super: 0 }] },
      { name: 'DEAR1-C', rate: 10.6, data: [{ position: 1, count: 1, amount: 100, super: 0 }] },
    ],
  },
  {
    group: 'Group 3',
    items: [
      {
        name: 'DEAR1-SUPER',
        rate: 8,
        data: [
          { position: 1, count: 1, amount: 5000, super: 400 },
          { position: 2, count: 1, amount: 500, super: 50 },
          { position: 3, count: 1, amount: 250, super: 20 },
          { position: 4, count: 1, amount: 100, super: 20 },
          { position: 5, count: 1, amount: 50, super: 20 },
          { position: 6, count: 30, amount: 20, super: 10 },
        ],
      },
      {
        name: 'DEAR1-BOX',
        rate: 8,
        data: [{ position: 1, count: 1, amount: 3000, super: 150 }],
      },
    ],
  },
];

const SchemeCard = ({ name, rate, group, data }: any) => (
  <View style={styles.card}>
    <View style={styles.header}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.groupBadge}>{group}</Text>
    </View>
    <Text style={styles.rate}>
      Rate: <Text style={styles.bold}>{rate}</Text>
    </Text>
    <View style={styles.tableHeader}>
      <Text style={styles.cellHeader}>Pos</Text>
      <Text style={styles.cellHeader}>Count</Text>
      <Text style={styles.cellHeader}>Amount</Text>
      <Text style={styles.cellHeader}>Super</Text>
    </View>
    {data.map((item: any, index: number) => (
      <View
        key={index}
        style={[
          styles.tableRow,
          index % 2 === 0 && { backgroundColor: '#f0f4ff' },
        ]}
      >
        <Text style={styles.cell}>{item.position}</Text>
        <Text style={styles.cell}>{item.count}</Text>
        <Text style={styles.cell}>{item.amount}</Text>
        <Text style={styles.cell}>{item.super}</Text>
      </View>
    ))}
  </View>
);

const SchemeScreen = () => {
  const [userScheme, setUserScheme] = useState<string>('');
  const [schemeData, setSchemeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScheme = async () => {
      const storedScheme = await AsyncStorage.getItem('scheme');
      const scheme = storedScheme || '';
      setUserScheme(scheme);

      if (scheme === 'scheme2') {
        setSchemeData(scheme2);
      } else {
        setSchemeData(scheme1);
      }

      setLoading(false);
    };

    fetchScheme();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading Scheme...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.userSchemeBox}>
        <Text style={styles.userSchemeText}>
          Your Scheme: <Text style={styles.userSchemeBold}>{userScheme || 'N/A'}</Text>
        </Text>
      </View>

      {schemeData.map((schemeGroup, groupIndex) => (
        <View key={groupIndex}>
          {schemeGroup.items.map((item: any, itemIndex: number) => (
            <SchemeCard
              key={itemIndex}
              name={item.name}
              rate={item.rate}
              group={schemeGroup.group}
              data={item.data}
            />
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f2f2f2',
    marginTop: 40,
    marginBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userSchemeBox: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  userSchemeText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  userSchemeBold: {
    fontWeight: 'bold',
    fontSize: 17,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  groupBadge: {
    backgroundColor: '#007bff',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 12,
    overflow: 'hidden',
  },
  rate: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  bold: {
    fontWeight: 'bold',
    color: '#000',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  cellHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#444',
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
  },
});

export default SchemeScreen;
