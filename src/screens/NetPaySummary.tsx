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
  } = route.params || {};

  const [selectedUser, setSelectedUser] = useState("All");
  const [rate, setRate] = useState<number>(10); // default until fetched

  // 🔹 Fetch rate from API dynamically
  useEffect(() => {
    const fetchRate = async () => {
      try {
        if (!loggedInUser?.id) {
          console.warn("No logged-in user ID provided for rate fetch");
          return;
        }

        const encodedDraw = encodeURIComponent(selectedTime);
        const url = `https://manu-netflix.onrender.com/rateMaster?user=${loggedInUser.id}&draw=${encodedDraw}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data?.rate) {
          setRate(Number(data.rate));
        } else {
          console.warn("API did not return a valid rate", data);
        }
      } catch (error) {
        console.error("Error fetching rate:", error);
      }
    };

    fetchRate();
  }, [loggedInUser?.id, selectedTime]);

  // Filter by date range
  const filteredByDateRange = matchedEntries.filter((entry: any) => {
    const entryDate = entry.createdAt
      ? entry.createdAt.split("T")[0]
      : entry.date;
    return entryDate >= fromDate && entryDate <= toDate;
  });

  // Extract usernames from entries
  const usernames = Array.from(
    new Set(filteredByDateRange.map((e) => e.username || e.createdBy))
  );

  // Determine users to include (selected + all sub-users)
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
    const totalCount = entries.reduce((sum, e) => sum + (e.count || 0), 0);
    const totalWinning = entries.reduce(
      (sum, e) => sum + (e.winAmount || 0),
      0
    );
    const totalSales = totalCount * rate; // 🔹 dynamic rate here
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
        User-wise Summary
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

      <ScrollView horizontal>
        <View>
          {/* Table Header */}
          <View style={[styles.tableRow, { backgroundColor: colors.header }]}>
            <Text style={[styles.cell, { width: 120, color: colors.text }]}>
              User
            </Text>
            <Text style={[styles.cell, { width: 120, color: colors.text }]}>
              Total Entries
            </Text>
            <Text style={[styles.cell, { width: 120, color: colors.text }]}>
              Total Sales
            </Text>
            <Text style={[styles.cell, { width: 120, color: colors.text }]}>
              Winning
            </Text>
            <Text style={[styles.cell, { width: 120, color: colors.text }]}>
              Net Pay
            </Text>
          </View>

          {/* Table Rows */}
          {userSummary.map((user, index) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                {
                  backgroundColor:
                    index % 2 === 0 ? colors.card : colors.altRow,
                  borderLeftWidth: user.totalWinning > 0 ? 4 : 0,
                  borderLeftColor:
                    user.totalWinning > 0 ? colors.winningBorder : "transparent",
                },
              ]}
            >
              <Text style={[styles.cell, { width: 120, color: colors.text }]}>
                {user.user}
              </Text>
              <Text style={[styles.cell, { width: 120, color: colors.text }]}>
                {user.totalEntries}
              </Text>
              <Text style={[styles.cell, { width: 120, color: colors.text }]}>
                ₹{user.totalSales}
              </Text>
              <Text
                style={[
                  styles.cell,
                  {
                    width: 120,
                    color:
                      user.totalWinning > 0 ? colors.positive : colors.faded,
                  },
                ]}
              >
                ₹{user.totalWinning}
              </Text>
              <Text
                style={[
                  styles.cell,
                  {
                    width: 120,
                    color:
                      user.netPay >= 0 ? colors.positive : colors.negative,
                  },
                ]}
              >
                ₹{user.netPay}
              </Text>
            </View>
          ))}

          {/* Footer Row */}
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
            <Text style={[styles.cell, { width: 120, color: colors.text }]}>
              Total
            </Text>
            <Text style={[styles.cell, { width: 120, color: colors.text }]}>
              {footerTotals.entries}
            </Text>
            <Text style={[styles.cell, { width: 120, color: colors.text }]}>
              ₹{footerTotals.sales}
            </Text>
            <Text style={[styles.cell, { width: 120, color: colors.text }]}>
              ₹{footerTotals.winning}
            </Text>
            <Text
              style={[
                styles.cell,
                {
                  width: 120,
                  color:
                    footerTotals.netPay >= 0
                      ? colors.positive
                      : colors.negative,
                },
              ]}
            >
              ₹{footerTotals.netPay}
            </Text>
          </View>
        </View>
      </ScrollView>

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
  container: { flex: 1, paddingTop: 10 },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  filterBox: {
    marginHorizontal: 8,
    marginBottom: 10,
    padding: 8,
    borderRadius: 8,
  },
  filterLabel: { fontWeight: "600", marginBottom: 4 },
  picker: { height: 50, width: 200, justifyContent: "center" },
  tableRow: { flexDirection: "row", paddingVertical: 12, paddingHorizontal: 4 },
  cell: {
    fontWeight: "600",
    fontSize: 14,
    paddingHorizontal: 4,
    textAlign: "right",
  },
  confetti: { position: "absolute", fontSize: 24, zIndex: 1000 },
});
