import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppContext } from '../src/hooks/useAppContext';
import ScreenHeader from '../src/components/ScreenHeader';

export default function CostAnalysisScreen() {
  const { state } = useAppContext();
  const config = state.selectedConfiguration;
  const region = state.region;

  if (!config || !region) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Cost Analysis" subtitle="Financial Breakdown" onBack={() => router.back()} />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No configuration selected.</Text>
          <TouchableOpacity onPress={() => router.push('/recommendations')}>
            <Text style={styles.backLink}>← Back to Recommendations</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const DEGRADATION_RATE = config.panel.degradationRate / 100;
  const ESCALATION_RATE = 0.025;

  function calcCumulative(years: number): number {
    let total = 0;
    let output = 1.0;
    let rateMult = 1.0;
    for (let y = 1; y <= years; y++) {
      total += config.annualSavings * output * rateMult;
      output *= 1 - DEGRADATION_RATE;
      rateMult *= 1 + ESCALATION_RATE;
    }
    return Math.round(total);
  }

  const year5Cumulative = calcCumulative(5);
  const year10Cumulative = calcCumulative(10);
  const year25Cumulative = calcCumulative(25);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Cost Analysis"
        subtitle={`${config.panel.brand} ${config.systemSizeKw.toFixed(1)} kW System`}
        onBack={() => router.back()}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <LinearGradient
          colors={['#1A5E3A', '#1E7A45']}
          style={styles.heroBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.heroTitle}>25-Year Net Benefit</Text>
          <Text style={styles.heroValue}>
            ${Math.round(config.roi25Year).toLocaleString()}
          </Text>
          <Text style={styles.heroSub}>
            After all costs, incentives & electricity savings
          </Text>
          <View style={styles.heroStats}>
            <HeroStat label="Net Cost" value={`$${Math.round(config.netCost / 1000)}K`} />
            <HeroStat label="Annual Savings" value={`$${Math.round(config.annualSavings).toLocaleString()}`} />
            <HeroStat label="Payback" value={`${config.paybackPeriodYears} yrs`} />
          </View>
        </LinearGradient>

        {/* Cost Breakdown */}
        <SectionCard title="💰 Investment Breakdown">
          <CostRow label="Hardware (Panels)" value={config.numberOfPanels * config.panel.pricePerPanel} />
          <CostRow label={`Inverter (${config.systemSizeKw.toFixed(1)} kW)`} value={Math.round(config.systemSizeKw * 250)} />
          <CostRow label="Installation Labor" value={Math.round(config.systemSizeKw * 700)} />
          <CostRow label="Permits & Inspection" value={500} />
          <View style={styles.divider} />
          <CostRow label="Gross System Cost" value={config.grossCost} bold />
          <CostRow
            label="Federal Tax Credit (30% ITC)"
            value={-config.federalTaxCredit}
            positive
          />
          {config.stateCreditEstimate > 0 && (
            <CostRow
              label={`${region.state} State Incentive`}
              value={-config.stateCreditEstimate}
              positive
            />
          )}
          <View style={styles.divider} />
          <CostRow label="Net Investment" value={config.netCost} bold highlight />
        </SectionCard>

        {/* Incentives Card */}
        <SectionCard title="🏛️ Available Incentives">
          <IncentiveRow
            title="Federal Investment Tax Credit (ITC)"
            description="30% of gross system cost credited against federal income taxes"
            value={config.federalTaxCredit}
            color="#2980B9"
          />
          {config.stateCreditEstimate > 0 && (
            <IncentiveRow
              title={`${region.state} State Incentive`}
              description={region.incentiveNotes}
              value={config.stateCreditEstimate}
              color="#8E44AD"
            />
          )}
          <View style={styles.incentiveNote}>
            <Ionicons name="information-circle" size={14} color="#888" />
            <Text style={styles.incentiveNoteText}>
              Consult a tax professional to confirm eligibility. State incentives subject to program availability.
            </Text>
          </View>
        </SectionCard>

        {/* Savings Projection */}
        <SectionCard title="📈 Savings Over Time">
          <Text style={styles.projectionSubtitle}>
            Assumes {(2.5).toFixed(1)}% annual electricity rate escalation and{' '}
            {(config.panel.degradationRate).toFixed(2)}% annual panel degradation
          </Text>

          <SavingsBar
            year={1}
            savings={Math.round(config.annualSavings)}
            maxSavings={year25Cumulative}
            isCumulative={false}
            breakEven={false}
          />
          <SavingsBar
            year={5}
            savings={year5Cumulative}
            maxSavings={year25Cumulative}
            isCumulative={true}
            breakEven={config.paybackPeriodYears <= 5}
          />
          <SavingsBar
            year={10}
            savings={year10Cumulative}
            maxSavings={year25Cumulative}
            isCumulative={true}
            breakEven={config.paybackPeriodYears <= 10}
          />
          <SavingsBar
            year={25}
            savings={year25Cumulative}
            maxSavings={year25Cumulative}
            isCumulative={true}
            breakEven={true}
          />
        </SectionCard>

        {/* System Details */}
        <SectionCard title="⚙️ System Specifications">
          <SpecRow label="Panel Model" value={`${config.panel.brand} ${config.panel.model}`} />
          <SpecRow label="Panel Type" value={config.panel.type.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())} />
          <SpecRow label="Number of Panels" value={`${config.numberOfPanels} panels`} />
          <SpecRow label="System Size" value={`${config.systemSizeKw.toFixed(2)} kW`} />
          <SpecRow label="Panel Efficiency" value={`${config.panel.efficiency}%`} />
          <SpecRow label="Annual Production" value={`${Math.round(config.annualProductionKwh).toLocaleString()} kWh`} />
          <SpecRow label="Energy Coverage" value={`${config.coveragePercentage}%`} />
          <SpecRow label="Roof Area Required" value={`${Math.round(config.roofAreaUsed)} sq ft`} />
          <SpecRow label="Equipment Warranty" value={`${config.panel.warranty} years`} />
          <SpecRow label="Degradation Rate" value={`${config.panel.degradationRate}%/year`} />
        </SectionCard>

        {/* Environmental */}
        <SectionCard title="🌱 Environmental Impact">
          <View style={styles.ecoGrid}>
            <EcoStat
              icon="leaf"
              label="CO₂ Offset/Year"
              value={`${config.co2OffsetTons.toFixed(1)} tons`}
              color="#27AE60"
            />
            <EcoStat
              icon="car"
              label="Cars Removed Equivalent"
              value={`${Math.round(config.co2OffsetTons * 1000 / 4600)}`}
              color="#2980B9"
            />
            <EcoStat
              icon="leaf"
              label="25-Year CO₂ Avoided"
              value={`${(config.co2OffsetTons * 25).toFixed(0)} tons`}
              color="#1A8C4E"
            />
            <EcoStat
              icon="sunny"
              label="Trees Equivalent"
              value={`${Math.round(config.co2OffsetTons * 45)}/yr`}
              color="#E67E22"
            />
          </View>
        </SectionCard>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/insights')}
          activeOpacity={0.85}
        >
          <Ionicons name="sparkles" size={20} color="#1A1A2E" />
          <Text style={styles.primaryBtnText}>View AI Insights & Predictions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/recommendations')}
          activeOpacity={0.85}
        >
          <Ionicons name="swap-horizontal" size={20} color="#F5A623" />
          <Text style={styles.secondaryBtnText}>Compare Other Configurations</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function CostRow({
  label,
  value,
  positive,
  bold,
  highlight,
}: {
  label: string;
  value: number;
  positive?: boolean;
  bold?: boolean;
  highlight?: boolean;
}) {
  const displayValue = positive
    ? `-$${Math.abs(Math.round(value)).toLocaleString()}`
    : `$${Math.round(value).toLocaleString()}`;

  return (
    <View style={[styles.costRow, highlight && styles.costRowHighlight]}>
      <Text style={[styles.costLabel, bold && styles.costLabelBold]}>{label}</Text>
      <Text
        style={[
          styles.costValue,
          positive && styles.costValuePositive,
          bold && styles.costValueBold,
          highlight && styles.costValueHighlight,
        ]}
      >
        {displayValue}
      </Text>
    </View>
  );
}

function IncentiveRow({
  title,
  description,
  value,
  color,
}: {
  title: string;
  description: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.incentiveRow}>
      <View style={[styles.incentiveIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name="cash" size={18} color={color} />
      </View>
      <View style={styles.incentiveInfo}>
        <Text style={styles.incentiveTitle}>{title}</Text>
        <Text style={styles.incentiveDesc}>{description}</Text>
      </View>
      <Text style={[styles.incentiveValue, { color }]}>
        ${Math.round(value).toLocaleString()}
      </Text>
    </View>
  );
}

function SavingsBar({
  year,
  savings,
  maxSavings,
  isCumulative,
  breakEven,
}: {
  year: number;
  savings: number;
  maxSavings: number;
  isCumulative: boolean;
  breakEven: boolean;
}) {
  const percentage = Math.min(100, (savings / maxSavings) * 100);

  return (
    <View style={styles.savingsBarRow}>
      <Text style={styles.savingsBarYear}>Yr {year}</Text>
      <View style={styles.savingsBarTrack}>
        <View
          style={[
            styles.savingsBarFill,
            { width: `${percentage}%` },
            breakEven ? styles.savingsBarFillGreen : styles.savingsBarFillOrange,
          ]}
        />
      </View>
      <Text style={styles.savingsBarValue}>
        ${(savings / 1000).toFixed(1)}K
        {isCumulative ? ' total' : '/yr'}
      </Text>
    </View>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

function EcoStat({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={[styles.ecoStat, { borderColor: color + '30' }]}>
      <Ionicons name={icon as any} size={22} color={color} />
      <Text style={[styles.ecoStatValue, { color }]}>{value}</Text>
      <Text style={styles.ecoStatLabel}>{label}</Text>
    </View>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: '#888' },
  backLink: { fontSize: 14, color: '#F5A623', fontWeight: '600' },

  heroBanner: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  heroTitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 4 },
  heroValue: { fontSize: 44, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 16 },
  heroStats: { flexDirection: 'row', justifyContent: 'space-around' },
  heroStat: { alignItems: 'center' },
  heroStatValue: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  heroStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },

  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  costRowHighlight: { backgroundColor: 'rgba(245,166,35,0.06)', borderRadius: 6, paddingHorizontal: 8 },
  costLabel: { fontSize: 13, color: '#555' },
  costLabelBold: { fontWeight: '700', color: '#1A1A2E' },
  costValue: { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },
  costValuePositive: { color: '#27AE60' },
  costValueBold: { fontSize: 14, fontWeight: '800' },
  costValueHighlight: { color: '#E08800', fontSize: 15 },
  divider: { height: 1, backgroundColor: '#E8E8E8', marginVertical: 6 },

  incentiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  incentiveIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incentiveInfo: { flex: 1 },
  incentiveTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },
  incentiveDesc: { fontSize: 11, color: '#888', marginTop: 2, lineHeight: 16 },
  incentiveValue: { fontSize: 16, fontWeight: '800' },
  incentiveNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  incentiveNoteText: { flex: 1, fontSize: 11, color: '#888', lineHeight: 16 },

  projectionSubtitle: { fontSize: 11, color: '#AAA', marginBottom: 12, lineHeight: 16 },
  savingsBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  savingsBarYear: { width: 34, fontSize: 12, fontWeight: '600', color: '#888' },
  savingsBarTrack: {
    flex: 1,
    height: 14,
    backgroundColor: '#F0F0F0',
    borderRadius: 7,
    overflow: 'hidden',
  },
  savingsBarFill: { height: '100%', borderRadius: 7 },
  savingsBarFillOrange: { backgroundColor: '#F5A623' },
  savingsBarFillGreen: { backgroundColor: '#27AE60' },
  savingsBarValue: { width: 72, fontSize: 12, fontWeight: '600', color: '#1A1A2E', textAlign: 'right' },

  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  specLabel: { fontSize: 13, color: '#666' },
  specValue: { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },

  ecoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  ecoStat: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FAFAFA',
    gap: 6,
  },
  ecoStatValue: { fontSize: 18, fontWeight: '800' },
  ecoStatLabel: { fontSize: 11, color: '#888', textAlign: 'center', lineHeight: 15 },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5A623',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
    marginBottom: 12,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#F5A623',
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '700', color: '#F5A623' },
});
