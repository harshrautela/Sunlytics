import React, { useContext } from 'react';
import { View, Text, TextInput } from 'react-native';
import { AppContext } from '../context/AppContext';
import PrimaryButton from '../components/PrimaryButton';

export default function BillScreen({ navigation }) {
  const { monthlyBill, setMonthlyBill } = useContext(AppContext);

  return (
    <View style={{ padding: 20 }}>
      <Text>Monthly Electricity Bill</Text>

      <TextInput
        value={monthlyBill.toString()}
        onChangeText={v => setMonthlyBill(Number(v))}
        keyboardType="numeric"
        style={{ borderWidth: 1, padding: 10, marginTop: 10 }}
      />

      <PrimaryButton title="Calculate" onPress={() => navigation.navigate('Result')} />
    </View>
  );
}
