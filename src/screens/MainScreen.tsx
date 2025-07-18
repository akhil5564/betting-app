import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App'; // adjust the path as needed

type MainScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const MainScreen = () => {
  const navigation = useNavigation<MainScreenNavigationProp>();
  const [username, setUsername] = useState<string>('Guest');
const [usertype, setUsertype] = useState<string | null>(null); // <-- add this
useEffect(() => {
  const loadUserData = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      const storedUsertype = await AsyncStorage.getItem('usertype');

      if (storedUsername) setUsername(storedUsername);
      if (storedUsertype) setUsertype(storedUsertype);
    } catch (error) {
      console.log('Error loading user data:', error);
      setUsername('Guest');
      setUsertype(null);
    }
  };

  loadUserData();
}, []);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="account-circle" size={30} />
        <Text style={styles.headerText}>Hello, {username}</Text>
      </View>

      <MenuButton icon="plus-circle-outline" label="Add" onPress={() => navigation.navigate('Add')} />
      <MenuButton icon="pencil-outline" label="Edit / Delete" onPress={() => navigation.navigate('Edit')} />
      <MenuButton icon="file-document-outline" label="Reports" onPress={() => navigation.navigate('Reports')} />
      <MenuButton icon="percent-outline" label="Manage Sales" onPress={() => navigation.navigate('ManageSales')} />
      <MenuButton icon="account-group-outline" label="Manage Users" onPress={() => navigation.navigate('UsersScreen')} />
      <MenuButton icon="bell-outline" label="Results" onPress={() => navigation.navigate('Result')} />
{usertype === 'admin' && (
  <MenuButton icon="bell-outline" label="More" onPress={() => navigation.navigate('')} />
)}

      <MenuButton
        icon="exit-to-app"
        label="Log Out"
        red
        onPress={async () => {
          await AsyncStorage.clear();
          navigation.replace('Login');
        }}
      />

      <Text style={styles.versionText}>Version 1.0</Text>
    </ScrollView>
  );
};

const MenuButton = ({
  icon,
  label,
  red = false,
  onPress,
}: {
  icon: any;
  label: string;
  red?: boolean;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    style={[styles.button, red ? styles.redButton : styles.pinkButton]}
    onPress={onPress}
  >
    <View style={styles.buttonContent}>
      <MaterialCommunityIcons name={icon} size={24} color="#fff" />
      <Text style={styles.buttonText}>{label}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flexGrow: 1,
    marginBottom: 160,
    marginTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
    elevation: 3,
  },
  pinkButton: {
    backgroundColor: '#ff2d55',
  },
  redButton: {
    backgroundColor: '#ff3b30',
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#aaa',
  },
});

export default MainScreen;
