import { useEffect, useRef, useState } from 'react';
import { useSession } from '../store/session';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

// Dérive l'URL WebSocket depuis l'URL API : on enlève le suffixe /api, on
// passe http(s) -> ws(s), et on cible le chemin du gateway de présence.
function presenceWsUrl(token: string, shopId: string): string {
  const base = API_URL.replace(/\/api\/?$/, '');
  const wsBase = base.replace(/^http/, 'ws');
  return `${wsBase}/ws/presence?token=${encodeURIComponent(token)}&shopId=${encodeURIComponent(shopId)}`;
}

export interface PresenceState {
  count: number;
  appWideCount: number;
  intensity: number;
}

/**
 * Présence temps réel dans une boutique (Phase 8). Ouvre une WebSocket tant
 * que l'écran est monté : le serveur enregistre l'entrée à la connexion et
 * la sortie automatiquement à la fermeture de la socket (démontage de
 * l'écran, app fermée, réseau coupé). Reconnexion automatique avec léger
 * back-off si la connexion tombe.
 */
export function usePresence(shopId: string | undefined, initial?: PresenceState): PresenceState {
  const [state, setState] = useState<PresenceState>(initial ?? { count: 0, appWideCount: 0, intensity: 0 });
  const socketRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const closedByUsRef = useRef(false);

  useEffect(() => {
    if (!shopId) return;
    const token = useSession.getState().accessToken;
    if (!token) return; // non connecté : pas de présence temps réel

    closedByUsRef.current = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    function connect() {
      const socket = new WebSocket(presenceWsUrl(token!, shopId!));
      socketRef.current = socket;

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          if (data.type === 'presence') {
            setState({ count: data.count, appWideCount: data.appWideCount, intensity: data.intensity });
          }
        } catch {
          // message non-JSON ignoré
        }
      };

      socket.onopen = () => {
        retryRef.current = 0;
      };

      socket.onclose = () => {
        if (closedByUsRef.current) return;
        // Reconnexion avec back-off plafonné à 10 s.
        const delay = Math.min(1000 * 2 ** retryRef.current, 10000);
        retryRef.current += 1;
        reconnectTimer = setTimeout(connect, delay);
      };

      socket.onerror = () => {
        // onclose suivra et gérera la reconnexion
      };
    }

    connect();

    return () => {
      closedByUsRef.current = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [shopId]);

  return state;
}
