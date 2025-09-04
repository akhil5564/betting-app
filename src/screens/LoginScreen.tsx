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
import { Domain } from './NetPayScreen';

const LoginScreen = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const uname = username.trim().toLowerCase();
    const pwd = password.trim();

    // Local testing users (only for offline)
    const localUsers: Record<string, { password: string; usertype: string; salesBlocked: boolean }> = {
      aki: { password: '388', usertype: 'admin', salesBlocked: false },
      john: { password: '1234', usertype: 'master', salesBlocked: true },
    };

    // ✅ LOCAL LOGIN CHECK (Only if you really want offline users)
    if (localUsers[uname] && localUsers[uname].password === pwd) {
      console.log("📦 Local user login:", localUsers[uname]);
      await AsyncStorage.setItem('username', uname);
      await AsyncStorage.setItem('usertype', localUsers[uname].usertype);
      await AsyncStorage.setItem('salesBlocked', String(localUsers[uname].salesBlocked));
      navigation.replace('Main' as never);
      return;
    }

    // ✅ API LOGIN
    try {
      const response = await axios.post(`${Domain}/login`, {
        username: uname,
        password: pwd,
      });

      if (response.status === 200 && response.data.user) {
        const user = response.data.user;

        console.log("📦 Backend user data:", user);

        if (user.isLoginBlocked) {
          Alert.alert('⛔ Login Blocked', 'Your login has been blocked by the admin.');
          return;
        }

        // Store values exactly as DB sends them
        await AsyncStorage.setItem('username', user.username || '');
        await AsyncStorage.setItem('usertype', user.userType || '');
        await AsyncStorage.setItem('scheme', user.scheme || '');
        await AsyncStorage.setItem('salesBlocked', String(user.salesBlocked)); // ✅ exact DB value

        // Debug logs
        console.log("💾 Stored salesBlocked:", await AsyncStorage.getItem('salesBlocked'));

        navigation.replace('Main' as never);
      } else {
        Alert.alert('Login Failed', response.data.message || 'Invalid response');
      }
    } catch (error: any) {
      console.error("❌ Login error:", error.response?.data || error.message);
      Alert.alert('Login Error', error.response?.data?.message || 'Server error');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image source={logo} style={styles.centerImage} />

        <TextInput
          style={styles.input}
          placeholder="Username"
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
      </View>
    </View>
  );
};

export default LoginScreen;

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
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
