import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform, StatusBar, ScrollView, Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PhoneAuthProvider } from 'firebase/auth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { useTheme } from '../config/theme';
import { useI18n } from '../config/i18n';
import { auth, firebaseConfig, getNativeAuth } from '../config/firebase';
import { setConfirmationResult } from '../utils/nativeAuthState';

// Recaptcha uniquement sur web
let FirebaseRecaptchaVerifierModal: any = null;
if (Platform.OS === 'web') {
  FirebaseRecaptchaVerifierModal = require('../components/FirebaseRecaptcha').default;
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
  route: RouteProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation, route }: Props) {
  const { nom, prenom, email } = route.params || {};
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sending, setSending] = useState(false);
  const recaptchaVerifier = useRef<any>(null);
  const { colors, mode } = useTheme();
  const { t } = useI18n();
  const isDark = mode === 'dark';
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const cleaned = phoneNumber.replace(/\s/g, '');
  const canSend = cleaned.length >= 9 && !sending;

  const handleSendOTP = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const fullPhone = `+237${cleaned}`;

      if (Platform.OS === 'web') {
        // Web : utiliser le SDK JS Firebase avec reCAPTCHA
        const verifier = recaptchaVerifier.current!;
        const phoneProvider = new PhoneAuthProvider(auth);
        const firebaseVerifier = verifier.getFirebaseVerifier();
        const verificationId = await phoneProvider.verifyPhoneNumber(fullPhone, firebaseVerifier);
        navigation.navigate('OTP', { phoneNumber: fullPhone, verificationId, nom, prenom, email });
      } else {
        // Native (Android/iOS) : utiliser @react-native-firebase/auth
        const nativeAuth = getNativeAuth();
        const confirmation = await nativeAuth().signInWithPhoneNumber(fullPhone);
        setConfirmationResult(confirmation);
        navigation.navigate('OTP', { phoneNumber: fullPhone, nom, prenom, email });
      }
    } catch (err: any) {
      console.error('SMS send error:', err);
      const msg = err?.message || t('login_error');
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert(t('login_error'), msg);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle={colors.statusBar} />

      {Platform.OS === 'web' && FirebaseRecaptchaVerifierModal && (
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={firebaseConfig}
        />
      )}

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
              <Ionicons name="call" size={28} color={colors.warning} />
            </View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('login_title')}</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              {prenom ? `${t('login_subtitle_hello')}${prenom} ! ` : ''}{t('login_subtitle_verify')}
            </Text>
          </View>

          {/* Carte formulaire */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadowColor }]}>
            <View style={styles.tricolor}>
              <View style={[styles.tri, { backgroundColor: '#009639' }]} />
              <View style={[styles.tri, { backgroundColor: '#CE1126' }]} />
              <View style={[styles.tri, { backgroundColor: '#FCBF49' }]} />
            </View>

            <View style={styles.formInner}>
              <Text style={[styles.label, { color: colors.textMuted }]}>{t('login_phone_label')}</Text>
              <View style={[styles.phoneInputContainer, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <View style={[styles.countryCode, { borderRightColor: colors.inputBorder, backgroundColor: isDark ? '#111' : '#F1F5F9' }]}>
                  <Text style={styles.flag}>🇨🇲</Text>
                  <Text style={[styles.countryCodeText, { color: colors.text }]}>+237</Text>
                </View>
                <TextInput
                  style={[styles.phoneInput, { color: colors.text }]}
                  placeholder={t('login_phone_placeholder')}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad" maxLength={12}
                  value={phoneNumber} onChangeText={setPhoneNumber}
                  autoFocus
                />
              </View>

              <View style={[styles.infoRow, { backgroundColor: isDark ? '#0A0F1A' : '#F0F4FF' }]}>
                <Ionicons name="information-circle" size={16} color={colors.accent} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>{t('login_sms_info')}</Text>
              </View>
            </View>
          </View>

          {/* Bouton */}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: canSend ? '#CE1126' : isDark ? '#1A1A1A' : '#E2E8F0' }]}
            onPress={handleSendOTP} disabled={!canSend} activeOpacity={0.85}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Text style={[styles.btnText, { color: canSend ? '#FFF' : colors.textMuted }]}>{t('login_send_code')}</Text>
                <Ionicons name="arrow-forward" size={18} color={canSend ? '#FFF' : colors.textMuted} />
              </>
            )}
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
  phoneInputContainer: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 14,
  },
  countryCode: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 15, borderRightWidth: 1, gap: 6,
  },
  flag: { fontSize: 18 },
  countryCodeText: { fontSize: 15, fontWeight: '600' },
  phoneInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 15, fontSize: 17, letterSpacing: 1 },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12,
  },
  infoText: { fontSize: 12, flex: 1, lineHeight: 17 },

  btn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginHorizontal: 20, marginTop: 24, paddingVertical: 17, borderRadius: 16, gap: 10,
  },
  btnText: { fontSize: 16, fontWeight: '700' },
});
