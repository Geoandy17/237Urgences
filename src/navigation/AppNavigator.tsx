import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import EmergencyCallScreen from '../screens/EmergencyCallScreen';
import HospitalsScreen from '../screens/HospitalsScreen';
import PharmaciesScreen from '../screens/PharmaciesScreen';
import DeclareIncidentScreen from '../screens/DeclareIncidentScreen';
import IncidentConfirmationScreen from '../screens/IncidentConfirmationScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { colors, mode } = useTheme();
  const { t } = useI18n();
  const isDark = mode === 'dark';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          // Shadow
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
          else if (route.name === 'Profile') iconName = focused ? 'person-circle' : 'person-circle-outline';

          return (
            <View style={{
              alignItems: 'center',
              paddingTop: 2,
            }}>
              {focused && (
                <View style={{
                  position: 'absolute', top: -8,
                  width: 20, height: 3, borderRadius: 2,
                  backgroundColor: colors.accent,
                }} />
              )}
              <Ionicons name={iconName} size={focused ? 26 : 24} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Accueil' }} />
      <Tab.Screen name="Profile" component={SettingsScreen} options={{ tabBarLabel: t('settings_title') }} />
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

  // Écran de chargement pendant la vérification de session
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
          // Utilisateur connecté → accès direct
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="EmergencyCall" component={EmergencyCallScreen} />
            <Stack.Screen name="Hospitals" component={HospitalsScreen} />
            <Stack.Screen name="Pharmacies" component={PharmaciesScreen} />
            <Stack.Screen name="DeclareIncident" component={DeclareIncidentScreen} />
            <Stack.Screen name="IncidentConfirmation" component={IncidentConfirmationScreen} options={{ gestureEnabled: false }} />
          </>
        ) : (
          // Pas connecté → Splash → Welcome → Register/Login → OTP
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
