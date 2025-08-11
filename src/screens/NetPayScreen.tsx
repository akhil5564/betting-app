import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

const payouts = {
  SUPER: { 1: 5000, 2: 500, 3: 250, 4: 100, 5: 50, other: 20 },
  BOX: {
    normal: { perfect: 3000, permutation: 800 },
    double: { perfect: 3800, permutation: 1600 },
  },
  AB_BC_AC: 700,
  A_B_C: 100,
};

function isDoubleNumber(numStr: string) {
  return new Set(numStr.split("")).size === 2;
}
function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

export default function NetPayMultiDayScreen() {
  const navigation = useNavigation();
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);
  const [selectedTime, setSelectedTime] = useState("DEAR 8 PM");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [entries, setEntries] = useState<any[]>([]);

  const calculateWinAmount = (entry: any, results: any) => {
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
    const rawType = (entry.type || "").toUpperCase();
    const baseType = rawType.includes("-")
      ? rawType.split("-").pop()
      : rawType;

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

  const processEntriesForDate = (entriesForDay: any[], resultForDay: any) =>
    entriesForDay.map((entry) => ({
      ...entry,
      winAmount: calculateWinAmount(entry, resultForDay),
    }));

  const fetchEntriesAndResultsForDate = async (dateStr: string, timeLabel: string) => {
    const entriesRes = await axios.get(
      "https://manu-netflix.onrender.com/entries",
      { params: { date: dateStr, timeLabel } }
    );
    const resultRes = await axios.get(
      "https://manu-netflix.onrender.com/getResult",
      { params: { date: dateStr, time: timeLabel } }
    );
    const resultsArray = resultRes.data;
    const latestResult =
      Array.isArray(resultsArray) && resultsArray.length > 0
        ? resultsArray[resultsArray.length - 1]
        : {};
    return {
      entries: entriesRes.data || [],
      result: latestResult || {},
    };
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    setEntries([]);
    try {
      const dates: string[] = [];
      let current = new Date(fromDate);
      const end = new Date(toDate);
      while (current <= end) {
        dates.push(formatDate(current));
        current = addDays(current, 1);
      }
      let allEntries: any[] = [];
      for (const dateStr of dates) {
        const { entries: dayEntries, result: dayResult } =
          await fetchEntriesAndResultsForDate(dateStr, selectedTime);
        if (!dayEntries || dayEntries.length === 0) continue;
        const processedEntries = processEntriesForDate(dayEntries, dayResult);
        allEntries = allEntries.concat(processedEntries);
      }
      setEntries(allEntries);
    } catch (err) {
      setError("Failed to fetch data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalSales = entries.reduce((acc, e) => acc + (e.count || 0), 0);
  const totalWinning = entries.reduce((acc, e) => acc + (e.winAmount || 0), 0);
  const netPay = totalSales - totalWinning;

  return (
    <View style={styles.container}>
      {/* Header same as SalesReportScreen */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Net Pay Report</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <Picker
          selectedValue={selectedTime}
          onValueChange={setSelectedTime}
          style={styles.picker}
        >
          <Picker.Item label="DEAR 1 PM" value="DEAR 1 PM" />
          <Picker.Item label="LSK 3 PM" value="LSK 3 PM" />
          <Picker.Item label="DEAR 6 PM" value="DEAR 6 PM" />
          <Picker.Item label="DEAR 8 PM" value="DEAR 8 PM" />
        </Picker>

        <View style={styles.row}>
          <View style={styles.dateInput}>
            <Text style={styles.label}>From</Text>
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
            <Text style={styles.equalText}>=</Text>
          </View>

          <View style={styles.dateInput}>
            <Text style={styles.label}>To</Text>
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

        <TouchableOpacity style={styles.generateButton} onPress={fetchData}>
          <Text style={styles.generateButtonText}>Generate Net Pay</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color="#ff2e63" />}
      {!!error && <Text style={styles.errorText}>{error}</Text>}

      {!loading && entries.length > 0 && (
        <ScrollView style={{ marginTop: 10 }}>
          <Text>Total Sales (Count): {totalSales}</Text>
          <Text>Total Winning Amount: ₹{totalWinning}</Text>
          <Text style={styles.netPayText}>Net Pay: ₹{netPay}</Text>
          {entries.map((e, i) => (
            <View key={i} style={styles.entryRow}>
              <Text>
                {e.date || "-"} | {e.number} | Count: {e.count} | Win: ₹
                {e.winAmount}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f2" },
  header: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
  },
  headerText: { fontSize: 18, fontWeight: "bold" },
  form: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 10,
    elevation: 2,
  },
  picker: {
    backgroundColor: "#f4f4f4",
    borderRadius: 5,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  dateInput: { flex: 1 },
  label: { fontSize: 12, marginBottom: 4 },
  dateText: {
    padding: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
  },
  equalBox: {
    width: 40,
    height: 40,
    backgroundColor: "#ff2e63",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    marginTop: 16,
  },
  equalText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  generateButton: {
    backgroundColor: "#ff2e63",
    padding: 14,
    borderRadius: 5,
    marginTop: 20,
  },
  generateButtonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  errorText: { color: "red", margin: 16 },
  netPayText: { fontWeight: "bold", marginVertical: 8 },
  entryRow: {
    borderBottomWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 8,
  },
});
