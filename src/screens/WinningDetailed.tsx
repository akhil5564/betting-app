import React, { Component } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "winningdetailed">;

interface WinEntry {
  number: string;
  type: string;
  winType?: string;
  count: number;
  winAmount: number;
  name?: string;
  billNo?: string;
}

interface Bill {
  billNo: string;
  createdBy: string;
  scheme: string;
  winnings?: WinEntry[];
}

export default class WinningDetailedScreen extends Component<Props> {
  // Calculate Super Amount
  calcSuperAmount = (win: WinEntry, scheme: string) => {
    // Extract bet type from full type string (e.g., "D-1-SUPER" -> "SUPER")
    const extractBetType = (typeStr: string): string => {
      if (!typeStr) return "";
      const parts = typeStr.split("-");
      return parts[parts.length - 1]; // Get the last part
    };
    
    const betType = extractBetType(win.type);
    
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

    if (betType === "SUPER") {
      if (schemeKey === "3") return 0;
      const pos = getPrizePosition(win.winType || "");
      if (pos && payouts.super[pos]) return payouts.super[pos] * win.count;
      return (payouts.super.other || 0) * win.count;
    }

    if (betType === "BOX") {
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

    if (["AB", "BC", "AC"].includes(betType)) {
      return payouts.ab_bc_ac * win.count;
    }

    return 0;
  };

  // Go to Summary Page
  goToSummary = () => {
    const { navigation, route } = this.props;
    const { report } = route.params || {};
    const bills: Bill[] = report?.bills || [];

    const allEntries = bills.flatMap((bill: Bill) =>
      (bill.winnings || []).map((win) => {
        const superAmount = this.calcSuperAmount(win, bill.scheme);
        const total = superAmount + win.winAmount;
        return {
          ...win,
          billNo: bill.billNo,
          scheme: bill.scheme,
          superAmount,
          total,
        };
      })
    );

    const totalWin = allEntries.reduce((sum, e) => sum + (e.winAmount || 0), 0);
    const totalSuper = allEntries.reduce(
      (sum, e) => sum + (e.superAmount || 0),
      0
    );
    const totalTotal = allEntries.reduce((sum, e) => sum + (e.total || 0), 0);

    navigation.navigate("winningreportsummary", {
      report,
      totalPrize: totalWin,
      totalSuper,
      totalAmount: totalTotal,
    });
  };

  // Render Each Row
  renderWinEntryRow = (entry: any, index: number) => {
    const isEven = index % 2 === 0;
    const firstName = (entry.name || '-').split(' ')[0];
    
    // Extract position number from winType (e.g., "SUPER 1" -> 1, "SUPER 35" -> 35)
    const extractPosition = (winType: string): string => {
      if (!winType) return '-';
      const match = winType.match(/\d+/);
      return match ? match[0] : '-';
    };
    
    const position = extractPosition(entry.winType || '');
    
    // Log type, count, number from backend
    console.log(`[Entry ${index}] Full Type: ${entry.type}, Count: ${entry.count}, Number: ${entry.number}, Position: ${position}`);
    
    return (
      <ScrollView
        key={index}
        horizontal
        scrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        style={[
          styles.tableRow,
          isEven ? styles.rowEven : styles.rowOdd,
        ]}
      >
        <View style={styles.cell}>
          <Text style={styles.cellText}>{entry.billNo}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellText}>{entry.number}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellText}>{entry.type}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellText}>{entry.count}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellText}>{firstName}</Text>
        </View>
        <View style={styles.cell}>
          <Text
            style={[
              styles.cellText,
              { color: entry.winAmount >= 0 ? '#1a7f37' : '#d32f2f', fontWeight: 'bold' },
            ]}
          >
            {entry.winAmount}
          </Text>
        </View>
        <View style={styles.cell}>
          <Text
            style={[
              styles.cellText,
              { color: entry.superAmount >= 0 ? '#1976d2' : '#d32f2f', fontWeight: 'bold' },
            ]}
          >
            {entry.superAmount}
          </Text>
        </View>
        <View style={[styles.cell, styles.lastCell]}>
          <Text
            style={[
              styles.cellText,
              { color: entry.total >= 0 ? '#6d4c41' : '#d32f2f', fontWeight: 'bold' },
            ]}
          >
            {entry.total}
          </Text>
        </View>
      </ScrollView>
    );
  };

  render() {
    const { route } = this.props;
    const { report } = route.params || {};
    const bills: Bill[] = report?.bills || [];

    const allEntries = bills.flatMap((bill: Bill) =>
      (bill.winnings || []).map((win) => {
        const superAmount = this.calcSuperAmount(win, bill.scheme);
        const total = superAmount + win.winAmount;
        return {
          ...win,
          billNo: bill.billNo,
          scheme: bill.scheme,
          superAmount,
          total,
        };
      })
    );

    const totalCount = allEntries.reduce((sum, e) => sum + (e.count || 0), 0);
    const totalWin = allEntries.reduce((sum, e) => sum + (e.winAmount || 0), 0);
    const totalSuperVal = allEntries.reduce(
      (sum, e) => sum + (e.superAmount || 0),
      0
    );
    const totalTotal = allEntries.reduce((sum, e) => sum + (e.total || 0), 0);

    const showTotalPrize = totalWin;
    const showTotalSuper = totalSuperVal;
    const showTotalAmount = totalTotal;

    return (
      <View style={[styles.container, { backgroundColor: "#f2f2f2" }]}> 
        <View style={styles.topTotalsContainer}>
          <View style={styles.topTotalBox}>
            <Text style={styles.topTotalLabel}>Total Prize</Text>
            <Text style={styles.topTotalValue}>₹{showTotalPrize}</Text>
          </View>
          <View style={styles.topTotalBox}>
            <Text style={styles.topTotalLabel}>Total Super</Text>
            <Text style={styles.topTotalValue}>₹{showTotalSuper}</Text>
          </View>
          <View style={styles.topTotalBox}>
            <Text style={styles.topTotalLabel}>Total Amount</Text>
            <Text style={styles.topTotalValue}>₹{showTotalAmount}</Text>
          </View>
        </View>

        {/* Table with horizontal and vertical scroll, and colored background */}
        <ScrollView horizontal style={styles.tableScroll} contentContainerStyle={{ minWidth: 900 }}>
          <View style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: 6, paddingBottom: 8 }}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.headerRow]}> 
              <View style={styles.cell}>
                <Text style={styles.cellText}>Bill No</Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.cellText}>Number</Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.cellText}>Type</Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.cellText}>Count</Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.cellText}>Name</Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.cellText}>Amount</Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.cellText}>Super</Text>
              </View>
              <View style={[styles.cell, styles.lastCell]}>
                <Text style={styles.cellText}>Total</Text>
              </View>
            </View>

            {/* Vertically scrollable data rows with fixed height */}
            <ScrollView style={{ height: 500, backgroundColor: '#ffffff' }} contentContainerStyle={{ minWidth: 900 }} scrollEnabled={true} showsVerticalScrollIndicator={true}>
              {allEntries.map(this.renderWinEntryRow)}
            </ScrollView>

            {/* Table Footer */}
            <View
              style={[
                styles.tableRow,
                styles.footerRow,
              ]}
            >
              <View style={styles.cell}>
                <Text style={styles.cellText}>Total</Text>
              </View>
              <View style={styles.cell}></View>
              <View style={styles.cell}></View>
              <View style={styles.cell}>
                <Text style={styles.cellText}>{totalCount}</Text>
              </View>
              <View style={styles.cell}></View>
              <View style={styles.cell}>
                <Text style={styles.cellText}>₹{totalWin}</Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.cellText}>₹{totalSuperVal}</Text>
              </View>
              <View style={[styles.cell, styles.lastCell]}>
                <Text style={styles.cellText}>₹{totalTotal}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  headerRow: {
    backgroundColor: '#dd102bd7',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    color: '#000000',
    borderBottomWidth: 0,
  },
  footerRow: {
    backgroundColor: '#e3f2fd',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderTopWidth: 0,
  },
  rowEven: {
    backgroundColor: '#ffffff',
  },
  rowOdd: {
    backgroundColor: '#e9e8e1ff',
  },
  container: {
    flex: 1,
    justifyContent: "flex-start",
    backgroundColor: "#f2f2f2",
    paddingTop: 40,
    marginBottom: 30,
  },
  topTotalsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#e6ffe6",
    borderRadius: 8,
  },
  topTotalBox: {
    alignItems: "center",
    flex: 1,
  },
  topTotalLabel: {
    fontSize: 13,
    color: "#000000",
    fontWeight: "bold",
    marginBottom: 2,
  },
  topTotalValue: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0,
    alignItems: "center",
    minWidth: 900,
    height: 50,
  },
  cell: {
    flex: 1,
    borderRightWidth: 0,
    justifyContent: "center",
    alignItems: "flex-start",
    padding: 9,
    minWidth: 90,
  },
  lastCell: {
    borderRightWidth: 0,
  },
  cellText: {
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "left",
    color: '#000000',
    letterSpacing: 0.2,
  },
  tableScroll: {
    marginBottom: 8,
    borderRadius: 4,
  },
  summaryButton: {
    backgroundColor: "#f02b61",
    paddingVertical: 10,
    borderRadius: 5,
    marginHorizontal: 20,
    marginBottom: 10,
    marginTop: 10,
  },
  summaryButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
