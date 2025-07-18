import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Linking,
} from 'react-native';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

const SplashScreen = () => {
  const navigation = useNavigation<any>();

  const onDoubleTap = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Top Header */}
        <View style={styles.header}>
          <Image
            source={{
              uri: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Bajaj_Finserv_Logo.svg',
            }}
            style={styles.logo}
          />
          <View style={styles.iconRow}>
            <MaterialIcons name="person-outline" size={24} color="#fff" />

            {/* Double Tap on Cart Icon */}
            <TapGestureHandler numberOfTaps={2} onHandlerStateChange={onDoubleTap}>
              <View>
                <Ionicons name="cart-outline" size={24} color="#fff" />
              </View>
            </TapGestureHandler>

            <MaterialCommunityIcons name="credit-card-outline" size={24} color="#fff" />
            <Text style={styles.prime}>prime</Text>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search Bajaj"
            placeholderTextColor="#666"
            style={styles.searchInput}
          />
          <TouchableOpacity>
            <Ionicons name="search" size={24} color="#005BAC" />
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.categories}>
          {[
            { name: 'Food & Grocery', icon: 'shopping-outline' },
            { name: 'Electronics on EMI', icon: 'television-outline' },
            { name: 'Personal Loan', icon: 'cash' },
            { name: 'Two Wheeler', icon: 'motorbike' },
            { name: 'Gold Loan', icon: 'gold' },
          ].map((item, index) => (
            <View key={index} style={styles.categoryItem}>
              <MaterialCommunityIcons name={item.icon as any} size={24} color="#005BAC" />
              <Text style={styles.categoryText}>{item.name}</Text>
            </View>
          ))}
        </View>

        {/* Yellow Banner */}
        <View style={styles.yellowBanner}>
          <Image
            source={{
              uri: 'https://static.vecteezy.com/system/resources/previews/028/818/342/original/3d-loan-promotion-banner-and-household-electronics-discount-shopping-sale-or-electronics-installment-sale-marketing-render-png.png',
            }}
            style={styles.bannerImage}
          />
          <TouchableOpacity style={styles.bannerBtn}>
            <Text style={styles.bannerBtnText}>BUY ON EMI</Text>
          </TouchableOpacity>
        </View>

        {/* Personal Loan Card */}
        <View style={styles.personalLoanCard}>
          <Text style={styles.loanTitle}>Get Personal Loan</Text>
          <Text style={styles.loanAmount}>Up to ₹55 lakhs*</Text>
          <Text style={styles.loanInfo}>• Instant disbursal</Text>
          <Text style={styles.loanInfo}>• No paperwork</Text>
          <Text style={styles.loanInfo}>• For all needs</Text>
          <TouchableOpacity style={styles.applyBtn}>
            <Text style={styles.applyText}>Apply Now</Text>
          </TouchableOpacity>
          <Image
            source={{
              uri: 'https://cdn.dribbble.com/users/782542/screenshots/11168501/media/da3e9e57e327a3239d0466b338029d92.png',
            }}
            style={styles.cricketer}
          />
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {[
          { name: 'Home', icon: 'home-outline' },
          { name: 'Account', icon: 'person-outline' },
          { name: 'More', icon: 'reload-circle-outline' },
          { name: 'Pay EMIs', icon: 'cash-outline' },
          { name: 'Menu', icon: 'menu-outline' },
        ].map((item, index) => (
          <TouchableOpacity key={index} style={styles.navItem}>
            <Ionicons name={item.icon as any} size={22} color="#005BAC" />
            <Text style={styles.navText}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  header: {
    backgroundColor: '#003b6f',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  logo: { width: 110, height: 40, resizeMode: 'contain' } as const,
  iconRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  prime: {
    color: '#ffd700',
    fontWeight: 'bold',
    fontSize: 14,
  },
  searchContainer: {
    backgroundColor: '#e6e6e6',
    margin: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    color: '#333',
  },
  categories: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingHorizontal: 5,
    flexWrap: 'wrap',
  },
  categoryItem: {
    alignItems: 'center',
    margin: 10,
    width: 80,
  },
  categoryText: {
    fontSize: 12,
    color: '#005BAC',
    textAlign: 'center',
    marginTop: 4,
  },
  yellowBanner: {
    backgroundColor: '#ffe600',
    margin: 12,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  bannerImage: { width: '100%', height: 100, resizeMode: 'contain' } as const,
  bannerBtn: {
    backgroundColor: '#005BAC',
    padding: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginTop: 10,
  },
  bannerBtnText: { color: '#fff', fontWeight: 'bold' },
  personalLoanCard: {
    backgroundColor: '#fef6cc',
    margin: 16,
    borderRadius: 10,
    padding: 16,
    position: 'relative',
  },
  loanTitle: { fontSize: 16, fontWeight: '500', color: '#333' },
  loanAmount: { fontSize: 20, fontWeight: 'bold', color: '#005BAC', marginVertical: 4 },
  loanInfo: { color: '#444', fontSize: 14 },
  applyBtn: {
    backgroundColor: '#005BAC',
    marginTop: 10,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  applyText: { color: '#fff', fontWeight: '600' },
  cricketer: {
    position: 'absolute',
    right: 10,
    bottom: 0,
    width: 80,
    height: 80,
    resizeMode: 'contain',
  } as const,
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#fff',
    paddingVertical: 10,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 10, color: '#005BAC', marginTop: 2 },
});

export default SplashScreen;

