import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

type User = {
  username: string;
  usertype: string;
};

type Props = {
  masterUsers: User[];
  subUsers: User[];
  selectedMaster: string;
  selectedSub: string;
  onChangeMaster: (value: string) => void;
  onChangeSub: (value: string) => void;
};

const UserPickerRow: React.FC<Props> = ({
  masterUsers,
  subUsers,
  selectedMaster,
  selectedSub,
  onChangeMaster,
  onChangeSub,
}) => {
  return (
    <View style={styles.row}>
      <View style={styles.pickerBox}>
        <Picker
          selectedValue={selectedMaster}
          onValueChange={onChangeMaster}
          style={styles.picker}
        >
          <Picker.Item label="Select Master" value="" />
          {masterUsers
            .filter((user) => user.usertype === 'master')
            .map((user) => (
              <Picker.Item key={user.username} label={user.username} value={user.username} />
            ))}
        </Picker>
      </View>

      <View style={styles.pickerBox}>
        <Picker
          selectedValue={selectedSub}
          onValueChange={onChangeSub}
          style={styles.picker}
        >
          <Picker.Item label="Select Sub" value="" />
          {subUsers
            .filter((user) => user.usertype === 'sub')
            .map((user) => (
              <Picker.Item key={user.username} label={user.username} value={user.username} />
            ))}
        </Picker>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  pickerBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  picker: {
    height: 40,
    width: '100%',
  },
});

export default UserPickerRow;
