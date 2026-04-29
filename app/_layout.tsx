import { Stack } from 'expo-router';
import { AppProvider } from '../src/hooks/useAppContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F8F9FA' },
          animation: 'slide_from_right',
        }}
      />
    </AppProvider>
  );
}
