import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import logo from '../assets/bajaj.png';

const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const uname = username.trim().toLowerCase();
    const pwd = password.trim();

    const localUsers = {
      aki: { password: '388', usertype: 'admin' },
      john: { password: '1234', usertype: 'master' },
    };

    // ✅ Local login
    if (localUsers[uname] && localUsers[uname].password === pwd) {
      await AsyncStorage.setItem('username', uname);
      await AsyncStorage.setItem('usertype', localUsers[uname].usertype);
      navigation.replace('Main');
      return;
    }

    try {
      const response = await axios.post('https://manu-netflix.onrender.com/login', {
        username: uname,
        password: pwd,
      });

      if (response.status === 200 && response.data.user) {
        const user = response.data.user;

        await AsyncStorage.setItem('username', user.username);
        await AsyncStorage.setItem('usertype', user.userType || '');
        await AsyncStorage.setItem('scheme', user.scheme || '');

        navigation.replace('Main');
      } else {
        Alert.alert('Login Failed', response.data.message || 'Invalid response');
      }
    } catch (error: any) {
      Alert.alert('Login Error', error.response?.data?.message || 'Server error');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image source={logo} style={styles.centerImage} />

        <TextInput
          style={styles.input}
          placeholder="User Name"
          placeholderTextColor="#666"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#130a33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: width * 0.85,
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 5,
  },
  centerImage: {
    width: 160,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    borderBottomWidth: 1,
    borderColor: '#999',
    marginBottom: 20,
    fontSize: 16,
    color: '#000',
    paddingVertical: 8,
  },
  loginButton: {
    backgroundColor: '#007aff',
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 12,
  },
  closeButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default LoginScreen;
