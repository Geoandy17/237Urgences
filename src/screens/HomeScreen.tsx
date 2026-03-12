import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
  Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../config/theme';
import { useI18n } from '../config/i18n';
import { useAuth } from '../config/auth';
import Logo from '../components/Logo';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;
};

export default function HomeScreen({ navigation }: Props) {
  const { colors, mode } = useTheme();
  const { t } = useI18n();
  const { user } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const isDark = mode === 'dark';

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t('home_greeting_morning');
    if (h < 18) return t('home_greeting_afternoon');
    return t('home_greeting_evening');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ===== EN-TÊTE ===== */}
          <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
            <View style={[styles.headerCircle, { backgroundColor: isDark ? 'rgba(0,184,71,0.04)' : 'rgba(59,111,224,0.06)' }]} />

            <View style={styles.topRow}>
              <Logo size="small" variant="compact" />
              <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
                <Text style={styles.avatarLetter}>
                  {(user?.prenom?.[0] || 'U').toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={[styles.welcomeText, { color: colors.text }]}>
              {getGreeting()}, {user?.prenom || t('home_user_default')}
            </Text>
            <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
              {t('home_subtitle')}
            </Text>

            {/* CTA Button */}
            <TouchableOpacity
              style={[styles.ctaButton, { backgroundColor: colors.accent }]}
              onPress={() => navigation.navigate('DeclareIncident')}
              activeOpacity={0.85}
            >
              <Ionicons name="megaphone-outline" size={18} color="#FFF" />
              <Text style={styles.ctaText}>{t('home_declare_incident')}</Text>
              <View style={styles.ctaArrow}>
                <Ionicons name="arrow-forward" size={16} color={colors.accent} />
              </View>
            </TouchableOpacity>
          </View>

          {/* ===== CARTE SIGNALEMENT ===== */}
          <View style={[
            styles.mainCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.shadowColor,
            },
          ]}>
            {/* Barre tricolore top */}
            <View style={styles.cardTricolor}>
              <View style={[styles.triSeg, { backgroundColor: '#009639' }]} />
              <View style={[styles.triSeg, { backgroundColor: '#CE1126' }]} />
              <View style={[styles.triSeg, { backgroundColor: '#FCBF49' }]} />
            </View>

            {/* Header card */}
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIcon, { backgroundColor: isDark ? colors.accentLight : colors.accentLight }]}>
                  <Ionicons name="shield-checkmark" size={20} color={colors.accent} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t('home_card_title')}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: colors.successLight }]}>
                <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.statusText, { color: colors.success }]}>{t('home_card_active')}</Text>
              </View>
            </View>

            {/* Contenu dots + info */}
            <View style={styles.cardBody}>
              <View style={styles.dotTimeline}>
                <View style={[styles.timelineDot, { backgroundColor: colors.accent }]} />
                <View style={[styles.timelineLine, { backgroundColor: isDark ? '#222222' : '#E2E8F0' }]} />
                <View style={[styles.timelineDot, { backgroundColor: colors.success }]} />
              </View>
              <View style={styles.cardDetails}>
                <View style={styles.detailBlock}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{t('home_card_type')}</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {t('home_card_type_desc')}
                  </Text>
                </View>
                <View style={styles.detailBlock}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{t('home_card_sent_to')}</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {t('home_card_sent_to_desc')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Footer action */}
            <TouchableOpacity
              style={[styles.cardFooter, { borderTopColor: isDark ? '#1A1A1A' : '#F1F5F9' }]}
              onPress={() => navigation.navigate('DeclareIncident')}
              activeOpacity={0.7}
            >
              <Text style={[styles.cardFooterText, { color: colors.accent }]}>
                {t('home_card_action')}
              </Text>
              <View style={[styles.cardFooterArrow, { backgroundColor: isDark ? colors.accentLight : colors.accentLight }]}>
                <Ionicons name="arrow-forward" size={14} color={colors.accent} />
              </View>
            </TouchableOpacity>
          </View>

          {/* ===== SERVICES ===== */}
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('home_services')}
          </Text>

          <View style={styles.servicesRow}>
            {[
              { icon: 'medical-outline' as const, label: t('home_hospitals'), color: colors.success, bg: colors.successLight, nav: 'Hospitals' as const },
              { icon: 'medkit-outline' as const, label: t('home_pharmacies'), color: colors.accent, bg: colors.accentLight, nav: 'Pharmacies' as const },
              { icon: 'call-outline' as const, label: t('home_emergency_short'), color: colors.warning, bg: colors.warningLight, nav: 'EmergencyCall' as const },
            ].map((svc, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.serviceChip, {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  shadowColor: colors.shadowColor,
                }]}
                onPress={() => navigation.navigate(svc.nav)}
                activeOpacity={0.7}
              >
                <View style={[styles.serviceIcon, { backgroundColor: svc.bg }]}>
                  <Ionicons name={svc.icon} size={22} color={svc.color} />
                </View>
                <Text style={[styles.serviceLabel, { color: colors.text }]} numberOfLines={2}>
                  {svc.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 30 },

  // ===== HEADER =====
  header: {
    paddingTop: Platform.OS === 'ios' ? 58 : 44,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    marginBottom: 24,
  },
  headerCircle: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    top: -40, right: -40,
  },
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarLetter: {
    color: '#FFF', fontSize: 18, fontWeight: '700',
  },
  welcomeText: {
    fontSize: 26, fontWeight: '700', marginBottom: 4,
  },
  subtitleText: {
    fontSize: 15, marginBottom: 24,
  },
  ctaButton: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, paddingVertical: 15, paddingHorizontal: 18,
    gap: 10,
  },
  ctaText: {
    color: '#FFF', fontSize: 15, fontWeight: '600', flex: 1,
  },
  ctaArrow: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center',
  },

  // ===== MAIN CARD =====
  mainCard: {
    marginHorizontal: 20,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 28,
    // Shadow iOS
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    // Shadow Android
    elevation: 8,
  },
  cardTricolor: {
    flexDirection: 'row', height: 3,
  },
  triSeg: { flex: 1 },

  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4,
  },
  cardHeaderLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  cardIcon: {
    width: 36, height: 36, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15, fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  statusDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  statusText: {
    fontSize: 12, fontWeight: '700',
  },

  cardBody: {
    flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 18, gap: 16,
  },
  dotTimeline: {
    alignItems: 'center', paddingTop: 2,
  },
  timelineDot: {
    width: 10, height: 10, borderRadius: 5,
  },
  timelineLine: {
    width: 2, height: 40, marginVertical: 4,
  },
  cardDetails: {
    flex: 1, gap: 16,
  },
  detailBlock: {},
  detailLabel: {
    fontSize: 11, fontWeight: '500', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14, fontWeight: '600', lineHeight: 20,
  },

  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
    borderTopWidth: 1,
  },
  cardFooterText: {
    fontSize: 14, fontWeight: '600',
  },
  cardFooterArrow: {
    width: 30, height: 30, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },

  // ===== SECTION =====
  sectionTitle: {
    fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 14, marginLeft: 24,
  },

  // ===== SERVICES =====
  servicesRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 20,
  },
  serviceChip: {
    flex: 1, borderRadius: 18, padding: 16,
    alignItems: 'center', borderWidth: 1,
    // Shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  serviceIcon: {
    width: 50, height: 50, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
  },
  serviceLabel: {
    fontSize: 12, fontWeight: '600', textAlign: 'center',
  },
});
