import React from 'react';
import { ThemeProvider } from './src/config/theme';
import { I18nProvider } from './src/config/i18n';
import { AuthProvider } from './src/config/auth';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <I18nProvider>
          <AppNavigator />
        </I18nProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
