import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppContext } from '../src/hooks/useAppContext';
import { generateRecommendations } from '../src/utils/solarCalculations';
import { generateAIInsights } from '../src/utils/aiRecommendations';

const ANALYSIS_STEPS = [
  { icon: 'flash', label: 'Calculating energy requirements...' },
  { icon: 'sunny', label: 'Analyzing solar irradiance...' },
  { icon: 'grid', label: 'Evaluating panel configurations...' },
  { icon: 'trending-up', label: 'Running financial projections...' },
  { icon: 'sparkles', label: 'Generating AI insights...' },
  { icon: 'checkmark-circle', label: 'Analysis complete!' },
];

export default function AnalyzingScreen() {
  const { state, setRecommendations, setInsights } = useAppContext();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [currentStep, setCurrentStep] = React.useState(0);

  useEffect(() => {
    // Spin animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // Progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3200,
      useNativeDriver: false,
    }).start();

    // Step counter
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < ANALYSIS_STEPS.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 550);

    // Run calculations
    const timer = setTimeout(() => {
      if (state.energyAudit && state.rooftopData && state.region) {
        const configs = generateRecommendations(
          state.energyAudit.annualConsumption,
          state.rooftopData,
          state.region,
        );
        setRecommendations(configs);

        if (configs.length > 0) {
          const insights = generateAIInsights(
            state.energyAudit,
            state.rooftopData,
            state.region,
            configs[0],
          );
          setInsights(insights);
        }

        router.replace('/recommendations');
      }
    }, 3500);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <LinearGradient colors={['#1A1A2E', '#16213E', '#0F3460']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          {/* Spinning solar icon */}
          <View style={styles.spinnerContainer}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name="sunny" size={80} color="#F5A623" />
            </Animated.View>
            <View style={styles.orbitRing} />
          </View>

          <Text style={styles.title}>Analyzing Your Home</Text>
          <Text style={styles.subtitle}>
            Our AI engine is processing your data...
          </Text>

          {/* Progress bar */}
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>

          {/* Step list */}
          <View style={styles.stepList}>
            {ANALYSIS_STEPS.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepIcon,
                    index <= currentStep ? styles.stepIconActive : styles.stepIconPending,
                  ]}
                >
                  <Ionicons
                    name={index <= currentStep ? (step.icon as any) : 'ellipse-outline'}
                    size={16}
                    color={index <= currentStep ? '#F5A623' : 'rgba(255,255,255,0.3)'}
                  />
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    index <= currentStep ? styles.stepLabelActive : styles.stepLabelPending,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  spinnerContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  orbitRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.2)',
    borderStyle: 'dashed',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 28,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 32,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F5A623',
    borderRadius: 3,
  },
  stepList: { width: '100%' },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconActive: { backgroundColor: 'rgba(245,166,35,0.15)' },
  stepIconPending: { backgroundColor: 'rgba(255,255,255,0.05)' },
  stepLabel: { fontSize: 14 },
  stepLabelActive: { color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  stepLabelPending: { color: 'rgba(255,255,255,0.3)' },
});
