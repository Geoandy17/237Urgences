import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
  Animated, Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, StatutIncident } from '../types';
import { useTheme } from '../config/theme';
import { useI18n } from '../config/i18n';
import { useAuth } from '../config/auth';
import { apiGetMesIncidents, IncidentResponse } from '../services/api';
import Logo from '../components/Logo';
import { useFocusEffect } from '@react-navigation/native';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;
};

const STATUS_COLORS: Record<StatutIncident, string> = {
  ALERTE: '#F59E0B',
  ASSIGNE: '#3B82F6',
  EN_ROUTE: '#8B5CF6',
  SUR_PLACE: '#EC4899',
  EN_COURS: '#F97316',
  RESOLU: '#10B981',
  CLOS: '#6B7280',
  ANNULE: '#EF4444',
};

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  INCENDIE: { icon: 'flame', color: '#EF4444' },
  AGRESSION: { icon: 'hand-left', color: '#8B5CF6' },
  ACCIDENT_ROUTE: { icon: 'car', color: '#F97316' },
  URGENCE_MEDICALE: { icon: 'medkit', color: '#10B981' },
  CATASTROPHE_NATURELLE: { icon: 'thunderstorm', color: '#3B82F6' },
  AUTRE: { icon: 'ellipsis-horizontal-circle', color: '#6B7280' },
};

const TYPE_LABELS: Record<string, { fr: string; en: string }> = {
  INCENDIE: { fr: 'Incendie', en: 'Fire' },
  AGRESSION: { fr: 'Agression', en: 'Assault' },
  ACCIDENT_ROUTE: { fr: 'Accident', en: 'Accident' },
  URGENCE_MEDICALE: { fr: 'Médical', en: 'Medical' },
  CATASTROPHE_NATURELLE: { fr: 'Catastrophe', en: 'Disaster' },
  AUTRE: { fr: 'Autre', en: 'Other' },
};

const { width: SCREEN_W } = Dimensions.get('window');

// Illustration empty state signalements (documents animés)
function EmptyIncidentsIllustration({ isDark, accentColor }: { isDark: boolean; accentColor: string }) {
  const float = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -8, duration: 1500, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.8, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const bg = isDark ? '#1A2332' : '#EFF6FF';
  const ringBg = isDark ? '#0F1923' : '#DBEAFE';

  return (
    <View style={emptyStyles.wrap}>
      {/* Cercles décoratifs */}
      <Animated.View style={[emptyStyles.ring, { backgroundColor: ringBg, opacity: pulse }]} />
      <View style={[emptyStyles.ringSmall, { backgroundColor: ringBg }]} />

      {/* Document principal flottant */}
      <Animated.View style={[emptyStyles.doc, { backgroundColor: bg, transform: [{ translateY: float }] }]}>
        <View style={[emptyStyles.docLine, { backgroundColor: accentColor + '30', width: 40 }]} />
        <View style={[emptyStyles.docLine, { backgroundColor: isDark ? '#2A3544' : '#CBD5E1', width: 55 }]} />
        <View style={[emptyStyles.docLine, { backgroundColor: isDark ? '#2A3544' : '#CBD5E1', width: 35 }]} />
        <View style={[emptyStyles.docCheck, { backgroundColor: accentColor + '20' }]}>
          <Ionicons name="checkmark-circle" size={20} color={accentColor} />
        </View>
      </Animated.View>

      {/* Petit document derrière */}
      <View style={[emptyStyles.docSmall, { backgroundColor: isDark ? '#141E2B' : '#F1F5F9' }]}>
        <View style={[emptyStyles.docLine, { backgroundColor: isDark ? '#1E2D3D' : '#E2E8F0', width: 30 }]} />
        <View style={[emptyStyles.docLine, { backgroundColor: isDark ? '#1E2D3D' : '#E2E8F0', width: 20 }]} />
      </View>

      {/* Points décoratifs */}
      <Animated.View style={[emptyStyles.dot1, { backgroundColor: '#F59E0B', opacity: pulse }]} />
      <View style={[emptyStyles.dot2, { backgroundColor: '#10B981' }]} />
      <Animated.View style={[emptyStyles.dot3, { backgroundColor: '#3B82F6', opacity: pulse }]} />
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap: { width: 160, height: 140, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 130, height: 130, borderRadius: 65 },
  ringSmall: { position: 'absolute', width: 90, height: 90, borderRadius: 45, top: 30, right: 10 },
  doc: {
    width: 80, height: 95, borderRadius: 14, padding: 14, gap: 8,
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6,
  },
  docLine: { height: 6, borderRadius: 3 },
  docCheck: {
    width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center',
    alignSelf: 'flex-end', marginTop: 'auto',
  },
  docSmall: {
    position: 'absolute', width: 55, height: 65, borderRadius: 10, padding: 10, gap: 6,
    left: 8, bottom: 10, transform: [{ rotate: '-12deg' }],
  },
  dot1: { position: 'absolute', width: 8, height: 8, borderRadius: 4, top: 15, right: 20 },
  dot2: { position: 'absolute', width: 6, height: 6, borderRadius: 3, bottom: 20, left: 15 },
  dot3: { position: 'absolute', width: 10, height: 10, borderRadius: 5, top: 40, left: 5 },
});

// Illustration empty state services (bâtiment animé)
function EmptyServicesIllustration({ isDark, color }: { isDark: boolean; color: string }) {
  const float = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -6, duration: 1800, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.7, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const bg = isDark ? '#1A2332' : '#F0FDF4';
  const ringBg = isDark ? '#0F1923' : '#DCFCE7';

  return (
    <View style={svcEmptyStyles.wrap}>
      <Animated.View style={[svcEmptyStyles.ring, { backgroundColor: ringBg, opacity: pulse }]} />

      {/* Bâtiment principal */}
      <Animated.View style={[svcEmptyStyles.building, { backgroundColor: bg, transform: [{ translateY: float }] }]}>
        <View style={[svcEmptyStyles.cross, { backgroundColor: color }]}>
          <Ionicons name="add" size={16} color="#FFF" />
        </View>
        <View style={svcEmptyStyles.windowsRow}>
          <View style={[svcEmptyStyles.window, { backgroundColor: isDark ? '#2A3544' : '#BBF7D0' }]} />
          <View style={[svcEmptyStyles.window, { backgroundColor: isDark ? '#2A3544' : '#BBF7D0' }]} />
        </View>
        <View style={svcEmptyStyles.windowsRow}>
          <View style={[svcEmptyStyles.window, { backgroundColor: isDark ? '#2A3544' : '#BBF7D0' }]} />
          <View style={[svcEmptyStyles.window, { backgroundColor: isDark ? '#2A3544' : '#BBF7D0' }]} />
        </View>
        <View style={[svcEmptyStyles.door, { backgroundColor: isDark ? '#2A3544' : '#86EFAC' }]} />
      </Animated.View>

      {/* Petit bâtiment */}
      <View style={[svcEmptyStyles.buildingSmall, { backgroundColor: isDark ? '#141E2B' : '#E8F5E9' }]}>
        <View style={[svcEmptyStyles.windowTiny, { backgroundColor: isDark ? '#1E2D3D' : '#A7F3D0' }]} />
        <View style={[svcEmptyStyles.windowTiny, { backgroundColor: isDark ? '#1E2D3D' : '#A7F3D0' }]} />
      </View>

      {/* Points GPS */}
      <Animated.View style={[svcEmptyStyles.pin, { opacity: pulse }]}>
        <Ionicons name="location" size={18} color={color} />
      </Animated.View>
      <View style={[svcEmptyStyles.dot1, { backgroundColor: '#3B82F6' }]} />
      <Animated.View style={[svcEmptyStyles.dot2, { backgroundColor: '#F59E0B', opacity: pulse }]} />
    </View>
  );
}

const svcEmptyStyles = StyleSheet.create({
  wrap: { width: 160, height: 130, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 120, height: 120, borderRadius: 60 },
  building: {
    width: 70, height: 85, borderRadius: 12, padding: 10, alignItems: 'center', gap: 6,
    shadowColor: '#10B981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  cross: {
    width: 24, height: 24, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  windowsRow: { flexDirection: 'row', gap: 6 },
  window: { width: 14, height: 10, borderRadius: 3 },
  door: { width: 16, height: 14, borderRadius: 3, borderTopLeftRadius: 8, borderTopRightRadius: 8, marginTop: 'auto' },
  buildingSmall: {
    position: 'absolute', width: 40, height: 50, borderRadius: 8, padding: 8, gap: 5, alignItems: 'center',
    right: 12, bottom: 15,
  },
  windowTiny: { width: 12, height: 8, borderRadius: 2 },
  pin: { position: 'absolute', top: 8, right: 25 },
  dot1: { position: 'absolute', width: 7, height: 7, borderRadius: 4, bottom: 18, left: 18 },
  dot2: { position: 'absolute', width: 6, height: 6, borderRadius: 3, top: 25, left: 10 },
});

const SERVICE_TYPES = [
  { key: 'all', icon: 'apps', labelFr: 'Tous', labelEn: 'All', color: '#6366F1' },
  { key: 'hospitals', icon: 'medical', labelFr: 'Hôpitaux', labelEn: 'Hospitals', color: '#10B981' },
  { key: 'pharmacies', icon: 'medkit', labelFr: 'Pharmacies', labelEn: 'Pharmacies', color: '#3B82F6' },
  { key: 'clinics', icon: 'fitness', labelFr: 'Cliniques', labelEn: 'Clinics', color: '#EC4899' },
  { key: 'labs', icon: 'flask', labelFr: 'Laboratoires', labelEn: 'Labs', color: '#8B5CF6' },
  { key: 'emergency', icon: 'call', labelFr: 'Urgences', labelEn: 'Emergency', color: '#F59E0B' },
];

export default function HomeScreen({ navigation }: Props) {
  const { colors, mode } = useTheme();
  const { t, language } = useI18n();
  const { user } = useAuth();
  const [recentIncidents, setRecentIncidents] = useState<IncidentResponse[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string>('all');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecentIncidents();
    }, [])
  );

  const loadRecentIncidents = async () => {
    try {
      const result = await apiGetMesIncidents(0, 5);
      if (result.success && result.data) {
        setRecentIncidents(result.data.content);
      }
    } catch {}
  };

  const isDark = mode === 'dark';

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t('home_greeting_morning');
    if (h < 18) return t('home_greeting_afternoon');
    return t('home_greeting_evening');
  };

  const statusKey = (s: StatutIncident) => `status_${s}` as any;

  const filteredIncidents = selectedType
    ? recentIncidents.filter(i => i.typeUrgence === selectedType)
    : recentIncidents;

  // Stats
  const totalIncidents = recentIncidents.length;
  const enCoursCount = recentIncidents.filter(i =>
    ['ALERTE', 'ASSIGNE', 'EN_ROUTE', 'SUR_PLACE', 'EN_COURS'].includes(i.statut)
  ).length;
  const resolusCount = recentIncidents.filter(i =>
    ['RESOLU', 'CLOS'].includes(i.statut)
  ).length;


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ===== HEADER ===== */}
          <View style={[styles.header, { backgroundColor: isDark ? '#111' : '#FFF7ED' }]}>
            <View style={[styles.headerDecor, { backgroundColor: isDark ? 'rgba(206,17,38,0.06)' : 'rgba(206,17,38,0.08)' }]} />
            <View style={[styles.headerDecor2, { backgroundColor: isDark ? 'rgba(0,150,57,0.04)' : 'rgba(0,150,57,0.06)' }]} />

            <View style={styles.topRow}>
              <Logo size="small" variant="compact" />
              <TouchableOpacity
                style={[styles.avatar, { backgroundColor: colors.accent }]}
                onPress={() => navigation.navigate('Settings')}
                activeOpacity={0.7}
              >
                <Text style={styles.avatarLetter}>
                  {(user?.prenom?.[0] || 'U').toUpperCase()}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.greetingText, { color: colors.text }]}>
              {getGreeting()}, {user?.prenom || t('home_user_default')}
            </Text>
            <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
              {t('home_subtitle')}
            </Text>

            {/* ===== SOS HERO CARD ===== */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[styles.sosCard, {
                  shadowColor: '#CE1126',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.35,
                  shadowRadius: 20,
                  elevation: 12,
                }]}
                onPress={() => navigation.navigate('DeclareIncident')}
                activeOpacity={0.85}
              >
                <View style={styles.sosLeft}>
                  <View style={styles.sosBadge}>
                    <Ionicons name="warning" size={14} color="#FFF" />
                    <Text style={styles.sosBadgeText}>{t('home_sos')}</Text>
                  </View>
                  <Text style={styles.sosTitle}>{t('home_card_action')}</Text>
                  <Text style={styles.sosDesc}>{t('home_declare_desc')}</Text>
                </View>
                <View style={styles.sosRight}>
                  <View style={styles.sosIconCircle}>
                    <Ionicons name="alert-circle" size={42} color="#FFF" />
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* ===== STATS CARD ===== */}
          <View style={[styles.statsCard, {
            backgroundColor: colors.card, borderColor: colors.border,
            shadowColor: isDark ? '#000' : '#64748B',
            shadowOffset: { width: 0, height: 6 }, shadowOpacity: isDark ? 0.25 : 0.1, shadowRadius: 14, elevation: 5,
          }]}>
            {/* Gradient tricolore */}
            <View style={styles.statsGradient}>
              <View style={[styles.statsGradientPart, { backgroundColor: '#009639' }]} />
              <View style={[styles.statsGradientPart, { backgroundColor: '#CE1126' }]} />
              <View style={[styles.statsGradientPart, { backgroundColor: '#FCBF49' }]} />
            </View>
            <View style={styles.statsInner}>
              {[
                { value: totalIncidents, label: language === 'fr' ? 'Signalements' : 'Reports', icon: 'document-text' as const, color: '#3B82F6' },
                { value: enCoursCount, label: language === 'fr' ? 'En cours' : 'Active', icon: 'pulse' as const, color: '#F59E0B' },
                { value: resolusCount, label: language === 'fr' ? 'Résolus' : 'Resolved', icon: 'checkmark-circle' as const, color: '#10B981' },
              ].map((stat, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <View style={[styles.statDivider, { backgroundColor: colors.border }]} />}
                  <View style={styles.statItem}>
                    <View style={[styles.statIconBg, { backgroundColor: stat.color + '15' }]}>
                      <Ionicons name={stat.icon} size={16} color={stat.color} />
                    </View>
                    <Text style={[styles.statNumber, { color: colors.text }]}>{stat.value}</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* ===== TYPE CHIPS ===== */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            <TouchableOpacity
              style={[
                styles.chip,
                {
                  backgroundColor: !selectedType ? colors.accent : (isDark ? '#1A1A1A' : '#F1F5F9'),
                  borderColor: !selectedType ? colors.accent : colors.border,
                },
              ]}
              onPress={() => setSelectedType(null)}
              activeOpacity={0.7}
            >
              <Ionicons name="apps" size={14} color={!selectedType ? '#FFF' : colors.textMuted} />
              <Text style={[styles.chipText, { color: !selectedType ? '#FFF' : colors.textMuted }]}>
                {language === 'fr' ? 'Tous' : 'All'}
              </Text>
            </TouchableOpacity>
            {Object.entries(TYPE_ICONS).map(([type, info]) => {
              const active = selectedType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? info.color : (isDark ? '#1A1A1A' : '#F1F5F9'),
                      borderColor: active ? info.color : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedType(active ? null : type)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={info.icon as any} size={14} color={active ? '#FFF' : info.color} />
                  <Text style={[styles.chipText, { color: active ? '#FFF' : colors.textMuted }]}>
                    {TYPE_LABELS[type]?.[language] || type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ===== MES SIGNALEMENTS ===== */}
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('home_recent_incidents')}
            </Text>
            {recentIncidents.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('MyIncidents')} activeOpacity={0.7}>
                <Text style={[styles.seeAll, { color: colors.accent }]}>{t('home_see_all')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {filteredIncidents.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.incidentsRow}
            >
              {filteredIncidents.map((item) => {
                const statusColor = STATUS_COLORS[item.statut] || colors.accent;
                const typeInfo = TYPE_ICONS[item.typeUrgence] || { icon: 'alert-circle', color: colors.accent };
                const dateStr = item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })
                  : '';
                const timeStr = item.createdAt
                  ? new Date(item.createdAt).toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', {
                      hour: '2-digit', minute: '2-digit',
                    })
                  : '';
                return (
                  <TouchableOpacity
                    key={item.reference}
                    style={[styles.incidentCard, {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      shadowColor: isDark ? '#000' : '#64748B',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: isDark ? 0.25 : 0.1,
                      shadowRadius: 14,
                      elevation: 5,
                    }]}
                    onPress={() => navigation.navigate('IncidentTracking', { reference: item.reference })}
                    activeOpacity={0.7}
                  >
                    {/* Top row: icon + status */}
                    <View style={styles.incidentTopRow}>
                      <View style={[styles.incidentIconBg, { backgroundColor: typeInfo.color + '15' }]}>
                        <Ionicons name={typeInfo.icon as any} size={22} color={typeInfo.color} />
                      </View>
                      <View style={[styles.incidentStatusBadge, { backgroundColor: statusColor + '18' }]}>
                        <View style={[styles.incidentDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.incidentStatusText, { color: statusColor }]}>
                          {t(statusKey(item.statut))}
                        </Text>
                      </View>
                    </View>

                    {/* Type */}
                    <Text style={[styles.incidentType, { color: colors.text }]} numberOfLines={1}>
                      {TYPE_LABELS[item.typeUrgence]?.[language] || item.typeUrgence.replace(/_/g, ' ')}
                    </Text>

                    {/* Reference */}
                    <Text style={[styles.incidentRef, { color: colors.textMuted }]}>{item.reference}</Text>

                    {/* Separator */}
                    <View style={[styles.incidentSep, { backgroundColor: colors.borderLight || colors.border }]} />

                    {/* Bottom: location + date */}
                    <View style={styles.incidentBottom}>
                      <View style={styles.incidentInfoRow}>
                        <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                        <Text style={[styles.incidentCity, { color: colors.textSecondary }]} numberOfLines={1}>
                          {item.quartier ? `${item.quartier}, ${item.ville}` : item.ville}
                        </Text>
                      </View>
                      {dateStr ? (
                        <View style={styles.incidentInfoRow}>
                          <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                          <Text style={[styles.incidentDate, { color: colors.textMuted }]}>
                            {dateStr} · {timeStr}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            /* Empty state avec illustration animée */
            <View style={[styles.emptyCard, {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: isDark ? '#000' : '#64748B',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: isDark ? 0.2 : 0.08,
              shadowRadius: 16,
              elevation: 4,
            }]}>
              <EmptyIncidentsIllustration isDark={isDark} accentColor={colors.accent} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {t('my_incidents_empty')}
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                {t('my_incidents_empty_desc')}
              </Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.accent }]}
                onPress={() => navigation.navigate('DeclareIncident')}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color="#FFF" />
                <Text style={styles.emptyBtnText}>{t('home_card_action')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ===== SERVICES ===== */}
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('home_services')}
            </Text>
          </View>

          {/* Service type chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {SERVICE_TYPES.map((svc) => {
              const active = selectedService === svc.key;
              return (
                <TouchableOpacity
                  key={svc.key}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? svc.color : (isDark ? '#1A1A1A' : '#F1F5F9'),
                      borderColor: active ? svc.color : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedService(svc.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={svc.icon as any} size={14} color={active ? '#FFF' : svc.color} />
                  <Text style={[styles.chipText, { color: active ? '#FFF' : colors.textMuted }]}>
                    {language === 'fr' ? svc.labelFr : svc.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Services empty state */}
          <View style={{ height: 14 }} />
          <View style={[styles.emptyCard, {
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: isDark ? '#000' : '#64748B',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDark ? 0.2 : 0.08,
            shadowRadius: 16,
            elevation: 4,
          }]}>
            <EmptyServicesIllustration isDark={isDark} color="#10B981" />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t('home_no_services')}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
              {t('home_no_services_desc')}
            </Text>
          </View>


          <View style={{ height: 20 }} />
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
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  headerDecor: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    top: -60, right: -60,
  },
  headerDecor2: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    bottom: -40, left: -40,
  },
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarLetter: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  greetingText: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitleText: { fontSize: 14, marginBottom: 20 },

  // ===== SOS CARD =====
  sosCard: {
    flexDirection: 'row',
    backgroundColor: '#CE1126',
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  sosLeft: { flex: 1 },
  sosBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    marginBottom: 10,
  },
  sosBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  sosTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  sosDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 12, lineHeight: 17 },
  sosRight: { justifyContent: 'center', paddingLeft: 12 },
  sosIconCircle: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },

  // ===== CHIPS =====
  chipsRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '600' },

  // ===== SECTION =====
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, marginTop: 22, marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  seeAll: { fontSize: 13, fontWeight: '600' },

  // ===== INCIDENTS HORIZONTAL =====
  incidentsRow: {
    paddingHorizontal: 20, gap: 12,
  },
  incidentCard: {
    width: SCREEN_W * 0.52,
    borderRadius: 18, borderWidth: 1, padding: 16,
  },
  incidentTopRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  incidentIconBg: {
    width: 42, height: 42, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  incidentStatusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  incidentDot: { width: 6, height: 6, borderRadius: 3 },
  incidentStatusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' as any, letterSpacing: 0.3 },
  incidentType: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  incidentRef: { fontSize: 11, fontWeight: '600', marginBottom: 8 },
  incidentSep: { height: 1, marginBottom: 10 },
  incidentBottom: { gap: 5 },
  incidentInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  incidentCity: { fontSize: 12, flex: 1 },
  incidentDate: { fontSize: 11 },

  // ===== EMPTY STATE =====
  emptyCard: {
    marginHorizontal: 20, borderRadius: 22, borderWidth: 1,
    padding: 30, alignItems: 'center', gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  emptyDesc: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
    marginTop: 8,
  },
  emptyBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  // ===== STATS =====
  statsCard: {
    marginHorizontal: 20, marginTop: 18, borderRadius: 18, borderWidth: 1,
    overflow: 'hidden',
  },
  statsGradient: { flexDirection: 'row', height: 4 },
  statsGradientPart: { flex: 1 },
  statsInner: {
    flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 6,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, marginVertical: 4 },
  statIconBg: {
    width: 28, height: 28, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center', marginBottom: 1,
  },
  statNumber: { fontSize: 19, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600' },
});
