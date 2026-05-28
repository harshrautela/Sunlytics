import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { AppContext } from '../context/AppContext';
import panels from '../data/panels.json';
import { calculateSystemSize, calculatePanels } from '../utils/energy';
import Card from '../components/Card';

export default function ResultScreen() {
  const { dailyEnergyKwh } = useContext(AppContext);

  const systemKw = calculateSystemSize(dailyEnergyKwh);
  const panel = panels[0];
  const panelCount = calculatePanels(systemKw, panel.watt);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>
        Your Solar Potential
      </Text>

      <Card>
        <Text>Daily Energy: {dailyEnergyKwh.toFixed(2)} kWh</Text>
        <Text>System Size: {systemKw.toFixed(2)} kW</Text>
        <Text>Panels Required: {panelCount}</Text>
      </Card>
    </View>
  );
}
