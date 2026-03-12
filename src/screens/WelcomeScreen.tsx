import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../config/theme';
import { useI18n } from '../config/i18n';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Welcome'>;
};

export default function WelcomeScreen({ navigation }: Props) {
  const { colors, mode } = useTheme();
  const { t } = useI18n();
  const isDark = mode === 'dark';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* Header */}
        <View style={styles.headerSection}>
          <View style={[styles.iconCircle, { backgroundColor: '#CE1126' }]}>
            <Ionicons name="shield-checkmark" size={32} color="#FFF" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>237 Urgences</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('welcome_subtitle')}
          </Text>
        </View>

        {/* Features */}
        <View style={[styles.featuresCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadowColor }]}>
          <View style={styles.tricolor}>
            <View style={[styles.tri, { backgroundColor: '#009639' }]} />
            <View style={[styles.tri, { backgroundColor: '#CE1126' }]} />
            <View style={[styles.tri, { backgroundColor: '#FCBF49' }]} />
          </View>
          {[
            { icon: 'megaphone-outline' as const, text: t('welcome_feature3_desc'), color: '#CE1126' },
            { icon: 'medical-outline' as const, text: t('welcome_feature2_desc'), color: '#009639' },
            { icon: 'call-outline' as const, text: t('welcome_feature1_desc'), color: '#FCBF49' },
          ].map((f, i) => (
            <View key={i} style={[styles.featureRow, i < 2 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}>
              <View style={[styles.featureIcon, { backgroundColor: f.color + '15' }]}>
                <Ionicons name={f.icon} size={20} color={f.color} />
              </View>
              <Text style={[styles.featureText, { color: colors.text }]}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Boutons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.btnPrimary, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <Ionicons name="person-add" size={20} color="#FFF" />
            <Text style={styles.btnPrimaryText}>{t('welcome_create_account')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnSecondary, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Login', {})}
            activeOpacity={0.7}
          >
            <Ionicons name="log-in-outline" size={20} color={colors.accent} />
            <Text style={[styles.btnSecondaryText, { color: colors.text }]}>{t('welcome_login')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.disclaimer, { color: colors.textMuted }]}>{t('login_disclaimer')}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1, paddingHorizontal: 24,
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingBottom: 30,
  },

  headerSection: { alignItems: 'center', marginBottom: 32 },
  iconCircle: {
    width: 70, height: 70, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    shadowColor: '#CE1126', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: 1, marginBottom: 6 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },

  featuresCard: {
    borderRadius: 22, borderWidth: 1, overflow: 'hidden', marginBottom: 32,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 6,
  },
  tricolor: { flexDirection: 'row', height: 4 },
  tri: { flex: 1 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 18,
  },
  featureIcon: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  featureText: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },

  buttons: { gap: 12, marginBottom: 20 },
  btnPrimary: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 17, borderRadius: 16, gap: 10,
  },
  btnPrimaryText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  btnSecondary: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 17, borderRadius: 16, gap: 10, borderWidth: 1,
  },
  btnSecondaryText: { fontSize: 16, fontWeight: '700' },

  disclaimer: { fontSize: 11, textAlign: 'center', lineHeight: 16, paddingHorizontal: 10 },
});
