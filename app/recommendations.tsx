import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppContext } from '../src/hooks/useAppContext';
import { SolarConfiguration } from '../src/types';
import ScreenHeader from '../src/components/ScreenHeader';

const TIER_COLORS = {
  premium: '#9B59B6',
  standard: '#2980B9',
  budget: '#27AE60',
};

const TIER_LABELS = {
  premium: 'Premium',
  standard: 'Standard',
  budget: 'Budget',
};

export default function RecommendationsScreen() {
  const { state, setSelectedConfiguration } = useAppContext();
  const { recommendations, energyAudit, region, insights } = state;

  const [expanded, setExpanded] = useState<string | null>(null);

  if (!recommendations || recommendations.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Recommendations" subtitle="AI Analysis" onBack={() => router.back()} />
        <View style={styles.empty}>
          <Ionicons name="alert-circle" size={48} color="#DDD" />
          <Text style={styles.emptyText}>No recommendations found.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.replace('/energy-audit')}>
            <Text style={styles.retryText}>Start Over</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const topConfig = recommendations[0];

  const handleSelectConfig = (config: SolarConfiguration) => {
    setSelectedConfiguration(config);
    router.push('/cost-analysis');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Solar Recommendations"
        subtitle={`${recommendations.length} configurations found`}
        onBack={() => router.back()}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Feasibility Banner */}
        {insights && (
          <LinearGradient
            colors={
              insights.feasibilityScore >= 80
                ? ['#1A5E3A', '#1E7A45']
                : insights.feasibilityScore >= 60
                ? ['#7D5A00', '#A07800']
                : ['#7B1A1A', '#A02020']
            }
            style={styles.feasibilityBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.feasibilityLeft}>
              <Text style={styles.feasibilityLabel}>Solar Feasibility Score</Text>
              <Text style={styles.feasibilityValue}>{insights.feasibilityScore}/100</Text>
              <Text style={styles.feasibilityCategory}>{insights.feasibilityLabel}</Text>
            </View>
            <View style={styles.feasibilityRight}>
              <View style={styles.feasibilityStats}>
                <FeasStat
                  label="Annual Savings"
                  value={`$${Math.round(topConfig.annualSavings).toLocaleString()}`}
                />
                <FeasStat
                  label="Payback"
                  value={`${topConfig.paybackPeriodYears} yrs`}
                />
                <FeasStat
                  label="CO₂/yr"
                  value={`${topConfig.co2OffsetTons.toFixed(1)}t`}
                />
              </View>
            </View>
          </LinearGradient>
        )}

        {/* Summary */}
        {insights && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="sparkles" size={18} color="#F5A623" />
              <Text style={styles.summaryTitle}>AI Analysis</Text>
            </View>
            <Text style={styles.summaryText} numberOfLines={4}>
              {insights.summary}
            </Text>
            <TouchableOpacity
              style={styles.viewInsightsBtn}
              onPress={() => router.push('/insights')}
            >
              <Text style={styles.viewInsightsBtnText}>View Full AI Insights</Text>
              <Ionicons name="arrow-forward" size={14} color="#F5A623" />
            </TouchableOpacity>
          </View>
        )}

        {/* Energy Context */}
        {energyAudit && region && (
          <View style={styles.contextRow}>
            <ContextChip
              icon="flash"
              label={`${energyAudit.annualConsumption.toFixed(0)} kWh/yr`}
              color="#E67E22"
            />
            <ContextChip
              icon="location"
              label={region.city}
              color="#2980B9"
            />
            <ContextChip
              icon="sunny"
              label={`${region.peakSunHoursPerDay} hrs/day`}
              color="#F5A623"
            />
          </View>
        )}

        {/* Panel Title */}
        <Text style={styles.sectionTitle}>🏆 Recommended Configurations</Text>
        <Text style={styles.sectionSubtitle}>
          Ranked by AI score (ROI · coverage · payback · efficiency)
        </Text>

        {/* Recommendation Cards */}
        {recommendations.map((config, index) => (
          <ConfigCard
            key={`${config.panel.id}-${config.numberOfPanels}`}
            config={config}
            rank={index + 1}
            isTop={index === 0}
            isExpanded={expanded === `${config.panel.id}-${config.numberOfPanels}`}
            onToggleExpand={() =>
              setExpanded(
                expanded === `${config.panel.id}-${config.numberOfPanels}`
                  ? null
                  : `${config.panel.id}-${config.numberOfPanels}`,
              )
            }
            onSelect={() => handleSelectConfig(config)}
          />
        ))}

        <TouchableOpacity
          style={styles.insightsButton}
          onPress={() => router.push('/insights')}
          activeOpacity={0.85}
        >
          <Ionicons name="sparkles" size={20} color="#FFF" />
          <Text style={styles.insightsButtonText}>View AI Insights & Predictions</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConfigCard({
  config,
  rank,
  isTop,
  isExpanded,
  onToggleExpand,
  onSelect,
}: {
  config: SolarConfiguration;
  rank: number;
  isTop: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
}) {
  const tierColor = TIER_COLORS[config.panel.tier];

  return (
    <View style={[styles.configCard, isTop && styles.configCardTop]}>
      {isTop && (
        <View style={styles.topBadge}>
          <Ionicons name="trophy" size={12} color="#1A1A2E" />
          <Text style={styles.topBadgeText}>AI Top Pick</Text>
        </View>
      )}

      {/* Header Row */}
      <View style={styles.configHeader}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{rank}</Text>
        </View>
        <View style={styles.configBrandInfo}>
          <Text style={styles.configBrand}>{config.panel.brand}</Text>
          <Text style={styles.configModel} numberOfLines={1}>{config.panel.model}</Text>
        </View>
        <View style={[styles.tierBadge, { backgroundColor: tierColor + '20' }]}>
          <Text style={[styles.tierText, { color: tierColor }]}>
            {TIER_LABELS[config.panel.tier]}
          </Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreValue}>{config.score}</Text>
          <Text style={styles.scoreLabel}>score</Text>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsRow}>
        <Metric label="System Size" value={`${config.systemSizeKw.toFixed(1)} kW`} />
        <Metric label="Panels" value={`${config.numberOfPanels}`} />
        <Metric label="Coverage" value={`${config.coveragePercentage}%`} highlight />
        <Metric label="Net Cost" value={`$${Math.round(config.netCost / 1000)}K`} />
      </View>

      <View style={styles.savingsRow}>
        <Ionicons name="trending-up" size={14} color="#27AE60" />
        <Text style={styles.savingsText}>
          Save ${Math.round(config.annualSavings).toLocaleString()}/yr · Pay back in {config.paybackPeriodYears} years
        </Text>
      </View>

      {/* Expandable Details */}
      <TouchableOpacity style={styles.expandToggle} onPress={onToggleExpand}>
        <Text style={styles.expandToggleText}>
          {isExpanded ? 'Hide Details' : 'Show Details & AI Reasoning'}
        </Text>
        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#888" />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <DetailRow label="Efficiency" value={`${config.panel.efficiency}%`} />
          <DetailRow label="Panel Wattage" value={`${config.panel.wattage}W`} />
          <DetailRow label="Annual Production" value={`${Math.round(config.annualProductionKwh).toLocaleString()} kWh`} />
          <DetailRow label="Roof Area Used" value={`${Math.round(config.roofAreaUsed)} sq ft`} />
          <DetailRow label="Gross Cost" value={`$${Math.round(config.grossCost).toLocaleString()}`} />
          <DetailRow label="Federal Tax Credit (30%)" value={`-$${Math.round(config.federalTaxCredit).toLocaleString()}`} positive />
          {config.stateCreditEstimate > 0 && (
            <DetailRow label="State Incentive" value={`-$${Math.round(config.stateCreditEstimate).toLocaleString()}`} positive />
          )}
          <DetailRow label="Net Cost" value={`$${Math.round(config.netCost).toLocaleString()}`} bold />
          <DetailRow label="25-Year ROI" value={`$${Math.round(config.roi25Year).toLocaleString()}`} positive />
          <DetailRow label="CO₂ Offset/yr" value={`${config.co2OffsetTons.toFixed(1)} tons`} />
          <DetailRow label="Panel Warranty" value={`${config.panel.warranty} years`} />

          {/* AI Reasoning */}
          <View style={styles.aiReasoningBox}>
            <View style={styles.aiReasoningHeader}>
              <Ionicons name="sparkles" size={14} color="#F5A623" />
              <Text style={styles.aiReasoningTitle}>AI Analysis</Text>
            </View>
            <Text style={styles.aiReasoningText}>{config.aiReasoning}</Text>
          </View>
        </View>
      )}

      {/* Select Button */}
      <TouchableOpacity style={styles.selectBtn} onPress={onSelect} activeOpacity={0.85}>
        <Text style={styles.selectBtnText}>View Full Cost Analysis</Text>
        <Ionicons name="arrow-forward" size={16} color="#1A1A2E" />
      </TouchableOpacity>
    </View>
  );
}

function FeasStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.feasStat}>
      <Text style={styles.feasStatValue}>{value}</Text>
      <Text style={styles.feasStatLabel}>{label}</Text>
    </View>
  );
}

function ContextChip({
  icon,
  label,
  color,
}: {
  icon: string;
  label: string;
  color: string;
}) {
  return (
    <View style={[styles.contextChip, { borderColor: color + '40' }]}>
      <Ionicons name={icon as any} size={14} color={color} />
      <Text style={[styles.contextChipText, { color }]}>{label}</Text>
    </View>
  );
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.metric, highlight && styles.metricHighlight]}>
      <Text style={[styles.metricValue, highlight && styles.metricValueHighlight]}>
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function DetailRow({
  label,
  value,
  positive,
  bold,
}: {
  label: string;
  value: string;
  positive?: boolean;
  bold?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[
          styles.detailValue,
          positive && styles.detailValuePositive,
          bold && styles.detailValueBold,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: '#888' },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#F5A623',
    borderRadius: 10,
  },
  retryText: { fontWeight: '700', color: '#1A1A2E' },

  feasibilityBanner: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feasibilityLeft: {},
  feasibilityLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginBottom: 4 },
  feasibilityValue: { fontSize: 36, fontWeight: '800', color: '#FFFFFF' },
  feasibilityCategory: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '600', marginTop: 2 },
  feasibilityRight: {},
  feasibilityStats: { gap: 8 },
  feasStat: { alignItems: 'flex-end' },
  feasStatValue: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  feasStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },

  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  summaryText: { fontSize: 13, color: '#555', lineHeight: 19 },
  viewInsightsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  viewInsightsBtnText: { fontSize: 13, color: '#F5A623', fontWeight: '600' },

  contextRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  contextChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: '#FFF',
  },
  contextChipText: { fontSize: 12, fontWeight: '600' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 2 },
  sectionSubtitle: { fontSize: 12, color: '#888', marginBottom: 14 },

  configCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  configCardTop: {
    borderColor: '#F5A623',
    shadowColor: '#F5A623',
    shadowOpacity: 0.15,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#F5A623',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 10,
  },
  topBadgeText: { fontSize: 11, fontWeight: '700', color: '#1A1A2E' },

  configHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { fontSize: 12, fontWeight: '700', color: '#555' },
  configBrandInfo: { flex: 1 },
  configBrand: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  configModel: { fontSize: 11, color: '#888', marginTop: 1 },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tierText: { fontSize: 11, fontWeight: '700' },
  scoreBadge: { alignItems: 'center', minWidth: 40 },
  scoreValue: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
  scoreLabel: { fontSize: 9, color: '#888', fontWeight: '600', textTransform: 'uppercase' },

  metricsRow: { flexDirection: 'row', marginBottom: 10 },
  metric: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    marginHorizontal: 2,
  },
  metricHighlight: { backgroundColor: 'rgba(245,166,35,0.1)' },
  metricValue: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
  metricValueHighlight: { color: '#E08800' },
  metricLabel: { fontSize: 10, color: '#888', marginTop: 2, textAlign: 'center' },

  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(39,174,96,0.08)',
    borderRadius: 8,
    marginBottom: 10,
  },
  savingsText: { fontSize: 13, color: '#1E8449', fontWeight: '600' },

  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginBottom: 4,
  },
  expandToggleText: { fontSize: 13, color: '#888', fontWeight: '500' },

  expandedContent: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  detailLabel: { fontSize: 13, color: '#666' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },
  detailValuePositive: { color: '#27AE60' },
  detailValueBold: { fontSize: 14, fontWeight: '800' },

  aiReasoningBox: {
    backgroundColor: 'rgba(245,166,35,0.06)',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.2)',
  },
  aiReasoningHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  aiReasoningTitle: { fontSize: 12, fontWeight: '700', color: '#E08800' },
  aiReasoningText: { fontSize: 12, color: '#555', lineHeight: 18 },

  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5A623',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  selectBtnText: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },

  insightsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
    marginTop: 8,
  },
  insightsButtonText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
