import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData } from '../types';
import { saveTokens, clearTokens, getAccessToken, apiLogout, apiGetProfil, setOnSessionExpired } from '../services/api';

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (userData: UserData, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<UserData>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isLoggedIn: false,
  login: async () => {},
  logout: async () => {},
  updateUser: async () => {},
});

const USER_STORAGE_KEY = '@237urgences_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Au lancement : vérifier si une session existe + enregistrer le callback d'expiration
  useEffect(() => {
    loadUser();
    setOnSessionExpired(() => {
      // Session expirée côté serveur → forcer la déconnexion locale
      setUser(null);
      AsyncStorage.removeItem(USER_STORAGE_KEY).catch(() => {});
    });
  }, []);

  const loadUser = async () => {
    try {
      const token = await getAccessToken();
      const stored = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (token && stored) {
        setUser(JSON.parse(stored));
      } else if (!token) {
        // Pas de token = pas de session
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch {
      // Pas de session sauvegardée
    }
    setIsLoading(false);
  };

  const login = async (userData: UserData, accessToken: string, refreshToken: string) => {
    // Sauvegarder les tokens JWT
    await saveTokens(accessToken, refreshToken);
    // Sauvegarder le profil en local
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    // Réinitialiser le state immédiatement
    setUser(null);
    // Nettoyer en arrière-plan
    try { await apiLogout(); } catch {}
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    await clearTokens();
  };

  const updateUser = async (partial: Partial<UserData>) => {
    if (!user) return;
    const updated = { ...user, ...partial };
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isLoggedIn: !!user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
