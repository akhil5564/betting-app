// UserPickerRow.tsx
import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Domain } from "./NetPayScreen";

interface UserPickerRowProps {
  onUserChange?: (selectedUser: string | null) => void;
}

export default function UserPickerRow({ onUserChange }: UserPickerRowProps) {
  const [loggedInUser, setLoggedInUser] = useState<string>("");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedUser1, setSelectedUser1] = useState<string>("");
  const [selectedUser2, setSelectedUser2] = useState<string>("");
  const [selectedUser3, setSelectedUser3] = useState<string>("");

  const [usersLevel1, setUsersLevel1] = useState<any[]>([]);
  const [usersLevel2, setUsersLevel2] = useState<any[]>([]);
  const [usersLevel3, setUsersLevel3] = useState<any[]>([]);

useEffect(() => {
  const fetchUsers = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("username");
      if (!storedUser) return;

      setLoggedInUser(storedUser);
      setSelectedUser1(storedUser); // ✅ set as initial value

      const res = await fetch(`${Domain}/users`);
      const data = await res.json();
      setAllUsers(data);

      setUsersLevel1(data.filter((u) => u.createdBy === storedUser));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  fetchUsers();
}, []);


  useEffect(() => {
    if (selectedUser1) {
      setUsersLevel2(allUsers.filter((u) => u.createdBy === selectedUser1));
      setSelectedUser2("");
      setUsersLevel3([]);
      setSelectedUser3("");
    } else {
      setUsersLevel2([]);
      setSelectedUser2("");
      setUsersLevel3([]);
      setSelectedUser3("");
    }
  }, [selectedUser1, allUsers]);

  useEffect(() => {
    if (selectedUser2) {
      setUsersLevel3(allUsers.filter((u) => u.createdBy === selectedUser2));
      setSelectedUser3("");
    } else {
      setUsersLevel3([]);
      setSelectedUser3("");
    }
  }, [selectedUser2, allUsers]);

  // Compute final selected user by priority: level 3 > level 2 > level 1
  const selectedUserFinal =
    selectedUser3 || selectedUser2 || selectedUser1 || null;

  useEffect(() => {
    onUserChange?.(selectedUserFinal);
  }, [selectedUserFinal, onUserChange]);

  if (loading)
    return <ActivityIndicator size="large" style={{ marginTop: 20 }} />;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Level 1 Picker */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedUser1}
            onValueChange={(value) => setSelectedUser1(value)}
          >
            <Picker.Item label="Select user1" value="" />
            {usersLevel1.map((user) => (
              <Picker.Item
                key={user._id}
                label={user.username}
                value={user.username}
              />
            ))}
          </Picker>
        </View>

        {/* Level 2 Picker */}
        <View style={styles.pickerContainer}>
          <Picker
            enabled={usersLevel2.length > 0}
            selectedValue={selectedUser2}
            onValueChange={(value) => setSelectedUser2(value)}
          >
            <Picker.Item label="Select user2" value="" />
            {usersLevel2.map((user) => (
              <Picker.Item
                key={user._id}
                label={user.username}
                value={user.username}
              />
            ))}
          </Picker>
        </View>

        {/* Level 3 Picker */}
        <View style={styles.pickerContainer}>
          <Picker
            enabled={usersLevel3.length > 0}
            selectedValue={selectedUser3}
            onValueChange={(value) => setSelectedUser3(value)}
          >
            <Picker.Item label="Select user3" value="" />
            {usersLevel3.map((user) => (
              <Picker.Item
                key={user._id}
                label={user.username}
                value={user.username}
              />
            ))}
          </Picker>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 10 },
  row: { flexDirection: "row" },
  pickerContainer: {
    flex: 1,
    marginHorizontal: 1,
    justifyContent: "center",
    backgroundColor: "white",
    height: 35,
  },
});
