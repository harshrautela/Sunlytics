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

export default function InsightsScreen() {
  const { state } = useAppContext();
  const { insights, selectedConfiguration, energyAudit, region } = state;

  if (!insights) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="AI Insights" subtitle="Smart Analysis" onBack={() => router.back()} />
        <View style={styles.empty}>
          <Ionicons name="sparkles" size={48} color="#DDD" />
          <Text style={styles.emptyText}>No insights available yet.</Text>
          <TouchableOpacity onPress={() => router.replace('/energy-audit')}>
            <Text style={styles.backLink}>Start Analysis</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const config = selectedConfiguration || state.recommendations?.[0];
  const feasScore = insights.feasibilityScore;
  const feasColor =
    feasScore >= 80 ? '#27AE60' : feasScore >= 60 ? '#F5A623' : feasScore >= 40 ? '#E67E22' : '#E74C3C';

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="AI Insights"
        subtitle="Powered by Sunlytics Intelligence Engine"
        onBack={() => router.back()}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Feasibility Score Hero */}
        <LinearGradient
          colors={['#1A1A2E', '#16213E']}
          style={styles.feasibilityHero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.feasibilityLeft}>
            <View style={styles.aiLabel}>
              <Ionicons name="sparkles" size={12} color="#F5A623" />
              <Text style={styles.aiLabelText}>AI ANALYSIS</Text>
            </View>
            <Text style={styles.feasibilityTitle}>Solar Feasibility</Text>
            <View style={styles.scoreCircle}>
              <Text style={[styles.scoreNumber, { color: feasColor }]}>{feasScore}</Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
            <View style={[styles.feasBadge, { backgroundColor: feasColor + '25' }]}>
              <Text style={[styles.feasBadgeText, { color: feasColor }]}>
                {insights.feasibilityLabel}
              </Text>
            </View>
          </View>
          {config && (
            <View style={styles.feasibilityRight}>
              <QuickStat icon="flash" label="System Size" value={`${config.systemSizeKw.toFixed(1)} kW`} />
              <QuickStat icon="trending-up" label="25-yr ROI" value={`$${(config.roi25Year / 1000).toFixed(0)}K`} />
              <QuickStat icon="leaf" label="CO₂/Year" value={`${config.co2OffsetTons.toFixed(1)}t`} />
              <QuickStat icon="sunny" label="Coverage" value={`${config.coveragePercentage}%`} />
            </View>
          )}
        </LinearGradient>

        {/* AI Summary */}
        <InsightCard
          icon="document-text"
          title="Executive Summary"
          color="#2980B9"
          content={insights.summary}
        />

        {/* Key Benefits */}
        <BulletCard
          icon="checkmark-circle"
          title="Key Benefits"
          color="#27AE60"
          items={insights.keyBenefits}
        />

        {/* Short-Term Prediction */}
        <InsightCard
          icon="time"
          title="Short-Term Outlook (1–5 Years)"
          color="#F5A623"
          content={insights.shortTermPrediction}
        />

        {/* Long-Term Prediction */}
        <InsightCard
          icon="telescope"
          title="Long-Term Forecast (10–25 Years)"
          color="#8E44AD"
          content={insights.longTermPrediction}
        />

        {/* Considerations */}
        <BulletCard
          icon="alert-circle"
          title="Important Considerations"
          color="#E67E22"
          items={insights.considerations}
        />

        {/* Environmental Impact */}
        <InsightCard
          icon="leaf"
          title="Environmental Impact"
          color="#1A8C4E"
          content={insights.environmentalImpact}
        />

        {/* Maintenance Tips */}
        <BulletCard
          icon="construct"
          title="Maintenance Tips"
          color="#2C3E50"
          items={insights.maintenanceTips}
        />

        {/* Region Info */}
        {region && (
          <View style={styles.regionCard}>
            <View style={styles.regionHeader}>
              <Ionicons name="location" size={16} color="#2980B9" />
              <Text style={styles.regionTitle}>{region.city}, {region.state} Solar Profile</Text>
            </View>
            <View style={styles.regionStats}>
              <RegionStat label="Peak Sun Hours" value={`${region.peakSunHoursPerDay} hrs/day`} />
              <RegionStat label="Electricity Rate" value={`$${region.averageElectricityRate}/kWh`} />
              <RegionStat
                label="State Incentive"
                value={region.stateIncentivePercent > 0 ? `${region.stateIncentivePercent}%` : 'None'}
              />
            </View>
            {region.incentiveNotes && (
              <View style={styles.incentiveNote}>
                <Ionicons name="information-circle" size={14} color="#2980B9" />
                <Text style={styles.incentiveNoteText}>{region.incentiveNotes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/recommendations')}
          activeOpacity={0.85}
        >
          <Ionicons name="grid" size={20} color="#1A1A2E" />
          <Text style={styles.primaryBtnText}>View All Configurations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.replace('/energy-audit')}
          activeOpacity={0.85}
        >
          <Ionicons name="refresh" size={18} color="#888" />
          <Text style={styles.secondaryBtnText}>Start New Analysis</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InsightCard({
  icon,
  title,
  color,
  content,
}: {
  icon: string;
  title: string;
  color: string;
  content: string;
}) {
  return (
    <View style={[styles.insightCard, { borderLeftColor: color }]}>
      <View style={styles.insightHeader}>
        <View style={[styles.insightIcon, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon as any} size={18} color={color} />
        </View>
        <Text style={styles.insightTitle}>{title}</Text>
      </View>
      <Text style={styles.insightContent}>{content}</Text>
    </View>
  );
}

function BulletCard({
  icon,
  title,
  color,
  items,
}: {
  icon: string;
  title: string;
  color: string;
  items: string[];
}) {
  return (
    <View style={[styles.insightCard, { borderLeftColor: color }]}>
      <View style={styles.insightHeader}>
        <View style={[styles.insightIcon, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon as any} size={18} color={color} />
        </View>
        <Text style={styles.insightTitle}>{title}</Text>
      </View>
      {items.map((item, index) => (
        <Text key={index} style={styles.bulletItem}>
          {item}
        </Text>
      ))}
    </View>
  );
}

function QuickStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.quickStat}>
      <Ionicons name={icon as any} size={14} color="#F5A623" />
      <Text style={styles.quickStatValue}>{value}</Text>
      <Text style={styles.quickStatLabel}>{label}</Text>
    </View>
  );
}

function RegionStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.regionStat}>
      <Text style={styles.regionStatValue}>{value}</Text>
      <Text style={styles.regionStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: '#888' },
  backLink: { fontSize: 15, color: '#F5A623', fontWeight: '700' },

  feasibilityHero: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  feasibilityLeft: {},
  aiLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  aiLabelText: { fontSize: 10, fontWeight: '700', color: '#F5A623', letterSpacing: 2 },
  feasibilityTitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6 },
  scoreCircle: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  scoreNumber: { fontSize: 56, fontWeight: '900', lineHeight: 60 },
  scoreMax: { fontSize: 20, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  feasBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  feasBadgeText: { fontSize: 13, fontWeight: '700' },
  feasibilityRight: {
    gap: 12,
    alignItems: 'flex-end',
  },
  quickStat: { alignItems: 'flex-end', gap: 2 },
  quickStatValue: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  quickStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },

  insightCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', flex: 1 },
  insightContent: { fontSize: 13, color: '#444', lineHeight: 20 },
  bulletItem: { fontSize: 13, color: '#444', lineHeight: 22, paddingLeft: 4, marginBottom: 2 },

  regionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  regionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  regionTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  regionStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  regionStat: { alignItems: 'center' },
  regionStatValue: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  regionStatLabel: { fontSize: 11, color: '#888', marginTop: 2, textAlign: 'center' },
  incentiveNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#EBF5FB',
    borderRadius: 8,
    padding: 10,
  },
  incentiveNoteText: { flex: 1, fontSize: 12, color: '#2980B9', lineHeight: 17 },

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
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: '#888' },
});
