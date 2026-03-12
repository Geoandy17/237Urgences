import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/theme';
import { useI18n } from '../config/i18n';
import { useAuth } from '../config/auth';

export default function SettingsScreen() {
  const { colors, mode, setTheme } = useTheme();
  const { t, language, setLanguage } = useI18n();
  const { user, logout } = useAuth();
  const isDark = mode === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} />

      {/* Header avec fond */}
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <View style={[styles.headerCircle, { backgroundColor: isDark ? 'rgba(91,155,243,0.04)' : 'rgba(59,111,224,0.06)' }]} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings_title')}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Carte Profil */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadowColor }]}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.accent }]}>
            <Text style={styles.avatarLetter}>
              {(user?.prenom?.[0] || 'U').toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {user?.prenom} {user?.nom}
            </Text>
            <View style={styles.profilePhoneRow}>
              <View style={[styles.phoneTag, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="call" size={12} color={colors.primary} />
                <Text style={[styles.phoneTagText, { color: colors.primary }]}>{user?.phoneNumber}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.profileBadge, { backgroundColor: colors.successLight }]}>
            <Ionicons name="shield-checkmark" size={18} color={colors.success} />
          </View>
        </View>

        {/* Apparence */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('settings_theme')}</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadowColor }]}>
          <View style={[styles.themeToggle, { backgroundColor: isDark ? '#111111' : '#F1F5F9' }]}>
            <TouchableOpacity
              style={[styles.themeBtn, mode === 'dark' && { backgroundColor: colors.accent }]}
              onPress={() => setTheme('dark')} activeOpacity={0.7}
            >
              <Ionicons name="moon" size={18} color={mode === 'dark' ? '#FFF' : colors.textMuted} />
              <Text style={[styles.themeBtnText, { color: mode === 'dark' ? '#FFF' : colors.textMuted }]}>
                {t('settings_dark')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.themeBtn, mode === 'light' && { backgroundColor: colors.accent }]}
              onPress={() => setTheme('light')} activeOpacity={0.7}
            >
              <Ionicons name="sunny" size={18} color={mode === 'light' ? '#FFF' : colors.textMuted} />
              <Text style={[styles.themeBtnText, { color: mode === 'light' ? '#FFF' : colors.textMuted }]}>
                {t('settings_light')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Langue */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('settings_language')}</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadowColor }]}>
          <TouchableOpacity
            style={[styles.langRow, language === 'fr' && { backgroundColor: isDark ? colors.accentLight : '#EDF2FF' }]}
            onPress={() => setLanguage('fr')} activeOpacity={0.7}
          >
            <Text style={styles.flag}>🇫🇷</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.langName, { color: colors.text }]}>{t('settings_french')}</Text>
              <Text style={[styles.langSub, { color: colors.textMuted }]}>Français</Text>
            </View>
            {language === 'fr' && (
              <View style={[styles.checkCircle, { backgroundColor: colors.accent }]}>
                <Ionicons name="checkmark" size={14} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
          <View style={[styles.langDivider, { backgroundColor: colors.borderLight }]} />
          <TouchableOpacity
            style={[styles.langRow, language === 'en' && { backgroundColor: isDark ? colors.accentLight : '#EDF2FF' }]}
            onPress={() => setLanguage('en')} activeOpacity={0.7}
          >
            <Text style={styles.flag}>🇬🇧</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.langName, { color: colors.text }]}>{t('settings_english')}</Text>
              <Text style={[styles.langSub, { color: colors.textMuted }]}>English</Text>
            </View>
            {language === 'en' && (
              <View style={[styles.checkCircle, { backgroundColor: colors.accent }]}>
                <Ionicons name="checkmark" size={14} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* À propos */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('settings_about')}</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadowColor }]}>
          <View style={styles.aboutRow}>
            <View style={[styles.aboutIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.aboutName, { color: colors.text }]}>237 Urgences</Text>
              <Text style={[styles.aboutSub, { color: colors.textMuted }]}>Application de signalement d'urgence</Text>
            </View>
            <View style={[styles.versionBadge, { backgroundColor: isDark ? '#1A1A1A' : '#F1F5F9' }]}>
              <Text style={[styles.versionText, { color: colors.textSecondary }]}>{t('settings_version')}</Text>
            </View>
          </View>
        </View>

        {/* Déconnexion */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.dangerLight, borderColor: colors.danger + '30' }]}
          onPress={() => {
            if (Platform.OS === 'web') {
              if (window.confirm(t('settings_logout') + ' ?')) {
                logout();
              }
            } else {
              Alert.alert(t('settings_logout'), '', [
                { text: t('cancel'), style: 'cancel' },
                { text: t('ok'), style: 'destructive', onPress: () => logout() },
              ]);
            }
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.logoutIcon, { backgroundColor: colors.danger }]}>
            <Ionicons name="log-out" size={18} color="#FFF" />
          </View>
          <Text style={[styles.logoutText, { color: colors.danger }]}>{t('settings_logout')}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.danger} />
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 58 : 44,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  headerCircle: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    top: -50, right: -40,
  },
  headerTitle: { fontSize: 26, fontWeight: '800' },

  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },

  // Profil
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 24,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4,
  },
  avatarCircle: {
    width: 56, height: 56, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarLetter: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700' },
  profilePhoneRow: { marginTop: 6 },
  phoneTag: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  phoneTagText: { fontSize: 12, fontWeight: '600' },
  profileBadge: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },

  // Card
  card: {
    borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 20,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },

  // Theme toggle
  themeToggle: {
    flexDirection: 'row', margin: 6, borderRadius: 14, padding: 4,
  },
  themeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 10,
  },
  themeBtnText: { fontSize: 15, fontWeight: '700' },

  // Langue
  langRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 18, paddingVertical: 16,
  },
  flag: { fontSize: 26 },
  langName: { fontSize: 15, fontWeight: '600' },
  langSub: { fontSize: 12, marginTop: 1 },
  langDivider: { height: 1, marginHorizontal: 18 },
  checkCircle: {
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },

  // Section
  sectionTitle: {
    fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 10, marginLeft: 4,
  },

  // About
  aboutRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 18, paddingVertical: 18,
  },
  aboutIcon: {
    width: 42, height: 42, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  aboutName: { fontSize: 15, fontWeight: '700' },
  aboutSub: { fontSize: 12, marginTop: 2 },
  versionBadge: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  versionText: { fontSize: 12, fontWeight: '600' },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 18, borderRadius: 18, borderWidth: 1, marginTop: 4,
  },
  logoutIcon: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  logoutText: { flex: 1, fontSize: 16, fontWeight: '700' },
});
