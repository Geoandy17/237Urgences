import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, StatusBar, Platform, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../config/theme';
import { useI18n } from '../config/i18n';
import { hospitals } from '../data/emergencyData';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Hospitals'>;
};

export default function HospitalsScreen({ navigation }: Props) {
  const { colors, mode } = useTheme();
  const { t } = useI18n();
  const isDark = mode === 'dark';
  const [search, setSearch] = useState('');

  const filtered = hospitals.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} />

      {/* Header arrondi */}
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <View style={[styles.headerCircle, { backgroundColor: isDark ? 'rgba(0,150,57,0.04)' : 'rgba(0,150,57,0.06)' }]} />
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: isDark ? '#1A1A1A' : '#FFF' }]}
            onPress={() => navigation.goBack()} activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={[styles.headerIcon, { backgroundColor: '#00963920' }]}>
          <Ionicons name="medical" size={28} color="#009639" />
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('hospitals_title')}</Text>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('hospitals_search')}
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Info dev */}
      <View style={[styles.devBanner, { backgroundColor: isDark ? '#1A1500' : '#FFFBEB' }]}>
        <Ionicons name="construct-outline" size={14} color="#FCBF49" />
        <Text style={[styles.devText, { color: isDark ? '#FCBF49' : '#92400E' }]}>{t('hospitals_dev')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadowColor }]}>
          <View style={styles.tricolor}>
            <View style={[styles.tri, { backgroundColor: '#009639' }]} />
            <View style={[styles.tri, { backgroundColor: '#CE1126' }]} />
            <View style={[styles.tri, { backgroundColor: '#FCBF49' }]} />
          </View>

          {filtered.map((hospital, index) => (
            <TouchableOpacity
              key={hospital.id}
              style={[
                styles.row,
                index < filtered.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
              ]}
              onPress={() => Linking.openURL(`tel:${hospital.phone.replace(/\s/g, '')}`)}
              activeOpacity={0.6}
            >
              <View style={[styles.iconCircle, { backgroundColor: hospital.type === 'public' ? '#00963918' : '#FF980018' }]}>
                <Ionicons name="medical" size={20} color={hospital.type === 'public' ? '#009639' : '#FF9800'} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{hospital.name}</Text>
                <View style={styles.metaRow}>
                  <View style={[styles.badge, { backgroundColor: hospital.type === 'public' ? '#00963915' : '#FF980015' }]}>
                    <Text style={[styles.badgeText, { color: hospital.type === 'public' ? '#009639' : '#FF9800' }]}>
                      {hospital.type === 'public' ? t('hospitals_public') : t('hospitals_private')}
                    </Text>
                  </View>
                  <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                  <Text style={[styles.city, { color: colors.textMuted }]}>{hospital.city}</Text>
                </View>
              </View>
              <View style={[styles.phoneIcon, { backgroundColor: '#00963915' }]}>
                <Ionicons name="call" size={16} color="#009639" />
              </View>
            </TouchableOpacity>
          ))}

          {filtered.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Aucun résultat</Text>
            </View>
          )}
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
    paddingBottom: 20, paddingHorizontal: 24,
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
  headerIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: '800' },

  searchWrap: { paddingHorizontal: 20, paddingTop: 16 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, height: 46,
  },
  searchInput: { flex: 1, fontSize: 15 },

  devBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
  },
  devText: { fontSize: 12, flex: 1, lineHeight: 16 },

  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  listCard: {
    borderRadius: 22, borderWidth: 1, overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 6,
  },
  tricolor: { flexDirection: 'row', height: 4 },
  tri: { flex: 1 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  iconCircle: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  rowInfo: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  city: { fontSize: 11 },
  phoneIcon: { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },

  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 14 },
});
