import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Domain } from "./NetPayScreen";
import { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "WinningReportScreen">;

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function WinningReportScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState<null | "from" | "to">(null);
  const [selectedDraw, setSelectedDraw] = useState("DEAR 8 PM");
  const [allUsers, setAllUsers] = useState<{ username: string; createdBy: string; scheme?: string }[]>([]);
  const [loggedInUser, setLoggedInUser] = useState<string>("");
  const [usersForPicker, setUsersForPicker] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("");

  useEffect(() => {
    async function loadUsers() {
      try {
        const storedUser = await AsyncStorage.getItem("username");
        if (!storedUser) {
          setErrorMsg("No logged-in user found");
          return;
        }
        setLoggedInUser(storedUser);
        const response = await fetch(`${Domain}/users`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setAllUsers(data);
          const directChildren = data.filter((u) => u.createdBy === storedUser).map((u) => u.username);
          setUsersForPicker([storedUser, ...directChildren]);
        }
      } catch (e) {
        console.error("Failed to load users", e);
        setErrorMsg("Failed to load users");
      }
    }
    loadUsers();
  }, []);

  const fetchWinningReport = async () => {
    if (toDate < fromDate) {
      setErrorMsg("To date must be after or equal to From date");
      return;
    }
  
    setLoading(true);
    setErrorMsg(null);
  
    try {
      const res = await axios.post(`${Domain}/report/winningReport`, {
        fromDate: formatDate(fromDate),
        toDate: formatDate(toDate),
        time: selectedDraw,
        agent: selectedAgent,
        loggedInUser,
      });
  
      if (!res.data || !res.data.bills || res.data.bills.length === 0) {
        setErrorMsg("No winning entries found for the selected date range.");
        return;
      }
  
      navigation.navigate("winningdetailed", {
        report: res.data,
      });
    } catch (err: any) {
      setErrorMsg("Failed to fetch winning report: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selected?: Date) => {
    setShowPicker(null);
    if (selected) {
      if (showPicker === "from") setFromDate(selected);
      else if (showPicker === "to") setToDate(selected);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Winning Report</Text>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Select Draw Time</Text>
        <Picker selectedValue={selectedDraw} onValueChange={setSelectedDraw} style={styles.picker}>
          <Picker.Item label="DEAR 1 PM" value="DEAR 1 PM" />
          <Picker.Item label="KERALA 3 PM" value="KERALA 3 PM" />
          <Picker.Item label="DEAR 6 PM" value="DEAR 6 PM" />
          <Picker.Item label="DEAR 8 PM" value="DEAR 8 PM" />
          <Picker.Item label="ALL" value="ALL" />
        </Picker>
      </View>

      <View style={styles.dateRow}>
        <View style={styles.fieldGroupHalf}>
          <Text style={styles.label}>From Date</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker("from")}>
            <Text>{formatDate(fromDate)}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.fieldGroupHalf}>
          <Text style={styles.label}>To Date</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker("to")}>
            <Text>{formatDate(toDate)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showPicker && (
        <DateTimePicker
          value={showPicker === "from" ? fromDate : toDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Select Agent</Text>
        <Picker selectedValue={selectedAgent} onValueChange={setSelectedAgent} style={styles.picker}>
          <Picker.Item label="All Agents" value="" />
          {usersForPicker.map((user) => (
            <Picker.Item key={user} label={user} value={user} />
          ))}
        </Picker>
      </View>

      <TouchableOpacity
        style={[styles.generateBtn, loading && { opacity: 0.6 }]}
        onPress={fetchWinningReport}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.generateBtnText}>Generate Report</Text>}
      </TouchableOpacity>

      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  fieldGroup: { marginBottom: 16 },
  fieldGroupHalf: { flex: 1, marginBottom: 16, marginRight: 8 },
  label: { marginBottom: 6, fontSize: 14, fontWeight: "600", color: "#333" },
  dateRow: { flexDirection: "row", justifyContent: "space-between" },
  dateBtn: { padding: 12, backgroundColor: "#ddd", borderRadius: 5, alignItems: "center" },
  picker: { backgroundColor: "#f4f4f4", borderRadius: 5, color: "black" },
  generateBtn: {
    padding: 14,
    backgroundColor: "#e73030c9",
    alignItems: "center",
    borderRadius: 5,
    marginVertical: 20,
  },
  generateBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  errorContainer: { backgroundColor: "#f8d7da", padding: 10, borderRadius: 5, marginTop: 10 },
  errorText: { color: "#721c24", fontWeight: "600" },
});
