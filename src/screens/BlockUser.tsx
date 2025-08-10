import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React, { useState } from 'react';

// API call to toggle login block
const blockLoginById = async (userId) => {
  try {
    const response = await axios.patch(
      `https://manu-netflix.onrender.com/user/blockLogin/${userId}`
    );
    console.log('✅ User login block toggled:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error blocking login:', error);
    throw error;
  }
};

// API call to toggle sales block
const blockSalesById = async (userId) => {
  try {
    const response = await axios.patch(
      `https://manu-netflix.onrender.com/blockSales/${userId}`
    );
    console.log('✅ User sales block toggled:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error blocking sales:', error);
    throw error;
  }
};

const UserDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user: initialUser } = route.params || {};
  const [user, setUser] = useState(initialUser);

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>No user data provided.</Text>
      </View>
    );
  }

  const handleToggleLoginBlock = async () => {
    try {
      console.log("🔍 Toggling login block for User ID:", user._id);
      const res = await blockLoginById(user._id);
      setUser(res.user); // Update state with backend response
      alert(
        res.user.blocked
          ? '✅ User login is now BLOCKED'
          : '✅ User login is now UNBLOCKED'
      );
    } catch (err) {
      alert('❌ Failed to update login block status.');
    }
  };

  const handleToggleSalesBlock = async () => {
    try {
      console.log("🔍 Toggling sales block for User ID:", user._id);
      const res = await blockSalesById(user._id);
      setUser(res.user); // Update state with backend response
      alert(
        res.user.salesBlocked
          ? '✅ User sales is now BLOCKED'
          : '✅ User sales is now UNBLOCKED'
      );
    } catch (err) {
      alert('❌ Failed to update sales block status.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>User Details</Text>

      <View style={styles.card}>
        {/* Row 1 */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{user.username}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Type</Text>
            <Text style={styles.value}>{user.usertype}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Scheme</Text>
            <Text style={styles.value}>{user.scheme || '-'}</Text>
          </View>
        </View>

        {/* Row 2 */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Partner</Text>
            <Text style={styles.value}>{user.partner || '-'}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Stockist</Text>
            <Text style={styles.value}>{user.stockist || '-'}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Sub Stockist</Text>
            <Text style={styles.value}>{user.subStockist || '-'}</Text>
          </View>
        </View>

        {/* Row 3 — Login + Sales Block */}
        <View style={styles.buttonRow}>
          {/* Login Block Button */}
          <TouchableOpacity
            style={[
              styles.button,
              user.blocked ? styles.red : styles.green
            ]}
            onPress={handleToggleLoginBlock}
          >
            <Text style={styles.buttonText}>
              {user.blocked ? 'Unblock Login' : 'Block Login'}
            </Text>
          </TouchableOpacity>

          {/* Sales Block Button */}
          <TouchableOpacity
            style={[
              styles.button,
              user.salesBlocked ? styles.red : styles.green
            ]}
            onPress={handleToggleSalesBlock}
          >
            <Text style={styles.buttonText}>
              {user.salesBlocked ? 'Unblock Sales' : 'Block Sales'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Row 4 — Navigate to BlockNumberScreen */}
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
            onPress={() => navigation.navigate('EditUserScreen', { user })}
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
  green: {
    backgroundColor: '#4CAF50', // ✅ Unblocked = Green
  },
  blue: {
    backgroundColor: '#2196F3',
  },
  red: {
    backgroundColor: '#F44336', // ✅ Blocked = Red
  },
  pink: {
    backgroundColor: '#E91E63',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default UserDetailScreen;
