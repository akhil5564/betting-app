import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const mockUsers = [
  {
    id: '1',
    name: 'Fr',
    type: 'Agent',
    scheme: 'scheme_1',
    partner: '-',
    stockist: '-',
    subStockist: 'Frs',
  },
  // Add more mock users if needed
];

const ListUsersScreen = () => {
  const navigation = useNavigation();
  const [search, setSearch] = useState('');

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderUserCard = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('BlockUser', { user: item })}
    >
      <View style={styles.cardRow}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.label}>Type</Text>
        <Text style={styles.label}>Scheme</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.value}>{item.name}</Text>
        <Text style={styles.value}>{item.type}</Text>
        <Text style={styles.value}>{item.scheme}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.label}>Partner</Text>
        <Text style={styles.label}>Stockist</Text>
        <Text style={styles.label}>Sub Stockist</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.value}>{item.partner}</Text>
        <Text style={styles.value}>{item.stockist}</Text>
        <Text style={styles.value}>{item.subStockist}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Users</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          placeholder="Search..."
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* User List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

export default ListUsersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 16,
    paddingTop: 20,
    marginTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 16,
    elevation: 2,
  },
  searchInput: {
    marginLeft: 10,
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color: '#555',
    flex: 1,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
});
