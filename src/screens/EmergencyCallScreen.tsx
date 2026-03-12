import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../config/theme';
import { useI18n } from '../config/i18n';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EmergencyCall'>;
};

const services = [
  { name_fr: 'Numéro d\'urgence', name_en: 'Emergency', phone: '112', icon: 'warning', color: '#CE1126' },
  { name_fr: 'Police', name_en: 'Police', phone: '117', icon: 'shield-checkmark', color: '#1E3A5F' },
  { name_fr: 'Gendarmerie', name_en: 'Gendarmerie', phone: '113', icon: 'people', color: '#2D5016' },
  { name_fr: 'Sapeurs-Pompiers', name_en: 'Firefighters', phone: '118', icon: 'flame', color: '#CC2200' },
  { name_fr: 'SAMU', name_en: 'SAMU', phone: '119', icon: 'medkit', color: '#E63946' },
  { name_fr: 'Croix-Rouge', name_en: 'Red Cross', phone: '+237 222 22 41 77', icon: 'heart', color: '#D62828' },
];

export default function EmergencyCallScreen({ navigation }: Props) {
  const { colors, mode } = useTheme();
  const { t, language } = useI18n();
  const isDark = mode === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} />

      {/* Header arrondi */}
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <View style={[styles.headerCircle, { backgroundColor: isDark ? 'rgba(206,17,38,0.04)' : 'rgba(206,17,38,0.06)' }]} />
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: isDark ? '#1A1A1A' : '#FFF' }]}
            onPress={() => navigation.goBack()} activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={[styles.headerIcon, { backgroundColor: '#CE112620' }]}>
          <Ionicons name="call" size={28} color="#CE1126" />
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('emergency_title')}</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{t('emergency_dev')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadowColor }]}>
          <View style={styles.tricolor}>
            <View style={[styles.tri, { backgroundColor: '#009639' }]} />
            <View style={[styles.tri, { backgroundColor: '#CE1126' }]} />
            <View style={[styles.tri, { backgroundColor: '#FCBF49' }]} />
          </View>

          {services.map((service, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.row,
                index < services.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
              ]}
              onPress={() => Linking.openURL(`tel:${service.phone.replace(/\s/g, '')}`)}
              activeOpacity={0.6}
            >
              <View style={[styles.iconCircle, { backgroundColor: service.color + '18' }]}>
                <Ionicons name={service.icon as any} size={22} color={service.color} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={[styles.serviceName, { color: colors.text }]}>
                  {language === 'fr' ? service.name_fr : service.name_en}
                </Text>
                <Text style={[styles.servicePhone, { color: colors.accent }]}>{service.phone}</Text>
              </View>
              <View style={[styles.callIcon, { backgroundColor: service.color + '15' }]}>
                <Ionicons name="call" size={18} color={service.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 58 : 44,
    paddingBottom: 24, paddingHorizontal: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    overflow: 'hidden', alignItems: 'center',
  },
  headerCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, top: -40, right: -40 },
  headerTop: { width: '100%', flexDirection: 'row', marginBottom: 16 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  headerIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  headerSub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  listCard: {
    borderRadius: 22, borderWidth: 1, overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 6,
  },
  tricolor: { flexDirection: 'row', height: 4 },
  tri: { flex: 1 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 18, paddingVertical: 16,
  },
  iconCircle: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  rowInfo: { flex: 1 },
  serviceName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  servicePhone: { fontSize: 17, fontWeight: '800', letterSpacing: 1 },
  callIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});
