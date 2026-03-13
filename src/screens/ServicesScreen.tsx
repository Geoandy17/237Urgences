import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Platform, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../config/theme';
import { useI18n } from '../config/i18n';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;
};

export default function ServicesScreen({ navigation }: Props) {
  const { colors, mode } = useTheme();
  const { t } = useI18n();
  const isDark = mode === 'dark';

  const emergencyNumbers = [
    { number: '112', label: t('services_emergency_general'), icon: 'call', color: '#EF4444' },
    { number: '117', label: t('services_police'), icon: 'shield', color: '#3B82F6' },
    { number: '118', label: t('services_fire'), icon: 'flame', color: '#F97316' },
    { number: '119', label: 'SAMU', icon: 'medkit', color: '#10B981' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} />

      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <View style={[styles.headerCircle, { backgroundColor: isDark ? 'rgba(91,155,243,0.04)' : 'rgba(59,111,224,0.06)' }]} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('services_title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Bandeau en cours de développement */}
        <View style={[styles.devBanner, { backgroundColor: isDark ? '#1A2332' : '#FFF7ED', borderColor: '#F59E0B' + '40' }]}>
          <Ionicons name="construct" size={16} color="#F59E0B" />
          <Text style={[styles.devBannerText, { color: isDark ? '#FBBF24' : '#92400E' }]}>
            {t('services_dev_banner')}
          </Text>
        </View>

        {/* Numéros d'urgence */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('services_emergency_numbers')}</Text>
        <View style={styles.numbersGrid}>
          {emergencyNumbers.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.numberCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => Linking.openURL(`tel:${item.number}`)}
              activeOpacity={0.7}
            >
              <View style={[styles.numberIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text style={[styles.numberValue, { color: colors.text }]}>{item.number}</Text>
              <Text style={[styles.numberLabel, { color: colors.textMuted }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Services */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('services_nearby')}</Text>

        <TouchableOpacity
          style={[styles.serviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigation.navigate('Hospitals')}
          activeOpacity={0.7}
        >
          <View style={[styles.serviceIcon, { backgroundColor: colors.successLight }]}>
            <Ionicons name="medical" size={24} color={colors.success} />
          </View>
          <View style={styles.serviceBody}>
            <Text style={[styles.serviceName, { color: colors.text }]}>{t('home_hospitals')}</Text>
            <Text style={[styles.serviceDesc, { color: colors.textMuted }]}>{t('home_hospitals_desc')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.serviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigation.navigate('Pharmacies')}
          activeOpacity={0.7}
        >
          <View style={[styles.serviceIcon, { backgroundColor: colors.accentLight }]}>
            <Ionicons name="medkit" size={24} color={colors.accent} />
          </View>
          <View style={styles.serviceBody}>
            <Text style={[styles.serviceName, { color: colors.text }]}>{t('home_pharmacies')}</Text>
            <Text style={[styles.serviceDesc, { color: colors.textMuted }]}>{t('home_pharmacies_desc')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.serviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigation.navigate('EmergencyCall')}
          activeOpacity={0.7}
        >
          <View style={[styles.serviceIcon, { backgroundColor: colors.warningLight }]}>
            <Ionicons name="call" size={24} color={colors.warning} />
          </View>
          <View style={styles.serviceBody}>
            <Text style={[styles.serviceName, { color: colors.text }]}>{t('home_emergency_numbers')}</Text>
            <Text style={[styles.serviceDesc, { color: colors.textMuted }]}>{t('home_emergency_numbers_desc')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 58 : 44,
    paddingBottom: 20, paddingHorizontal: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  headerCircle: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -50, right: -40,
  },
  headerTitle: { fontSize: 24, fontWeight: '800' },

  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },

  devBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 16,
  },
  devBannerText: { fontSize: 12, fontWeight: '600', flex: 1 },

  sectionTitle: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 12, marginLeft: 4,
  },

  numbersGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28,
  },
  numberCard: {
    width: '47%', borderRadius: 16, borderWidth: 1, padding: 16, alignItems: 'center', gap: 8,
  },
  numberIcon: {
    width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
  },
  numberValue: { fontSize: 24, fontWeight: '900' },
  numberLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  serviceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 18, borderRadius: 16, borderWidth: 1, marginBottom: 10,
  },
  serviceIcon: {
    width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
  },
  serviceBody: { flex: 1 },
  serviceName: { fontSize: 15, fontWeight: '700' },
  serviceDesc: { fontSize: 12, marginTop: 2 },
});
