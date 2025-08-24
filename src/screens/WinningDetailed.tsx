import React, { Component } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "winningdetailed">;
type State = {};

// Define the types locally since we're importing from App.tsx
interface WinEntry {
  number: string;
  type: string;
  winType?: string;
  count: number;
  winAmount: number;
}

interface Bill {
  billNo: string;
  createdBy: string;
  scheme: string;
  winnings?: WinEntry[];
}

export default class WinningDetailed extends Component<Props, State> {
  calcSuperAmount = (win: WinEntry, scheme: string) => {
    const payoutTables: { [key: string]: any } = {
      "1": {
        super: { 1: 400, 2: 50, 3: 30, 4: 30, 5: 20, other: 10 },
        box: {
          normal: { perfect: 300, permutation: 30 },
          double: { perfect: 330, permutation: 60 },
        },
        ab_bc_ac: 30,
      },
      "2": {
        super: { 1: 200, 2: 25, 3: 15, 4: 15, 5: 10, other: 5 },
        box: {
          normal: { perfect: 150, permutation: 15 },
          double: { perfect: 165, permutation: 30 },
        },
        ab_bc_ac: 15,
      },
      "3": {
        super: {},
        box: {
          normal: { perfect: 0, permutation: 0 },
          double: { perfect: 0, permutation: 0 },
        },
        ab_bc_ac: 0,
      },
    };

    const schemeKey = String(scheme).replace(/[^0-9]/g, "") || "1";
    const payouts = payoutTables[schemeKey] || payoutTables["1"];

    const getPrizePosition = (winType: string): number | null => {
      const match = winType.match(/SUPER (\d)/);
      return match ? parseInt(match[1], 10) : null;
    };

    if (win.type === "SUPER") {
      if (schemeKey === "3") return 0;
      const pos = getPrizePosition(win.winType || "");
      if (pos && payouts.super[pos]) return payouts.super[pos] * win.count;
      return (payouts.super.other || 0) * win.count;
    }

    if (win.type === "BOX") {
      const isPerfect = (win.winType || "").includes("perfect");
      const isDouble = (win.winType || "").includes("double");
      if (isDouble) {
        return isPerfect
          ? payouts.box.double.perfect * win.count
          : payouts.box.double.permutation * win.count;
      }
      return isPerfect
        ? payouts.box.normal.perfect * win.count
        : payouts.box.normal.permutation * win.count;
    }

    if (["AB", "BC", "AC"].includes(win.type)) {
      return payouts.ab_bc_ac * win.count;
    }

    return 0;
  };

  renderWinEntry = (win: WinEntry, index: number, scheme: string) => {
    const superAmount = this.calcSuperAmount(win, scheme);
    const total = superAmount + win.winAmount;
    const isEven = index % 2 === 0;
  
    return (
      <View key={index} style={[styles.winEntryRow, { backgroundColor: isEven ? "#f9f9f9" : "#fff" }]}>
        <Text style={styles.winNumber}>{win.number}</Text>
        <Text style={styles.winType}>{win.winType || win.type}</Text>
        <Text style={styles.winCount}>{win.count}</Text>
        <Text style={[styles.winAmount, { color: win.winAmount >= 0 ? "green" : "red" }]}>
          ₹{win.winAmount}
        </Text>
        <Text style={[styles.winAmount, { color: superAmount >= 0 ? "green" : "red" }]}>
          {String(scheme).replace(/[^0-9]/g, "") === "3" ? "₹0" : `₹${superAmount}`}
        </Text>
        <Text style={[styles.winAmount, { color: total >= 0 ? "green" : "red" }]}>₹{total}</Text>
      </View>
    );
  };
  

  renderBill = (bill: Bill, index: number) => {
    return (
      <View key={index} style={styles.billCard}>
        {/* Header */}
        <View style={styles.billHeader}>
          <Text style={styles.billTitle}>Bill #{bill.billNo}</Text>
          <Text style={styles.agentName}>Agent: {bill.createdBy}</Text>
          <Text style={styles.agentName}>Scheme: {bill.scheme}</Text>
        </View>

        {/* Table Header */}
        <View style={styles.winEntriesHeader}>
          <Text style={styles.winNumber}>Number</Text>
          <Text style={styles.winType}>Type</Text>
          <Text style={styles.winCount}>Count</Text>
          <Text style={styles.winAmount}>Amount</Text>
          <Text style={styles.winAmount}>Super</Text>
          <Text style={styles.winAmount}>Total</Text>
        </View>

        {bill.winnings?.map((win: WinEntry, idx: number) =>
          this.renderWinEntry(win, idx, bill.scheme)
        )}
      </View>
    );
  };

  render() {
    const { report } = this.props.route.params || {};
    const bills = report?.bills || [];
    const grandTotal = report?.grandTotal || 0;

    if (!report) {
      return (
        <View style={styles.container}>
          <Text>No report data passed!</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.container}>
        <View style={styles.totalContainer}>
          <Text style={styles.grandTotal}>Grand Total: ₹{grandTotal}</Text>
        </View>
        {bills.map(this.renderBill)}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f2" },

  totalContainer: {
    backgroundColor: "#e6ffe6",
    padding: 10,
    marginBottom: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  grandTotal: { fontSize: 18, fontWeight: "bold", color: "green" },

  billCard: {
    backgroundColor: "#fff",
    marginBottom: 16,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#722e2eff",
    padding: 6,
    marginBottom: 6,
  },
  billTitle: { fontWeight: "bold", fontSize: 14, color: "#fff" },
  agentName: { fontStyle: "italic", fontSize: 12, color: "#fff" },

  winEntriesHeader: {
    flexDirection: "row",
    backgroundColor: "#e3e3e3",
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  winNumber: { flex: 2, fontWeight: "bold", fontSize: 13, textAlign: "center" },
  winType: { flex: 1, fontWeight: "bold", fontSize: 13, textAlign: "center" },
  winCount: { flex: 1, fontWeight: "bold", fontSize: 13, textAlign: "center" },
  winAmount: { flex: 1, fontWeight: "bold", fontSize: 13, textAlign: "center" },

  winEntryRow: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 2,
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
    borderRadius: 4,
  },
});
