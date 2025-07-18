import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BlockNumberScreen = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Block</Text>
      </View>

      {/* Add Buttons */}
      <View style={styles.addButtonsContainer}>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>➕ Number</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>➕ Group</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>➕ Series</Text>
        </TouchableOpacity>
      </View>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>GROUP</Text>
        <Text style={styles.tableHeaderText}>TICKET</Text>
        <Text style={styles.tableHeaderText}>NUMBER</Text>
        <Text style={styles.tableHeaderText}>COUNT</Text>
      </View>

      {/* No Data Text */}
      <ScrollView contentContainerStyle={styles.noDataContainer}>
        <Text style={styles.noDataText}>No Data</Text>
      </ScrollView>
    </View>
  );
};

export default BlockNumberScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
    marginTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: 'white',
    elevation: 2,
  },
  backButton: {
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: 'white',
    elevation: 2,
  },
  addButton: {
    backgroundColor: '#F51659',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#D9003C',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  tableHeaderText: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
  noDataContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: 'black',
  },
});
