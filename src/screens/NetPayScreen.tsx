import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const payouts = {
  SUPER: { 1: 5000, 2: 500, 3: 250, 4: 100, 5: 50, other: 20 },
  BOX: {
    normal: { perfect: 3000, permutation: 800 },
    double: { perfect: 3800, permutation: 1600 },
  },
  AB_BC_AC: 700,
  A_B_C: 100,
};

function isDoubleNumber(numStr) {
  return new Set(numStr.split("")).size === 2;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

export function extractBetType(typeStr) {
  if (!typeStr) return "";
  const parts = typeStr.split("-");
  return parts[parts.length - 1];
}

export const Domain = "https://www.muralibajaj.site";

export default function NetPayMultiDayScreen() {
  const navigation = useNavigation();
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);
  const [selectedTime, setSelectedTime] = useState("DEAR 8 PM");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");

  useEffect(() => {
    const loadUserAndUsers = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("username");
        if (storedUser) {
          setSelectedAgent(storedUser);
          setLoggedInUser(storedUser);

          const response = await fetch(`${Domain}/users`);
          const data = await response.json();

          if (response.ok && Array.isArray(data)) {
            const usernames = data
              .filter((u) => u.createdBy === storedUser)
              .map((u) => u.username)
              .filter(
                (username) =>
                  typeof username === "string" && username.trim() !== ""
              );

            setAllUsers([storedUser, ...usernames]);
          } else {
            console.error("Invalid data format from API");
          }
        }
      } catch (err) {
        console.error("❌ Error loading users:", err);
      }
    };

    loadUserAndUsers();
  }, []);

  const calculateWinAmount = (entry, results) => {
    if (!results || !results["1"]) return 0;

    const firstPrize = results["1"];
    const others = Array.isArray(results.others) ? results.others : [];
    const allPrizes = [
      results["1"],
      results["2"],
      results["3"],
      results["4"],
      results["5"],
      ...others,
    ].filter(Boolean);

    const num = entry.number;
    const count = entry.count || 0;
    const baseType = extractBetType(entry.type);

    let winAmount = 0;

    if (baseType === "SUPER") {
      const prizePos = allPrizes.indexOf(num) + 1;
      if (prizePos > 0) {
        winAmount = (payouts.SUPER[prizePos] || payouts.SUPER.other) * count;
      }
    } else if (baseType === "BOX") {
      if (num === firstPrize) {
        winAmount = isDoubleNumber(firstPrize)
          ? payouts.BOX.double.perfect * count
          : payouts.BOX.normal.perfect * count;
      } else if (
        num.split("").sort().join("") === firstPrize.split("").sort().join("")
      ) {
        winAmount = isDoubleNumber(firstPrize)
          ? payouts.BOX.double.permutation * count
          : payouts.BOX.normal.permutation * count;
      }
    } else if (baseType === "AB" && num === firstPrize.slice(0, 2)) {
      winAmount = payouts.AB_BC_AC * count;
    } else if (baseType === "BC" && num === firstPrize.slice(1, 3)) {
      winAmount = payouts.AB_BC_AC * count;
    } else if (baseType === "AC" && num === firstPrize[0] + firstPrize[2]) {
      winAmount = payouts.AB_BC_AC * count;
    } else if (baseType === "A" && num === firstPrize[0]) {
      winAmount = payouts.A_B_C * count;
    } else if (baseType === "B" && num === firstPrize[1]) {
      winAmount = payouts.A_B_C * count;
    } else if (baseType === "C" && num === firstPrize[2]) {
      winAmount = payouts.A_B_C * count;
    }

    return winAmount;
  };

  const getAllDescendants = (username, usersList) => {
    const children = usersList
      .filter((u) => u.createdBy === username)
      .map((u) => u.username);

    let all = [...children];
    children.forEach((child) => {
      all = all.concat(getAllDescendants(child, usersList));
    });
    return all;
  };

  const fetchDataAndNavigate = async () => {
    setLoading(true);
    setError("");

    try {
      // Map "All" to all individual times
      const timeToSend =
        selectedTime === "All"
          ? ["DEAR 1 PM", "LSK 3 PM", "DEAR 6 PM", "DEAR 8 PM"]
          : selectedTime;

      const response = await axios.post(`${Domain}/report/netpay-multiday`, {
        fromDate: formatDate(fromDate),
        toDate: formatDate(toDate),
        time: timeToSend,
        agent: selectedAgent,
      });

      const allEntries = response.data.entries || [];
      if (allEntries.length === 0) {
        setError("No entries found for the selected date range and agent.");
        setLoading(false);
        return;
      }

      navigation.navigate("netdetailed", {
        fromDate: formatDate(fromDate),
        toDate: formatDate(toDate),
        time: selectedTime, // keep "All" in UI/navigation
        agent: selectedAgent || "All Agents",
        matchedEntries: allEntries,
        userRates: response.data.userRates,
        usersList: response.data.usersList || [],
      });
    } catch (err) {
      setError("Failed to fetch data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Net Pay Report</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Time Slot</Text>
        <Picker
          selectedValue={selectedTime}
          onValueChange={setSelectedTime}
          style={styles.picker}
        >
          <Picker.Item label="DEAR 1 PM" value="DEAR 1 PM" />
          <Picker.Item label="LSK 3 PM" value="LSK 3 PM" />
          <Picker.Item label="DEAR 6 PM" value="DEAR 6 PM" />
          <Picker.Item label="DEAR 8 PM" value="DEAR 8 PM" />
          <Picker.Item label="All" value="All" />
        </Picker>

        <View style={styles.row}>
          <View style={styles.dateInput}>
            <Text style={styles.label}>From Date</Text>
            <TouchableOpacity onPress={() => setShowFrom(true)}>
              <Text style={styles.dateText}>{fromDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showFrom && (
              <DateTimePicker
                value={fromDate}
                mode="date"
                display="default"
                onChange={(e, date) => {
                  setShowFrom(false);
                  if (date) setFromDate(date);
                }}
              />
            )}
          </View>

          <View style={styles.equalBox}>
            <Text style={styles.equalText}>→</Text>
          </View>

          <View style={styles.dateInput}>
            <Text style={styles.label}>To Date</Text>
            <TouchableOpacity onPress={() => setShowTo(true)}>
              <Text style={styles.dateText}>{toDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showTo && (
              <DateTimePicker
                value={toDate}
                mode="date"
                display="default"
                onChange={(e, date) => {
                  setShowTo(false);
                  if (date) setToDate(date);
                }}
              />
            )}
          </View>
        </View>

        <Text style={styles.pickerWrapper}>Select Agent</Text>
        <Picker
          selectedValue={selectedAgent}
          onValueChange={setSelectedAgent}
          style={styles.picker}
        >
          <Picker.Item label="All Agents" value="" />
          {allUsers.map((username, i) => (
            <Picker.Item key={i} label={username} value={username} />
          ))}
        </Picker>

        <TouchableOpacity
          style={styles.generateButton}
          onPress={fetchDataAndNavigate}
        >
          <Text style={styles.generateButtonText}>Generate Net Pay Report</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff2e63" />
          <Text style={styles.loadingText}>Loading report...</Text>
        </View>
      )}

      {!!error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerText: { fontSize: 18, fontWeight: "bold", color: "#333" },
  form: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    marginTop: 12,
  },
  picker: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#553737ff",
    color: "#000",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  dateInput: { flex: 1 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#666",
  },
  dateText: {
    padding: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 14,
  },
  equalBox: {
    width: 40,
    height: 40,
    backgroundColor: "#ff2e63",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginTop: 20,
  },
  equalText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  generateButton: {
    backgroundColor: "#ff2e63",
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  generateButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: "#ffebee",
    borderRadius: 8,
    borderLeft: 4,
    borderLeftColor: "#f44336",
  },
  errorText: { color: "#d32f2f", fontSize: 14, fontWeight: "500" },
});
