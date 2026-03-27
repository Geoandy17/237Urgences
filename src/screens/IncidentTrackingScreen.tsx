import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
  ActivityIndicator, StatusBar, Animated, Linking, Alert, Image,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, StatutIncident } from '../types';
import { useTheme } from '../config/theme';
import { useI18n } from '../config/i18n';
import { apiGetIncidentSuivi, IncidentResponse, BASE_URL } from '../services/api';
import { connectWebSocket } from '../services/websocket';
import * as Clipboard from 'expo-clipboard';

// react-native-maps désactivé temporairement — pas de clé Google Maps configurée
// TODO: réactiver avec la clé API Google Maps dans app.json
// let MapView: any = null;
// let Marker: any = null;
// let PROVIDER_GOOGLE: any = null;
// if (Platform.OS !== 'web') {
//   try {
//     const Maps = require('react-native-maps');
//     MapView = Maps.default;
//     Marker = Maps.Marker;
//     PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
//   } catch {}
// }

const MEDIA_BASE_URL = BASE_URL.replace('/api/v1', '');

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'IncidentTracking'>;
  route: RouteProp<RootStackParamList, 'IncidentTracking'>;
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

const STATUS_ICONS: Record<StatutIncident, string> = {
  ALERTE: 'alert-circle',
  ASSIGNE: 'person-circle',
  EN_ROUTE: 'car',
  SUR_PLACE: 'location',
  EN_COURS: 'construct',
  RESOLU: 'checkmark-circle',
  CLOS: 'lock-closed',
  ANNULE: 'close-circle',
};

const TYPE_META: Record<string, { icon: string; color: string; fr: string; en: string }> = {
  INCENDIE: { icon: 'flame', color: '#EF4444', fr: 'Incendie', en: 'Fire' },
  AGRESSION: { icon: 'hand-left', color: '#8B5CF6', fr: 'Agression', en: 'Assault' },
  ACCIDENT_ROUTE: { icon: 'car', color: '#F97316', fr: 'Accident de route', en: 'Road Accident' },
  URGENCE_MEDICALE: { icon: 'medkit', color: '#10B981', fr: 'Urgence médicale', en: 'Medical Emergency' },
  CATASTROPHE_NATURELLE: { icon: 'thunderstorm', color: '#3B82F6', fr: 'Catastrophe naturelle', en: 'Natural Disaster' },
  AUTRE: { icon: 'ellipsis-horizontal-circle', color: '#6B7280', fr: 'Autre', en: 'Other' },
};

const GRAVITE_META: Record<string, { fr: string; en: string; color: string }> = {
  FAIBLE: { fr: 'Faible', en: 'Low', color: '#10B981' },
  MODEREE: { fr: 'Modérée', en: 'Moderate', color: '#F59E0B' },
  GRAVE: { fr: 'Grave', en: 'Severe', color: '#F97316' },
  CRITIQUE: { fr: 'Critique', en: 'Critical', color: '#EF4444' },
};

// Ordre des statuts pour la progress bar
const STATUS_ORDER: StatutIncident[] = ['ALERTE', 'ASSIGNE', 'EN_ROUTE', 'SUR_PLACE', 'EN_COURS', 'RESOLU', 'CLOS'];

export default function IncidentTrackingScreen({ navigation, route }: Props) {
  const { reference } = route.params;
  const [incident, setIncident] = useState<IncidentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [lastUpdatedText, setLastUpdatedText] = useState('');
  const { colors, mode } = useTheme();
  const { t, language } = useI18n();
  const isDark = mode === 'dark';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [playingAudio, setPlayingAudio] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const playMediaAudio = async (url: string) => {
    try {
      if (playingAudio && soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setPlayingAudio(false);
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri: url });
      soundRef.current = sound;
      setPlayingAudio(true);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingAudio(false);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
      await sound.playAsync();
    } catch {
      setPlayingAudio(false);
    }
  };

  const fetchIncident = async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await apiGetIncidentSuivi(reference);
      if (result.success && result.data) {
        setIncident(result.data);
        setLastUpdated(new Date());
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
    setLoading(false);
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  };

  useEffect(() => {
    fetchIncident();
    const disconnect = connectWebSocket(
      reference,
      (updatedIncident) => {
        setIncident(updatedIncident);
        setLastUpdated(new Date());
      },
      fetchIncident,
    );
    return () => { disconnect(); };
  }, [reference]);

  const computeLastUpdatedText = useCallback(() => {
    if (!lastUpdated) return;
    const diffSec = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (diffSec < 10) setLastUpdatedText(t('tracking_just_now'));
    else if (diffSec < 60) setLastUpdatedText(`${diffSec}s`);
    else setLastUpdatedText(`${Math.floor(diffSec / 60)} min`);
  }, [lastUpdated, t]);

  useEffect(() => {
    computeLastUpdatedText();
    const timer = setInterval(computeLastUpdatedText, 15000);
    return () => clearInterval(timer);
  }, [computeLastUpdatedText]);

  const copyReference = async () => {
    try {
      await Clipboard.setStringAsync(reference);
      if (Platform.OS === 'web') window.alert(t('tracking_copied'));
      else Alert.alert('', t('tracking_copied'));
    } catch {}
  };

  const callNumber = (phone: string) => { Linking.openURL(`tel:${phone}`); };
  const statusKey = (s: StatutIncident) => `status_${s}` as any;

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={colors.statusBar} />
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>{t('tracking_loading')}</Text>
      </View>
    );
  }

  if (error || !incident) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={colors.statusBar} />
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={[styles.errorText, { color: colors.text }]}>{t('tracking_error')}</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.accent }]} onPress={fetchIncident}>
          <Text style={styles.retryText}>{t('tracking_refresh')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 12 }} onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.accent, fontWeight: '600' }}>{t('incident_back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[incident.statut] || colors.accent;
  const statusIcon = STATUS_ICONS[incident.statut] || 'alert-circle';
  const typeMeta = TYPE_META[incident.typeUrgence] || { icon: 'alert-circle', color: colors.accent, fr: incident.typeUrgence, en: incident.typeUrgence };
  const graviteMeta = GRAVITE_META[incident.niveauGravite] || { fr: incident.niveauGravite, en: incident.niveauGravite, color: '#6B7280' };
  const isTerminal = ['RESOLU', 'CLOS', 'ANNULE'].includes(incident.statut);
  const currentStepIdx = incident.statut === 'ANNULE' ? -1 : STATUS_ORDER.indexOf(incident.statut);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <View style={[styles.headerDecor1, { backgroundColor: isDark ? 'rgba(0,150,57,0.06)' : 'rgba(0,150,57,0.08)' }]} />
        <View style={[styles.headerDecor2, { backgroundColor: isDark ? 'rgba(206,17,38,0.04)' : 'rgba(206,17,38,0.06)' }]} />
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: isDark ? '#1A1A1A' : '#FFF' }]}
            onPress={() => navigation.goBack()} activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('tracking_title')}</Text>
          </View>
          <TouchableOpacity
            style={[styles.refreshIconBtn, { backgroundColor: isDark ? '#1A1A1A' : '#FFF' }]}
            onPress={fetchIncident} activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={18} color={colors.accent} />
          </TouchableOpacity>
        </View>
        {lastUpdatedText ? (
          <View style={styles.lastUpdateRow}>
            <View style={[styles.liveDot, { backgroundColor: isTerminal ? '#6B7280' : '#10B981' }]} />
            <Text style={[styles.lastUpdateText, { color: colors.textMuted }]}>
              {t('tracking_last_update')} : {lastUpdatedText}
            </Text>
          </View>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ===== HERO CARD : Statut + Type + Référence ===== */}
          <View style={[styles.heroCard, {
            backgroundColor: colors.card, borderColor: colors.border,
            shadowColor: isDark ? '#000' : statusColor,
            shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 6,
          }]}>
            {/* Gradient tricolore */}
            <View style={styles.heroGradient}>
              <View style={[styles.heroGradientPart, { backgroundColor: '#009639' }]} />
              <View style={[styles.heroGradientPart, { backgroundColor: '#CE1126' }]} />
              <View style={[styles.heroGradientPart, { backgroundColor: '#FCBF49' }]} />
            </View>

            <View style={styles.heroInner}>
              {/* Row 1 : Type + Gravité */}
              <View style={styles.heroTopRow}>
                <View style={[styles.heroTypeIcon, { backgroundColor: typeMeta.color + '12' }]}>
                  <Ionicons name={typeMeta.icon as any} size={22} color={typeMeta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.heroType, { color: colors.text }]}>
                    {language === 'fr' ? typeMeta.fr : typeMeta.en}
                  </Text>
                  <TouchableOpacity onPress={copyReference} style={styles.heroRefRow} activeOpacity={0.7}>
                    <Text style={[styles.heroRef, { color: colors.accent }]}>{incident.reference}</Text>
                    <Ionicons name="copy-outline" size={12} color={colors.accent} />
                  </TouchableOpacity>
                </View>
                <View style={[styles.graviteBadge, { backgroundColor: graviteMeta.color + '15' }]}>
                  <Text style={[styles.graviteText, { color: graviteMeta.color }]}>
                    {language === 'fr' ? graviteMeta.fr : graviteMeta.en}
                  </Text>
                </View>
              </View>

              {/* Row 2 : Grand statut */}
              <View style={[styles.heroStatusRow, { backgroundColor: statusColor + '10' }]}>
                <View style={[styles.heroStatusIcon, { backgroundColor: statusColor + '20' }]}>
                  <Ionicons name={statusIcon as any} size={22} color={statusColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.heroStatusLabel, { color: colors.textMuted }]}>
                    {language === 'fr' ? 'STATUT ACTUEL' : 'CURRENT STATUS'}
                  </Text>
                  <Text style={[styles.heroStatusValue, { color: statusColor }]}>
                    {t(statusKey(incident.statut))}
                  </Text>
                </View>
                {!isTerminal && <View style={[styles.heroStatusLive, { backgroundColor: statusColor }]} />}
              </View>

              {/* Progress bar */}
              {incident.statut !== 'ANNULE' && (
                <View style={styles.progressContainer}>
                  <View style={[styles.progressTrack, { backgroundColor: isDark ? '#2A2A2A' : '#E2E8F0' }]}>
                    <View style={[styles.progressFill, {
                      backgroundColor: statusColor,
                      width: `${Math.max(((currentStepIdx) / (STATUS_ORDER.length - 1)) * 100, 5)}%`,
                    }]} />
                  </View>
                  <View style={styles.progressLabels}>
                    <Text style={[styles.progressLabelText, { color: statusColor }]}>
                      {currentStepIdx + 1}/{STATUS_ORDER.length}
                    </Text>
                    <Text style={[styles.progressLabelText, { color: colors.textMuted }]}>
                      {t(statusKey(STATUS_ORDER[STATUS_ORDER.length - 1]))}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* ===== INFOS CLÉS ===== */}
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.infoGrid}>
              <InfoItem icon="location" iconColor="#EF4444" label={language === 'fr' ? 'Localisation' : 'Location'}
                value={[incident.quartier, incident.ville].filter(Boolean).join(', ') || '-'}
                colors={colors} isDark={isDark} />
              <InfoItem icon="calendar" iconColor="#3B82F6" label="Date"
                value={new Date(incident.createdAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                colors={colors} isDark={isDark} />
              {incident.corpsPrenantEnCharge && (
                <InfoItem icon="shield" iconColor="#009639" label={language === 'fr' ? 'Corps en charge' : 'Responding body'}
                  value={incident.corpsPrenantEnCharge} colors={colors} isDark={isDark} />
              )}
              {incident.region && (
                <InfoItem icon="map" iconColor="#8B5CF6" label={language === 'fr' ? 'Région' : 'Region'}
                  value={incident.region} colors={colors} isDark={isDark} />
              )}
              {incident.nombreVictimesEstime != null && (
                <InfoItem icon="people" iconColor="#EC4899" label={language === 'fr' ? 'Victimes estimées' : 'Estimated victims'}
                  value={`${incident.nombreVictimesEstime}`} colors={colors} isDark={isDark} />
              )}
              {incident.tempsReponseMinutes != null && (
                <InfoItem icon="timer" iconColor="#F59E0B" label={language === 'fr' ? 'Temps de réponse' : 'Response time'}
                  value={`${incident.tempsReponseMinutes} min`} colors={colors} isDark={isDark} />
              )}
            </View>
          </View>

          {/* ===== DESCRIPTION ===== */}
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: '#3B82F615' }]}>
                <Ionicons name="document-text" size={16} color="#3B82F6" />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            </View>
            <Text style={[styles.descText, { color: colors.textSecondary }]}>{incident.description}</Text>
          </View>

          {/* ===== CHRONOLOGIE ===== */}
          {(incident.heureAssignation || incident.heureArrivee || incident.heureResolution) && (
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: '#8B5CF615' }]}>
                  <Ionicons name="time" size={16} color="#8B5CF6" />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('tracking_timeline')}</Text>
              </View>
              {[
                { time: incident.heureAssignation, label: t('tracking_assigned_at'), color: '#3B82F6', icon: 'person-add' },
                { time: incident.heureArrivee, label: t('tracking_arrived_at'), color: '#EC4899', icon: 'location' },
                { time: incident.heureResolution, label: t('tracking_resolved_at'), color: '#10B981', icon: 'checkmark-done' },
              ].filter(t => t.time).map((item, idx, arr) => (
                <View key={idx} style={styles.tlRow}>
                  <View style={styles.tlLeft}>
                    <View style={[styles.tlDotOuter, { borderColor: item.color }]}>
                      <View style={[styles.tlDotInner, { backgroundColor: item.color }]} />
                    </View>
                    {idx < arr.length - 1 && <View style={[styles.tlLine, { backgroundColor: isDark ? '#2A2A2A' : '#E2E8F0' }]} />}
                  </View>
                  <View style={[styles.tlContent, { backgroundColor: isDark ? '#111' : '#F8FAFC' }]}>
                    <View style={styles.tlContentTop}>
                      <Ionicons name={item.icon as any} size={14} color={item.color} />
                      <Text style={[styles.tlLabel, { color: item.color }]}>{item.label}</Text>
                    </View>
                    <Text style={[styles.tlValue, { color: colors.text }]}>
                      {new Date(item.time!).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ===== MEDIAS ===== */}
          {incident.medias && incident.medias.length > 0 && (
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: '#F59E0B15' }]}>
                  <Ionicons name="images" size={16} color="#F59E0B" />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('tracking_medias')}</Text>
                <Text style={[styles.sectionBadge, { color: colors.textMuted, backgroundColor: isDark ? '#1A1A1A' : '#F1F5F9' }]}>
                  {incident.medias.length}
                </Text>
              </View>
              {/* Photos */}
              {incident.medias.filter(m => m.type === 'IMAGE').length > 0 && (
                <View style={styles.photosGrid}>
                  {incident.medias.filter(m => m.type === 'IMAGE').map((media) => (
                    <Image
                      key={media.id}
                      source={{ uri: `${MEDIA_BASE_URL}${media.url}` }}
                      style={styles.mediaPhoto}
                      resizeMode="cover"
                    />
                  ))}
                </View>
              )}
              {/* Audio */}
              {incident.medias.filter(m => m.type === 'AUDIO').map((media) => (
                <TouchableOpacity
                  key={media.id}
                  style={[styles.audioBtn, { backgroundColor: isDark ? '#1A1A1A' : '#F1F5F9' }]}
                  onPress={() => playMediaAudio(`${MEDIA_BASE_URL}${media.url}`)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.audioBtnIcon, { backgroundColor: playingAudio ? '#EF444415' : '#3B82F615' }]}>
                    <Ionicons name={playingAudio ? 'stop' : 'play'} size={18} color={playingAudio ? '#EF4444' : '#3B82F6'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.audioName, { color: colors.text }]}>{media.nomFichier}</Text>
                    <Text style={[styles.audioHint, { color: colors.textMuted }]}>
                      {playingAudio ? t('tracking_stop_audio') : t('tracking_play_audio')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ===== UNITÉ ASSIGNÉE ===== */}
          {incident.uniteAssignee && (
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: '#00963915' }]}>
                  <Ionicons name="shield" size={16} color="#009639" />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('tracking_unit')}</Text>
              </View>
              <View style={[styles.unitBanner, { backgroundColor: isDark ? '#0A1A10' : '#F0FDF4' }]}>
                <View style={[styles.unitAvatarBg, { backgroundColor: '#009639' }]}>
                  <Ionicons name="shield-checkmark" size={22} color="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.unitName, { color: colors.text }]}>{incident.uniteAssignee.nom}</Text>
                  <Text style={[styles.unitCorps, { color: colors.textSecondary }]}>
                    {incident.uniteAssignee.corpsService}
                    {incident.uniteAssignee.typeUnite ? ` · ${incident.uniteAssignee.typeUnite}` : ''}
                  </Text>
                </View>
              </View>
              {/* Boutons d'appel */}
              <View style={styles.callRow}>
                {incident.uniteAssignee.telephoneStandard && (
                  <TouchableOpacity
                    style={[styles.callBtn, { backgroundColor: '#009639' }]}
                    onPress={() => callNumber(incident.uniteAssignee!.telephoneStandard!)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="call" size={16} color="#FFF" />
                    <Text style={styles.callText}>{t('tracking_call_standard')}</Text>
                  </TouchableOpacity>
                )}
                {incident.uniteAssignee.telephoneChef && (
                  <TouchableOpacity
                    style={[styles.callBtn, { backgroundColor: colors.accent }]}
                    onPress={() => callNumber(incident.uniteAssignee!.telephoneChef!)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="call" size={16} color="#FFF" />
                    <Text style={styles.callText}>{t('tracking_call_chef')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ===== CARTE MAP — désactivée temporairement (pas de clé Google Maps) ===== */}
          {/* TODO: réactiver quand la clé API Google Maps sera configurée dans app.json */}

          {/* ===== HISTORIQUE ===== */}
          {incident.historique && incident.historique.length > 0 && (
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: '#6366F115' }]}>
                  <Ionicons name="list" size={16} color="#6366F1" />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('tracking_history')}</Text>
                <Text style={[styles.sectionBadge, { color: colors.textMuted, backgroundColor: isDark ? '#1A1A1A' : '#F1F5F9' }]}>
                  {incident.historique.length}
                </Text>
              </View>
              {incident.historique.map((h, i) => {
                const hColor = STATUS_COLORS[h.nouveauStatut] || colors.accent;
                return (
                  <View key={i} style={styles.histRow}>
                    <View style={styles.histLeft}>
                      <View style={[styles.histDotOuter, { borderColor: hColor }]}>
                        <View style={[styles.histDotInner, { backgroundColor: hColor }]} />
                      </View>
                      {i < incident.historique.length - 1 && (
                        <View style={[styles.histLine, { backgroundColor: isDark ? '#2A2A2A' : '#E2E8F0' }]} />
                      )}
                    </View>
                    <View style={[styles.histContent, { borderColor: colors.border }]}>
                      <View style={styles.histContentTop}>
                        <View style={[styles.histStatusPill, { backgroundColor: hColor + '15' }]}>
                          <Text style={[styles.histStatusText, { color: hColor }]}>{t(statusKey(h.nouveauStatut))}</Text>
                        </View>
                        <Text style={[styles.histTime, { color: colors.textMuted }]}>
                          {new Date(h.changedAt).toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      {h.commentaire && (
                        <Text style={[styles.histComment, { color: colors.textSecondary }]}>{h.commentaire}</Text>
                      )}
                      <Text style={[styles.histAuthor, { color: colors.textMuted }]}>
                        {[h.modifieParPrenom, h.modifieParNom].filter(Boolean).join(' ')}
                        {h.modifieParRole ? ` · ${h.modifieParRole}` : ''}
                        {' · '}{new Date(h.changedAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short' })}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ===== DÉCLARANT ===== */}
          {(incident.signaleParNom || incident.signaleParTelephone) && (
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: '#EC489915' }]}>
                  <Ionicons name="person" size={16} color="#EC4899" />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {language === 'fr' ? 'Déclarant' : 'Reporter'}
                </Text>
              </View>
              <View style={styles.declarantRow}>
                <View style={[styles.declarantAvatar, { backgroundColor: isDark ? '#1A1A1A' : '#F1F5F9' }]}>
                  <Ionicons name="person" size={18} color={colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  {incident.signaleParNom && (
                    <Text style={[styles.declarantName, { color: colors.text }]}>{incident.signaleParNom}</Text>
                  )}
                  {incident.signaleParTelephone && (
                    <Text style={[styles.declarantPhone, { color: colors.textSecondary }]}>{incident.signaleParTelephone}</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function InfoItem({ icon, iconColor, label, value, colors, isDark }: any) {
  return (
    <View style={infoStyles.item}>
      <View style={[infoStyles.iconBg, { backgroundColor: iconColor + '12' }]}>
        <Ionicons name={icon} size={14} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[infoStyles.label, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[infoStyles.value, { color: colors.text }]} numberOfLines={2}>{value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, width: '50%' },
  iconBg: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginBottom: 1, textTransform: 'uppercase' as any },
  value: { fontSize: 12, fontWeight: '600', lineHeight: 17 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  errorText: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 16 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: '#FFF', fontWeight: '700' },

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomLeftRadius: 26, borderBottomRightRadius: 26,
    overflow: 'hidden',
  },
  headerDecor1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -50, right: -50 },
  headerDecor2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, bottom: -30, left: -20 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  refreshIconBtn: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  lastUpdateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, justifyContent: 'center' },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  lastUpdateText: { fontSize: 11, fontWeight: '500' },

  scrollContent: { paddingHorizontal: 20, paddingTop: 14 },

  // Hero card
  heroCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  heroGradient: { flexDirection: 'row', height: 4 },
  heroGradientPart: { flex: 1 },
  heroInner: { padding: 16 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  heroTypeIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  heroType: { fontSize: 16, fontWeight: '700' },
  heroRefRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  heroRef: { fontSize: 12, fontWeight: '700' },
  graviteBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  graviteText: { fontSize: 11, fontWeight: '700' },
  heroStatusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14,
  },
  heroStatusIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  heroStatusLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  heroStatusValue: { fontSize: 18, fontWeight: '800' },
  heroStatusLive: { width: 8, height: 8, borderRadius: 4, opacity: 0.8 },

  // Progress bar
  progressContainer: { marginTop: 14 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressLabelText: { fontSize: 10, fontWeight: '600' },

  // Info card
  infoCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap' },

  // Section card (generic)
  sectionCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sectionIconBg: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  sectionBadge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },

  descText: { fontSize: 14, lineHeight: 21 },

  // Timeline
  tlRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  tlLeft: { alignItems: 'center', width: 20 },
  tlDotOuter: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  tlDotInner: { width: 6, height: 6, borderRadius: 3 },
  tlLine: { width: 2, flex: 1, marginVertical: 2 },
  tlContent: { flex: 1, padding: 12, borderRadius: 12, marginBottom: 8 },
  tlContentTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  tlLabel: { fontSize: 11, fontWeight: '700' },
  tlValue: { fontSize: 13, fontWeight: '500' },

  // Medias
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  mediaPhoto: { width: 100, height: 100, borderRadius: 14 },
  audioBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, marginTop: 6 },
  audioBtnIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  audioName: { fontSize: 13, fontWeight: '600' },
  audioHint: { fontSize: 11, marginTop: 2 },

  // Unit
  unitBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, marginBottom: 12 },
  unitAvatarBg: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  unitName: { fontSize: 14, fontWeight: '700' },
  unitCorps: { fontSize: 12, marginTop: 2 },
  callRow: { flexDirection: 'row', gap: 8 },
  callBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  callText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  // Map
  map: { width: '100%', height: 200, marginTop: 8 },

  // History
  histRow: { flexDirection: 'row', gap: 10 },
  histLeft: { alignItems: 'center', width: 20 },
  histDotOuter: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  histDotInner: { width: 6, height: 6, borderRadius: 3 },
  histLine: { width: 2, flex: 1, marginVertical: 2 },
  histContent: { flex: 1, paddingBottom: 14, marginBottom: 4 },
  histContentTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  histStatusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  histStatusText: { fontSize: 11, fontWeight: '700' },
  histTime: { fontSize: 11, fontWeight: '600' },
  histComment: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  histAuthor: { fontSize: 11 },

  // Declarant
  declarantRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  declarantAvatar: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  declarantName: { fontSize: 14, fontWeight: '600' },
  declarantPhone: { fontSize: 12, marginTop: 2 },
});
