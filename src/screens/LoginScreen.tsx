import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform, StatusBar, ScrollView, Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../config/theme';
import { useI18n } from '../config/i18n';
import { useAuth } from '../config/auth';
import { apiLogin } from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { colors, mode } = useTheme();
  const { t } = useI18n();
  const { login } = useAuth();
  const isDark = mode === 'dark';
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const cleaned = telephone.replace(/\s/g, '');
  const canSubmit = cleaned.length >= 9 && motDePasse.length >= 8 && !loading;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const fullPhone = `+237${cleaned}`;
      const result = await apiLogin({
        telephone: fullPhone,
        motDePasse,
      });

      if (result.success && result.data) {
        await login(
          {
            userId: result.data.userId,
            nom: result.data.nom,
            prenom: result.data.prenom,
            telephone: result.data.telephone,
            role: result.data.role,
          },
          result.data.accessToken,
          result.data.refreshToken,
        );
        // Navigation automatique via isLoggedIn = true
      } else {
        const msg = result.message || t('login_error');
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert(t('login_error'), msg);
        }
      }
    } catch (err: any) {
      const msg = err?.message || t('login_error');
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert(t('login_error'), msg);
      }
    } finally {
      setLoading(false);
    }
  };

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
            <View style={[styles.headerIcon, { backgroundColor: colors.warningLight }]}>
              <Ionicons name="log-in" size={28} color={colors.warning} />
            </View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('login_title')}</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{t('login_subtitle')}</Text>
          </View>

          {/* Carte formulaire */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadowColor }]}>
            <View style={styles.tricolor}>
              <View style={[styles.tri, { backgroundColor: '#009639' }]} />
              <View style={[styles.tri, { backgroundColor: '#CE1126' }]} />
              <View style={[styles.tri, { backgroundColor: '#FCBF49' }]} />
            </View>

            <View style={styles.formInner}>
              {/* Téléphone */}
              <Text style={[styles.label, { color: colors.textMuted }]}>{t('login_phone_label')}</Text>
              <View style={[styles.phoneContainer, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <View style={[styles.countryCode, { borderRightColor: colors.inputBorder, backgroundColor: isDark ? '#111' : '#F1F5F9' }]}>
                  <Text style={styles.flag}>🇨🇲</Text>
                  <Text style={[styles.countryCodeText, { color: colors.text }]}>+237</Text>
                </View>
                <TextInput
                  style={[styles.phoneInput, { color: colors.text }]}
                  placeholder={t('login_phone_placeholder')}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad" maxLength={12}
                  value={telephone} onChangeText={setTelephone}
                  autoFocus
                />
              </View>

              {/* Mot de passe */}
              <Text style={[styles.label, { color: colors.textMuted }]}>{t('login_password_label')}</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={{ marginLeft: 14 }} />
                <TextInput
                  style={[styles.input, { color: colors.text, flex: 1 }]}
                  placeholder={t('login_password_placeholder')}
                  placeholderTextColor={colors.textMuted}
                  value={motDePasse} onChangeText={setMotDePasse}
                  secureTextEntry={!showPassword} autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingRight: 14 }}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bouton connexion */}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: canSubmit ? '#CE1126' : isDark ? '#1A1A1A' : '#E2E8F0' }]}
            onPress={handleLogin} disabled={!canSubmit} activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Text style={[styles.btnText, { color: canSubmit ? '#FFF' : colors.textMuted }]}>{t('login_submit')}</Text>
                <Ionicons name="arrow-forward" size={18} color={canSubmit ? '#FFF' : colors.textMuted} />
              </>
            )}
          </TouchableOpacity>

          {/* Lien vers register */}
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.7}
          >
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>{t('login_no_account')} </Text>
            <Text style={[styles.linkBold, { color: colors.accent }]}>{t('login_register_link')}</Text>
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
  headerCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, top: -40, right: -40 },
  headerTop: { width: '100%', flexDirection: 'row', marginBottom: 20 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  headerIcon: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  headerTitle: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  headerSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  formCard: {
    marginHorizontal: 20, marginTop: 24, borderRadius: 22, borderWidth: 1, overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 6,
  },
  tricolor: { flexDirection: 'row', height: 4 },
  tri: { flex: 1 },
  formInner: { padding: 22 },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },

  phoneContainer: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 14,
  },
  countryCode: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 15, borderRightWidth: 1, gap: 6,
  },
  flag: { fontSize: 18 },
  countryCodeText: { fontSize: 15, fontWeight: '600' },
  phoneInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 15, fontSize: 17, letterSpacing: 1 },

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

  linkRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 18, paddingVertical: 8,
  },
  linkText: { fontSize: 14 },
  linkBold: { fontSize: 14, fontWeight: '700' },
});
