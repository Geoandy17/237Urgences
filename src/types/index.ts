import { TypeUrgence, Region, StatutIncident, IncidentResponse } from '../services/api';

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Register: undefined;
  Login: undefined;
  OTP: {
    phoneNumber: string;
    verificationId?: string;
    nom: string;
    prenom: string;
    email?: string;
    motDePasse: string;
  };
  MainTabs: undefined;
  EmergencyCall: undefined;
  Hospitals: undefined;
  Pharmacies: undefined;
  DeclareIncident: undefined;
  IncidentConfirmation: { reference: string };
  IncidentTracking: { reference: string };
  MyIncidents: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Services: undefined;
  MyIncidents: undefined;
  Profile: undefined;
};

export interface UserData {
  userId: number;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  role: string;
}

export interface Incident {
  id: number;
  reference: string;
  typeUrgence: TypeUrgence;
  statut: StatutIncident;
  description: string;
  ville: string;
  region: Region;
  createdAt: string;
}

export type IncidentCategory = TypeUrgence;

// Re-export API types for convenience
export type { TypeUrgence, Region, StatutIncident, IncidentResponse };

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
