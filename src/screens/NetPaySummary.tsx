import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Domain, extractBetType } from "./NetPayScreen";

const { width, height } = Dimensions.get("window");
const emojiOptions = ["🎉", "🎊", "✨", "💥", "🧨"];

// Recursively get all sub-users
const getAllSubUsers = (username: string, usersList: any[]): string[] => {
  const children = usersList
    .filter((u: any) => u.parent === username)
    .map((u: any) => u.username);
  let all = [...children];
  children.forEach((child) => {
    all = all.concat(getAllSubUsers(child, usersList));
  });
  return all;
};

// Fixed theme (light)
const colors = {
  background: "#f5f5f5",
  card: "#fff",
  text: "#000",
  header: "#fa8686dc",
  border: "#aaa",
  altRow: "#f9f9f9",
  winningBorder: "#4caf50",
  footer: "#ddd",
  positive: "#4caf50",
  negative: "#f44336",
  faded: "#999",
};

export default function WinningDetailed({ route }: any) {
  const {
    fromDate,
    toDate,
    matchedEntries = [],
    usersList = [],
    loggedInUser, // must include loggedInUser.id or loggedInUser.username
    selectedTime = "KERALA 3 PM", // optional default draw name
    time,
    fromAccountSummary,
    userRates={},
  } = route.params || {};
console.log("paramssssss",route.params);
console.log("userRates==========",userRates);

const [selectedUser, setSelectedUser] = useState("All");
  const [rate, setRate] = useState<number>(10); // default until fetched
// const [userRates, setUserRates] = useState<{ [username: string]: number }>({});
  
  const filteredByDateRange = matchedEntries.filter((entry: any) => {
    const entryDate = entry.date
      ? entry.date.split("T")[0]
      : entry.date;
    return entryDate >= fromDate && entryDate <= toDate;
  });
    const usernames = Array.from(
    new Set(filteredByDateRange.map((e) => e.username || e.createdBy))
  );

  const selectedHierarchyUsers =
    selectedUser === "All"
      ? usernames
      : [selectedUser, ...getAllSubUsers(selectedUser, usersList)];

  // Filter entries for selected user + sub-users
  const filteredUsers = filteredByDateRange.filter((entry) =>
    selectedHierarchyUsers.includes(entry.username || entry.createdBy)
  );

  // Aggregate totals per user
  const userSummary = selectedHierarchyUsers.map((user) => {
    const entries = filteredUsers.filter(
      (e) => (e.username || e.createdBy) === user
    );

  //   const totalSales = entries.reduce((sum, entry) => {
  //   const betType = extractBetType(entry.type);
  //   console.log("aaaaaaa",userRates);
    
  //   const rate = userRates[user]?.[betType] ?? 10;
  //   return sum + (entry.count || 0) * rate;
  // }, 0);
  // Normalize bet type: extract just the bet type (SUPER, BOX, A, B, C, etc.)
  // from formats like "LSK3SUPER", "DEAR1BOX", "D-1-SUPER", etc.
  const normalizeBetType = (typeStr: string): string => {
    if (!typeStr) return "";
    
    // First try the existing extractBetType logic (for formats like "D-1-SUPER")
    const extracted = extractBetType(typeStr);
    
    // If it contains a dash, the extracted part is likely the bet type
    if (typeStr.includes("-")) {
      return extracted;
    }
    
    // Otherwise, strip common draw prefixes (LSK3, DEAR1, DEAR6, DEAR8)
    const drawPrefixes = ["LSK3", "DEAR1", "DEAR6", "DEAR8"];
    for (const prefix of drawPrefixes) {
      if (extracted.startsWith(prefix)) {
        return extracted.substring(prefix.length);
      }
    }
    
    // If no prefix found, return as-is (might already be normalized like "SUPER", "A", "B", etc.)
    return extracted;
  };

  const totalSales = entries.reduce((sum, entry) => {
    const betType = normalizeBetType(entry.type);
  
    // normalize draw name (to match backend keys)
    const drawLabelMap: Record<string, string> = {
      "LSK 3 PM": "KERALA 3 PM",
      "DEAR 1 PM": "DEAR 1 PM",
      "DEAR 6 PM": "DEAR 6 PM",
      "DEAR 8 PM": "DEAR 8 PM",
    };
    // First map LSK to KERALA, then strip space before PM/AM to match backend format
    const mappedLabel = drawLabelMap[entry.timeLabel] || entry.timeLabel;
    const normalizedLabel = mappedLabel.replace(/\s+(PM|AM)$/gi, '$1');
  
    // Use entry's createdBy/username to lookup rates (backend uses createdBy as key)
    const entryUser = entry.createdBy || entry.username || user;
  
    // ✅ now lookup with both entry's user + draw + betType
    const rate =
      userRates[entryUser]?.[normalizedLabel]?.[betType] ??
      10;

    return sum + (entry.count || 0) * rate;
  }, 0);

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

  // Calculate winning using the same logic as WinningReportSummary.tsx
  const billsMap = {};

  // Log summary for verification
  const winningEntries = entries.filter(entry => entry.winAmount && entry.winAmount > 0);
  // console.log("📊 SUMMARY - Winning entries:", winningEntries.length, "| Total winAmount:", winningEntries.reduce((sum, e) => sum + e.winAmount, 0));

  entries.forEach(entry => {
    if (!entry.billNo) return;

    // 🔴 MUST SKIP non-winning entries
    if (!entry.winAmount || entry.winAmount <= 0) return;

    if (!billsMap[entry.billNo]) {
      billsMap[entry.billNo] = {
        billNo: entry.billNo,
        scheme: entry.scheme,
        winnings: []
      };
    }

    const betType = normalizeBetType(entry.type);

    billsMap[entry.billNo].winnings.push({
      type: betType,   // SUPER / BOX / A / B / C
      winType: entry.winType, // Now properly computed from backend
      winAmount: entry.winAmount,
      count: entry.count || 1
    });
  });

  let totalWinning = 0;
  let runningTotalPrize = 0;
  let runningTotalSuper = 0;

  Object.values(billsMap).forEach(bill => {
    let billPrize = 0;
    let billCommission = 0;

    bill.winnings.forEach(win => {
      const commission = calcSuperAmount(win, bill.scheme);
      billPrize += win.winAmount;
      billCommission += commission;
      runningTotalPrize += win.winAmount;
      runningTotalSuper += commission;

      // console.log(
      //   "🎯 WIN →",
      //   "Bill:", bill.billNo,
      //   "| Type:", win.type,
      //   "| WinAmount:", win.winAmount,
      //   "| WinTotal:", runningTotalPrize,
      //   "| CommissionTotal:", runningTotalSuper,
      //   "| Count:", win.count,
      //   "| Commission:", commission
      // );
    });

    // After finishing the bill, add to total
    totalWinning += billPrize + billCommission;

    // console.log(
    //   "🧾 BILL SUMMARY →",
    //   "BillNo:", bill.billNo,
    //   "| Prize:", billPrize,
    //   "| Commission:", billCommission,
    //   "| Total for bill:", billPrize + billCommission,
    //   "| Running totalWinning:", totalWinning
    // );
  });

  // console.log("🧾 Total Bills:", Object.keys(billsMap).length);
  // console.log("🎯 FINAL totalWinning:", totalWinning);

  // Calculate and log totals like WinningReportSummary
  let totalPrizeAll = 0;
  let totalSuperAll = 0;
  // console.log("📋 BILL BREAKDOWN:");
  Object.values(billsMap).forEach(bill => {
    let billPrize = 0;
    let billSuper = 0;
    bill.winnings.forEach(win => {
      const superAmt = calcSuperAmount(win, bill.scheme);
      billPrize += win.winAmount;
      billSuper += superAmt;
    });
    totalPrizeAll += billPrize;
    totalSuperAll += billSuper;
    // console.log(`  Bill ${bill.billNo}: Prize=₹${billPrize}, Commission=₹${billSuper}, Total=₹${billPrize + billSuper}`);
  });
  // console.log("📊 SUMMARY - Total Prize:", totalPrizeAll, "| Total Super:", totalSuperAll, "| Grand Total:", totalPrizeAll + totalSuperAll);

  // Check for any bills that might have zero winnings
  const zeroWinBills = Object.values(billsMap).filter(bill => bill.winnings.length === 0);
  if (zeroWinBills.length > 0) {
    // console.log("⚠️ Bills with no winnings:", zeroWinBills.map(b => b.billNo));
  }
  
  

// const totalAmount = totalPrize + totalSuper;
    
  // const totalWinning = entries.reduce((sum, e) => sum + (e.winAmount || 0), 0);

    return {
      user,
      totalEntries: entries.length,
      totalSales,
      totalWinning,
      netPay: totalSales - totalWinning,
    };
  });

  // Footer totals
  const footerTotals = {
    entries: userSummary.reduce((sum, u) => sum + u.totalEntries, 0),
    sales: userSummary.reduce((sum, u) => sum + u.totalSales, 0),
    winning: userSummary.reduce((sum, u) => sum + u.totalWinning, 0),
    netPay: userSummary.reduce((sum, u) => sum + u.netPay, 0),
  };

  // Total winning for confetti
  const totalWinningAmount = userSummary.reduce(
    (sum, u) => sum + u.totalWinning,
    0
  );

  const confettis = Array.from({ length: 15 }).map(() => ({
    top: useRef(new Animated.Value(-50)).current,
    left: Math.random() * width,
    emoji: emojiOptions[Math.floor(Math.random() * emojiOptions.length)],
  }));

  useEffect(() => {
    if (totalWinningAmount > 0) {
      confettis.forEach(({ top }, index) => {
        setTimeout(() => {
          Animated.timing(top, {
            toValue: height + 100,
            duration: 4000 + Math.random() * 2000,
            useNativeDriver: false,
          }).start();
        }, index * 200);
      });
    }
  }, [totalWinningAmount]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {fromAccountSummary ? "Account" : "User-wise"} Summary
      </Text>

      {/* User Filter */}
      {usernames.length > 1 && (
        <View style={[styles.filterBox, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>
            Filter by User:
          </Text>
          <Picker
            selectedValue={selectedUser}
            onValueChange={(value) => setSelectedUser(value)}
            style={styles.picker}
            dropdownIconColor={colors.text}
          >
            <Picker.Item label="All Users" value="All" color={colors.text} />
            {usernames.map((name) => (
              <Picker.Item
                key={name}
                label={name}
                value={name}
                color={colors.text}
              />
            ))}
          </Picker>
        </View>
      )}

      {/* Table */}
      <View>
        {/* Header */}
        <View style={styles.tableRow}>
          <View style={styles.cell}>
            <Text style={styles.cellText}>User</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.cellText}>Total Sales</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.cellText}>Winning</Text>
          </View>
          <View style={[styles.cell, styles.lastCell]}>
            <Text style={styles.cellText}>Net Pay</Text>
          </View>
        </View>

        {/* Rows */}
        {userSummary.map((user, index) => (
          <View
            key={index}
            style={[
              styles.tableRow,
              {
                backgroundColor:
                  index % 2 === 0 ? colors.card : colors.altRow,
                borderLeftColor:
                  user.totalWinning > 0
                    ? colors.winningBorder
                    : "transparent",
              },
            ]}
          >
            <View style={styles.cell}>
              <Text style={{ color: colors.text }}>{user.user}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={{ color: colors.text }}>{user.totalSales}</Text>
            </View>
            <View style={styles.cell}>
              <Text
                style={{
                  color:
                    user.totalWinning > 0
                      ? colors.positive
                      : colors.faded,
                }}
              >
                {user.totalWinning}
              </Text>
            </View>
            <View style={[styles.cell, styles.lastCell]}>
              <Text
                style={{
                  color:
                    user.netPay >= 0 ? colors.positive : colors.negative,
                }}
              >
                {user.netPay}
              </Text>
            </View>
          </View>
        ))}

        {/* Footer */}
        <View
          style={[
            styles.tableRow,
            {
              backgroundColor: colors.footer,
              borderTopWidth: 2,
              borderTopColor: colors.border,
            },
          ]}
        >
          <View style={styles.cell}>
            <Text style={{ color: colors.text }}>Total</Text>
          </View>
          <View style={styles.cell}>
            <Text style={{ color: colors.text }}>₹{footerTotals.sales}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={{ color: colors.text }}>₹{footerTotals.winning}</Text>
          </View>
          <View style={[styles.cell, styles.lastCell]}>
            <Text
              style={{
                color:
                  footerTotals.netPay >= 0
                    ? colors.positive
                    : colors.negative,
              }}
            >
              {footerTotals.netPay}
            </Text>
          </View>
        </View>
      </View>

      {/* Confetti */}
      {totalWinningAmount > 0 &&
        confettis.map((item, index) => (
          <Animated.Text
            key={index}
            style={[styles.confetti, { top: item.top, left: item.left }]}
          >
            {item.emoji}
          </Animated.Text>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 0,
  },
  filterBox: {
    marginHorizontal: 0,
    marginBottom: 0,
    padding: 2,
    borderRadius: 4,
  },
  filterLabel: {
    fontWeight: "600",
    marginBottom: 0,
    fontSize: 12,
  },
  picker: {
    height: 34,
    width: 120,
    margin: 0,
    padding: 0,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "black",
    backgroundColor: 'green'
  },
  cell: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: "black",
    justifyContent: "center",
    alignItems: "center",
    padding: 9,
  },
  lastCell: {
    borderRightWidth: 0,
  },
  cellText: {
    fontWeight: "500",
    fontSize: 14,
    textAlign: "center",
  },
  confetti: {
    position: "absolute",
    fontSize: 16,
    zIndex: 1000,
  },
});