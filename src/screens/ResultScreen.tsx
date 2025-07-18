import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ReportsScreen = () => {
  const navigation = useNavigation();

  const reports = [
    {
      title: 'View Result',
      icon: <Ionicons name="document-text-outline" size={24} color="white" />,
      screen: 'SelectResultScreen',
    },

      {
      title: ' Result entry',
      icon: <Ionicons name="document-text-outline" size={24} color="white" />,
      screen: 'ResultEntry',
    },

    
      {
      title: ' Ticket Limit',
      icon: <Ionicons name="document-text-outline" size={24} color="white" />,
      screen: 'timeblock',
    },


    
     {
  title: 'Time Setting',
  icon: <Ionicons name="time-outline" size={24} color="white" />,
  screen: 'timeblock',
},

      {
      title: ' Count Report',
      icon: <Ionicons name="document-text-outline" size={24} color="white" />,
      screen: '',
    },
    
      {
      title: ' Profit',
      icon: <Ionicons name="document-text-outline" size={24} color="white" />,
      screen: '',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('SelectResultScreen')}>
          <Text style={styles.title}>View Result</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <Ionicons name="home" size={24} color="red" />
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {reports.map((report, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => navigation.navigate(report.screen)}
          >
            <Text style={styles.cardText}>{report.title}</Text>
            {report.icon}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default ReportsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: 40,
  },
  header: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  body: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FF2D55',
    padding: 20,
    marginBottom: 16,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  cardText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
