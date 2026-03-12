import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Platform } from 'react-native';
import { db, auth, getNativeAuth } from './firebase';

interface UserData {
  phoneNumber: string;
  nom: string;
  prenom: string;
  email?: string;
}

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (userData: UserData) => Promise<void>;
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

  // Au lancement : vérifier si une session existe
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // Pas de session sauvegardée
    }
    setIsLoading(false);
  };

  const login = async (userData: UserData) => {
    // Sauvegarder en local (session offline)
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
    // Sauvegarder le profil dans Firestore seulement si on a un vrai nom
    // (éviter d'écraser un profil existant avec des données vides)
    if (userData.nom || userData.prenom) {
      try {
        const userRef = doc(db, 'users', userData.phoneNumber);
        await setDoc(userRef, {
          ...userData,
          createdAt: new Date().toISOString(),
        }, { merge: true });
      } catch (e) {
        console.warn('Firestore save failed (offline?):', e);
      }
    }
  };

  const logout = async () => {
    // Réinitialiser le state immédiatement pour rediriger
    setUser(null);
    // Nettoyer en arrière-plan
    AsyncStorage.removeItem(USER_STORAGE_KEY).catch(() => {});
    signOut(auth).catch(() => {});
    // Déconnecter aussi le SDK natif Firebase sur mobile
    if (Platform.OS !== 'web') {
      try { getNativeAuth()?.().signOut(); } catch {}
    }
  };

  const updateUser = async (partial: Partial<UserData>) => {
    if (!user) return;
    const updated = { ...user, ...partial };
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
    setUser(updated);
    // Sync Firestore
    try {
      const userRef = doc(db, 'users', updated.phoneNumber);
      await setDoc(userRef, updated, { merge: true });
    } catch (e) {
      console.warn('Firestore update failed (offline?):', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isLoggedIn: !!user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/**
 * Vérifie si un utilisateur existe déjà dans Firestore.
 * Retourne ses données si oui, null sinon.
 */
export async function checkUserExists(phoneNumber: string): Promise<UserData | null> {
  try {
    const userRef = doc(db, 'users', phoneNumber);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserData;
    }
  } catch (e) {
    console.warn('Firestore check failed:', e);
  }
  return null;
}
