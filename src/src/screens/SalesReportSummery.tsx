import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, AntDesign } from '@expo/vector-icons';

const SalesReportSummary = () => {
  const navigation = useNavigation();
  const route = useRoute();

const {
  count = 0,
  amount = 0,
  date = '',
  fromDate,
  toDate,
  createdBy,
  timeLabel,
  entries = [],
} = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sales Report Summary</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <AntDesign name="home" size={24} color="red" />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Count :</Text>
          <Text style={styles.value}>{count}</Text>
          <Text style={[styles.label, { marginLeft: 30 }]}>Amount :</Text>
          <Text style={styles.value}>{amount}</Text>
        </View>
      </View>

      {/* Date Report Card */}
      <View style={styles.card}>
        <Text style={styles.dateText}>{date}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Sales Amount :</Text>
          <Text style={styles.value}>{amount}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Total Count :</Text>
          <Text style={styles.value}>{count}</Text>
        </View>

<TouchableOpacity
  style={styles.button}
  onPress={() =>
    navigation.navigate('SalesReportDetailed', {
      fromDate,
      toDate,
      createdBy,
      timeLabel,
      entries,
    })
  }
>
  <Text style={styles.buttonText}>View Detailed</Text>
</TouchableOpacity>


      </View>
    </SafeAreaView>
  );
};

export default SalesReportSummary;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    padding: 10,
    marginTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 15,
    marginTop: 15,
    shadowColor: '#000',
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  dateText: {
    fontSize: 16,
    color: '#f02b61',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#f02b61',
    paddingVertical: 12,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
