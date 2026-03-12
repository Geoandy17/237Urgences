import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ThemeMode = 'dark' | 'light';

interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  surfaceSecondary: string;
  card: string;
  headerBg: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;

  // Borders
  border: string;
  borderLight: string;

  // Brand
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;

  // Semantic
  danger: string;
  dangerLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;

  // Inputs
  inputBg: string;
  inputBorder: string;

  // Shadows (pour reference, appliqués manuellement)
  shadowColor: string;

  statusBar: 'light-content' | 'dark-content';
}

// ========================================
// DARK THEME - Vraiment sombre, OLED-friendly
// ========================================
const darkColors: ThemeColors = {
  background: '#000000',
  surface: '#111111',
  surfaceSecondary: '#1A1A1A',
  card: '#141414',
  headerBg: '#0A0A0A',

  text: '#FAFAFA',
  textSecondary: '#A0A0A0',
  textMuted: '#666666',

  border: '#222222',
  borderLight: '#1A1A1A',

  primary: '#00B847',
  primaryLight: '#0A2A14',
  primaryDark: '#009639',
  accent: '#5B9BF3',
  accentLight: '#0D1A2D',

  danger: '#FF4757',
  dangerLight: '#2A0D12',
  success: '#00D68F',
  successLight: '#0A2A1E',
  warning: '#FFAA33',
  warningLight: '#2A1F0A',

  inputBg: '#111111',
  inputBorder: '#222222',

  shadowColor: '#000000',

  statusBar: 'light-content',
};

// ========================================
// LIGHT THEME - Clean, aéré, moderne
// ========================================
const lightColors: ThemeColors = {
  background: '#F2F4F8',
  surface: '#FFFFFF',
  surfaceSecondary: '#F7F8FA',
  card: '#FFFFFF',
  headerBg: '#E4EAF5',

  text: '#0F1B2D',
  textSecondary: '#5A6B82',
  textMuted: '#94A3B8',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  primary: '#009639',
  primaryLight: '#ECFDF5',
  primaryDark: '#007A2E',
  accent: '#3B6FE0',
  accentLight: '#EDF2FF',

  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',

  inputBg: '#F7F8FA',
  inputBorder: '#E2E8F0',

  shadowColor: '#64748B',

  statusBar: 'dark-content',
};

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  colors: darkColors,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');

  const colors = mode === 'dark' ? darkColors : lightColors;

  const toggleTheme = () => setMode(mode === 'dark' ? 'light' : 'dark');
  const setTheme = (newMode: ThemeMode) => setMode(newMode);

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
