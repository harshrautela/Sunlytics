import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const FEATURES = [
  {
    icon: 'flash',
    title: 'Energy Analysis',
    description: 'Input your appliances or monthly bill to understand your exact energy needs',
  },
  {
    icon: 'home',
    title: 'Rooftop Intelligence',
    description: 'Analyze your roof area, orientation, and shading for precise calculations',
  },
  {
    icon: 'cellular',
    title: 'AI Recommendations',
    description: 'Get personalized solar panel configurations ranked by our AI engine',
  },
  {
    icon: 'trending-up',
    title: 'Cost & ROI Analysis',
    description: '25-year financial projections with tax credits and savings forecasts',
  },
];

export default function WelcomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={['#1A1A2E', '#16213E', '#0F3460']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <Animated.View
            style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          >
            <View style={styles.logoContainer}>
              <Ionicons name="sunny" size={64} color="#F5A623" />
            </View>
            <Text style={styles.appName}>Sunlytics</Text>
            <Text style={styles.tagline}>AI-Powered Solar Planning</Text>
            <Text style={styles.subtitle}>
              Discover the perfect solar configuration for your home — powered by intelligent
              energy analysis and AI recommendations.
            </Text>
          </Animated.View>

          {/* Feature Cards */}
          <Animated.View style={{ opacity: fadeAnim }}>
            {FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon as any} size={24} color="#F5A623" />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </Animated.View>

          {/* Stats Row */}
          <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>10+</Text>
              <Text style={styles.statLabel}>Panel Brands</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>15</Text>
              <Text style={styles.statLabel}>US Regions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>25yr</Text>
              <Text style={styles.statLabel}>ROI Forecast</Text>
            </View>
          </Animated.View>

          {/* CTA Button */}
          <Animated.View style={{ opacity: fadeAnim, marginTop: 24 }}>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push('/energy-audit')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#F5A623', '#E08800']}
                style={styles.ctaGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.ctaText}>Start Free Analysis</Text>
                <Ionicons name="arrow-forward" size={20} color="#1A1A2E" />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.disclaimer}>
              No account required · Takes 3 minutes
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(245, 166, 35, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.3)',
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    color: '#F5A623',
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 20,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F5A623',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: 8,
  },
  ctaButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: 0.5,
  },
  disclaimer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 12,
  },
});
