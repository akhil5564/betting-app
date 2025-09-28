import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Domain } from './NetPayScreen';
import { useRoute } from '@react-navigation/native';

const BlockNumbersScreen = () => {
  const [blockType, setBlockType] = useState<'single' | 'series' | 'group'>('single');
  const [singleNumber, setSingleNumber] = useState('');
  const [seriesStart, setSeriesStart] = useState('');
  const [seriesEnd, setSeriesEnd] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<'group1' | 'group2' | 'group3'>('group1');
  const [selectedTime, setSelectedTime] = useState('All');
  const route = useRoute();

  const selectedUser = (route.params as any)?.user;

  // Inputs for groups
  const [groupInputs, setGroupInputs] = useState({
    A: '',
    B: '',
    C: '',
    AB: '',
    BC: '',
    AC: '',
    SUPER: '',
    BOX: '',
  });

  // Count fields for each input
  const [groupCounts, setGroupCounts] = useState({
    A: '',
    B: '',
    C: '',
    AB: '',
    BC: '',
    AC: '',
    SUPER: '',
    BOX: '',
  });

  // State to track validation errors
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Loading state for API call
  const [isLoading, setIsLoading] = useState(false);
  
  // State to store existing blocked numbers
  const [blockedNumbers, setBlockedNumbers] = useState<any[]>([]);
  const [isLoadingBlocked, setIsLoadingBlocked] = useState(false);

  // Load blocked numbers when component mounts
  useEffect(() => {
    getBlockedNumbers();
  }, [selectedUser,selectedTime,selectedGroup]);

  // Function to get blocked numbers by user and draw time
  const getBlockedNumbersByUserAndTime = async (user: string, drawTime: string) => {
    try {
      setIsLoadingBlocked(true);
      
      const response = await fetch(`${Domain}/block-numbers/${user}/${drawTime}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Blocked numbers by user and time:', result);
      
      if (result.success) {
        return result.data || [];
      } else {
        console.error('Error retrieving blocked numbers:', result.message);
        return [];
      }
      
    } catch (error) {
      console.error('Error retrieving blocked numbers by user and time:', error);
      return [];
    } finally {
      setIsLoadingBlocked(false);
    }
  };

  const handleInputChange = (field: string, value: string, maxLen: number) => {
    if (value.length <= maxLen) {
      setGroupInputs((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleCountChange = (field: string, value: string) => {
    // Allow empty string or numeric values up to 999
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) <= 999)) {
      setGroupCounts((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Helper function to check if a field requires count
  const isCountRequired = (field: string) => {
    const inputValue = groupInputs[field as keyof typeof groupInputs];
    return inputValue && inputValue.trim() !== '';
  };

  // Helper function to check if input field is required (when count has value)
  const isInputRequired = (field: string) => {
    const countValue = groupCounts[field as keyof typeof groupCounts];
    return countValue && countValue.trim() !== '';
  };

  // Validation function to check both directions
  const validateFields = () => {
    const errors: string[] = [];
    let hasAnyValues = false;
    
    // Check each field - bidirectional validation
    Object.keys(groupInputs).forEach(field => {
      const inputValue = groupInputs[field as keyof typeof groupInputs];
      const countValue = groupCounts[field as keyof typeof groupCounts];
      
      // Check if this field pair has any values
      if ((inputValue && inputValue.trim() !== '') || (countValue && countValue.trim() !== '')) {
        hasAnyValues = true;
      }
      
      // If input has value, count must also have value
      if (inputValue && inputValue.trim() !== '' && (!countValue || countValue.trim() === '')) {
        errors.push(`${field} field requires a count value`);
      }
      
      // If count has value, input must also have value
      if (countValue && countValue.trim() !== '' && (!inputValue || inputValue.trim() === '')) {
        errors.push(`${field} count field requires an input value`);
      }
    });
    
    // Check if no fields have any values
    if (!hasAnyValues) {
      errors.push('Please enter at least one field value');
    }
    
    setValidationErrors(errors);
    return errors;
  };

  // API call function to get existing blocked numbers by user
  const getBlockedNumbers = async () => {
    try {
      setIsLoadingBlocked(true);
      
      // Get current user (replace with actual user from context/auth)
      const currentUser = selectedUser.username
      
      // API endpoint for getting blocked numbers by user
      // The fetch call is incorrect: fetch takes the URL as the first argument, and an options object as the second argument.
      // The original code is passing method and headers as separate arguments, which is invalid.
      // The correct usage is:
      const response = await fetch(
        `${Domain}/block-numbers?createdBy=${currentUser}&isActive=true&drawTime=${encodeURIComponent(selectedTime)}&group=${encodeURIComponent(selectedGroup)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Add any authentication headers if needed
            // 'Authorization': 'Bearer YOUR_TOKEN',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Blocked numbers retrieved successfully:', result);
      
      // Update state with retrieved data
      if (result.success) {
        setBlockedNumbers(result.data || []);
      } else {
        console.error('Error retrieving blocked numbers:', result.message);
        setBlockedNumbers([]);
      }
      
    } catch (error) {
      console.error('Error retrieving blocked numbers:', error);
      alert('Failed to retrieve blocked numbers. Please try again.');
      setBlockedNumbers([]);
    } finally {
      setIsLoadingBlocked(false);
    }
  };

  // API call function to submit block number data
  const submitBlockNumbers = async (formData: any) => {
    try {
      setIsLoading(true);
      
      // API endpoint for adding blocked numbers
      const response = await fetch(`${Domain}/block-numbers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add any authentication headers if needed
          // 'Authorization': 'Bearer YOUR_TOKEN',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Block numbers API response:', result);
      
      if (result.success) {
        alert('Block numbers submitted successfully!');
        // Reset form after successful submission
        resetForm();
        console.log('Block numbers submitted successfully:', result);
        // Refresh the blocked numbers list
        await getBlockedNumbers();
      } else {
        alert(result.message || 'Failed to submit block numbers');
      }
      
    } catch (error) {
      console.error('Error submitting block numbers:', error);
      alert('Failed to submit block numbers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to reset form after successful submission
  const resetForm = () => {
    setGroupInputs({
      A: '',
      B: '',
      C: '',
      AB: '',
      BC: '',
      AC: '',
      SUPER: '',
      BOX: '',
    });
    setGroupCounts({
      A: '',
      B: '',
      C: '',
      AB: '',
      BC: '',
      AC: '',
      SUPER: '',
      BOX: '',
    });
    setValidationErrors([]);
  };

  // Function to prepare form data for API submission
  const prepareFormData = () => {
    const blockData: any[] = [];
    
    // Collect all field pairs that have values
    Object.keys(groupInputs).forEach(field => {
      const inputValue = groupInputs[field as keyof typeof groupInputs];
      const countValue = groupCounts[field as keyof typeof groupCounts];
      
      if (inputValue && inputValue.trim() !== '' && countValue && countValue.trim() !== '') {
        blockData.push({
          field: field,
          number: inputValue.trim(),
          count: parseInt(countValue.trim()),
          group: selectedGroup,
          drawTime: selectedTime,
        });
      }
    });

    return {
      blockData: blockData,
      selectedGroup: selectedGroup,
      drawTime: selectedTime,
      createdBy:selectedUser.username, // Replace with actual user from context/auth
      timestamp: new Date().toISOString(),
    };
  };

  const handleSubmit = async () => {
    const errors = validateFields();
    
    if (errors.length > 0) {
      // Show alert with validation errors
      alert('Please fill required fields:\n' + errors.join('\n'));
      return;
    }
    
    // Prepare form data
    const formData = prepareFormData();
    
    // Submit to API
    await submitBlockNumbers(formData);
  };



  const [editVisible, setEditVisible] = useState(false);
const [editItem, setEditItem] = useState<any | null>(null);
console.log("ssssssssssss",editItem);

const [editForm, setEditForm] = useState({ number: '', count: '' });
const [deletingId, setDeletingId] = useState<string | null>(null);

// Open edit
const startEdit = (item: any) => {
  setEditItem(item);
  setEditForm({ number: String(item.number || ''), count: String(item.count || '') });
  setEditVisible(true);
};

// Save edit
const saveEdit = async () => {
  if (!editItem) return;
  try {
    const payload = {
      number: editForm.number.trim(),
      count: parseInt(editForm.count || '0', 10),
    };
    if (!payload.number || !payload.count || isNaN(payload.count) || payload.count <= 0) {
      alert('Enter valid number and count'); return;
    }
    const res = await fetch(`${Domain}/block-numbers/${editItem._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      alert(result.message || 'Update failed'); return;
    }
    setEditVisible(false);
    setEditItem(null);
    await getBlockedNumbers();
  } catch (e) {
    alert('Update failed'); 
  }
};

// Delete
const deleteBlocked = async (id: string) => {
  try {
    setDeletingId(id);
    const res = await fetch(`${Domain}/block-numbers/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (!res.ok || !result.success) {
      alert(result.message || 'Delete failed');
    } else {
      await getBlockedNumbers();
    }
  } catch (e) {
    alert('Delete failed');
  } finally {
    setDeletingId(null);
  }
};

// Confirm delete wrapper
const confirmDelete = (id: string) => {
  Alert.alert(
    'Delete Blocked Number',
    'Are you sure you want to delete this blocked number?',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteBlocked(id) },
    ]
  );
};

const getMaxLengthForGroup = () => {
  if (!editItem) return 3;
  switch (editItem.group) {
    case 'group1':
      return 1;
    case 'group2':
      return 2;
    case 'group3':
      return 3;
    default:
      return 3;
  }
};
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>Block Numbers</Text>

        {/* Existing Blocked Numbers Section */}
  

        {/* Block Type Selection */}
        <View style={styles.blockTypeRow}>
          {/* <TouchableOpacity
            style={[styles.blockTypeBtn, blockType === 'single' && styles.activeBtn]}
            onPress={() => setBlockType('single')}
          >
            <Text style={styles.blockTypeText}>Single Number</Text>
          </TouchableOpacity> */}
          {/* <TouchableOpacity
            style={[styles.blockTypeBtn, blockType === 'series' && styles.activeBtn]}
            onPress={() => setBlockType('series')}
          >
            <Text style={styles.blockTypeText}>Block Series</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.blockTypeBtn, blockType === 'group' && styles.activeBtn]}
            onPress={() => setBlockType('group')}
          >
            <Text style={styles.blockTypeText}>Whole Group</Text>
          </TouchableOpacity> */}
        </View>

        {/* Single Number */}
        {/* {blockType === 'single' && (
          <TextInput
            style={styles.input}
            placeholder="Enter single number"
            value={singleNumber}
            onChangeText={setSingleNumber}
            keyboardType="numeric"
          />
        )} */}

        {/* Series */}
        {blockType === 'series' && (
          <View style={styles.seriesRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 5 }]}
              placeholder="Start"
              value={seriesStart}
              onChangeText={setSeriesStart}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, { flex: 1, marginLeft: 5 }]}
              placeholder="End"
              value={seriesEnd}
              onChangeText={setSeriesEnd}
              keyboardType="numeric"
            />
          </View>
        )}

        {/* Radio Buttons for Group Selection (only for single/series) */}
        {(blockType === 'single' || blockType === 'series') && (
          <View style={styles.groupWrapper}>
            {['group1', 'group2', 'group3'].map((grp) => (
              <TouchableOpacity
                key={grp}
                style={styles.radioRow}
                onPress={() => setSelectedGroup(grp as any)}
              >
                <View style={[styles.radioCircle, selectedGroup === grp && styles.radioSelected]} />
                <Text style={styles.radioText}>{grp.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Inputs for selected group */}
        {selectedGroup === 'group1' && (
          <View>
            <View style={styles.inputRow}>
            <TextInput
                style={[
                  styles.input, 
                  { flex: 1, marginRight: 8 },
                  isInputRequired('A') && (!groupInputs.A || groupInputs.A.trim() === '') && styles.requiredField
                ]}
                placeholder={isInputRequired('A') ? "A *" : "A"}
              value={groupInputs.A}
              onChangeText={(val) => handleInputChange('A', val, 1)}
              keyboardType="numeric"
            />
            <TextInput
                style={[
                  styles.input, 
                  { flex: 1, marginLeft: 8 },
                  isCountRequired('A') && (!groupCounts.A || groupCounts.A.trim() === '') && styles.requiredField
                ]}
                placeholder={isCountRequired('A') ? "Count *" : "Count"}
                value={groupCounts.A}
                onChangeText={(val) => handleCountChange('A', val)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.input, 
                  { flex: 1, marginRight: 8 },
                  isInputRequired('B') && (!groupInputs.B || groupInputs.B.trim() === '') && styles.requiredField
                ]}
                placeholder={isInputRequired('B') ? "B *" : "B"}
              value={groupInputs.B}
              onChangeText={(val) => handleInputChange('B', val, 1)}
              keyboardType="numeric"
            />
            <TextInput
                style={[
                  styles.input, 
                  { flex: 1, marginLeft: 8 },
                  isCountRequired('B') && (!groupCounts.B || groupCounts.B.trim() === '') && styles.requiredField
                ]}
                placeholder={isCountRequired('B') ? "Count *" : "Count"}
                value={groupCounts.B}
                onChangeText={(val) => handleCountChange('B', val)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.input, 
                  { flex: 1, marginRight: 8 },
                  isInputRequired('C') && (!groupInputs.C || groupInputs.C.trim() === '') && styles.requiredField
                ]}
                placeholder={isInputRequired('C') ? "C *" : "C"}
              value={groupInputs.C}
              onChangeText={(val) => handleInputChange('C', val, 1)}
              keyboardType="numeric"
            />
              <TextInput
                style={[
                  styles.input, 
                  { flex: 1, marginLeft: 8 },
                  isCountRequired('C') && (!groupCounts.C || groupCounts.C.trim() === '') && styles.requiredField
                ]}
                placeholder={isCountRequired('C') ? "Count *" : "Count"}
                value={groupCounts.C}
                onChangeText={(val) => handleCountChange('C', val)}
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        {selectedGroup === 'group2' && (
          <View>
            <View style={styles.inputRow}>
            <TextInput
                style={[
                  styles.input, 
                  { flex: 1, marginRight: 8 },
                  isInputRequired('AB') && (!groupInputs.AB || groupInputs.AB.trim() === '') && styles.requiredField
                ]}
                placeholder={isInputRequired('AB') ? "AB *" : "AB"}
              value={groupInputs.AB}
              onChangeText={(val) => handleInputChange('AB', val, 2)}
              keyboardType="numeric"
            />
            <TextInput
                style={[
                  styles.input, 
                  { flex: 1, marginLeft: 8 },
                  isCountRequired('AB') && (!groupCounts.AB || groupCounts.AB.trim() === '') && styles.requiredField
                ]}
                placeholder={isCountRequired('AB') ? "Count *" : "Count"}
                value={groupCounts.AB}
                onChangeText={(val) => handleCountChange('AB', val)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.input, 
                  { flex: 1, marginRight: 8 },
                  isInputRequired('BC') && (!groupInputs.BC || groupInputs.BC.trim() === '') && styles.requiredField
                ]}
                placeholder={isInputRequired('BC') ? "BC *" : "BC"}
              value={groupInputs.BC}
              onChangeText={(val) => handleInputChange('BC', val, 2)}
              keyboardType="numeric"
            />
            <TextInput
                style={[
                  styles.input, 
                  { flex: 1, marginLeft: 8 },
                  isCountRequired('BC') && (!groupCounts.BC || groupCounts.BC.trim() === '') && styles.requiredField
                ]}
                placeholder={isCountRequired('BC') ? "Count *" : "Count"}
                value={groupCounts.BC}
                onChangeText={(val) => handleCountChange('BC', val)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.input, 
                  { flex: 1, marginRight: 8 },
                  isInputRequired('AC') && (!groupInputs.AC || groupInputs.AC.trim() === '') && styles.requiredField
                ]}
                placeholder={isInputRequired('AC') ? "AC *" : "AC"}
              value={groupInputs.AC}
              onChangeText={(val) => handleInputChange('AC', val, 2)}
              keyboardType="numeric"
            />
              <TextInput
                style={[
                  styles.input, 
                  { flex: 1, marginLeft: 8 },
                  isCountRequired('AC') && (!groupCounts.AC || groupCounts.AC.trim() === '') && styles.requiredField
                ]}
                placeholder={isCountRequired('AC') ? "Count *" : "Count"}
                value={groupCounts.AC}
                onChangeText={(val) => handleCountChange('AC', val)}
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        {selectedGroup === 'group3' && (
          <View>
            <View style={styles.inputRow}>
            <TextInput
                style={[
                  styles.input, 
                  { flex: 1, marginRight: 8 },
                  isInputRequired('SUPER') && (!groupInputs.SUPER || groupInputs.SUPER.trim() === '') && styles.requiredField
                ]}
                placeholder={isInputRequired('SUPER') ? "SUPER *" : "SUPER"}
              value={groupInputs.SUPER}
              onChangeText={(val) => handleInputChange('SUPER', val, 3)}
              keyboardType="numeric"
            />
            <TextInput
                style={[
                  styles.input, 
                  { flex: 1, marginLeft: 8 },
                  isCountRequired('SUPER') && (!groupCounts.SUPER || groupCounts.SUPER.trim() === '') && styles.requiredField
                ]}
                placeholder={isCountRequired('SUPER') ? "Count *" : "Count"}
                value={groupCounts.SUPER}
                onChangeText={(val) => handleCountChange('SUPER', val)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.input, 
                  { flex: 1, marginRight: 8 },
                  isInputRequired('BOX') && (!groupInputs.BOX || groupInputs.BOX.trim() === '') && styles.requiredField
                ]}
                placeholder={isInputRequired('BOX') ? "BOX *" : "BOX"}
              value={groupInputs.BOX}
              onChangeText={(val) => handleInputChange('BOX', val, 3)}
              keyboardType="numeric"
            />
              <TextInput
                style={[
                  styles.input, 
                  { flex: 1, marginLeft: 8 },
                  isCountRequired('BOX') && (!groupCounts.BOX || groupCounts.BOX.trim() === '') && styles.requiredField
                ]}
                placeholder={isCountRequired('BOX') ? "Count *" : "Count"}
                value={groupCounts.BOX}
                onChangeText={(val) => handleCountChange('BOX', val)}
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        {/* Draw Time Selection */}
        <Text style={styles.label}>Select Draw Time</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedTime}
            onValueChange={setSelectedTime}
            style={styles.picker}
          >
            <Picker.Item label="All" value="All" />
            <Picker.Item label="DEAR 1 PM" value="DEAR 1 PM" />
            <Picker.Item label="KERALA 3 PM" value="KERALA 3 PM" />
            <Picker.Item label="DEAR 6 PM" value="DEAR 6 PM" />
            <Picker.Item label="DEAR 8 PM" value="DEAR 8 PM" />
          </Picker>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Submitting...' : 'Block Number(s)'}
          </Text>
        </TouchableOpacity>
        {/* Existing Blocked Numbers Section */}
<View style={[styles.blockedNumbersSection, { marginTop: 24 }]}>
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>Currently Blocked Numbers</Text>
    <View style={styles.headerButtons}>
      {/* <TouchableOpacity
        style={styles.filterButton}
        onPress={() => {
          const currentUser = selectedUser.username
          getBlockedNumbersByUserAndTime(currentUser, selectedTime).then(setBlockedNumbers);
        }}
        disabled={isLoadingBlocked}
      >
        <Text style={styles.filterButtonText}>Filter by Time</Text>
      </TouchableOpacity> */}
      {/* <TouchableOpacity
        style={styles.refreshButton}
        onPress={getBlockedNumbers}
        disabled={isLoadingBlocked}
      >
        <Text style={styles.refreshButtonText}>
          {isLoadingBlocked ? 'Loading...' : 'Refresh'}
        </Text>
      </TouchableOpacity> */}
    </View>
  </View>

  {isLoadingBlocked ? (
    <Text style={styles.loadingText}>Loading blocked numbers...</Text>
  ) : blockedNumbers.length === 0 ? (
    <Text style={styles.noDataText}>No blocked numbers found</Text>
  ) : (
    <View style={styles.tableWrapper}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={[styles.th, { flex: 0.7 }]}>Field</Text>
        <Text style={[styles.th, { flex: 1 }]}>Number</Text>
        <Text style={[styles.th, { flex: 0.8 }]}>Count</Text>
        <Text style={[styles.th, { flex: 1 }]}>Group</Text>
        <Text style={[styles.th, { flex: 1.1 }]}>Time</Text>
        <Text style={[styles.th, { flex: 1.2, textAlign: 'right' }]}>Actions</Text>
      </View>

      {blockedNumbers.map((item: any) => (
        <View key={item._id} style={styles.tableRow}>
          <Text style={[styles.td, { flex: 0.7 }]}>{item.field}</Text>
          <Text style={[styles.td, { flex: 1 }]}>{item.number}</Text>
          <Text style={[styles.td, { flex: 0.8 }]}>{item.count}</Text>
          <Text style={[styles.td, { flex: 1 }]}>{item.group}</Text>
          <Text style={[styles.td, { flex: 1.1 }]}>{item.drawTime}</Text>
          <View style={[styles.td, { flex: 1.2, alignItems: 'flex-end' }]}>
            <View style={styles.rowActions}>
              <TouchableOpacity style={[styles.iconButton, styles.btnEdit]} onPress={() => startEdit(item)}>
                <Text style={styles.iconText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, styles.btnDelete]}
                onPress={() => confirmDelete(item._id)}
                disabled={deletingId === item._id}
              >
                <Text style={styles.iconText}>{deletingId === item._id ? '…' : '🗑️'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </View>
  )}
</View>

{/* Edit Modal */}
{editVisible && (
  <View style={styles.modalOverlay}>
    <View style={styles.modalCard}>
      <Text style={styles.modalTitle}>Edit Blocked Number</Text>
      <TextInput      
        style={styles.input}
        placeholder={editItem.field}
        value={editForm.number}
        onChangeText={(v) => {
          const maxLen = getMaxLengthForGroup();
          if (v.length <= maxLen && /^\d*$/.test(v)) {
            setEditForm((p) => ({ ...p, number: v }));
          }
        }}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Count"
        value={editForm.count}
        onChangeText={(v) => {
          if (/^\d*$/.test(v)) setEditForm((p) => ({ ...p, count: v }));
        }}
        keyboardType="numeric"
      />
      <View style={styles.modalActions}>
        <TouchableOpacity style={styles.btnCancel} onPress={() => { setEditVisible(false); setEditItem(null); }}>
          <Text style={styles.btnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSave} onPress={saveEdit}>
          <Text style={styles.btnText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
)}
      </ScrollView>
    </SafeAreaView>
  );
};

export default BlockNumbersScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4', marginTop: 30 },
  body: { padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  blockTypeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  blockTypeBtn: {
    flex: 1,
    padding: 12,
    backgroundColor: '#ddd',
    marginHorizontal: 5,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeBtn: { backgroundColor: '#f92659' },
  blockTypeText: { color: '#000', fontWeight: 'bold' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
  },
  seriesRow: { flexDirection: 'row', marginBottom: 16 },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 16,
  },
  picker: { height: 50, width: '100%' },
  label: { fontSize: 14, marginBottom: 4 },
  button: {
    backgroundColor: '#f92659',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  groupWrapper: { marginBottom: 16 },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#f92659',
    marginRight: 8,
  },
  radioSelected: { backgroundColor: '#f92659' },
  radioText: { fontSize: 14, fontWeight: '600' },
  inputRow: { flexDirection: 'row', marginBottom: 12 },
  requiredField: { borderColor: '#ff4444', borderWidth: 2 },
  blockedNumbersSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    backgroundColor: '#f92659',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  blockedNumbersList: {
    maxHeight: 200,
  },
  blockedNumberItem: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f92659',
  },
  blockedNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  blockedNumberDetails: {
    fontSize: 12,
    color: '#666',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
  },
  tableWrapper: {
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableHeader: {
    backgroundColor: '#f7f7f7',
  },
  th: {
    fontWeight: '700',
    color: '#333',
    fontSize: 12,
  },
  td: {
    color: '#333',
    fontSize: 12,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  btnEdit: {
    // backgroundColor: '#007bff',
    borderRadius: 6,
    marginRight: 8,
  },
  btnDelete: {
    // backgroundColor: '#e53935',
    borderRadius: 6,
  },
  iconButton: {
    width: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#fff',
    fontSize: 16,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  
  // Modal
  modalOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '86%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
  },
  modalTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 12,
  },
  modalActions: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  btnCancel: {
    backgroundColor: '#9e9e9e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  btnSave: {
    backgroundColor: '#28a745',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
});
