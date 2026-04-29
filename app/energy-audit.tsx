import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useAppContext } from '../src/hooks/useAppContext';
import { Appliance } from '../src/types';
import { DEFAULT_APPLIANCES } from '../src/constants/appliances';
import { buildEnergyAuditData } from '../src/utils/energyCalculations';
import { REGIONS } from '../src/constants/regions';
import ScreenHeader from '../src/components/ScreenHeader';
import StepIndicator from '../src/components/StepIndicator';

export default function EnergyAuditScreen() {
  const { setEnergyAudit, setRegion, state } = useAppContext();

  const [useManualBill, setUseManualBill] = useState(true);
  const [monthlyBill, setMonthlyBill] = useState('150');
  const [electricityRate, setElectricityRate] = useState(
    state.region?.averageElectricityRate.toString() || '0.16',
  );
  const [selectedCity, setSelectedCity] = useState(state.region?.city || 'Los Angeles');
  const [appliances, setAppliances] = useState<Appliance[]>(DEFAULT_APPLIANCES);
  const [showCityPicker, setShowCityPicker] = useState(false);

  const updateAppliance = (id: string, field: keyof Appliance, value: number) => {
    setAppliances((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    );
  };

  const handleNext = () => {
    const bill = parseFloat(monthlyBill);
    const rate = parseFloat(electricityRate);

    if (isNaN(bill) || bill <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid monthly electricity bill.');
      return;
    }
    if (isNaN(rate) || rate <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid electricity rate ($/kWh).');
      return;
    }

    const data = buildEnergyAuditData(useManualBill, bill, rate, appliances);
    setEnergyAudit(data);

    const region = REGIONS.find((r) => r.city === selectedCity) || REGIONS[1];
    setRegion(region);

    router.push('/rooftop-analysis');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Energy Audit"
        subtitle="Step 1 of 3"
        onBack={() => router.back()}
      />
      <StepIndicator currentStep={1} totalSteps={3} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Location */}
        <SectionCard title="📍 Your Location" subtitle="Affects solar irradiance calculations">
          <TouchableOpacity
            style={styles.citySelector}
            onPress={() => setShowCityPicker(!showCityPicker)}
          >
            <View style={styles.citySelectorLeft}>
              <Ionicons name="location" size={18} color="#F5A623" />
              <Text style={styles.citySelectorText}>{selectedCity}</Text>
            </View>
            <Ionicons
              name={showCityPicker ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#666"
            />
          </TouchableOpacity>
          {showCityPicker && (
            <View style={styles.cityList}>
              {REGIONS.map((r) => (
                <TouchableOpacity
                  key={r.city}
                  style={[styles.cityItem, r.city === selectedCity && styles.cityItemActive]}
                  onPress={() => {
                    setSelectedCity(r.city);
                    setElectricityRate(r.averageElectricityRate.toString());
                    setShowCityPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.cityItemText,
                      r.city === selectedCity && styles.cityItemTextActive,
                    ]}
                  >
                    {r.city}, {r.state}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </SectionCard>

        {/* Input Mode Toggle */}
        <SectionCard title="⚡ Energy Usage Method" subtitle="Choose how to specify your usage">
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, useManualBill && styles.toggleLabelActive]}>
              Monthly Bill
            </Text>
            <Switch
              value={!useManualBill}
              onValueChange={(v) => setUseManualBill(!v)}
              trackColor={{ false: '#F5A623', true: '#27AE60' }}
              thumbColor="#FFF"
            />
            <Text style={[styles.toggleLabel, !useManualBill && styles.toggleLabelActive]}>
              Appliance List
            </Text>
          </View>
        </SectionCard>

        {/* Bill Input */}
        {useManualBill && (
          <SectionCard title="💵 Monthly Electricity Bill" subtitle="Enter your average monthly bill">
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Monthly Bill ($)</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputPrefix}>$</Text>
                  <TextInput
                    style={styles.input}
                    value={monthlyBill}
                    onChangeText={setMonthlyBill}
                    keyboardType="decimal-pad"
                    placeholder="150"
                    placeholderTextColor="#AAA"
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Rate ($/kWh)</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputPrefix}>$</Text>
                  <TextInput
                    style={styles.input}
                    value={electricityRate}
                    onChangeText={setElectricityRate}
                    keyboardType="decimal-pad"
                    placeholder="0.16"
                    placeholderTextColor="#AAA"
                  />
                </View>
              </View>
            </View>
            {parseFloat(monthlyBill) > 0 && parseFloat(electricityRate) > 0 && (
              <View style={styles.estimateRow}>
                <Ionicons name="flash" size={14} color="#F5A623" />
                <Text style={styles.estimateText}>
                  ≈ {(parseFloat(monthlyBill) / parseFloat(electricityRate)).toFixed(0)} kWh/month
                  · {((parseFloat(monthlyBill) / parseFloat(electricityRate)) * 12).toFixed(0)} kWh/year
                </Text>
              </View>
            )}
          </SectionCard>
        )}

        {/* Appliance List */}
        {!useManualBill && (
          <SectionCard
            title="🏠 Appliance Usage"
            subtitle="Set quantity to 0 to exclude an appliance"
          >
            {appliances.map((appliance) => (
              <ApplianceRow
                key={appliance.id}
                appliance={appliance}
                onChangeQuantity={(q) => updateAppliance(appliance.id, 'quantity', q)}
                onChangeHours={(h) => updateAppliance(appliance.id, 'hoursPerDay', h)}
              />
            ))}
            <View style={styles.estimateRow}>
              <Ionicons name="flash" size={14} color="#F5A623" />
              <Text style={styles.estimateText}>
                Total:{' '}
                {appliances
                  .reduce(
                    (sum, a) => sum + (a.wattage * a.hoursPerDay * 30 * a.quantity) / 1000,
                    0,
                  )
                  .toFixed(0)}{' '}
                kWh/month
              </Text>
            </View>
          </SectionCard>
        )}

        {/* Next Button */}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.nextButtonText}>Next: Rooftop Analysis</Text>
          <Ionicons name="arrow-forward" size={20} color="#1A1A2E" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function ApplianceRow({
  appliance,
  onChangeQuantity,
  onChangeHours,
}: {
  appliance: Appliance;
  onChangeQuantity: (q: number) => void;
  onChangeHours: (h: number) => void;
}) {
  const monthlyKwh = (appliance.wattage * appliance.hoursPerDay * 30 * appliance.quantity) / 1000;

  return (
    <View style={styles.applianceRow}>
      <View style={styles.applianceInfo}>
        <Text style={styles.applianceName}>{appliance.name}</Text>
        <Text style={styles.applianceWatts}>{appliance.wattage}W · {monthlyKwh.toFixed(1)} kWh/mo</Text>
      </View>
      <View style={styles.applianceControls}>
        <View style={styles.counterGroup}>
          <Text style={styles.controlLabel}>Qty</Text>
          <View style={styles.counter}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => onChangeQuantity(Math.max(0, appliance.quantity - 1))}
            >
              <Text style={styles.counterBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.counterValue}>{appliance.quantity}</Text>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => onChangeQuantity(appliance.quantity + 1)}
            >
              <Text style={styles.counterBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.counterGroup}>
          <Text style={styles.controlLabel}>Hrs/Day</Text>
          <View style={styles.counter}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => onChangeHours(Math.max(0.5, parseFloat((appliance.hoursPerDay - 0.5).toFixed(1))))}
            >
              <Text style={styles.counterBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.counterValue}>{appliance.hoursPerDay}</Text>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => onChangeHours(Math.min(24, parseFloat((appliance.hoursPerDay + 0.5).toFixed(1))))}
            >
              <Text style={styles.counterBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 2 },
  cardSubtitle: { fontSize: 12, color: '#888', marginBottom: 12 },
  cardBody: {},

  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  citySelectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  citySelectorText: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  cityList: {
    marginTop: 8,
    maxHeight: 220,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    overflow: 'hidden',
  },
  cityItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  cityItemActive: { backgroundColor: 'rgba(245,166,35,0.1)' },
  cityItemText: { fontSize: 14, color: '#444' },
  cityItemTextActive: { color: '#E08800', fontWeight: '700' },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  toggleLabel: { fontSize: 14, color: '#AAA', fontWeight: '500' },
  toggleLabelActive: { color: '#1A1A2E', fontWeight: '700' },

  inputRow: { flexDirection: 'row' },
  inputGroup: {},
  inputLabel: { fontSize: 12, color: '#888', marginBottom: 6, fontWeight: '500' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: 12,
    height: 46,
  },
  inputPrefix: { fontSize: 15, color: '#888', marginRight: 4 },
  input: { flex: 1, fontSize: 16, color: '#1A1A2E', fontWeight: '600' },
  estimateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  estimateText: { fontSize: 13, color: '#666' },

  applianceRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  applianceInfo: { marginBottom: 8 },
  applianceName: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  applianceWatts: { fontSize: 12, color: '#888', marginTop: 2 },
  applianceControls: { flexDirection: 'row', gap: 16 },
  counterGroup: { alignItems: 'center' },
  controlLabel: { fontSize: 11, color: '#888', marginBottom: 4, fontWeight: '600' },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    overflow: 'hidden',
  },
  counterBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
  },
  counterBtnText: { fontSize: 18, fontWeight: '600', color: '#444' },
  counterValue: {
    width: 36,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
  },

  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5A623',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
    marginTop: 8,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  nextButtonText: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
});
