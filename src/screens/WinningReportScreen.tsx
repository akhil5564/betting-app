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

type Props = NativeStackScreenProps<RootStackParamList, "WinningReport">;

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

function processReport(sales: any[], results: Record<string, any>, userSchemeMap: Map<string, string>): Report {
  if (!results || typeof results !== "object" || !results["1"]) {
    return { grandTotal: 0, bills: [] };
  }

  const firstPrize = results["1"];
  const others = Array.isArray(results.others) ? results.others : [];

  const prizeList = [results["1"], results["2"], results["3"], results["4"], results["5"], ...others].filter(Boolean);
  const prizeMap = new Map<string, number>();
  prizeList.forEach((num, idx) => prizeMap.set(num, idx + 1));

  const firstPrizeSorted = firstPrize.split("").sort().join("");
  const isFirstPrizeDouble = isDoubleNumber(firstPrize);

  const firstA = firstPrize[0];
  const firstB = firstPrize[1];
  const firstC = firstPrize[2];
  const firstAB = firstA + firstB;
  const firstBC = firstB + firstC;
  const firstAC = firstA + firstC;

  const report: Record<string, any> = {};

  for (const sale of sales) {
    const { number: num, count, type, billNo, createdBy } = sale;
    if (!num || !count || !type || !billNo || !createdBy) continue;

    const scheme = userSchemeMap.get(createdBy) || "N/A";
    const baseType = type.toUpperCase().includes("-") ? type.toUpperCase().split("-").pop()! : type.toUpperCase();

    let winAmount = 0;
    let winType = "";

    const pos = prizeMap.get(num);
    if (baseType === "SUPER" && pos) {
      winAmount = (payouts.SUPER[pos] || payouts.SUPER.other) * count;
      winType = `SUPER ${pos <= 5 ? pos + " prize" : "other prize"}`;
    } else if (baseType === "BOX") {
      if (num === firstPrize) {
        winAmount = (isFirstPrizeDouble ? payouts.BOX.double.perfect : payouts.BOX.normal.perfect) * count;
        winType = `BOX perfect ${isFirstPrizeDouble ? "double" : "normal"}`;
      } else if (num.split("").sort().join("") === firstPrizeSorted) {
        winAmount = (isFirstPrizeDouble ? payouts.BOX.double.permutation : payouts.BOX.normal.permutation) * count;
        winType = `BOX permutation ${isFirstPrizeDouble ? "double" : "normal"}`;
      }
    } else if (baseType === "AB" && num === firstAB) {
      winAmount = payouts.AB_BC_AC * count;
      winType = "AB match";
    } else if (baseType === "BC" && num === firstBC) {
      winAmount = payouts.AB_BC_AC * count;
      winType = "BC match";
    } else if (baseType === "AC" && num === firstAC) {
      winAmount = payouts.AB_BC_AC * count;
      winType = "AC match";
    } else if (baseType === "A" && num === firstA) {
      winAmount = payouts.A_B_C * count;
      winType = "A match";
    } else if (baseType === "B" && num === firstB) {
      winAmount = payouts.A_B_C * count;
      winType = "B match";
    } else if (baseType === "C" && num === firstC) {
      winAmount = payouts.A_B_C * count;
      winType = "C match";
    }

    if (winAmount > 0) {
      if (!report[billNo]) {
        report[billNo] = { createdBy, billNo, scheme, winnings: [], total: 0 };
      }
      report[billNo].winnings.push({ number: num, type: baseType, count, winType, winAmount });
      report[billNo].total += winAmount;
    }
  }

  const bills = Object.values(report);
  const grandTotal = bills.reduce((sum, b) => sum + b.total, 0);
  return { grandTotal, bills };
}

function getDatesBetween(start: Date, end: Date) {
  const dates = [];
  const curr = new Date(start);
  while (curr <= end) {
    dates.push(new Date(curr));
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function mergeReports(r1: Report, r2: Report): Report {
  const map = new Map<string, typeof r1.bills[0]>();
  for (const bill of r1.bills) map.set(bill.billNo.toString(), { ...bill });
  for (const bill of r2.bills) {
    const key = bill.billNo.toString();
    if (map.has(key)) {
      const existing = map.get(key)!;
      existing.winnings.push(...bill.winnings);
      existing.total += bill.total;
    } else {
      map.set(key, { ...bill });
    }
  }
  const bills = Array.from(map.values());
  const grandTotal = bills.reduce((sum, b) => sum + b.total, 0);
  return { grandTotal, bills };
}

function getDescendants(username: string, users: { username: string; createdBy: string }[]): string[] {
  let descendants: string[] = [];
  const directChildren = users.filter((u) => u.createdBy === username).map((u) => u.username);
  descendants.push(...directChildren);
  directChildren.forEach((child) => {
    descendants.push(...getDescendants(child, users));
  });
  return descendants;
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
        const response = await fetch("https://www.muralibajaj.site/users");
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

  async function fetchAndNavigate() {
    if (toDate < fromDate) {
      setErrorMsg("To date must be after or equal to From date");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      let createdByList: string[] = [];
      if (!selectedAgent) {
        createdByList = [loggedInUser, ...getDescendants(loggedInUser, allUsers)];
      } else {
        createdByList = [selectedAgent, ...getDescendants(selectedAgent, allUsers)];
      }
      const createdBySet = new Set(createdByList);

      const entriesRes = await axios.get("https://www.muralibajaj.site/entries", {
        params: { fromDate: formatDate(fromDate), toDate: formatDate(toDate), timeLabel: selectedDraw },
      });

      if (!Array.isArray(entriesRes.data)) {
        setErrorMsg("Invalid entries data");
        setLoading(false);
        return;
      }

      // Filter once and group by date for O(1) access later
      const entriesByDate: Record<string, any[]> = {};
      for (const e of entriesRes.data) {
        if (!createdBySet.has(e.createdBy)) continue;
        const dateStr = formatDate(new Date(e.createdAt));
        if (!entriesByDate[dateStr]) entriesByDate[dateStr] = [];
        entriesByDate[dateStr].push(e);
      }

      const userSchemeMap = new Map<string, string>();
      allUsers.forEach((u) => {
        if (u.username && u.scheme) userSchemeMap.set(u.username, u.scheme);
      });

      const allDates = getDatesBetween(fromDate, toDate);
      let combinedReport: Report = { grandTotal: 0, bills: [] };
      let anyResultsFound = false;

      for (const date of allDates) {
        const formattedDate = formatDate(date);
        let resultsRes;
        try {
          resultsRes = await axios.get("https://www.muralibajaj.site/getResult", {
            params: { date: formattedDate, time: selectedDraw },
          });
        } catch (err: any) {
          if (err.response?.status === 404) continue;
          else throw err;
        }

        const resultData = Array.isArray(resultsRes.data) ? resultsRes.data[0] : resultsRes.data;
        const salesForDate = entriesByDate[formattedDate] || [];
        const dayReport = processReport(salesForDate, resultData, userSchemeMap);

        if (dayReport.bills.length > 0) anyResultsFound = true;
        combinedReport = mergeReports(combinedReport, dayReport);
      }

      if (!anyResultsFound) {
        setErrorMsg("No results found for the selected date range.");
      } else {
        navigation.navigate("winningdetailed", { report: combinedReport });
      }
    } catch (err: any) {
      setErrorMsg("Failed to fetch report: " + err.message);
    } finally {
      setLoading(false);
    }
  }

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

      <TouchableOpacity style={[styles.generateBtn, loading && { opacity: 0.6 }]} onPress={fetchAndNavigate} disabled={loading}>
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
  picker: { backgroundColor: "#f4f4f4", borderRadius: 5 , color:'black'},
  generateBtn: { padding: 14, backgroundColor: "#e73030c9", alignItems: "center", borderRadius: 5, marginVertical: 20 },
  generateBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  errorContainer: { backgroundColor: "#f8d7da", padding: 10, borderRadius: 5, marginTop: 10 },
  errorText: { color: "#721c24", fontWeight: "600" },
});