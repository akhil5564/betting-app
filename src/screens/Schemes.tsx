import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const schemes = [
  {
    group: 'Group 1',
    items: [
      { name: 'DEAR1-A', rate: 10.6, data: [{ position: 1, count: 1, amount: 100, super: 0 }] },
      { name: 'DEAR1-B', rate: 10.6, data: [{ position: 1, count: 1, amount: 100, super: 0 }] },
      { name: 'DEAR1-C', rate: 10.6, data: [{ position: 1, count: 1, amount: 100, super: 0 }] },
    ]
  },
  {
    group: 'Group 2',
    items: [
      { name: 'DEAR1-AB', rate: 8, data: [{ position: 1, count: 1, amount: 700, super: 30 }] },
      { name: 'DEAR1-BC', rate: 8, data: [{ position: 1, count: 1, amount: 700, super: 30 }] },
      { name: 'DEAR1-AC', rate: 8, data: [{ position: 1, count: 1, amount: 700, super: 30 }] },
    ]
  },
  {
    group: 'Group 3',
    items: [
      { name: 'DEAR1-SUPER', rate: 8, data: [
        { position: 1, count: 1, amount: 5000, super: 400 },
        { position: 2, count: 1, amount: 500, super: 50 },
        { position: 3, count: 1, amount: 250, super: 20 },
        { position: 4, count: 1, amount: 100, super: 20 },
        { position: 5, count: 1, amount: 50, super: 20 },
        { position: 6, count: 30, amount: 20, super: 10 },
      ]},
      { name: 'DEAR1-BOX', rate: 8, data: [
        { position: 1, count: 1, amount: 3000, super: 300 }
      ]}
    ]
  }
];

const SchemeCard = ({ name, rate, group, data }: any) => (
  <View style={styles.card}>
    <View style={styles.header}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.group}>{group}</Text>
      <Text style={styles.rate}>Rate: <Text style={{ fontWeight: 'bold' }}>{rate}</Text></Text>
    </View>
    <View style={styles.tableHeader}>
      <Text style={styles.cell}>Position</Text>
      <Text style={styles.cell}>Count</Text>
      <Text style={styles.cell}>Amount</Text>
      <Text style={styles.cell}>Super</Text>
    </View>
    {data.map((item: any, index: number) => (
      <View key={index} style={styles.tableRow}>
        <Text style={styles.cell}>{item.position}</Text>
        <Text style={styles.cell}>{item.count}</Text>
        <Text style={styles.cell}>{item.amount}</Text>
        <Text style={styles.cell}>{item.super}</Text>
      </View>
    ))}
  </View>
);

const SchemeScreen = () => {
  return (
    <ScrollView style={styles.container}>
      {schemes.map((schemeGroup, groupIndex) => (
        <View key={groupIndex}>
          {schemeGroup.items.map((item, itemIndex) => (
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
  container: { padding: 10, backgroundColor: '#fff' },
  card: {
    backgroundColor: '#f9f9f9',
    marginVertical: 8,
    padding: 10,
    borderRadius: 8,
    elevation: 2
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  name: { fontWeight: 'bold', fontSize: 16 },
  group: { fontSize: 14, color: '#666' },
  rate: { fontSize: 14 },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 4,
    marginTop: 4
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 2
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14
  }
});

export default SchemeScreen;
