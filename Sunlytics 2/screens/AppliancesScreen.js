import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { AppContext } from '../context/AppContext';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';

export default function AppliancesScreen({ navigation }) {
  const { appliances, setAppliances } = useContext(AppContext);

  const addDemo = () => {
    setAppliances([
      { name: 'Refrigerator', watts: 150, qty: 1, hours: 24 },
      { name: 'AC', watts: 1200, qty: 1, hours: 5 },
      { name: 'LED Lights', watts: 10, qty: 10, hours: 6 }
    ]);
    navigation.navigate('Roof');
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>Daily Appliances</Text>

      {appliances.map((a, i) => (
        <Card key={i}>
          <Text>{a.name}</Text>
          <Text>{a.watts}W × {a.qty} × {a.hours}h</Text>
        </Card>
      ))}

      <PrimaryButton title="Add Demo & Continue" onPress={addDemo} />
    </View>
  );
}
