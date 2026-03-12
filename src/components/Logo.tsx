import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../config/theme';

type Props = {
  size?: 'small' | 'medium' | 'large';
  variant?: 'full' | 'compact';
};

export default function Logo({ size = 'medium', variant = 'full' }: Props) {
  const { colors, mode } = useTheme();
  const isDark = mode === 'dark';

  const scale = size === 'small' ? 0.65 : size === 'large' ? 1.3 : 1;

  if (variant === 'compact') {
    return (
      <View style={styles.compactRow}>
        <View style={[styles.compactBadge, {
          width: 34 * scale,
          height: 34 * scale,
          borderRadius: 9 * scale,
        }]}>
          <Text style={[styles.compactNumber, { fontSize: 14 * scale }]}>237</Text>
        </View>
        <View>
          <Text style={[styles.compactText, { fontSize: 15 * scale, color: colors.text }]}>
            URGENCES
          </Text>
          <View style={[styles.tricolorBar, { marginTop: 3 * scale, width: 60 * scale }]}>
            <View style={[styles.seg, { backgroundColor: '#009639', height: 2 * scale }]} />
            <View style={[styles.seg, { backgroundColor: '#CE1126', height: 2 * scale }]} />
            <View style={[styles.seg, { backgroundColor: '#FCBF49', height: 2 * scale }]} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Badge 237 */}
      <View style={[styles.badge, {
        width: 56 * scale,
        height: 56 * scale,
        borderRadius: 16 * scale,
        shadowColor: '#CE1126',
        shadowOffset: { width: 0, height: 4 * scale },
        shadowOpacity: 0.3,
        shadowRadius: 8 * scale,
        elevation: 6,
      }]}>
        <Text style={[styles.badgeNumber, { fontSize: 22 * scale }]}>237</Text>
      </View>

      {/* URGENCES */}
      <Text style={[styles.title, {
        fontSize: 28 * scale,
        color: isDark ? '#FAFAFA' : '#0F1B2D',
      }]}>
        URGENCES
      </Text>

      {/* Barre tricolore */}
      <View style={[styles.tricolorBar, { marginTop: 8 * scale, width: 180 * scale }]}>
        <View style={[styles.seg, { backgroundColor: '#009639', height: 3.5 * scale, borderTopLeftRadius: 2, borderBottomLeftRadius: 2 }]} />
        <View style={[styles.seg, { backgroundColor: '#CE1126', height: 3.5 * scale }]} />
        <View style={[styles.seg, { backgroundColor: '#FCBF49', height: 3.5 * scale, borderTopRightRadius: 2, borderBottomRightRadius: 2 }]} />
      </View>

      {/* Sous-titre */}
      <Text style={[styles.subtitle, {
        fontSize: 11 * scale,
        color: isDark ? '#666666' : '#94A3B8',
      }]}>
        CAMEROUN
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Full variant
  container: {
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#CE1126',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeNumber: {
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  title: {
    fontWeight: '900',
    letterSpacing: 4,
  },
  tricolorBar: {
    flexDirection: 'row',
    gap: 2,
  },
  seg: {
    flex: 1,
    borderRadius: 1,
  },
  subtitle: {
    fontWeight: '600',
    letterSpacing: 6,
    marginTop: 6,
  },

  // Compact variant
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compactBadge: {
    backgroundColor: '#CE1126',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactNumber: {
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: 1,
  },
  compactText: {
    fontWeight: '800',
    letterSpacing: 2,
  },
});
