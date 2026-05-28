import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require('../assets/solar_bg.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Sunlytics</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>
            Your Smart Solar{'\n'}Planning Assistant
          </Text>

          {/* ✅ CONNECTED TO ASSESS */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Assess')}
          >
            <Text style={styles.primaryButtonText}>
              Start Free Assessment
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Result')}
          >
            <Text style={styles.secondaryButtonText}>
              View Sample Report
            </Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={22} color="#F59E0B" />
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Assess')}
        >
          <Ionicons name="clipboard-outline" size={22} color="#6B7280" />
          <Text style={styles.navText}>Assess</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="layers-outline" size={22} color="#6B7280" />
          <Text style={styles.navText}>Catalog</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="settings-outline" size={22} color="#6B7280" />
          <Text style={styles.navText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  backgroundImage: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 12,
  },

  logo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    textShadowColor: 'rgba(255,255,255,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 80,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 32,
    lineHeight: 34,
    color: '#000',
    textShadowColor: 'rgba(255,255,255,0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  primaryButton: {
    backgroundColor: '#E5E5E5',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },

  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#000',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },

  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },

  bottomNav: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  navText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },

  navTextActive: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '700',
    marginTop: 2,
  },
});