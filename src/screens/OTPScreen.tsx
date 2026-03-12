import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, StatusBar, Platform,
  ActivityIndicator, ScrollView, Animated, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { useTheme } from '../config/theme';
import { useI18n } from '../config/i18n';
import { useAuth, checkUserExists } from '../config/auth';
import { auth, firebaseConfig, getNativeAuth } from '../config/firebase';
import { getConfirmationResult, setConfirmationResult, clearConfirmationResult } from '../utils/nativeAuthState';

// Recaptcha uniquement sur web (pour le resend)
let FirebaseRecaptchaVerifierModal: any = null;
if (Platform.OS === 'web') {
  FirebaseRecaptchaVerifierModal = require('../components/FirebaseRecaptcha').default;
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OTP'>;
  route: RouteProp<RootStackParamList, 'OTP'>;
};

export default function OTPScreen({ navigation, route }: Props) {
  const { phoneNumber, verificationId: initialVerificationId, nom, prenom, email } = route.params;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [verificationId, setVerificationId] = useState(initialVerificationId);
  const inputRefs = useRef<TextInput[]>([]);
  const recaptchaVerifier = useRef<any>(null);
  const { colors, mode } = useTheme();
  const { t } = useI18n();
  const { login } = useAuth();
  const isDark = mode === 'dark';
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const verifyCode = async (fullCode: string) => {
    if (fullCode.length < 6 || verifying) return;
    setVerifying(true);
    try {
      if (Platform.OS === 'web') {
        // Web : SDK JS Firebase
        const credential = PhoneAuthProvider.credential(verificationId!, fullCode);
        await signInWithCredential(auth, credential);
      } else {
        // Native : @react-native-firebase/auth
        const confirmation = getConfirmationResult();
        if (!confirmation) throw new Error('Session expirée, veuillez renvoyer le code');
        await confirmation.confirm(fullCode);
        clearConfirmationResult();
      }

      // Vérifier si l'utilisateur existe dans Firestore
      const existingUser = await checkUserExists(phoneNumber);
      if (existingUser) {
        // Utilisateur existant → récupérer son profil
        await login(existingUser);
      } else if (nom || prenom) {
        // Nouvel utilisateur venant du formulaire Register → créer le profil
        await login({ phoneNumber, nom: nom || '', prenom: prenom || '', email });
      } else {
        // Connexion sans profil trouvé (Firestore inaccessible ou premier login sans Register)
        // Sauvegarder avec le numéro seulement, sans écraser un éventuel profil existant
        await login({ phoneNumber, nom: '', prenom: '', email: '' });
      }
      // Navigation automatique via isLoggedIn = true
    } catch (err: any) {
      console.error('OTP verify error:', err);
      const isInvalidCode = err?.code === 'auth/invalid-verification-code';
      const msg = isInvalidCode ? t('otp_wrong_code') : (err?.message || t('error'));
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert(t('error'), msg);
      }
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    try {
      if (Platform.OS === 'web') {
        // Web : SDK JS Firebase
        const verifier = recaptchaVerifier.current!;
        const phoneProvider = new PhoneAuthProvider(auth);
        const firebaseVerifier = verifier.getFirebaseVerifier();
        const newVerificationId = await phoneProvider.verifyPhoneNumber(phoneNumber, firebaseVerifier);
        setVerificationId(newVerificationId);
      } else {
        // Native : renvoyer le SMS via @react-native-firebase/auth
        const nativeAuth = getNativeAuth();
        const confirmation = await nativeAuth().signInWithPhoneNumber(phoneNumber, true);
        setConfirmationResult(confirmation);
      }
      setTimer(60);
      setCode(['', '', '', '', '', '']);
    } catch (err: any) {
      console.error('Resend error:', err);
      if (Platform.OS === 'web') {
        window.alert(err?.message || t('error'));
      } else {
        Alert.alert(t('error'), err?.message || t('error'));
      }
    } finally {
      setResending(false);
    }
  };

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    if (text && index < 5) inputRefs.current[index + 1]?.focus();
    if (index === 5 && text) verifyCode(newCode.join(''));
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
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
            <View style={[styles.headerIcon, { backgroundColor: colors.successLight }]}>
              <Ionicons name="chatbubble-ellipses" size={28} color={colors.success} />
            </View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('otp_title')}</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{t('otp_subtitle')}</Text>
            <View style={[styles.phoneBadge, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="call" size={14} color={colors.primary} />
              <Text style={[styles.phoneBadgeText, { color: colors.primary }]}>{phoneNumber}</Text>
            </View>
          </View>

          {/* Carte OTP */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadowColor }]}>
            <View style={styles.tricolor}>
              <View style={[styles.tri, { backgroundColor: '#009639' }]} />
              <View style={[styles.tri, { backgroundColor: '#CE1126' }]} />
              <View style={[styles.tri, { backgroundColor: '#FCBF49' }]} />
            </View>

            <View style={styles.formInner}>
              {/* Code inputs */}
              <View style={styles.codeContainer}>
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { if (ref) inputRefs.current[index] = ref; }}
                    style={[
                      styles.codeInput,
                      { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text },
                      digit && { borderColor: colors.accent, backgroundColor: isDark ? colors.accentLight : '#EDF2FF' },
                    ]}
                    maxLength={1} keyboardType="number-pad"
                    value={digit}
                    onChangeText={(text) => handleCodeChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    autoFocus={index === 0} editable={!verifying}
                  />
                ))}
              </View>

              {/* Timer / Resend */}
              <View style={styles.timerArea}>
                {timer > 0 ? (
                  <Text style={[styles.timerText, { color: colors.textMuted }]}>
                    {t('otp_resend_in')} <Text style={{ fontWeight: 'bold', color: colors.primary }}>{timer}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResend} disabled={resending} style={[styles.resendBtn, { backgroundColor: colors.accentLight }]}>
                    {resending ? (
                      <ActivityIndicator size="small" color={colors.accent} />
                    ) : (
                      <>
                        <Ionicons name="refresh" size={16} color={colors.accent} />
                        <Text style={[styles.resendText, { color: colors.accent }]}>{t('otp_resend')}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Bouton vérifier */}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#009639' }, verifying && { opacity: 0.7 }]}
            onPress={() => verifyCode(code.join(''))}
            disabled={verifying} activeOpacity={0.85}
          >
            {verifying ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Text style={styles.btnText}>{t('otp_verify')}</Text>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
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
  headerSub: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  phoneBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
  },
  phoneBadgeText: { fontSize: 14, fontWeight: '700' },

  formCard: {
    marginHorizontal: 20, marginTop: 24, borderRadius: 22, borderWidth: 1, overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 6,
  },
  tricolor: { flexDirection: 'row', height: 4 },
  tri: { flex: 1 },
  formInner: { padding: 22 },

  codeContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 24 },
  codeInput: {
    width: 48, height: 58, borderRadius: 14, borderWidth: 2,
    fontSize: 24, fontWeight: 'bold', textAlign: 'center',
  },

  timerArea: { alignItems: 'center' },
  timerText: { fontSize: 14 },
  resendBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12,
  },
  resendText: { fontSize: 14, fontWeight: '600' },

  btn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginHorizontal: 20, marginTop: 24, paddingVertical: 17, borderRadius: 16, gap: 10,
  },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
