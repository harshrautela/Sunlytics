import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StepIndicatorProps {
  currentStep: number; // 1-based
  totalSteps: number;
}

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;
        return (
          <React.Fragment key={step}>
            <View
              style={[
                styles.step,
                isCompleted && styles.stepCompleted,
                isActive && styles.stepActive,
              ]}
            >
              <Text
                style={[
                  styles.stepText,
                  (isCompleted || isActive) && styles.stepTextActive,
                ]}
              >
                {step}
              </Text>
            </View>
            {step < totalSteps && (
              <View
                style={[
                  styles.connector,
                  isCompleted && styles.connectorCompleted,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  step: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  stepActive: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  stepCompleted: {
    backgroundColor: '#27AE60',
    borderColor: '#27AE60',
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#AAA',
  },
  stepTextActive: {
    color: '#FFF',
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 6,
  },
  connectorCompleted: {
    backgroundColor: '#27AE60',
  },
});
