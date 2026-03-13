import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Platform,
  ActivityIndicator, StatusBar, RefreshControl, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, StatutIncident } from '../types';
import { useTheme } from '../config/theme';
import { useI18n } from '../config/i18n';
import { apiGetMesIncidents, IncidentResponse } from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MyIncidents'>;
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

const TYPE_META: Record<string, { icon: string; color: string; fr: string; en: string }> = {
  INCENDIE: { icon: 'flame', color: '#EF4444', fr: 'Incendie', en: 'Fire' },
  AGRESSION: { icon: 'hand-left', color: '#8B5CF6', fr: 'Agression', en: 'Assault' },
  ACCIDENT_ROUTE: { icon: 'car', color: '#F97316', fr: 'Accident de route', en: 'Road Accident' },
  URGENCE_MEDICALE: { icon: 'medkit', color: '#10B981', fr: 'Urgence médicale', en: 'Medical Emergency' },
  CATASTROPHE_NATURELLE: { icon: 'thunderstorm', color: '#3B82F6', fr: 'Catastrophe naturelle', en: 'Natural Disaster' },
  AUTRE: { icon: 'ellipsis-horizontal-circle', color: '#6B7280', fr: 'Autre', en: 'Other' },
};

const STATUS_FILTERS: { key: 'all' | 'active' | 'resolved' | 'cancelled'; fr: string; en: string; icon: string }[] = [
  { key: 'all', fr: 'Tous', en: 'All', icon: 'apps' },
  { key: 'active', fr: 'En cours', en: 'Active', icon: 'pulse' },
  { key: 'resolved', fr: 'Résolus', en: 'Resolved', icon: 'checkmark-circle' },
  { key: 'cancelled', fr: 'Annulés', en: 'Cancelled', icon: 'close-circle' },
];

const ACTIVE_STATUSES: StatutIncident[] = ['ALERTE', 'ASSIGNE', 'EN_ROUTE', 'SUR_PLACE', 'EN_COURS'];
const RESOLVED_STATUSES: StatutIncident[] = ['RESOLU', 'CLOS'];

export default function MyIncidentsScreen({ navigation }: Props) {
  const navState = navigation.getState();
  const canGoBack = navigation.canGoBack() && navState?.type !== ('tab' as string);
  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved' | 'cancelled'>('all');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const { colors, mode } = useTheme();
  const { t, language } = useI18n();
  const isDark = mode === 'dark';

  const fetchIncidents = async (pageNum = 0, refresh = false) => {
    try {
      const result = await apiGetMesIncidents(pageNum, 20);
      if (result.success && result.data) {
        if (refresh || pageNum === 0) {
          setIncidents(result.data.content);
        } else {
          setIncidents((prev) => [...prev, ...result.data!.content]);
        }
        setHasMore(!result.data.last);
        setPage(pageNum);
      }
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchIncidents(0, true);
  }, []);

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchIncidents(page + 1);
    }
  };

  const statusKey = (s: StatutIncident) => `status_${s}` as any;

  // Client-side filtering
  const filteredIncidents = incidents.filter(i => {
    if (statusFilter === 'active' && !ACTIVE_STATUSES.includes(i.statut)) return false;
    if (statusFilter === 'resolved' && !RESOLVED_STATUSES.includes(i.statut)) return false;
    if (statusFilter === 'cancelled' && i.statut !== 'ANNULE') return false;
    if (typeFilter && i.typeUrgence !== typeFilter) return false;
    return true;
  });

  // Stats
  const activeCount = incidents.filter(i => ACTIVE_STATUSES.includes(i.statut)).length;
  const resolvedCount = incidents.filter(i => RESOLVED_STATUSES.includes(i.statut)).length;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', {
      hour: '2-digit', minute: '2-digit',
    });
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return language === 'fr' ? 'À l\'instant' : 'Just now';
    if (mins < 60) return `${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}j`;
  };

  const renderItem = ({ item }: { item: IncidentResponse }) => {
    const statusColor = STATUS_COLORS[item.statut] || colors.accent;
    const typeMeta = TYPE_META[item.typeUrgence] || { icon: 'alert-circle', color: colors.accent, fr: item.typeUrgence, en: item.typeUrgence };
    const isActive = ACTIVE_STATUSES.includes(item.statut);

    return (
      <TouchableOpacity
        style={[styles.card, {
          backgroundColor: colors.card, borderColor: colors.border,
          shadowColor: isDark ? '#000' : '#64748B',
          shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.2 : 0.08, shadowRadius: 12, elevation: 4,
        }]}
        onPress={() => navigation.navigate('IncidentTracking', { reference: item.reference })}
        activeOpacity={0.7}
      >
        {/* Top: Type icon + Status badge + Time ago */}
        <View style={styles.cardTop}>
          <View style={styles.cardTopLeft}>
            <View style={[styles.cardTypeIcon, { backgroundColor: typeMeta.color + '12' }]}>
              <Ionicons name={typeMeta.icon as any} size={18} color={typeMeta.color} />
            </View>
            <View>
              <Text style={[styles.cardType, { color: colors.text }]}>
                {language === 'fr' ? typeMeta.fr : typeMeta.en}
              </Text>
              <Text style={[styles.cardRef, { color: colors.textMuted }]}>{item.reference}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <View style={[styles.statusPill, { backgroundColor: statusColor + '15' }]}>
              {isActive && <View style={[styles.statusDotLive, { backgroundColor: statusColor }]} />}
              {!isActive && <View style={[styles.statusDot, { backgroundColor: statusColor }]} />}
              <Text style={[styles.statusText, { color: statusColor }]}>{t(statusKey(item.statut))}</Text>
            </View>
            <Text style={[styles.cardTimeAgo, { color: colors.textMuted }]}>{timeAgo(item.createdAt)}</Text>
          </View>
        </View>

        {/* Description */}
        {item.description ? (
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {/* Separator */}
        <View style={[styles.cardSep, { backgroundColor: colors.border }]} />

        {/* Bottom: Location + Date + Unit */}
        <View style={styles.cardBottom}>
          <View style={styles.cardInfoRow}>
            <Ionicons name="location-outline" size={13} color={colors.textMuted} />
            <Text style={[styles.cardInfoText, { color: colors.textMuted }]} numberOfLines={1}>
              {[item.quartier, item.ville].filter(Boolean).join(', ') || '-'}
            </Text>
          </View>
          <View style={styles.cardInfoRow}>
            <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
            <Text style={[styles.cardInfoText, { color: colors.textMuted }]}>
              {formatDate(item.createdAt)} · {formatTime(item.createdAt)}
            </Text>
          </View>
          {item.uniteAssignee && (
            <View style={styles.cardInfoRow}>
              <Ionicons name="shield-outline" size={13} color={colors.accent} />
              <Text style={[styles.cardInfoText, { color: colors.accent }]} numberOfLines={1}>
                {item.uniteAssignee.nom}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View style={styles.listHeader}>
      {/* Stats card with gradient */}
      <View style={[styles.statsCard, {
        backgroundColor: colors.card, borderColor: colors.border,
        shadowColor: isDark ? '#000' : '#64748B',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.2 : 0.1, shadowRadius: 12, elevation: 4,
      }]}>
        <View style={styles.statsGradient}>
          <View style={[styles.statsGradientPart, { backgroundColor: '#009639' }]} />
          <View style={[styles.statsGradientPart, { backgroundColor: '#CE1126' }]} />
          <View style={[styles.statsGradientPart, { backgroundColor: '#FCBF49' }]} />
        </View>
        <View style={styles.statsInner}>
          {[
            { value: incidents.length, label: 'Total', color: '#3B82F6', icon: 'document-text' as const },
            { value: activeCount, label: language === 'fr' ? 'Actifs' : 'Active', color: '#F59E0B', icon: 'pulse' as const },
            { value: resolvedCount, label: language === 'fr' ? 'Résolus' : 'Resolved', color: '#10B981', icon: 'checkmark-circle' as const },
          ].map((stat, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <View style={[styles.statDivider, { backgroundColor: colors.border }]} />}
              <View style={styles.statItem}>
                <View style={[styles.statIconBg, { backgroundColor: stat.color + '15' }]}>
                  <Ionicons name={stat.icon} size={14} color={stat.color} />
                </View>
                <Text style={[styles.statNumber, { color: stat.color }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Filtres combinés */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
        {/* Statut chips */}
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.key;
          const chipColor = f.key === 'active' ? '#F59E0B' : f.key === 'resolved' ? '#10B981' : f.key === 'cancelled' ? '#EF4444' : colors.accent;
          return (
            <TouchableOpacity
              key={`s-${f.key}`}
              style={[styles.filterChip, {
                backgroundColor: active ? chipColor : (isDark ? '#1A1A1A' : '#F1F5F9'),
                borderColor: active ? chipColor : colors.border,
              }]}
              onPress={() => setStatusFilter(f.key)}
              activeOpacity={0.7}
            >
              <Ionicons name={f.icon as any} size={13} color={active ? '#FFF' : chipColor} />
              <Text style={[styles.filterChipText, { color: active ? '#FFF' : colors.textMuted }]}>
                {language === 'fr' ? f.fr : f.en}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Séparateur vertical */}
        <View style={[styles.filterSep, { backgroundColor: colors.border }]} />

        {/* Type chips */}
        {Object.entries(TYPE_META).map(([key, meta]) => {
          const active = typeFilter === key;
          return (
            <TouchableOpacity
              key={`t-${key}`}
              style={[styles.filterChip, {
                backgroundColor: active ? meta.color : (isDark ? '#1A1A1A' : '#F1F5F9'),
                borderColor: active ? meta.color : colors.border,
              }]}
              onPress={() => setTypeFilter(active ? null : key)}
              activeOpacity={0.7}
            >
              <Ionicons name={meta.icon as any} size={13} color={active ? '#FFF' : meta.color} />
              <Text style={[styles.filterChipText, { color: active ? '#FFF' : colors.textMuted }]}>
                {language === 'fr' ? meta.fr : meta.en}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Result count */}
      <View style={styles.resultRow}>
        <Text style={[styles.resultCount, { color: colors.textMuted }]}>
          {filteredIncidents.length} {language === 'fr' ? 'signalement(s)' : 'report(s)'}
        </Text>
        {(statusFilter !== 'all' || typeFilter) && (
          <TouchableOpacity onPress={() => { setStatusFilter('all'); setTypeFilter(null); }} activeOpacity={0.7}>
            <Text style={[styles.clearFilters, { color: colors.accent }]}>
              {language === 'fr' ? 'Réinitialiser' : 'Clear'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <View style={[styles.headerDecorCircle1, { backgroundColor: isDark ? 'rgba(0,150,57,0.06)' : 'rgba(0,150,57,0.08)' }]} />
        <View style={[styles.headerDecorCircle2, { backgroundColor: isDark ? 'rgba(206,17,38,0.04)' : 'rgba(206,17,38,0.06)' }]} />
        <View style={styles.headerTopRow}>
          {canGoBack ? (
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: isDark ? '#1A1A1A' : '#FFF' }]}
              onPress={() => navigation.goBack()} activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <TouchableOpacity
            style={[styles.refreshBtn, { backgroundColor: isDark ? '#1A1A1A' : '#FFF' }]}
            onPress={onRefresh} activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={18} color={colors.accent} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerContent}>
          <View style={[styles.headerIconBg, { backgroundColor: isDark ? 'rgba(59,111,224,0.12)' : 'rgba(59,111,224,0.1)' }]}>
            <Ionicons name="document-text" size={20} color={colors.accent} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('my_incidents_title')}</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              {language === 'fr' ? 'Historique et suivi de vos alertes' : 'History and tracking of your alerts'}
            </Text>
          </View>
        </View>
      </View>

      {loading && incidents.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            {language === 'fr' ? 'Chargement...' : 'Loading...'}
          </Text>
        </View>
      ) : incidents.length === 0 ? (
        <View style={styles.center}>
          <View style={[styles.emptyIconBg, { backgroundColor: isDark ? '#1A2332' : '#EFF6FF' }]}>
            <Ionicons name="document-text-outline" size={48} color={colors.accent} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('my_incidents_empty')}</Text>
          <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>{t('my_incidents_empty_desc')}</Text>
          <TouchableOpacity
            style={[styles.emptyBtn, { backgroundColor: '#CE1126' }]}
            onPress={() => navigation.navigate('DeclareIncident')}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.emptyBtnText}>
              {language === 'fr' ? 'Déclarer un incident' : 'Report an incident'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredIncidents}
          renderItem={renderItem}
          keyExtractor={(item) => item.reference}
          contentContainerStyle={styles.list}
          ListHeaderComponent={ListHeader}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.filterEmpty}>
              <Ionicons name="filter-outline" size={36} color={colors.textMuted} />
              <Text style={[styles.filterEmptyText, { color: colors.textMuted }]}>
                {language === 'fr' ? 'Aucun signalement avec ce filtre' : 'No reports match this filter'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 10 },

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  headerDecorCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    top: -60, right: -50,
  },
  headerDecorCircle2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    bottom: -30, left: -30,
  },
  headerTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  refreshBtn: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconBg: {
    width: 42, height: 42, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  headerSub: { fontSize: 12, marginTop: 2 },

  // List header
  listHeader: { paddingBottom: 6 },

  // Stats card
  statsCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  statsGradient: { flexDirection: 'row', height: 3 },
  statsGradientPart: { flex: 1 },
  statsInner: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 6 },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, marginVertical: 4 },
  statIconBg: {
    width: 28, height: 28, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center', marginBottom: 1,
  },
  statNumber: { fontSize: 19, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600' },

  // Filters
  filtersRow: { gap: 7, marginBottom: 12, alignItems: 'center' as const },
  filterSep: { width: 1, height: 24, marginHorizontal: 2 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1,
  },
  filterChipText: { fontSize: 11, fontWeight: '600' },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  resultCount: { fontSize: 12, fontWeight: '600' },
  clearFilters: { fontSize: 12, fontWeight: '700' },

  // List
  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 30 },

  // Card
  card: {
    borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  cardTypeIcon: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  cardType: { fontSize: 14, fontWeight: '700' },
  cardRef: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  cardTimeAgo: { fontSize: 10, fontWeight: '600' },
  cardDesc: { fontSize: 13, lineHeight: 18, marginTop: 10 },
  cardSep: { height: 1, marginVertical: 12 },
  cardBottom: { gap: 6 },
  cardInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardInfoText: { fontSize: 12, flex: 1 },

  // Status pill
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusDotLive: { width: 6, height: 6, borderRadius: 3, opacity: 0.9 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' as any, letterSpacing: 0.3 },

  // Empty state
  emptyIconBg: {
    width: 90, height: 90, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyDesc: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 22, paddingVertical: 14, borderRadius: 14, marginTop: 10,
  },
  emptyBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  loadingText: { fontSize: 13, marginTop: 10 },

  // Filter empty
  filterEmpty: {
    alignItems: 'center', paddingVertical: 50, gap: 10,
  },
  filterEmptyText: { fontSize: 14, fontWeight: '600' },
});
