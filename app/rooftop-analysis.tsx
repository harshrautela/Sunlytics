import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useAppContext } from '../src/hooks/useAppContext';
import { RoofOrientation } from '../src/types';
import ScreenHeader from '../src/components/ScreenHeader';
import StepIndicator from '../src/components/StepIndicator';

const ORIENTATIONS: { value: RoofOrientation; label: string; icon: string; efficiency: number }[] = [
  { value: 'south', label: 'South', icon: 'arrow-down', efficiency: 100 },
  { value: 'west', label: 'West', icon: 'arrow-back', efficiency: 88 },
  { value: 'east', label: 'East', icon: 'arrow-forward', efficiency: 88 },
  { value: 'flat', label: 'Flat', icon: 'remove', efficiency: 90 },
  { value: 'north', label: 'North', icon: 'arrow-up', efficiency: 65 },
];

const ROOF_TYPES = [
  { value: 'asphalt', label: 'Asphalt Shingle', note: 'Most common, easiest installation' },
  { value: 'tile', label: 'Tile / Clay', note: '+15-30% installation cost' },
  { value: 'metal', label: 'Metal', note: 'Excellent for clamp mounts' },
  { value: 'flat', label: 'Flat / TPO / EPDM', note: 'Requires ballasted racking' },
];

export default function RooftopAnalysisScreen() {
  const { setRooftopData } = useAppContext();

  const [totalArea, setTotalArea] = useState('1200');
  const [orientation, setOrientation] = useState<RoofOrientation>('south');
  const [tiltAngle, setTiltAngle] = useState(30);
  const [shadingPercentage, setShadingPercentage] = useState(10);
  const [roofType, setRoofType] = useState<'asphalt' | 'tile' | 'metal' | 'flat'>('asphalt');

  const usableArea = Math.round(parseFloat(totalArea || '0') * 0.7); // 70% usable after setbacks

  const handleNext = () => {
    const area = parseFloat(totalArea);
    if (isNaN(area) || area < 50) {
      Alert.alert('Invalid Input', 'Please enter a valid roof area (minimum 50 sq ft).');
      return;
    }

    setRooftopData({
      totalArea: area,
      usableArea,
      orientation,
      tiltAngle,
      shadingPercentage,
      roofType,
    });

    router.push('/analyzing');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Rooftop Analysis"
        subtitle="Step 2 of 3"
        onBack={() => router.back()}
      />
      <StepIndicator currentStep={2} totalSteps={3} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Roof Area */}
        <SectionCard title="📐 Roof Area" subtitle="Enter your approximate total roof area">
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Total Roof Area (sq ft)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={totalArea}
                onChangeText={setTotalArea}
                keyboardType="decimal-pad"
                placeholder="1200"
                placeholderTextColor="#AAA"
              />
              <Text style={styles.inputSuffix}>sq ft</Text>
            </View>
          </View>
          {parseFloat(totalArea) > 0 && (
            <View style={styles.infoRow}>
              <InfoItem
                icon="checkmark-circle"
                color="#27AE60"
                label="Usable Area"
                value={`~${usableArea} sq ft`}
              />
              <InfoItem
                icon="information-circle"
                color="#F5A623"
                label="Setback Buffer"
                value="~30%"
              />
            </View>
          )}
        </SectionCard>

        {/* Orientation */}
        <SectionCard title="🧭 Roof Orientation" subtitle="Direction your main roof faces">
          <View style={styles.orientationGrid}>
            {ORIENTATIONS.map((o) => (
              <TouchableOpacity
                key={o.value}
                style={[
                  styles.orientationCard,
                  orientation === o.value && styles.orientationCardActive,
                ]}
                onPress={() => setOrientation(o.value)}
              >
                <Ionicons
                  name={o.icon as any}
                  size={20}
                  color={orientation === o.value ? '#F5A623' : '#888'}
                />
                <Text
                  style={[
                    styles.orientationLabel,
                    orientation === o.value && styles.orientationLabelActive,
                  ]}
                >
                  {o.label}
                </Text>
                <Text style={styles.orientationEfficiency}>{o.efficiency}%</Text>
              </TouchableOpacity>
            ))}
          </View>
          {orientation === 'north' && (
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={16} color="#E74C3C" />
              <Text style={styles.warningText}>
                North-facing roofs have significantly reduced solar production. South-facing is
                strongly recommended.
              </Text>
            </View>
          )}
        </SectionCard>

        {/* Tilt Angle */}
        <SectionCard title="📏 Roof Tilt Angle" subtitle="Approximate slope of your roof">
          <View style={styles.sliderRow}>
            <TouchableOpacity
              style={styles.sliderBtn}
              onPress={() => setTiltAngle(Math.max(0, tiltAngle - 5))}
            >
              <Ionicons name="remove" size={20} color="#444" />
            </TouchableOpacity>
            <View style={styles.sliderValueBox}>
              <Text style={styles.sliderValue}>{tiltAngle}°</Text>
              <Text style={styles.sliderLabel}>
                {tiltAngle === 0
                  ? 'Flat'
                  : tiltAngle < 20
                  ? 'Low Slope'
                  : tiltAngle < 35
                  ? 'Moderate (Optimal)'
                  : 'Steep'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.sliderBtn}
              onPress={() => setTiltAngle(Math.min(60, tiltAngle + 5))}
            >
              <Ionicons name="add" size={20} color="#444" />
            </TouchableOpacity>
          </View>
          <Text style={styles.tiltNote}>
            💡 Optimal tilt is 30-35° for most US locations. Flat roofs use ballasted racking.
          </Text>
        </SectionCard>

        {/* Shading */}
        <SectionCard title="🌳 Shading" subtitle="Estimated shading from trees, chimneys, etc.">
          <View style={styles.shadingRow}>
            {[0, 10, 20, 30, 50].map((pct) => (
              <TouchableOpacity
                key={pct}
                style={[
                  styles.shadingBtn,
                  shadingPercentage === pct && styles.shadingBtnActive,
                ]}
                onPress={() => setShadingPercentage(pct)}
              >
                <Text
                  style={[
                    styles.shadingBtnText,
                    shadingPercentage === pct && styles.shadingBtnTextActive,
                  ]}
                >
                  {pct}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.shadingDesc}>
            {shadingPercentage === 0
              ? '☀️ No shading – maximum solar production'
              : shadingPercentage <= 10
              ? '🌤 Minimal shading – very good production'
              : shadingPercentage <= 20
              ? '⛅ Moderate shading – consider micro-inverters'
              : '🌥 Heavy shading – micro-inverters strongly recommended'}
          </Text>
        </SectionCard>

        {/* Roof Type */}
        <SectionCard title="🏗️ Roof Type" subtitle="Affects installation method and cost">
          {ROOF_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.roofTypeRow,
                roofType === type.value && styles.roofTypeRowActive,
              ]}
              onPress={() => setRoofType(type.value as any)}
            >
              <View
                style={[
                  styles.radioCircle,
                  roofType === type.value && styles.radioCircleActive,
                ]}
              >
                {roofType === type.value && <View style={styles.radioInner} />}
              </View>
              <View style={styles.roofTypeInfo}>
                <Text style={styles.roofTypeLabel}>{type.label}</Text>
                <Text style={styles.roofTypeNote}>{type.note}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </SectionCard>

        {/* Next Button */}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.nextButtonText}>Analyze & Get Recommendations</Text>
          <Ionicons name="arrow-forward" size={20} color="#1A1A2E" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

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
      {children}
    </View>
  );
}

function InfoItem({
  icon,
  color,
  label,
  value,
}: {
  icon: string;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon as any} size={16} color={color} />
      <Text style={styles.infoLabel}>{label}: </Text>
      <Text style={styles.infoValue}>{value}</Text>
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

  inputGroup: { marginBottom: 8 },
  inputLabel: { fontSize: 12, color: '#888', marginBottom: 6, fontWeight: '500' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: 12,
    height: 48,
  },
  input: { flex: 1, fontSize: 16, color: '#1A1A2E', fontWeight: '600' },
  inputSuffix: { fontSize: 13, color: '#888', marginLeft: 6 },

  infoRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoLabel: { fontSize: 13, color: '#666' },
  infoValue: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },

  orientationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  orientationCard: {
    flex: 1,
    minWidth: '18%',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    gap: 4,
  },
  orientationCardActive: {
    backgroundColor: 'rgba(245,166,35,0.08)',
    borderColor: '#F5A623',
  },
  orientationLabel: { fontSize: 11, fontWeight: '600', color: '#888' },
  orientationLabelActive: { color: '#E08800' },
  orientationEfficiency: { fontSize: 10, color: '#AAA' },

  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    marginTop: 8,
  },
  warningText: { flex: 1, fontSize: 12, color: '#E74C3C', lineHeight: 17 },

  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 8,
  },
  sliderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderValueBox: { alignItems: 'center', minWidth: 80 },
  sliderValue: { fontSize: 32, fontWeight: '800', color: '#1A1A2E' },
  sliderLabel: { fontSize: 12, color: '#F5A623', fontWeight: '600' },
  tiltNote: { fontSize: 12, color: '#888', lineHeight: 17, marginTop: 4 },

  shadingRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  shadingBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    alignItems: 'center',
  },
  shadingBtnActive: { backgroundColor: 'rgba(245,166,35,0.1)', borderColor: '#F5A623' },
  shadingBtnText: { fontSize: 13, fontWeight: '600', color: '#888' },
  shadingBtnTextActive: { color: '#E08800' },
  shadingDesc: { fontSize: 13, color: '#666', lineHeight: 18 },

  roofTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 12,
  },
  roofTypeRowActive: { backgroundColor: 'rgba(245,166,35,0.04)', borderRadius: 8 },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: { borderColor: '#F5A623' },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F5A623',
  },
  roofTypeInfo: {},
  roofTypeLabel: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  roofTypeNote: { fontSize: 12, color: '#888', marginTop: 2 },

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
