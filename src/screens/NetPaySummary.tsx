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
  const totalSales = entries.reduce((sum, entry) => {
    const betType = extractBetType(entry.type);
  
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
  
  const totalWinning = entries.reduce((sum, e) => sum + (e.winAmount || 0), 0);

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