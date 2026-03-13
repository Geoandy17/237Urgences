import { Client, IMessage } from '@stomp/stompjs';
import { IncidentResponse, BASE_URL } from './api';

// Construire l'URL WebSocket à partir de BASE_URL
const WS_URL = BASE_URL.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:') + '/ws';

// Mode démo : false = connexion réelle au serveur
const DEMO_MODE = false;

// Intervalle de polling REST en fallback (30 secondes)
const POLLING_INTERVAL = 30000;

type StatusCallback = (incident: IncidentResponse) => void;

let stompClient: Client | null = null;

/**
 * Se connecter au WebSocket STOMP et écouter les changements de statut
 * pour un incident donné (filtré par référence).
 * En mode démo ou si le WebSocket échoue, active un polling REST en fallback.
 */
export function connectWebSocket(
  reference: string,
  onStatusUpdate: StatusCallback,
  fetchFallback: () => Promise<void>,
): () => void {
  let pollingTimer: ReturnType<typeof setInterval> | null = null;
  let disconnected = false;

  const startPolling = () => {
    if (pollingTimer || disconnected) return;
    pollingTimer = setInterval(() => {
      if (!disconnected) fetchFallback();
    }, POLLING_INTERVAL);
  };

  const stopPolling = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
  };

  if (DEMO_MODE) {
    // En mode démo, on fait du polling REST uniquement
    startPolling();
    return () => {
      disconnected = true;
      stopPolling();
    };
  }

  // Mode réel : connexion WebSocket STOMP
  try {
    stompClient = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    stompClient.onConnect = () => {
      // Arrêter le polling si le WebSocket est connecté
      stopPolling();

      // Écouter les changements de statut
      stompClient?.subscribe('/topic/statuts', (msg: IMessage) => {
        try {
          const incident: IncidentResponse = JSON.parse(msg.body);
          // Filtrer par référence pour ne traiter que notre incident
          if (incident.reference === reference) {
            onStatusUpdate(incident);
          }
        } catch {}
      });
    };

    stompClient.onStompError = () => {
      // En cas d'erreur STOMP, basculer sur le polling
      startPolling();
    };

    stompClient.onWebSocketClose = () => {
      // Connexion perdue, basculer sur le polling
      if (!disconnected) startPolling();
    };

    stompClient.activate();
  } catch {
    // WebSocket indisponible, fallback polling
    startPolling();
  }

  // Retourne la fonction de déconnexion
  return () => {
    disconnected = true;
    stopPolling();
    if (stompClient) {
      try { stompClient.deactivate(); } catch {}
      stompClient = null;
    }
  };
}
