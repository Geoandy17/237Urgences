import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
  Alert, Platform, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../config/theme';
import { useI18n } from '../config/i18n';
import { useAuth } from '../config/auth';
import { apiGetProfil, apiUpdateProfil, apiGetMesIncidents, apiLogout } from '../services/api';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { colors, mode, setTheme } = useTheme();
  const { t, language, setLanguage } = useI18n();
  const { user, logout } = useAuth();
  const isDark = mode === 'dark';

  const state = navigation.getState();
  const showBack = navigation.canGoBack() && state?.type !== ('tab' as string);

  // Profil éditable
  const [editMode, setEditMode] = useState(false);
  const [nom, setNom] = useState(user?.nom || '');
  const [prenom, setPrenom] = useState(user?.prenom || '');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [totalIncidents, setTotalIncidents] = useState(0);

  useEffect(() => {
    // Charger le profil complet + stats
    apiGetProfil().then(r => {
      if (r.success && r.data) {
        setNom(r.data.nom);
        setPrenom(r.data.prenom);
        setEmail(r.data.email || '');
      }
    }).catch(() => {});
    apiGetMesIncidents(0, 1).then(r => {
      if (r.success && r.data) setTotalIncidents(r.data.totalElements);
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await apiUpdateProfil({
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim() || undefined,
      });
      if (result.success) {
        setEditMode(false);
        const msg = language === 'fr' ? 'Profil mis à jour' : 'Profile updated';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('', msg);
      } else {
        const msg = result.message || t('error');
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert(t('error'), msg);
      }
    } catch {
      if (Platform.OS === 'web') window.alert(t('error'));
      else Alert.alert(t('error'));
    }
    setSaving(false);
  };

  const handleLogout = () => {
    const doLogout = async () => {
      try { await apiLogout(); } catch {}
      logout();
    };
    if (Platform.OS === 'web') {
      if (window.confirm(language === 'fr' ? 'Se déconnecter ?' : 'Log out?')) doLogout();
    } else {
      Alert.alert(
        t('settings_logout'),
        language === 'fr' ? 'Voulez-vous vous déconnecter ?' : 'Do you want to log out?',
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('ok'), style: 'destructive', onPress: doLogout },
        ],
      );
    }
  };

  const roleLabel = user?.role === 'CITOYEN' ? (language === 'fr' ? 'Citoyen' : 'Citizen')
    : user?.role === 'ADMIN' ? 'Admin'
    : user?.role || (language === 'fr' ? 'Utilisateur' : 'User');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ===== HEADER PROFIL ===== */}
        <View style={[styles.profileHeader, { backgroundColor: colors.headerBg }]}>
          <View style={[styles.headerDecor1, { backgroundColor: isDark ? 'rgba(0,150,57,0.06)' : 'rgba(0,150,57,0.08)' }]} />
          <View style={[styles.headerDecor2, { backgroundColor: isDark ? 'rgba(206,17,38,0.04)' : 'rgba(206,17,38,0.06)' }]} />

          {/* Top bar */}
          <View style={styles.headerTopRow}>
            {showBack ? (
              <TouchableOpacity
                style={[styles.headerBtn, { backgroundColor: isDark ? '#1A1A1A' : '#FFF' }]}
                onPress={() => navigation.goBack()} activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </TouchableOpacity>
            ) : <View style={{ width: 38 }} />}
            <View style={{ width: 38 }} />
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: isDark ? '#1A1A1A' : '#FFF' }]}
              onPress={() => setEditMode(!editMode)} activeOpacity={0.7}
            >
              <Ionicons name={editMode ? 'close' : 'create-outline'} size={18} color={colors.accent} />
            </TouchableOpacity>
          </View>

          {/* Avatar + Nom */}
          <View style={styles.profileAvatarSection}>
            <View style={[styles.avatarLarge, { backgroundColor: colors.accent }]}>
              <Text style={styles.avatarLargeText}>
                {(user?.prenom?.[0] || 'U').toUpperCase()}{(user?.nom?.[0] || '').toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.profileFullName, { color: colors.text }]}>
              {user?.prenom} {user?.nom}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: isDark ? '#1A2332' : '#EFF6FF' }]}>
              <Ionicons name="shield-checkmark" size={12} color={colors.accent} />
              <Text style={[styles.roleText, { color: colors.accent }]}>{roleLabel}</Text>
            </View>
          </View>

          {/* Stats mini */}
          <View style={styles.profileStatsRow}>
            <View style={[styles.profileStat, { backgroundColor: isDark ? '#111' : '#FFF' }]}>
              <Text style={[styles.profileStatNum, { color: '#3B82F6' }]}>{totalIncidents}</Text>
              <Text style={[styles.profileStatLabel, { color: colors.textMuted }]}>
                {language === 'fr' ? 'Signalements' : 'Reports'}
              </Text>
            </View>
            <View style={[styles.profileStat, { backgroundColor: isDark ? '#111' : '#FFF' }]}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={[styles.profileStatLabel, { color: colors.textMuted }]}>
                {language === 'fr' ? 'Vérifié' : 'Verified'}
              </Text>
            </View>
            <View style={[styles.profileStat, { backgroundColor: isDark ? '#111' : '#FFF' }]}>
              <Text style={[styles.profileStatNum, { color: '#F59E0B' }]}>v1.0</Text>
              <Text style={[styles.profileStatLabel, { color: colors.textMuted }]}>Version</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>

          {/* ===== INFOS PERSONNELLES ===== */}
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBg, { backgroundColor: '#3B82F615' }]}>
              <Ionicons name="person" size={15} color="#3B82F6" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {language === 'fr' ? 'Informations personnelles' : 'Personal information'}
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Nom */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldLeft}>
                <Ionicons name="person-outline" size={16} color={colors.textMuted} />
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                  {language === 'fr' ? 'Nom' : 'Last name'}
                </Text>
              </View>
              {editMode ? (
                <TextInput
                  style={[styles.fieldInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#111' : '#F8FAFC' }]}
                  value={nom} onChangeText={setNom}
                />
              ) : (
                <Text style={[styles.fieldValue, { color: colors.text }]}>{nom}</Text>
              )}
            </View>
            <View style={[styles.fieldDivider, { backgroundColor: colors.border }]} />

            {/* Prénom */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldLeft}>
                <Ionicons name="person-outline" size={16} color={colors.textMuted} />
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                  {language === 'fr' ? 'Prénom' : 'First name'}
                </Text>
              </View>
              {editMode ? (
                <TextInput
                  style={[styles.fieldInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#111' : '#F8FAFC' }]}
                  value={prenom} onChangeText={setPrenom}
                />
              ) : (
                <Text style={[styles.fieldValue, { color: colors.text }]}>{prenom}</Text>
              )}
            </View>
            <View style={[styles.fieldDivider, { backgroundColor: colors.border }]} />

            {/* Téléphone (non éditable) */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldLeft}>
                <Ionicons name="call-outline" size={16} color={colors.textMuted} />
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                  {language === 'fr' ? 'Téléphone' : 'Phone'}
                </Text>
              </View>
              <View style={styles.fieldRight}>
                <Text style={[styles.fieldValue, { color: colors.text }]}>{user?.telephone}</Text>
                <View style={[styles.verifiedBadge, { backgroundColor: '#10B98115' }]}>
                  <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                </View>
              </View>
            </View>
            <View style={[styles.fieldDivider, { backgroundColor: colors.border }]} />

            {/* Email */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldLeft}>
                <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Email</Text>
              </View>
              {editMode ? (
                <TextInput
                  style={[styles.fieldInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#111' : '#F8FAFC' }]}
                  value={email} onChangeText={setEmail}
                  keyboardType="email-address" autoCapitalize="none"
                  placeholder="email@exemple.com" placeholderTextColor={colors.textMuted}
                />
              ) : (
                <Text style={[styles.fieldValue, { color: email ? colors.text : colors.textMuted }]}>
                  {email || (language === 'fr' ? 'Non renseigné' : 'Not set')}
                </Text>
              )}
            </View>

            {/* Bouton Sauvegarder */}
            {editMode && (
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: '#009639' }]}
                onPress={handleSave} disabled={saving} activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#FFF" />
                    <Text style={styles.saveBtnText}>
                      {language === 'fr' ? 'Enregistrer' : 'Save'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* ===== PRÉFÉRENCES ===== */}
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBg, { backgroundColor: '#8B5CF615' }]}>
              <Ionicons name="settings" size={15} color="#8B5CF6" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {language === 'fr' ? 'Préférences' : 'Preferences'}
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Thème */}
            <View style={styles.prefRow}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={isDark ? '#F59E0B' : '#F97316'} />
              <Text style={[styles.prefLabel, { color: colors.text }]}>{t('settings_theme')}</Text>
            </View>
            <View style={[styles.themeToggle, { backgroundColor: isDark ? '#0A0A0A' : '#F1F5F9' }]}>
              <TouchableOpacity
                style={[styles.themeBtn, mode === 'light' && { backgroundColor: colors.accent }]}
                onPress={() => setTheme('light')} activeOpacity={0.7}
              >
                <Ionicons name="sunny" size={16} color={mode === 'light' ? '#FFF' : colors.textMuted} />
                <Text style={[styles.themeBtnText, { color: mode === 'light' ? '#FFF' : colors.textMuted }]}>
                  {t('settings_light')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeBtn, mode === 'dark' && { backgroundColor: colors.accent }]}
                onPress={() => setTheme('dark')} activeOpacity={0.7}
              >
                <Ionicons name="moon" size={16} color={mode === 'dark' ? '#FFF' : colors.textMuted} />
                <Text style={[styles.themeBtnText, { color: mode === 'dark' ? '#FFF' : colors.textMuted }]}>
                  {t('settings_dark')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.fieldDivider, { backgroundColor: colors.border, marginVertical: 14 }]} />

            {/* Langue */}
            <View style={styles.prefRow}>
              <Ionicons name="language" size={18} color="#3B82F6" />
              <Text style={[styles.prefLabel, { color: colors.text }]}>{t('settings_language')}</Text>
            </View>
            <View style={styles.langOptions}>
              <TouchableOpacity
                style={[styles.langOption, {
                  backgroundColor: language === 'fr' ? (isDark ? colors.accentLight : '#EDF2FF') : 'transparent',
                  borderColor: language === 'fr' ? colors.accent : colors.border,
                }]}
                onPress={() => setLanguage('fr')} activeOpacity={0.7}
              >
                <Text style={styles.langFlag}>🇫🇷</Text>
                <Text style={[styles.langName, { color: language === 'fr' ? colors.accent : colors.text }]}>Français</Text>
                {language === 'fr' && <Ionicons name="checkmark-circle" size={16} color={colors.accent} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langOption, {
                  backgroundColor: language === 'en' ? (isDark ? colors.accentLight : '#EDF2FF') : 'transparent',
                  borderColor: language === 'en' ? colors.accent : colors.border,
                }]}
                onPress={() => setLanguage('en')} activeOpacity={0.7}
              >
                <Text style={styles.langFlag}>🇬🇧</Text>
                <Text style={[styles.langName, { color: language === 'en' ? colors.accent : colors.text }]}>English</Text>
                {language === 'en' && <Ionicons name="checkmark-circle" size={16} color={colors.accent} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* ===== À PROPOS ===== */}
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBg, { backgroundColor: '#10B98115' }]}>
              <Ionicons name="information-circle" size={15} color="#10B981" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('settings_about')}
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.aboutRow}>
              <View style={[styles.aboutIconBg, { backgroundColor: '#CE112615' }]}>
                <Ionicons name="shield-checkmark" size={20} color="#CE1126" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.aboutAppName, { color: colors.text }]}>237 Urgences</Text>
                <Text style={[styles.aboutDesc, { color: colors.textMuted }]}>
                  {language === 'fr'
                    ? 'Application de signalement d\'urgence au Cameroun'
                    : 'Emergency reporting app in Cameroon'}
                </Text>
              </View>
            </View>
            <View style={[styles.fieldDivider, { backgroundColor: colors.border }]} />
            <View style={styles.aboutInfoGrid}>
              {[
                { label: 'Version', value: '1.0.0', icon: 'code-slash' as const },
              ].map((item, idx) => (
                <View key={idx} style={styles.aboutInfoItem}>
                  <Ionicons name={item.icon} size={13} color={colors.textMuted} />
                  <Text style={[styles.aboutInfoLabel, { color: colors.textMuted }]}>{item.label}</Text>
                  <Text style={[styles.aboutInfoValue, { color: colors.text }]}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ===== DÉCONNEXION ===== */}
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: isDark ? '#1A0A0A' : '#FEF2F2', borderColor: '#EF444430' }]}
            onPress={handleLogout} activeOpacity={0.7}
          >
            <View style={[styles.logoutIconBg, { backgroundColor: '#EF4444' }]}>
              <Ionicons name="log-out" size={18} color="#FFF" />
            </View>
            <Text style={[styles.logoutText, { color: '#EF4444' }]}>{t('settings_logout')}</Text>
            <Ionicons name="chevron-forward" size={18} color="#EF4444" />
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Profile header
  profileHeader: {
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingBottom: 20, paddingHorizontal: 20,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  headerDecor1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, top: -60, right: -50 },
  headerDecor2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, bottom: -30, left: -30 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerBtn: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },

  profileAvatarSection: { alignItems: 'center', marginBottom: 18 },
  avatarLarge: {
    width: 72, height: 72, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  avatarLargeText: { color: '#FFF', fontSize: 26, fontWeight: '800' },
  profileFullName: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10,
  },
  roleText: { fontSize: 12, fontWeight: '700' },

  profileStatsRow: { flexDirection: 'row', gap: 10 },
  profileStat: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12,
    gap: 2,
  },
  profileStatNum: { fontSize: 16, fontWeight: '800' },
  profileStatLabel: { fontSize: 10, fontWeight: '600' },

  content: { paddingHorizontal: 20, paddingTop: 20 },

  // Section header
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sectionIconBg: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '700' },

  // Card
  card: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 20 },

  // Fields
  fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  fieldLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 110 },
  fieldLabel: { fontSize: 13, fontWeight: '600' },
  fieldValue: { fontSize: 14, fontWeight: '600', textAlign: 'right', flex: 1 },
  fieldRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end' },
  fieldInput: {
    flex: 1, fontSize: 14, fontWeight: '600', textAlign: 'right',
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  fieldDivider: { height: 1 },
  verifiedBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 14, paddingVertical: 13, borderRadius: 12,
  },
  saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  // Preferences
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  prefLabel: { fontSize: 14, fontWeight: '600' },
  themeToggle: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  themeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: 10,
  },
  themeBtnText: { fontSize: 13, fontWeight: '700' },

  langOptions: { flexDirection: 'row', gap: 10 },
  langOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
  },
  langFlag: { fontSize: 20 },
  langName: { fontSize: 13, fontWeight: '600' },

  // About
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  aboutIconBg: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  aboutAppName: { fontSize: 16, fontWeight: '700' },
  aboutDesc: { fontSize: 12, marginTop: 2, lineHeight: 17 },
  aboutInfoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  aboutInfoItem: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    width: '47%', paddingVertical: 6,
  },
  aboutInfoLabel: { fontSize: 11, fontWeight: '600' },
  aboutInfoValue: { fontSize: 11, fontWeight: '700' },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 16, borderWidth: 1,
  },
  logoutIconBg: { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  logoutText: { flex: 1, fontSize: 15, fontWeight: '700' },
});
