import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// ===== CONFIGURATION =====
const BASE_URL = 'http://154.126.128.36:8080/api/v1';

// Mode démo : false = appels réels au serveur
const DEMO_MODE = false;

const TOKEN_KEY = '@237urgences_access_token';
const REFRESH_KEY = '@237urgences_refresh_token';

// ===== TYPES API =====

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  timestamp: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: number;
  nom: string;
  prenom: string;
  telephone: string;
  role: string;
}

export type TypeUrgence =
  | 'INCENDIE'
  | 'AGRESSION'
  | 'ACCIDENT_ROUTE'
  | 'URGENCE_MEDICALE'
  | 'CATASTROPHE_NATURELLE'
  | 'AUTRE';

export type Region =
  | 'ADAMAOUA' | 'CENTRE' | 'EST'
  | 'EXTREME_NORD' | 'LITTORAL' | 'NORD'
  | 'NORD_OUEST' | 'OUEST' | 'SUD'
  | 'SUD_OUEST';

export type NiveauGravite = 'LEGERE' | 'MODEREE' | 'GRAVE' | 'CRITIQUE';

export type StatutIncident =
  | 'ALERTE' | 'ASSIGNE' | 'EN_ROUTE' | 'SUR_PLACE'
  | 'EN_COURS' | 'RESOLU' | 'CLOS' | 'ANNULE';

export interface SignalementRequest {
  typeUrgence: TypeUrgence;
  description: string;
  telephoneContact: string;
  region: Region;
  ville: string;
  latitude: number;
  longitude: number;
  quartier?: string;
  nombreVictimesEstime?: number;
  heureDebutIncident?: string;
  estTemoin?: boolean;
}

export interface UniteAssignee {
  id: number;
  nom: string;
  corpsService: 'POMPIERS' | 'POLICE' | 'GENDARMERIE' | 'SAMU';
  typeUnite: 'FIXE' | 'MOBILE';
  statut: string;
  telephoneStandard?: string;
  telephoneChef?: string;
  ville?: string;
  latitude?: number;
  longitude?: number;
}

export interface MediaItem {
  id: number;
  type: 'IMAGE' | 'AUDIO';
  url: string;
  nomFichier: string;
}

export interface HistoriqueStatut {
  ancienStatut: StatutIncident;
  nouveauStatut: StatutIncident;
  commentaire?: string;
  modifieParNom: string;
  modifieParPrenom?: string;
  modifieParRole?: string;
  changedAt: string;
}

export interface IncidentResponse {
  id: number;
  reference: string;
  typeUrgence: TypeUrgence;
  niveauGravite: NiveauGravite;
  statut: StatutIncident;
  description: string;
  region: Region;
  ville: string;
  quartier?: string;
  latitude: number;
  longitude: number;
  signaleParNom?: string;
  signaleParTelephone?: string;
  corpsPrenantEnCharge?: string;
  assigneParNom?: string;
  assigneParRole?: string;
  nombreVictimesEstime?: number;
  tempsReponseMinutes?: number;
  heureDebutIncident?: string;
  uniteAssignee?: UniteAssignee;
  medias: MediaItem[];
  createdAt: string;
  heureAssignation?: string;
  heureArrivee?: string;
  heureResolution?: string;
  historique: HistoriqueStatut[];
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ProfilResponse {
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
}

// ===== DONNÉES DÉMO =====

const DEMO_STORAGE_KEY = '@237urgences_demo_incidents';

let demoUserId = 1;

function generateReference(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'URG-';
  for (let i = 0; i < 8; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

function demoResponse<T>(data: T, message = 'Succès'): ApiResponse<T> {
  return { success: true, message, data, timestamp: new Date().toISOString() };
}

function demoError<T>(message: string): ApiResponse<T> {
  return { success: false, message, data: null, timestamp: new Date().toISOString() };
}

async function getDemoIncidents(): Promise<IncidentResponse[]> {
  try {
    const stored = await AsyncStorage.getItem(DEMO_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

async function saveDemoIncidents(incidents: IncidentResponse[]) {
  await AsyncStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(incidents));
}

// ===== GESTION DES TOKENS (SecureStore sur mobile, AsyncStorage sur web) =====

const isWeb = Platform.OS === 'web';

async function secureSet(key: string, value: string) {
  if (isWeb) {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function secureGet(key: string): Promise<string | null> {
  if (isWeb) {
    return AsyncStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function secureDelete(key: string) {
  if (isWeb) {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export async function saveTokens(access: string, refresh: string) {
  await secureSet(TOKEN_KEY, access);
  await secureSet(REFRESH_KEY, refresh);
}

export async function getAccessToken(): Promise<string | null> {
  return secureGet(TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return secureGet(REFRESH_KEY);
}

export async function clearTokens() {
  await secureDelete(TOKEN_KEY);
  await secureDelete(REFRESH_KEY);
}

// ===== SESSION EXPIRATION CALLBACK =====

let onSessionExpired: (() => void) | null = null;

/** Enregistre un callback appelé quand la session expire (refresh token invalide) */
export function setOnSessionExpired(callback: () => void) {
  onSessionExpired = callback;
}

// ===== CLIENT HTTP =====

async function request<T>(
  path: string,
  options: RequestInit = {},
  requireAuth = true,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Ajouter le Content-Type JSON si pas multipart
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Ajouter le token si nécessaire
  if (requireAuth) {
    const token = await getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = `${BASE_URL}${path}`;

  let response = await fetch(url, { ...options, headers });

  // Si 401, tenter un refresh
  if (response.status === 401 && requireAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = await getAccessToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, { ...options, headers });
    } else {
      // Refresh échoué → session expirée, forcer la déconnexion
      await clearTokens();
      if (onSessionExpired) onSessionExpired();
    }
  }

  const json = await response.json();
  return json as ApiResponse<T>;
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;

    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        Accept: 'application/json',
      },
      body: refreshToken,
    });

    if (!response.ok) return false;

    const json: ApiResponse<AuthTokens> = await response.json();
    if (json.success && json.data) {
      await saveTokens(json.data.accessToken, json.data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ===== ENDPOINTS AUTH =====

export async function apiRegister(data: {
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  motDePasse: string;
}): Promise<ApiResponse<AuthTokens>> {
  if (DEMO_MODE) {
    // Simuler un délai réseau
    await new Promise(r => setTimeout(r, 800));
    demoUserId++;
    return demoResponse<AuthTokens>({
      accessToken: `demo_access_${Date.now()}`,
      refreshToken: `demo_refresh_${Date.now()}`,
      tokenType: 'Bearer',
      expiresIn: 3600,
      userId: demoUserId,
      nom: data.nom,
      prenom: data.prenom,
      telephone: data.telephone,
      role: 'CITOYEN',
    }, 'Compte créé avec succès');
  }
  return request<AuthTokens>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }, false);
}

export async function apiLogin(data: {
  telephone: string;
  motDePasse: string;
}): Promise<ApiResponse<AuthTokens>> {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 800));
    // En mode démo, accepter n'importe quel mot de passe
    return demoResponse<AuthTokens>({
      accessToken: `demo_access_${Date.now()}`,
      refreshToken: `demo_refresh_${Date.now()}`,
      tokenType: 'Bearer',
      expiresIn: 3600,
      userId: 1,
      nom: 'Utilisateur',
      prenom: 'Demo',
      telephone: data.telephone,
      role: 'CITOYEN',
    }, 'Connexion réussie');
  }
  return request<AuthTokens>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }, false);
}

export async function apiLogout(): Promise<ApiResponse<null>> {
  if (DEMO_MODE) {
    await clearTokens();
    return demoResponse<null>(null, 'Déconnexion réussie');
  }
  const result = await request<null>('/auth/logout', { method: 'POST' });
  await clearTokens();
  return result;
}

// ===== ENDPOINTS PROFIL =====

export async function apiGetProfil(): Promise<ApiResponse<ProfilResponse>> {
  if (DEMO_MODE) {
    return demoResponse<ProfilResponse>({
      nom: 'Utilisateur',
      prenom: 'Demo',
      telephone: '+237600000000',
    });
  }
  return request<ProfilResponse>('/profil');
}

export async function apiUpdateProfil(data: Partial<ProfilResponse>): Promise<ApiResponse<ProfilResponse>> {
  if (DEMO_MODE) {
    return demoResponse<ProfilResponse>({
      nom: data.nom || 'Utilisateur',
      prenom: data.prenom || 'Demo',
      telephone: data.telephone || '+237600000000',
      email: data.email,
    });
  }
  return request<ProfilResponse>('/profil', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ===== ENDPOINTS INCIDENTS =====

export async function apiCreateIncident(data: SignalementRequest): Promise<ApiResponse<IncidentResponse>> {
  if (DEMO_MODE) {
    return _demoCreateIncident(data);
  }
  return request<IncidentResponse>('/incidents', {
    method: 'POST',
    body: JSON.stringify(data),
  }, false);
}

async function _demoCreateIncident(data: SignalementRequest): Promise<ApiResponse<IncidentResponse>> {
  await new Promise(r => setTimeout(r, 1500));
  const reference = generateReference();
  const now = new Date().toISOString();
  const incident: IncidentResponse = {
    id: Date.now(),
    reference,
    typeUrgence: data.typeUrgence,
    niveauGravite: 'MODEREE',
    statut: 'ALERTE',
    description: data.description,
    region: data.region,
    ville: data.ville,
    quartier: data.quartier,
    latitude: data.latitude,
    longitude: data.longitude,
    medias: [],
    createdAt: now,
    historique: [
      {
        ancienStatut: 'ALERTE',
        nouveauStatut: 'ALERTE',
        commentaire: 'Signalement reçu',
        modifieParNom: 'Système',
        changedAt: now,
      },
    ],
  };

  // Sauvegarder dans le stockage local
  const incidents = await getDemoIncidents();
  incidents.unshift(incident);
  await saveDemoIncidents(incidents);

  return demoResponse(incident, 'Incident signalé avec succès');
}

export async function apiCreateIncidentWithMedia(
  data: SignalementRequest,
  photos: { uri: string; name: string; type: string }[],
  audio?: { uri: string; name: string; type: string },
): Promise<ApiResponse<IncidentResponse>> {
  if (DEMO_MODE) {
    // En mode démo, on ignore les fichiers média et on crée l'incident
    return _demoCreateIncident(data);
  }

  const formData = new FormData();

  // Part "data" : JSON sérialisé
  formData.append('data', JSON.stringify(data));

  // Parts "photos" (0 à 3)
  photos.forEach((photo) => {
    formData.append('photos', photo as any);
  });

  // Part "audio" (optionnel)
  if (audio) {
    formData.append('audio', audio as any);
  }

  const token = await getAccessToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}/incidents/avec-photo`, {
    method: 'POST',
    headers,
    body: formData,
  });

  // Si 401, tenter refresh et réessayer
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = await getAccessToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      const retryResponse = await fetch(`${BASE_URL}/incidents/avec-photo`, {
        method: 'POST',
        headers,
        body: formData,
      });
      return retryResponse.json();
    }
  }

  return response.json();
}

export async function apiGetIncidentSuivi(reference: string): Promise<ApiResponse<IncidentResponse>> {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 600));
    const incidents = await getDemoIncidents();
    const found = incidents.find(i => i.reference === reference);
    if (found) {
      return demoResponse(found);
    }
    return demoError('Incident non trouvé');
  }
  return request<IncidentResponse>(`/incidents/suivi/${reference}`, {}, false);
}

export async function apiGetMesIncidents(page = 0, size = 10): Promise<ApiResponse<PageResponse<IncidentResponse>>> {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 600));
    const allIncidents = await getDemoIncidents();
    const start = page * size;
    const content = allIncidents.slice(start, start + size);
    return demoResponse<PageResponse<IncidentResponse>>({
      content,
      page,
      size,
      totalElements: allIncidents.length,
      totalPages: Math.ceil(allIncidents.length / size),
      last: start + size >= allIncidents.length,
    });
  }
  return request<PageResponse<IncidentResponse>>(`/incidents/mes-incidents?page=${page}&size=${size}`);
}

export async function apiAddMedias(
  incidentId: number,
  photos: { uri: string; name: string; type: string }[],
  audio?: { uri: string; name: string; type: string },
): Promise<ApiResponse<IncidentResponse>> {
  if (DEMO_MODE) {
    return demoError('Non disponible en mode démo');
  }

  const formData = new FormData();
  photos.forEach((photo) => formData.append('fichiers', photo as any));
  if (audio) formData.append('fichiers', audio as any);

  const token = await getAccessToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}/incidents/${incidentId}/medias`, {
    method: 'POST',
    headers,
    body: formData,
  });
  return response.json();
}

// ===== HELPERS =====

/** Convertit un nom de région humain vers l'enum API */
export function regionToEnum(regionName: string): Region {
  const mapping: Record<string, Region> = {
    'adamaoua': 'ADAMAOUA',
    'centre': 'CENTRE',
    'est': 'EST',
    'extrême-nord': 'EXTREME_NORD',
    'extreme-nord': 'EXTREME_NORD',
    'extrême nord': 'EXTREME_NORD',
    'extreme nord': 'EXTREME_NORD',
    'littoral': 'LITTORAL',
    'nord': 'NORD',
    'nord-ouest': 'NORD_OUEST',
    'nord ouest': 'NORD_OUEST',
    'ouest': 'OUEST',
    'sud': 'SUD',
    'sud-ouest': 'SUD_OUEST',
    'sud ouest': 'SUD_OUEST',
    // Versions avec "région du/de"
    'région du centre': 'CENTRE',
    'region du centre': 'CENTRE',
    'région du littoral': 'LITTORAL',
    'region du littoral': 'LITTORAL',
    'région du nord': 'NORD',
    'region du nord': 'NORD',
    'région du sud': 'SUD',
    'region du sud': 'SUD',
    'région de l\'est': 'EST',
    'region de l\'est': 'EST',
    'région de l\'ouest': 'OUEST',
    'region de l\'ouest': 'OUEST',
    'région de l\'adamaoua': 'ADAMAOUA',
    'region de l\'adamaoua': 'ADAMAOUA',
    'région de l\'extrême-nord': 'EXTREME_NORD',
    'region de l\'extreme-nord': 'EXTREME_NORD',
    'région du nord-ouest': 'NORD_OUEST',
    'region du nord-ouest': 'NORD_OUEST',
    'région du sud-ouest': 'SUD_OUEST',
    'region du sud-ouest': 'SUD_OUEST',
  };
  const key = regionName.toLowerCase().trim();
  return mapping[key] || 'CENTRE';
}

export { BASE_URL };
