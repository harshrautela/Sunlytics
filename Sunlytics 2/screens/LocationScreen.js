import React, { useContext } from 'react';
import { View, Text, TextInput } from 'react-native';
import { AppContext } from '../context/AppContext';
import PrimaryButton from '../components/PrimaryButton';

export default function LocationScreen({ navigation }) {
  const { location, setLocation } = useContext(AppContext);

  return (
    <View style={{ padding: 20 }}>
      <Text>Enter City / Location</Text>

      <TextInput
        value={location}
        onChangeText={setLocation}
        style={{ borderWidth: 1, padding: 10, marginTop: 10 }}
      />

      <PrimaryButton title="Next" onPress={() => navigation.navigate('Bill')} />
    </View>
  );
}
