import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SliderInput from '../components/SliderInput';
import { AppContext } from '../context/AppContext';
import PrimaryButton from '../components/PrimaryButton';

export default function RoofScreen({ navigation }) {
  const { roofAreaSqFt, setRoofAreaSqFt } = useContext(AppContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Roof Area</Text>
      <Text style={styles.subtitle}>
        Select the usable roof area for solar panel installation
      </Text>

      <SliderInput
        label="Roof Area (sq ft)"
        value={roofAreaSqFt}
        onChange={setRoofAreaSqFt}
        min={0}
        max={2000}
      />

      <PrimaryButton
        title="Next"
        onPress={() => navigation.navigate('Location')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
});
