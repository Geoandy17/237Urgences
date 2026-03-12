import { initializeApp } from 'firebase/app';
import { initializeAuth, getAuth, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

export const firebaseConfig = {
  apiKey: "AIzaSyB7dLwTMM-c2xNGGDeoF-E81zm-IJInPew",
  authDomain: "urgences-d3be6.firebaseapp.com",
  projectId: "urgences-d3be6",
  storageBucket: "urgences-d3be6.firebasestorage.app",
  messagingSenderId: "785845575961",
  appId: "1:785845575961:web:7961b48af2142dc8b76588"
};

// SDK moderne (v9+)
const app = initializeApp(firebaseConfig);

// Sur mobile, indexedDB n'existe pas → utiliser inMemoryPersistence
// (la session utilisateur est déjà gérée via AsyncStorage dans auth.tsx)
export const auth = Platform.OS === 'web'
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: inMemoryPersistence,
    });

export const db = getFirestore(app);

// Module natif Firebase Auth (uniquement sur iOS/Android)
// Lazy require pour ne pas crasher sur web
export function getNativeAuth() {
  if (Platform.OS === 'web') return null;
  return require('@react-native-firebase/auth').default;
}

export default app;
