# 237Urgences - Application Mobile d'Urgence au Cameroun

## Présentation du Projet

**237Urgences** est une application mobile développée avec **React Native (Expo)** qui permet aux citoyens camerounais de signaler des incidents et d'accéder rapidement aux services d'urgence.

### Objectif

Mettre en relation les citoyens camerounais avec les services d'urgence (Police, Gendarmerie, Sapeurs-Pompiers, SAMU) et faciliter le signalement d'incidents en temps réel.

---

## Fonctionnalités

### Authentification
- Connexion par **numéro de téléphone** (+237)
- Vérification par **code OTP à 6 chiffres**
- Système sécurisé avec timer de renvoi du code

### Menu Principal
- **Déclarer un incident** (fonctionnalité principale)
- **Hôpitaux** - Liste des centres hospitaliers avec appel direct
- **Pharmacies** - Liste des pharmacies (dont celles ouvertes 24h)
- **Numéros d'urgence** - Appel direct Police (117), Gendarmerie (113), Pompiers (118), SAMU (119)

### Déclaration d'Incident (Workflow Multi-étapes)

| Étape | Description |
|-------|-------------|
| **1. Type & Description** | Choix du type d'incident (Incendie, Agression, Accident, Urgence médicale, Catastrophe naturelle, Arnaque/Scam, Autre). Saisie de la description. Enregistrement vocal optionnel. Photo optionnelle. |
| **2. Localisation** | Récupération automatique par GPS ou saisie manuelle (Ville + Quartier) |
| **3. Contact** | Numéro de téléphone d'une personne à prévenir |
| **4. Récapitulatif** | Visualisation de toutes les informations avant envoi de l'alerte |

### Paramètres
- **Thème** : Mode sombre (par défaut) / Mode clair
- **Langue** : Français / Anglais
- Déconnexion

---

## Stack Technique

| Technologie | Rôle |
|------------|------|
| **React Native** | Framework mobile cross-platform |
| **Expo SDK 55** | Environnement de développement |
| **TypeScript** | Typage statique |
| **React Navigation** | Navigation (Stack + Bottom Tabs) |
| **Firebase** | Authentification OTP + Base de données Firestore |
| **expo-location** | Géolocalisation GPS |
| **expo-image-picker** | Capture photo / Galerie |
| **expo-av** | Enregistrement vocal |
| **@expo/vector-icons** | Icônes (Ionicons) |

---

## Architecture du Projet

```
237Urgences/
├── App.tsx                          # Point d'entrée
├── app.json                         # Configuration Expo
├── eas.json                         # Configuration EAS Build
├── package.json                     # Dépendances
├── tsconfig.json                    # Config TypeScript
├── assets/                          # Icônes et images
└── src/
    ├── config/
    │   ├── firebase.ts              # Configuration Firebase
    │   ├── theme.tsx                # Système de thème Dark/Light
    │   └── i18n.tsx                 # Internationalisation FR/EN
    ├── data/
    │   └── emergencyData.ts         # Données statiques (hôpitaux, pharmacies, urgences)
    ├── navigation/
    │   └── AppNavigator.tsx         # Navigation principale
    ├── screens/
    │   ├── WelcomeScreen.tsx        # Écran d'accueil
    │   ├── LoginScreen.tsx          # Saisie du numéro de téléphone
    │   ├── OTPScreen.tsx            # Vérification OTP
    │   ├── HomeScreen.tsx           # Menu principal
    │   ├── DeclareIncidentScreen.tsx # Déclaration d'incident (4 étapes)
    │   ├── EmergencyCallScreen.tsx  # Numéros d'urgence
    │   ├── HospitalsScreen.tsx      # Liste des hôpitaux
    │   ├── PharmaciesScreen.tsx     # Liste des pharmacies
    │   └── SettingsScreen.tsx       # Paramètres (thème, langue)
    └── types/
        └── index.ts                 # Types TypeScript
```

---

## Installation et Lancement

### Prérequis
- **Node.js** >= 18
- **npm** >= 9
- **Expo Go** installé sur votre téléphone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))

### Étape 1 : Installer les dépendances

```bash
cd 237Urgences
npm install
```

### Étape 2 : Lancer le serveur de développement

```bash
npx expo start
```

Un QR code apparaît dans le terminal. Scannez-le avec :
- **Android** : App Expo Go > Scanner le QR code
- **iOS** : Appareil photo > Scanner le QR code (ouvre Expo Go)

### Étape 3 : Tester sur émulateur (optionnel)

```bash
# Android (Android Studio requis)
npx expo start --android

# iOS (macOS + Xcode requis)
npx expo start --ios
```

---

## Génération de l'APK (Android)

### Étape 1 : Installer EAS CLI

```bash
npm install -g eas-cli
```

### Étape 2 : Créer un compte Expo (gratuit)

```bash
eas login
# Ou créer un compte sur https://expo.dev/signup
```

### Étape 3 : Configurer le projet

```bash
eas build:configure
```

### Étape 4 : Générer l'APK

```bash
eas build -p android --profile preview
```

> Le build se fait sur les serveurs Expo (gratuit, ~10-15 min).
> Une fois terminé, le lien de téléchargement de l'APK apparaît dans le terminal et sur https://expo.dev

### Étape 5 : Télécharger l'APK

Le lien de téléchargement est affiché à la fin du build. Installez l'APK directement sur un téléphone Android.

---

## Démo iOS

Pour iOS, deux options :

### Option 1 : Expo Go (Démo rapide)
1. Lancez `npx expo start`
2. Scannez le QR code avec l'appareil photo de l'iPhone
3. L'app s'ouvre dans Expo Go

### Option 2 : Build iOS (nécessite un compte Apple Developer - 99$/an)
```bash
eas build -p ios --profile preview
```

---

## Configuration Firebase (Production)

Pour que l'authentification OTP fonctionne en production :

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Créez un nouveau projet "237Urgences"
3. Activez **Authentication** > **Phone** dans les méthodes de connexion
4. Ajoutez une **application Android** (package: `com.urgences237.app`)
5. Ajoutez une **application iOS** (bundle: `com.urgences237.app`)
6. Copiez la configuration Firebase dans `src/config/firebase.ts`

```typescript
// src/config/firebase.ts - Remplacez par vos vraies clés
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

> **Note** : En mode démo, l'OTP est simulé et le code est affiché à l'utilisateur.

---

## Commandes Utiles

| Commande | Description |
|----------|-------------|
| `npx expo start` | Lancer le serveur de développement |
| `npx expo start --android` | Lancer sur émulateur Android |
| `npx expo start --ios` | Lancer sur simulateur iOS |
| `npx tsc --noEmit` | Vérifier les types TypeScript |
| `eas build -p android --profile preview` | Générer l'APK Android |
| `eas build -p ios --profile preview` | Build iOS |
| `eas login` | Se connecter à Expo |
| `eas whoami` | Vérifier le compte connecté |

---

## Charte Graphique

| Élément | Couleur | Hex |
|---------|---------|-----|
| Primaire (Vert Cameroun) | 🟩 | `#009639` |
| Danger / Alerte (Rouge Cameroun) | 🟥 | `#CE1126` |
| Warning (Jaune Cameroun) | 🟨 | `#FCBF49` |
| Fond sombre | ⬛ | `#0D1117` |
| Surface sombre | ⬛ | `#161B22` |
| Fond clair | ⬜ | `#F5F6FA` |

---

## Auteurs

- Projet universitaire - @ntic 2026
- Application : **237Urgences**
- Plateforme : Android & iOS
