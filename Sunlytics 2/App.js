import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AppProvider } from './context/AppContext';

/* Auth Screens */
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';

/* App Screens */
import HomeScreen from './screens/HomeScreen';
import AssessScreen from './screens/AssessScreen';
import AppliancesScreen from './screens/AppliancesScreen';
import BillScreen from './screens/BillScreen';
import RoofScreen from './screens/RoofScreen';
import LocationScreen from './screens/LocationScreen';
import ResultScreen from './screens/ResultScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />

          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Assess" component={AssessScreen} />
          <Stack.Screen name="Appliances" component={AppliancesScreen} />
          <Stack.Screen name="Bill" component={BillScreen} />
          <Stack.Screen name="Roof" component={RoofScreen} />
          <Stack.Screen name="Location" component={LocationScreen} />
          <Stack.Screen name="Result" component={ResultScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}