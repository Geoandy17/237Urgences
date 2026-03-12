import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar, ScrollView, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../config/theme';
import { useI18n } from '../config/i18n';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const { colors, mode } = useTheme();
  const { t } = useI18n();
  const isDark = mode === 'dark';
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const canContinue = nom.trim().length > 0 && prenom.trim().length > 0;

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle={colors.statusBar} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Header arrondi */}
          <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
            <View style={[styles.headerCircle, { backgroundColor: isDark ? 'rgba(0,184,71,0.04)' : 'rgba(59,111,224,0.06)' }]} />
            <View style={styles.headerTop}>
              <TouchableOpacity
                style={[styles.backBtn, { backgroundColor: isDark ? '#1A1A1A' : '#FFF' }]}
                onPress={() => navigation.goBack()} activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={[styles.headerIcon, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="person-add" size={28} color={colors.accent} />
            </View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('register_welcome')}</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{t('register_subtitle')}</Text>
          </View>

          {/* Carte formulaire */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadowColor }]}>
            <View style={styles.tricolor}>
              <View style={[styles.tri, { backgroundColor: '#009639' }]} />
              <View style={[styles.tri, { backgroundColor: '#CE1126' }]} />
              <View style={[styles.tri, { backgroundColor: '#FCBF49' }]} />
            </View>

            <View style={styles.formInner}>
              {/* Nom */}
              <Text style={[styles.label, { color: colors.textMuted }]}>{t('profile_lastname')} *</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <Ionicons name="person-outline" size={18} color={colors.textMuted} style={{ marginLeft: 14 }} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t('profile_lastname_placeholder')}
                  placeholderTextColor={colors.textMuted}
                  value={nom} onChangeText={setNom}
                  autoCapitalize="words"
                />
              </View>

              {/* Prénom */}
              <Text style={[styles.label, { color: colors.textMuted }]}>{t('profile_firstname')} *</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <Ionicons name="person-outline" size={18} color={colors.textMuted} style={{ marginLeft: 14 }} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t('profile_firstname_placeholder')}
                  placeholderTextColor={colors.textMuted}
                  value={prenom} onChangeText={setPrenom}
                  autoCapitalize="words"
                />
              </View>

              {/* Email */}
              <Text style={[styles.label, { color: colors.textMuted }]}>{t('profile_email')}</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={{ marginLeft: 14 }} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t('profile_email_placeholder')}
                  placeholderTextColor={colors.textMuted}
                  value={email} onChangeText={setEmail}
                  keyboardType="email-address" autoCapitalize="none"
                />
              </View>
            </View>
          </View>

          {/* Bouton continuer */}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: canContinue ? colors.accent : isDark ? '#1A1A1A' : '#E2E8F0' }]}
            onPress={() => navigation.navigate('Login', { nom: nom.trim(), prenom: prenom.trim(), email: email.trim() || undefined })}
            disabled={!canContinue} activeOpacity={0.85}
          >
            <Text style={[styles.btnText, { color: canContinue ? '#FFF' : colors.textMuted }]}>{t('register_continue')}</Text>
            <Ionicons name="arrow-forward" size={18} color={canContinue ? '#FFF' : colors.textMuted} />
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  header: {
    paddingTop: Platform.OS === 'ios' ? 58 : 44,
    paddingBottom: 28, paddingHorizontal: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    overflow: 'hidden', alignItems: 'center',
  },
  headerCircle: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100, top: -40, right: -40,
  },
  headerTop: { width: '100%', flexDirection: 'row', marginBottom: 20 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  headerIcon: {
    width: 60, height: 60, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  headerSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  formCard: {
    marginHorizontal: 20, marginTop: 24, borderRadius: 22, borderWidth: 1, overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 6,
  },
  tricolor: { flexDirection: 'row', height: 4 },
  tri: { flex: 1 },
  formInner: { padding: 22 },

  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 14,
  },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 15, fontSize: 15 },

  btn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginHorizontal: 20, marginTop: 24, paddingVertical: 17, borderRadius: 16, gap: 10,
  },
  btnText: { fontSize: 16, fontWeight: '700' },
});
