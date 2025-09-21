import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";

const API_URL = "https://manu-netflix.onrender.com"; // ✅ API base

const BlockDateScreen = () => {
  const [selectedTicket, setSelectedTicket] = useState("ALL");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch blocked dates
  const fetchBlockedDates = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/blockedDates`);
      setBlockedDates(res.data || []);
    } catch (error) {
      console.log("Error fetching blocked dates:", error);
      Alert.alert("Error", "Failed to fetch blocked dates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedDates();
  }, []);

  // ✅ Add Block Date
  const handleBlockDate = async () => {
    try {
      const newBlock = {
        ticket: selectedTicket,
        date: date.toISOString().split("T")[0], // YYYY-MM-DD
      };

      await axios.post(`${API_URL}/blockDate`, newBlock);
      Alert.alert("✅ Success", "Date blocked successfully");
      fetchBlockedDates();
    } catch (error) {
      console.log("Error blocking date:", error);
      Alert.alert("Error", "Failed to block date");
    }
  };

  // ✅ Delete Block Date
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/blockDate/${id}`);
      fetchBlockedDates();
    } catch (error) {
      console.log("Error deleting blocked date:", error);
      Alert.alert("Error", "Failed to delete blocked date");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Blocked Dates</Text>

      {/* Row with Picker + Date */}
      <View style={styles.row}>
        <Picker
          selectedValue={selectedTicket}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedTicket(itemValue)}
        >
          <Picker.Item label="ALL Tickets" value="ALL" />
          <Picker.Item label="LSK3" value="LSK3" />
          <Picker.Item label="DEAR1" value="DEAR1" />
          <Picker.Item label="DEAR6" value="DEAR6" />
          <Picker.Item label="DEAR8" value="DEAR8" />
        </Picker>

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={{ fontWeight: "bold" }}>
            {date.toISOString().split("T")[0]}
          </Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      {/* Add button */}
      <TouchableOpacity style={styles.blockButton} onPress={handleBlockDate}>
        <Text style={styles.blockButtonText}>+ Block Date</Text>
      </TouchableOpacity>

      {/* Loader */}
      {loading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : (
        <FlatList
          data={blockedDates}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20, color: "gray" }}>
              No blocked dates found
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.listRow}>
              <Text style={styles.listText}>{item.ticket}</Text>
              <Text style={styles.listText}>{item.date}</Text>
              <TouchableOpacity onPress={() => handleDelete(item._id)}>
                <Text style={styles.delete}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default BlockDateScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#333",
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  picker: { flex: 1, height: 50 },
  dateButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#eee",
    borderRadius: 8,
    marginLeft: 10,
  },
  blockButton: {
    backgroundColor: "#ff4d4d",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 16,
  },
  blockButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  listRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    backgroundColor: "#fafafa",
    borderRadius: 6,
    marginVertical: 4,
  },
  listText: { fontSize: 16, color: "#333" },
  delete: { fontSize: 20, color: "red" },
});
