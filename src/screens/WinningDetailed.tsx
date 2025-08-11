import React, { Component } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, Report, Bill, WinEntry } from "./types";

type Props = NativeStackScreenProps<RootStackParamList, "WinningDetailed">;

type State = {};

export default class WinningDetailed extends Component<Props, State> {
  renderWinEntry = (win: WinEntry, index: number) => {
    return (
      <View key={index} style={styles.winEntryRow}>
        <Text style={styles.winNumber}>{win.number}</Text>
        <Text style={styles.winType}>{win.type}</Text>
        <Text style={styles.winCount}>x{win.count}</Text>
        <Text style={styles.winAmount}>{win.winAmount}</Text>
      </View>
    );
  };

  renderBill = (bill: Bill, index: number) => {
    return (
      <View key={index} style={styles.billCard}>
        <View style={styles.billHeader}>
          <Text style={styles.billTitle}>Bill #{bill.billNo}</Text>
          <Text style={styles.agentName}>Agent: {bill.createdBy}</Text>
        </View>

        <View style={styles.winEntriesHeader}>
          <Text style={styles.winNumber}>Number</Text>
          <Text style={styles.winType}>Type</Text>
          <Text style={styles.winCount}>Count</Text>
          <Text style={styles.winAmount}>Amount</Text>
        </View>

        {bill.winnings.map(this.renderWinEntry)}

        <View style={styles.billFooter}>
          <Text style={styles.billTotal}>Total: ₹{bill.total}</Text>
        </View>
      </View>
    );
  };

  render() {
    const { report } = this.props.route.params;

    if (!report) {
      return (
        <View style={styles.container}>
          <Text>No report data passed!</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.container}>
        <Text style={styles.grandTotal}>Grand Total: ₹{report.grandTotal}</Text>

        {report.bills.map(this.renderBill)}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 10 },
  pageTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 15 },
  grandTotal: { fontSize: 20, fontWeight: "600", marginBottom: 15, color: "green" },

  billCard: {
    backgroundColor: "#fafafa",
    borderRadius: 8,
    marginBottom: 20,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
        backgroundColor:'red',

  },
  billTitle: { fontWeight: "bold", fontSize: 18 },
  agentName: { fontStyle: "italic", fontSize: 14, color: "black" },

  winEntriesHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "blue",
    paddingBottom: 4,
    marginBottom: 2,
    backgroundColor:'red',
  },
  winNumber: { flex: 2, fontWeight: "bold" },
  winType: { flex: 1, fontWeight: "bold" },
  winCount: { flex: 1, fontWeight: "bold", textAlign: "center" },
  winAmount: { flex: 1, fontWeight: "bold", textAlign: "right" },
  winDescription: { flex: 2, fontWeight: "bold" },

  winEntryRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderColor: "#301919ff",
  },

  billFooter: {
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    paddingTop: 6,
    backgroundColor: "#ada0a0ff"
  },
  billTotal: { fontWeight: "bold", fontSize: 16, textAlign: "right", backgroundColor: "#ada0a0ff" },
});
