import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

export default function SliderInput({ label, value, onChange, min = 0, max = 100 }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}: {value}
      </Text>

      <Slider
        style={{ width: '100%' }}
        minimumValue={min}
        maximumValue={max}
        step={1}
        value={value}
        onValueChange={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
  },
});
