import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, AntDesign } from '@expo/vector-icons';

const WinningReportSummary = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const { report, loggedInUser } = (route.params as any) || {};
  const {
    grandTotal = 0,
    fromDate,
    toDate,
    time,
    agent,
    bills = [],
    usersList = [],
    byAgent = [],
  } = report || {};

  const totalBills = bills.length;

  /** Calculate full totals for summary */
  let totalPrize = 0;
  let totalSuper = 0;
  let totalAmount = 0;

  const calcSuperAmount = (win, scheme) => {
    const payoutTables = {
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
        box: { normal: { perfect: 0, permutation: 0 }, double: { perfect: 0, permutation: 0 } },
        ab_bc_ac: 0,
      },
    };
    const schemeKey = String(scheme).replace(/[^0-9]/g, "") || "1";
    const payouts = payoutTables[schemeKey] || payoutTables["1"];

    const getPrizePosition = (winType) => {
      const match = winType && winType.match(/SUPER (\d)/);
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
  let billCommission =0
  let billWinTotal =0
  /** Calculate global totals */
  // bills.forEach((bill: any) => {
  //   (bill.winnings || []).forEach((win: any) => {
  //     const superAmt = calcSuperAmount(win, bill.scheme);
  //     // billCommission += superAmt;
  //     // billWinTotal += win.winAmount;
  //     console.log(
  //       "🎯 WIN →",
  //       "Bill:", bill.billNo,
  //       "| Type:", win.type,
  //       "| WinAmount:", win.winAmount,
  //       "| WinTotal:", billWinTotal,
  //       "| CommissionTotal:", billCommission,
  //       "| Count:", win.count,
  //       "| Commission:", superAmt
  //     );
  //   });
  // });
  // bills.forEach(bill => {
  //   console.log(
  //     `🧾 BillNo: ${bill.billNo}`,
  //     " | Wins count:", bill.winnings.length,
  //     " | Scheme:", bill.scheme,
  //     " | Win amounts:", bill.winnings.map(w => w.winAmount)
  //   );
  // });
  /** Group bills by agent for agent summary */
  const getAgentSummary = () => {
    const agentMap = new Map();
    bills.forEach((bill: any) => {
      const agentName = bill.createdBy || bill.agent || 'Unknown';
      if (!agentMap.has(agentName)) {
        agentMap.set(agentName, { agent: agentName, bills: [], totalWinnings: 0, totalBills: 0 });
      }
      const agentData = agentMap.get(agentName);
      agentData.bills.push(bill);
      agentData.totalBills += 1;
      if (bill.winnings && Array.isArray(bill.winnings)) {
        bill.winnings.forEach((win: any) => {
          agentData.totalWinnings += win.winAmount || 0;
        });
      }
    });
    return Array.from(agentMap.values());
  };

  const agentSummary = getAgentSummary();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Winning Report Summary</Text>
        <TouchableOpacity onPress={() => (navigation as any).navigate('Main')}>
          <AntDesign name="home" size={24} color="red" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Main Summary */}
        <View style={styles.card}>
          <Text style={styles.dateText}>
            {fromDate && toDate ? `${fromDate} to ${toDate}` : 'Winning Report'}
          </Text>
          {time && time !== 'ALL' && <Text style={styles.timeText}>{time}</Text>}

          <View style={styles.row}>
            <Text style={styles.label}>Total Bills :</Text>
            <Text style={styles.value}>{totalBills}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Prize :</Text>
            <Text style={styles.value}>₹{totalPrize}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Super :</Text>
            <Text style={styles.value}>₹{totalSuper}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Amount :</Text>
            <Text style={styles.value}>₹{totalAmount}</Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              (navigation as any).navigate('winningdetailed', {
                report,
              })
            }
          >
            <Text style={styles.buttonText}>View Detailed</Text>
          </TouchableOpacity>
        </View>

        {/* Agent Cards */}
        {agentSummary.length > 0 && (
          <View>
            <Text style={[styles.headerTitle, { textAlign: 'center', marginVertical: 15, color: '#f02b61' }]}>
              Agents Report
            </Text>

            {agentSummary.map((agentData: any, index: number) => {
              let aPrize = 0, aSuper = 0, aAmount = 0;
              agentData.bills.forEach((bill: any) => {
                (bill.winnings || []).forEach((win: any) => {
                  const superAmt = calcSuperAmount(win, bill.scheme);
                  aPrize += win.winAmount || 0;
                  aSuper += superAmt;
                  aAmount += (win.winAmount || 0) + superAmt;
                  console.log(
                          "🎯 WIN →",
                          "Bill:", bill?.billNo,
                          "| Type:", win?.type,
                          "| WinAmount:", win?.winAmount,
                          "| WinTotal:", aAmount,
                          "| CommissionTotal:", aSuper,
                          "| Count:", win.count,
                          "| Commission:", superAmt
                        );
                });
              });

              return (
                <View key={`${agentData.agent}-${index}`} style={[styles.card, styles.agentCard]}>
                  <View style={styles.agentHeader}>
                    <Ionicons name="person-circle" size={20} color="#f02b61" />
                    <Text style={styles.agentName}>{agentData.agent}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Total Bills :</Text>
                    <Text style={styles.value}>{agentData.totalBills}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Total Prize :</Text>
                    <Text style={styles.value}>₹{aPrize}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Total Super :</Text>
                    <Text style={styles.value}>₹{aSuper}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Total Amount :</Text>
                    <Text style={styles.value}>₹{aAmount}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.button, styles.agentButton]}
                    onPress={() =>
                      (navigation as any).navigate('winningdetailed', {
                        report: {
                          bills: agentData.bills,
                          fromDate,
                          toDate,
                          time,
                          agent: agentData.agent,
                          grandTotal: agentData.totalWinnings,
                        },
                      })
                    }
                  >
                    <Text style={styles.buttonText}>View Agent Details</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default WinningReportSummary;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f1f1', padding: 10, marginTop: 30 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ccc',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  card: {
    backgroundColor: '#fff', borderRadius: 6, padding: 15,
    marginTop: 15, shadowColor: '#000', elevation: 2,
  },
  agentCard: { borderLeftWidth: 3, borderLeftColor: '#f02b61' },
  agentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  agentName: { fontSize: 18, fontWeight: 'bold', color: '#f02b61', marginLeft: 8 },
  row: { flexDirection: 'row', marginTop: 10, alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 16, color: '#333' },
  value: { fontSize: 16, fontWeight: 'bold' },
  dateText: { fontSize: 16, color: '#f02b61', textAlign: 'center', fontWeight: 'bold' },
  timeText: { fontSize: 14, color: '#666', textAlign: 'center', fontStyle: 'italic', marginTop: 4 },
  button: { backgroundColor: '#f02b61', paddingVertical: 12, borderRadius: 5, marginTop: 20 },
  agentButton: { backgroundColor: '#501a05c0' },
  buttonText: { textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
