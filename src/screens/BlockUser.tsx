import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BlockNumberScreen from './BlockNumberScreen';

const UserDetailScreen = () => {
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Users</Text>

      <View style={styles.card}>
        {/* Row 1 */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>Fr</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Type</Text>
            <Text style={styles.value}>Agent</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Scheme</Text>
            <Text style={styles.value}>scheme_1</Text>
          </View>
        </View>

        {/* Row 2 */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Partner</Text>
            <Text style={styles.value}>-</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Stockist</Text>
            <Text style={styles.value}>-</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Sub Stockist</Text>
            <Text style={styles.value}>Frs</Text>
          </View>
        </View>

        {/* Row 3 */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, styles.gray]}>
            <Text style={styles.buttonText}>Login Block</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.gray]}>
            <Text style={styles.buttonText}>Sales Block</Text>
          </TouchableOpacity>
        </View>

        {/* Row 4 — Navigates to BlockNumberScreen */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.blue]}
onPress={() => navigation.navigate('BlockNumberScreen')}
          >
            <Text style={styles.buttonText}>Blocked No</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.blue]}>
            <Text style={styles.buttonText}>Credit Limit</Text>
          </TouchableOpacity>
        </View>

        {/* Row 5 — Edit and Delete */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.pink]}
            onPress={() => navigation.navigate('EditUserScreen')}
          >
            <Text style={styles.buttonText}>Edit User</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.red]}>
            <Text style={styles.buttonText}>Delete User</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
    marginTop: 30,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  column: {
    flex: 1,
    paddingHorizontal: 5,
  },
  label: {
    fontSize: 14,
    color: 'gray',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  gray: {
    backgroundColor: '#888',
  },
  blue: {
    backgroundColor: '#2196F3',
  },
  red: {
    backgroundColor: '#F44336',
  },
  pink: {
    backgroundColor: '#E91E63',
  },
});

export default UserDetailScreen;
