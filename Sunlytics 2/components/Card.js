import React from 'react';
import { View } from 'react-native';

export default function Card({ children }) {
  return (
    <View
      style={{
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        elevation: 2
      }}
    >
      {children}
    </View>
  );
}
