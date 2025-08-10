import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';

const TimeSetScreen = ({ navigation }) => {
  const [blockTime, setBlockTime] = useState(new Date());
  const [unblockTime, setUnblockTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState<null | 'block' | 'unblock'>(null);
  const [selectedDraw, setSelectedDraw] = useState('');
  const [summaryList, setSummaryList] = useState<
    { draw: string; blockTime: string; unblockTime: string }[]
  >([]);

  const drawOptions = ['DEAR 1 PM', 'LSK 3 PM', 'DEAR 6 PM', 'DEAR 8 PM'];

  const onChange = (event, selectedTime) => {
    if (event.type === 'dismissed') {
      setShowPicker(null);
      return;
    }
    if (selectedTime) {
      if (showPicker === 'block') setBlockTime(selectedTime);
      else if (showPicker === 'unblock') setUnblockTime(selectedTime);
    }
    setShowPicker(null);
  };

  const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const handleConfirm = () => {
    if (!selectedDraw) {
      Alert.alert('Error', 'Please select a draw');
      return;
    }

    if (blockTime >= unblockTime) {
      Alert.alert('Error', 'Block time must be before Unblock time');
      return;
    }

    const alreadyInSummary = summaryList.some(
      (item) => item.draw === selectedDraw
    );

    if (alreadyInSummary) {
      Alert.alert('Duplicate', 'This draw is already added to summary');
      return;
    }

    setSummaryList((prev) => [
      ...prev,
      {
        draw: selectedDraw,
        blockTime: formatTime(blockTime),
        unblockTime: formatTime(unblockTime),
      },
    ]);

    setSelectedDraw('');
  };

  const handleSave = async () => {
    if (summaryList.length === 0) {
      Alert.alert('No data', 'Nothing to save');
      return;
    }

    const blocksToSend = summaryList.map((item) => ({
      draw: item.draw,
      blockTime: item.blockTime,
      unblockTime: item.unblockTime,
    }));

    try {
      const response = await axios.post(
        'https://manu-netflix.onrender.com/setBlockTime',
        { blocks: blocksToSend }
      );

      if (response.status === 200) {
        Alert.alert('✅ Success', 'Block times saved');
        navigation.goBack();
      } else {
        throw new Error(response.data?.message || 'Save failed');
      }
    } catch (err) {
      console.error('❌ Save error:', err);
      Alert.alert('Error', 'Failed to save block times');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Entry Time</Text>

      <View style={styles.drawRow}>
        {drawOptions.map((draw) => (
          <TouchableOpacity
            key={draw}
            style={[
              styles.drawButton,
              selectedDraw === draw && styles.drawSelected,
            ]}
            onPress={() => setSelectedDraw(draw)}
          >
            <Text style={styles.drawText}>{draw}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.timeButton}
        onPress={() => setShowPicker('block')}
      >
        <Text style={styles.timeText}>Block: {formatTime(blockTime)}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.timeButton, { backgroundColor: '#d7263d' }]}
        onPress={() => setShowPicker('unblock')}
      >
        <Text style={styles.timeText}>Unblock: {formatTime(unblockTime)}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={showPicker === 'block' ? blockTime : unblockTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onChange}
        />
      )}

      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmText}>Confirm Time Range</Text>
      </TouchableOpacity>

      <FlatList
        data={summaryList}
        keyExtractor={(_, i) => i.toString()}
        ListHeaderComponent={<Text style={styles.summaryHeader}>Summary</Text>}
        renderItem={({ item }) => (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>{item.draw}</Text>
            <Text style={styles.summaryText}>
              {item.blockTime} - {item.unblockTime}
            </Text>
          </View>
        )}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save All</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  drawRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  drawButton: {
    padding: 10,
    backgroundColor: '#ddd',
    borderRadius: 8,
    margin: 5,
  },
  drawSelected: {
    backgroundColor: '#4CAF50',
  },
  drawText: {
    fontWeight: 'bold',
  },
  timeButton: {
    backgroundColor: '#3a86ff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  timeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#f57c00',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  confirmText: {
    color: 'white',
    fontWeight: 'bold',
  },
  summaryHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  summaryText: {
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: '#009688',
    padding: 14,
    marginTop: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TimeSetScreen;
