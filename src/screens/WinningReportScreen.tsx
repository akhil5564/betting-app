import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Report } from "./types";

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

function processReport(sales: any[], results: Record<string, any>): Report {
  if (!results || typeof results !== "object") {
    console.warn("processReport: invalid results object", results);
    return { grandTotal: 0, bills: [] };
  }
  if (!results["1"]) {
    console.warn("processReport: missing key '1' in results", results);
    return { grandTotal: 0, bills: [] };
  }

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

  const report: Record<string, any> = {};

  for (const sale of sales) {
    if (
      !sale.number ||
      !sale.count ||
      !sale.type ||
      !sale.billNo ||
      !sale.createdBy
    ) {
      console.warn("Skipping invalid sale entry:", sale);
      continue;
    }

    const rawType = (sale.type || "").toUpperCase();
    const baseType = rawType.includes("-")
      ? rawType.split("-").pop()!
      : rawType;

    const num = sale.number;
    const count = sale.count;
    let winAmount = 0;
    let winType = "";

    if (baseType === "SUPER") {
      let prizePos = allPrizes.indexOf(num) + 1;
      if (prizePos > 0) {
        winAmount = (payouts.SUPER[prizePos] || payouts.SUPER.other) * count;
        winType = `SUPER ${
          prizePos <= 5 ? prizePos + " prize" : "other prize"
        }`;
      }
    }

    if (baseType === "BOX") {
      if (num === firstPrize) {
        if (isDoubleNumber(firstPrize)) {
          winAmount = payouts.BOX.double.perfect * count;
          winType = "BOX perfect double";
        } else {
          winAmount = payouts.BOX.normal.perfect * count;
          winType = "BOX perfect normal";
        }
      } else if (
        num.split("").sort().join("") === firstPrize.split("").sort().join("")
      ) {
        if (isDoubleNumber(firstPrize)) {
          winAmount = payouts.BOX.double.permutation * count;
          winType = "BOX permutation double";
        } else {
          winAmount = payouts.BOX.normal.permutation * count;
          winType = "BOX permutation normal";
        }
      }
    }

    if (baseType === "AB" && num === firstPrize.slice(0, 2)) {
      winAmount = payouts.AB_BC_AC * count;
      winType = "AB match";
    }
    if (baseType === "BC" && num === firstPrize.slice(1, 3)) {
      winAmount = payouts.AB_BC_AC * count;
      winType = "BC match";
    }
    if (baseType === "AC" && num === firstPrize[0] + firstPrize[2]) {
      winAmount = payouts.AB_BC_AC * count;
      winType = "AC match";
    }

    if (baseType === "A" && num === firstPrize[0]) {
      winAmount = payouts.A_B_C * count;
      winType = "A match";
    }
    if (baseType === "B" && num === firstPrize[1]) {
      winAmount = payouts.A_B_C * count;
      winType = "B match";
    }
    if (baseType === "C" && num === firstPrize[2]) {
      winAmount = payouts.A_B_C * count;
      winType = "C match";
    }

    if (winAmount > 0) {
      if (!report[sale.billNo]) {
        report[sale.billNo] = {
          createdBy: sale.createdBy,
          billNo: sale.billNo,
          winnings: [],
          total: 0,
        };
      }
      report[sale.billNo].winnings.push({
        number: num,
        type: baseType,
        count,
        winType,
        winAmount,
      });
      report[sale.billNo].total += winAmount;
    }
  }

  const finalReport = Object.values(report);
  const grandTotal = finalReport.reduce((sum, b) => sum + b.total, 0);

  return { grandTotal, bills: finalReport };
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
  for (const bill of r1.bills) {
    map.set(bill.billNo.toString(), { ...bill });
  }
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

export default function WinningReportScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState<null | "from" | "to">(null);

  const [selectedDraw, setSelectedDraw] = useState("DEAR 8 PM");

  async function fetchData() {
    if (toDate < fromDate) {
      setErrorMsg("To date must be after or equal to From date");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setReport(null);

      const entriesRes = await axios.get(
        "https://manu-netflix.onrender.com/entries",
        {
          params: {
            fromDate: formatDate(fromDate),
            toDate: formatDate(toDate),
            timeLabel: selectedDraw,
          },
        }
      );

      const allDates = getDatesBetween(fromDate, toDate);
      let combinedReport: Report = { grandTotal: 0, bills: [] };
      let anyResultsFound = false;

      for (const date of allDates) {
        const formattedDate = formatDate(date);

        let resultsRes;
        try {
          resultsRes = await axios.get(
            "https://manu-netflix.onrender.com/getResult",
            { params: { date: formattedDate, time: selectedDraw } }
          );
        } catch (err: any) {
          if (err.response && err.response.status === 404) {
            console.log(`No result found for ${formattedDate}, skipping.`);
            continue;
          } else {
            throw err;
          }
        }

        const resultData = Array.isArray(resultsRes.data)
          ? resultsRes.data[0]
          : resultsRes.data;

        const salesForDate = entriesRes.data.filter((e: any) => {
          const created = new Date(e.createdAt);
          return (
            created >= new Date(formattedDate + "T00:00:00") &&
            created <= new Date(formattedDate + "T23:59:59")
          );
        });

        const dayReport = processReport(salesForDate, resultData);

        if (dayReport.bills.length > 0) anyResultsFound = true;

        combinedReport = mergeReports(combinedReport, dayReport);
      }

      if (!anyResultsFound) {
        setErrorMsg("No results found for the selected date range.");
        setReport(null);
      } else {
        setReport(combinedReport);
      }
    } catch (err: any) {
      console.error("Error fetching report:", err.message);
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

      <View style={styles.dateRow}>
        <TouchableOpacity
          style={styles.dateBtn}
          onPress={() => setShowPicker("from")}
        >
          <Text>From: {formatDate(fromDate)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateBtn}
          onPress={() => setShowPicker("to")}
        >
          <Text>To: {formatDate(toDate)}</Text>
        </TouchableOpacity>
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

      <Picker selectedValue={selectedDraw} onValueChange={setSelectedDraw}>
        <Picker.Item label="DEAR 1 PM" value="DEAR 1 PM" />
        <Picker.Item label="DEAR 3 PM" value="DEAR 3 PM" />
        <Picker.Item label="DEAR 6 PM" value="DEAR 6 PM" />
        <Picker.Item label="DEAR 8 PM" value="DEAR 8 PM" />
      </Picker>

      <TouchableOpacity style={styles.fetchBtn} onPress={fetchData}>
        <Text style={{ color: "#fff" }}>Fetch Report</Text>
      </TouchableOpacity>

      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading report...</Text>
        </View>
      )}

      {!loading && report && (
        <>
          <TouchableOpacity
            style={[styles.fetchBtn, { backgroundColor: "green" }]}
            onPress={() => navigation.navigate("winningdetailed", { report })}
          >
            <Text style={{ color: "#fff" }}>Generate Detailed Report</Text>
          </TouchableOpacity>

          <ScrollView>
            <Text style={styles.total}>Grand Total: ₹{report.grandTotal}</Text>
            {report.bills.map((bill, index) => (
              <View key={index} style={styles.bill}>
                <Text style={styles.billHeader}>
                  Bill #{bill.billNo} - Agent: {bill.createdBy}
                </Text>
                {bill.winnings.map((w: any, i: number) => (
                  <Text key={i} style={styles.winningLine}>
                    {w.number} ({w.type}) x{w.count} → ₹{w.winAmount} [{w.winType}]
                  </Text>
                ))}
                <Text style={styles.billTotal}>Total: ₹{bill.total}</Text>
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  dateRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  dateBtn: {
    padding: 10,
    backgroundColor: "#ddd",
    borderRadius: 5,
    width: "48%",
    alignItems: "center",
  },
  fetchBtn: {
    padding: 12,
    backgroundColor: "blue",
    alignItems: "center",
    borderRadius: 5,
    marginBottom: 10,
  },
  total: { fontSize: 18, fontWeight: "600", marginBottom: 15 },
  bill: {
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  billHeader: { fontSize: 16, fontWeight: "bold" },
  winningLine: { fontSize: 14, marginVertical: 2 },
  billTotal: { fontWeight: "bold", marginTop: 5 },
  center: { alignItems: "center", justifyContent: "center" },
  errorContainer: {
    backgroundColor: "#f8d7da",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  errorText: {
    color: "#721c24",
    fontWeight: "600",
  },
});
