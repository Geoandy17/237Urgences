export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Register: undefined;
  Login: { nom?: string; prenom?: string; email?: string };
  OTP: { phoneNumber: string; verificationId?: string; nom?: string; prenom?: string; email?: string };
  MainTabs: undefined;
  EmergencyCall: undefined;
  Hospitals: undefined;
  Pharmacies: undefined;
  DeclareIncident: undefined;
  IncidentDetail: { incident: Incident };
  IncidentConfirmation: { payload: IncidentPayload };
};

export type MainTabParamList = {
  Home: undefined;
  Profile: undefined;
};

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  createdAt: Date;
}

export interface Incident {
  id: string;
  userId: string;
  userName: string;
  category: IncidentCategory;
  description: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  status: 'pending' | 'in_progress' | 'resolved';
  createdAt: Date;
}

export type IncidentCategory =
  | 'vol'
  | 'agression'
  | 'accident'
  | 'incendie'
  | 'arnaque'
  | 'vandalisme'
  | 'disparition'
  | 'autre';

// Format de données envoyé au service tiers pour signalement
export interface IncidentPayload {
  id: string;
  timestamp: string;               // ISO 8601
  type: IncidentCategory;
  typeLabel: string;
  description: string;
  audio: {
    uri: string | null;
    durationSeconds: number;
  };
  declarant: {
    userId: string;
    nom: string;
    prenom: string;
    phone: string;                  // numéro OTP (celui avec lequel il s'est connecté)
    selfieUri: string;
  };
  contactUrgence: {
    nom: string;
    phone: string;                  // numéro saisi dans le formulaire
    countryCode: string;
    countryDial: string;
  };
  location: {
    mode: 'gps' | 'manual';
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    city: string | null;
    region: string | null;
    villeManuelle: string | null;
    quartierManuel: string | null;
  };
  status: 'pending';
  platform: string;                 // ios | android | web
}

export interface EmergencyService {
  id: string;
  name: string;
  phone: string;
  icon: string;
  color: string;
  description: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  city: string;
  type: 'public' | 'private';
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  city: string;
  isOpen24h: boolean;
}
