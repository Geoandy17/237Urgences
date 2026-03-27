// import { Client, IMessage } from '@stomp/stompjs';
import { IncidentResponse } from './api';

// const WS_URL = BASE_URL.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:') + '/ws';

// Mode démo : false = connexion réelle au serveur
// const DEMO_MODE = false;

// Intervalle de polling REST en fallback (30 secondes)
const POLLING_INTERVAL = 30000;

type StatusCallback = (incident: IncidentResponse) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let stompClient: any = null;

/**
 * Se connecter au WebSocket STOMP et écouter les changements de statut
 * pour un incident donné (filtré par référence).
 * En mode démo ou si le WebSocket échoue, active un polling REST en fallback.
 */
export function connectWebSocket(
  _reference: string,
  _onStatusUpdate: StatusCallback,
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

  // if (DEMO_MODE) {
  //   // En mode démo, on fait du polling REST uniquement
  //   startPolling();
  //   return () => {
  //     disconnected = true;
  //     stopPolling();
  //   };
  // }

  // WebSocket STOMP désactivé temporairement — serveur WS non disponible
  // TODO: réactiver quand le serveur WebSocket sera opérationnel
  // try {
  //   stompClient = new Client({
  //     brokerURL: WS_URL,
  //     reconnectDelay: 5000,
  //     heartbeatIncoming: 10000,
  //     heartbeatOutgoing: 10000,
  //   });
  //   stompClient.onConnect = () => {
  //     stopPolling();
  //     stompClient?.subscribe('/topic/statuts', (msg: IMessage) => {
  //       try {
  //         const incident: IncidentResponse = JSON.parse(msg.body);
  //         if (incident.reference === reference) {
  //           onStatusUpdate(incident);
  //         }
  //       } catch {}
  //     });
  //   };
  //   stompClient.onStompError = () => { startPolling(); };
  //   stompClient.onWebSocketClose = () => { if (!disconnected) startPolling(); };
  //   stompClient.activate();
  // } catch {
  //   startPolling();
  // }

  // Fallback polling REST uniquement
  startPolling();

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
