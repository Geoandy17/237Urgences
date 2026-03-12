import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform, Animated, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, IncidentPayload } from '../types';
import { useTheme } from '../config/theme';
import { useI18n } from '../config/i18n';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'IncidentConfirmation'>;
  route: RouteProp<RootStackParamList, 'IncidentConfirmation'>;
};

export default function IncidentConfirmationScreen({ navigation, route }: Props) {
  const { colors, mode } = useTheme();
  const { t } = useI18n();
  const isDark = mode === 'dark';
  const { payload } = route.params;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Séquence d'animation
    Animated.sequence([
      // 1. Le cercle de succès apparaît avec un bounce
      Animated.spring(scaleAnim, {
        toValue: 1, friction: 4, tension: 60, useNativeDriver: true,
      }),
      // 2. Le contenu slide + fade in
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    // Pulse continu sur le cercle
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const locationText = payload.location.mode === 'gps'
    ? payload.location.address || `${payload.location.latitude?.toFixed(4)}, ${payload.location.longitude?.toFixed(4)}`
    : `${payload.location.quartierManuel}, ${payload.location.villeManuelle}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Cercle de succès animé */}
        <Animated.View style={[styles.successArea, { transform: [{ scale: scaleAnim }] }]}>
          <Animated.View style={[styles.successRing3, {
            backgroundColor: '#009639' + '08',
            transform: [{ scale: pulseAnim }],
          }]}>
            <View style={[styles.successRing2, { backgroundColor: '#009639' + '12' }]}>
              <View style={[styles.successRing1, { backgroundColor: '#009639' }]}>
                <Ionicons name="checkmark" size={40} color="#FFF" />
              </View>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Titre + message */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={[styles.title, { color: colors.text }]}>{t('confirm_title')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('confirm_subtitle')}
          </Text>

          {/* Fiche récapitulative */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadowColor }]}>

            {/* Tricolore */}
            <View style={styles.tricolor}>
              <View style={[styles.tri, { backgroundColor: '#009639' }]} />
              <View style={[styles.tri, { backgroundColor: '#CE1126' }]} />
              <View style={[styles.tri, { backgroundColor: '#FCBF49' }]} />
            </View>

            {/* ID + Date */}
            <View style={[styles.cardTop, { backgroundColor: isDark ? '#0A0F1A' : '#F0F4FF' }]}>
              <View>
                <Text style={[styles.cardTopLabel, { color: colors.textMuted }]}>{t('confirm_id')}</Text>
                <Text style={[styles.cardTopId, { color: colors.accent }]}>{payload.id}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: '#009639' + '18' }]}>
                <View style={[styles.statusDot, { backgroundColor: '#009639' }]} />
                <Text style={[styles.statusText, { color: '#009639' }]}>{t('confirm_status')}</Text>
              </View>
            </View>

            {/* Infos */}
            <View style={styles.cardBody}>

              {/* Type */}
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: colors.dangerLight }]}>
                  <Ionicons name="warning" size={16} color={colors.danger} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{t('confirm_type')}</Text>
                  <Text style={[styles.rowValue, { color: colors.text }]}>{payload.typeLabel}</Text>
                </View>
              </View>

              <View style={[styles.sep, { backgroundColor: colors.borderLight }]} />

              {/* Description */}
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="document-text" size={16} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{t('confirm_desc')}</Text>
                  <Text style={[styles.rowValue, { color: colors.text }]} numberOfLines={2}>{payload.description}</Text>
                </View>
              </View>

              <View style={[styles.sep, { backgroundColor: colors.borderLight }]} />

              {/* Localisation */}
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: colors.warningLight }]}>
                  <Ionicons name="location" size={16} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{t('confirm_location')}</Text>
                  <Text style={[styles.rowValue, { color: colors.text }]}>{locationText}</Text>
                </View>
              </View>

              <View style={[styles.sep, { backgroundColor: colors.borderLight }]} />

              {/* Contact */}
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: colors.successLight }]}>
                  <Ionicons name="call" size={16} color={colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{t('confirm_contact')}</Text>
                  <Text style={[styles.rowValue, { color: colors.text }]}>
                    {payload.contactUrgence.nom ? `${payload.contactUrgence.nom} - ` : ''}
                    {payload.contactUrgence.countryDial} {payload.contactUrgence.phone}
                  </Text>
                </View>
              </View>

              <View style={[styles.sep, { backgroundColor: colors.borderLight }]} />

              {/* Date */}
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: isDark ? '#1A1A1A' : '#F1F5F9' }]}>
                  <Ionicons name="time" size={16} color={colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{t('confirm_date')}</Text>
                  <Text style={[styles.rowValue, { color: colors.text }]}>{formatDate(payload.timestamp)}</Text>
                </View>
              </View>
            </View>

            {/* Footer */}
            <View style={[styles.cardFooter, { borderTopColor: colors.borderLight, backgroundColor: isDark ? '#0A0F1A' : '#F8FAFC' }]}>
              <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
              <Text style={[styles.cardFooterText, { color: colors.textMuted }]}>
                {t('confirm_footer')}
              </Text>
            </View>
          </View>

          {/* Bouton retour */}
          <TouchableOpacity
            style={[styles.homeBtn, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('MainTabs')}
            activeOpacity={0.85}
          >
            <Ionicons name="home" size={20} color="#FFF" />
            <Text style={styles.homeBtnText}>{t('confirm_home')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.newBtn, { borderColor: colors.border }]}
            onPress={() => navigation.replace('DeclareIncident')}
            activeOpacity={0.7}
          >
            <Text style={[styles.newBtnText, { color: colors.text }]}>{t('confirm_new')}</Text>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
  },

  // Succès
  successArea: { alignItems: 'center', marginBottom: 24 },
  successRing3: {
    width: 130, height: 130, borderRadius: 65,
    justifyContent: 'center', alignItems: 'center',
  },
  successRing2: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
  },
  successRing1: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#009639', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },

  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 28, paddingHorizontal: 10 },

  // Card
  card: {
    borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 24,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 6,
  },
  tricolor: { flexDirection: 'row', height: 4 },
  tri: { flex: 1 },

  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 18,
  },
  cardTopLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  cardTopId: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },

  cardBody: { paddingHorizontal: 20, paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  rowIcon: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  rowLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 3 },
  rowValue: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  sep: { height: 1 },

  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderTopWidth: 1,
  },
  cardFooterText: { fontSize: 13, fontWeight: '600' },

  // Boutons
  homeBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 10, paddingVertical: 18, borderRadius: 16,
    marginBottom: 12,
  },
  homeBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  newBtn: {
    justifyContent: 'center', alignItems: 'center',
    paddingVertical: 16, borderRadius: 16, borderWidth: 1,
  },
  newBtnText: { fontSize: 15, fontWeight: '600' },
});
