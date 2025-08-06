import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from 'react-native';

const drawLabels = ['DEAR 1 PM', 'LSK 3 PM', 'DEAR 6 PM', 'LSK 8 PM'];

export default function TimeBlockSettingsScreen() {
  const [blockTimes, setBlockTimes] = useState<Record<string, string>>({});


  const isValidTime = (str: string) => {
    const [hh, mm] = str.split(':').map(Number);
    return (
      /^\d{2}:\d{2}$/.test(str) &&
      hh >= 0 && hh <= 23 &&
      mm >= 0 && mm <= 59
    );
  };
const handleSave = async () => {
  try {
    for (const drawLabel of drawLabels) {
      const blockTime = blockTimes[drawLabel];

      if (!/^\d{2}:\d{2}$/.test(blockTime)) {
        Alert.alert('Invalid format', `Enter HH:mm for ${drawLabel}`);
        return;
      }

      // ✅ Send one draw at a time
      const response = await fetch('https://manu-netflix.onrender.com/setBlockTime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawLabel, blockTime }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.log('❌ Failed:', result);
        Alert.alert('❌ Error', `Failed to save ${drawLabel}`);
        return;
      }
    }

    Alert.alert('✅ All block times saved successfully');
  } catch (err) {
    console.error('❌ Error saving block times:', err);
    Alert.alert('❌ Network error');
  }
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>⏰ Create Time Blocks for Draws</Text>
      {drawLabels.map((label) => (
        <View key={label} style={styles.inputRow}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            placeholder="HH:mm"
            value={blockTimes[label] || ''}
            onChangeText={(text) =>
              setBlockTimes((prev) => ({ ...prev, [label]: text }))
            }
            style={styles.input}
          />
        </View>
      ))}
      <Button title="💾 Save All Block Times" onPress={handleSave} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  heading: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    width: 110,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderColor: '#ccc',
  },
});
