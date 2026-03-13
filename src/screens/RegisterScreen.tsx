import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar, ScrollView, Animated,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../config/theme';
import { useI18n } from '../config/i18n';
import { useAuth } from '../config/auth';
import { apiRegister } from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmMdp, setConfirmMdp] = useState('');
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
  const canSubmit =
    nom.trim().length > 0 &&
    prenom.trim().length > 0 &&
    cleaned.length >= 9 &&
    motDePasse.length >= 8 &&
    motDePasse === confirmMdp &&
    !loading;

  const handleRegister = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const fullPhone = `+237${cleaned}`;

      // Inscription directe via API (mot de passe, pas d'OTP)
      const result = await apiRegister({
        nom: nom.trim(),
        prenom: prenom.trim(),
        telephone: fullPhone,
        email: email.trim() || undefined,
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
      } else {
        const msg = result.message || t('error');
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert(t('error'), msg);
      }
    } catch (err: any) {
      console.error('Register error:', err);
      const msg = err?.message || t('error');
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert(t('error'), msg);
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

              {/* Téléphone */}
              <Text style={[styles.label, { color: colors.textMuted }]}>{t('login_phone_label')} *</Text>
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

              {/* Mot de passe */}
              <Text style={[styles.label, { color: colors.textMuted }]}>{t('register_password')} *</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={{ marginLeft: 14 }} />
                <TextInput
                  style={[styles.input, { color: colors.text, flex: 1 }]}
                  placeholder={t('register_password_placeholder')}
                  placeholderTextColor={colors.textMuted}
                  value={motDePasse} onChangeText={setMotDePasse}
                  secureTextEntry={!showPassword} autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingRight: 14 }}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Confirmer mot de passe */}
              <Text style={[styles.label, { color: colors.textMuted }]}>{t('register_confirm_password')} *</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={{ marginLeft: 14 }} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t('register_confirm_password_placeholder')}
                  placeholderTextColor={colors.textMuted}
                  value={confirmMdp} onChangeText={setConfirmMdp}
                  secureTextEntry={!showPassword} autoCapitalize="none"
                />
              </View>

              {motDePasse.length > 0 && motDePasse.length < 8 && (
                <Text style={[styles.hint, { color: colors.warning }]}>{t('register_password_min')}</Text>
              )}
              {confirmMdp.length > 0 && motDePasse !== confirmMdp && (
                <Text style={[styles.hint, { color: colors.danger }]}>{t('register_password_mismatch')}</Text>
              )}
            </View>
          </View>

          {/* Bouton créer le compte */}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: canSubmit ? '#009639' : isDark ? '#1A1A1A' : '#E2E8F0' }]}
            onPress={handleRegister}
            disabled={!canSubmit} activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Text style={[styles.btnText, { color: canSubmit ? '#FFF' : colors.textMuted }]}>{t('register_create_account')}</Text>
                <Ionicons name="checkmark-circle" size={20} color={canSubmit ? '#FFF' : colors.textMuted} />
              </>
            )}
          </TouchableOpacity>

          {/* Lien vers login */}
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>{t('register_have_account')} </Text>
            <Text style={[styles.linkBold, { color: colors.accent }]}>{t('register_login_link')}</Text>
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

  phoneContainer: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 14,
  },
  countryCode: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 15, borderRightWidth: 1, gap: 6,
  },
  flag: { fontSize: 18 },
  countryCodeText: { fontSize: 15, fontWeight: '600' },
  phoneInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 15, fontSize: 17, letterSpacing: 1 },

  hint: { fontSize: 12, marginTop: -8, marginBottom: 8, marginLeft: 4 },

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
