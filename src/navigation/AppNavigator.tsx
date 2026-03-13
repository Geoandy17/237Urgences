import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList, MainTabParamList } from '../types';
import { useTheme } from '../config/theme';
import { useI18n } from '../config/i18n';
import { useAuth } from '../config/auth';

import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import RegisterScreen from '../screens/RegisterScreen';
import LoginScreen from '../screens/LoginScreen';
import OTPScreen from '../screens/OTPScreen';
import HomeScreen from '../screens/HomeScreen';
import ServicesScreen from '../screens/ServicesScreen';
import EmergencyCallScreen from '../screens/EmergencyCallScreen';
import HospitalsScreen from '../screens/HospitalsScreen';
import PharmaciesScreen from '../screens/PharmaciesScreen';
import DeclareIncidentScreen from '../screens/DeclareIncidentScreen';
import IncidentConfirmationScreen from '../screens/IncidentConfirmationScreen';
import IncidentTrackingScreen from '../screens/IncidentTrackingScreen';
import MyIncidentsScreen from '../screens/MyIncidentsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { colors, mode } = useTheme();
  const { t } = useI18n();
  const isDark = mode === 'dark';
  const insets = useSafeAreaInsets();

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
          borderTopWidth: 0,
          height: 62 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
          shadowColor: isDark ? '#000' : '#64748B',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 16,
          elevation: 20,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Services') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'MyIncidents') iconName = focused ? 'notifications' : 'notifications-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

          return (
            <View style={{ alignItems: 'center', paddingTop: 2 }}>
              {focused && (
                <View style={{
                  position: 'absolute', top: -8,
                  width: 20, height: 3, borderRadius: 2,
                  backgroundColor: colors.accent,
                }} />
              )}
              <Ionicons name={iconName} size={focused ? 24 : 22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('tab_home') }} />
      <Tab.Screen name="Services" component={ServicesScreen} options={{ tabBarLabel: t('tab_services') }} />
      <Tab.Screen name="MyIncidents" component={MyIncidentsScreen} options={{ tabBarLabel: t('tab_incidents') }} />
      <Tab.Screen name="Profile" component={SettingsScreen} options={{ tabBarLabel: t('tab_profile') }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { mode, colors } = useTheme();
  const { isLoggedIn, isLoading } = useAuth();

  const navTheme = {
    ...(mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <View style={styles.loadingBadge}>
          <Text style={styles.loadingBadgeText}>237</Text>
        </View>
        <Text style={[styles.loadingTitle, { color: colors.text }]}>URGENCES</Text>
        <View style={styles.loadingBar}>
          <View style={[styles.loadingSeg, { backgroundColor: '#009639' }]} />
          <View style={[styles.loadingSeg, { backgroundColor: '#CE1126' }]} />
          <View style={[styles.loadingSeg, { backgroundColor: '#FCBF49' }]} />
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="EmergencyCall" component={EmergencyCallScreen} />
            <Stack.Screen name="Hospitals" component={HospitalsScreen} />
            <Stack.Screen name="Pharmacies" component={PharmaciesScreen} />
            <Stack.Screen name="DeclareIncident" component={DeclareIncidentScreen} />
            <Stack.Screen name="IncidentConfirmation" component={IncidentConfirmationScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="IncidentTracking" component={IncidentTrackingScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingBadge: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: '#CE1126',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  loadingBadgeText: { color: '#FFF', fontSize: 22, fontWeight: '900', letterSpacing: 1.5 },
  loadingTitle: { fontSize: 28, fontWeight: '900', letterSpacing: 4, marginBottom: 12 },
  loadingBar: { flexDirection: 'row', gap: 2, width: 180 },
  loadingSeg: { flex: 1, height: 3.5, borderRadius: 2 },
});
