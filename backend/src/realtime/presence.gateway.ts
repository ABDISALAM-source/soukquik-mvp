import { IncomingMessage, Server as HttpServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { presenceRepository } from '../modules/presence/presence.repository';

// Chaque connexion représente un utilisateur présent dans UNE boutique.
// Le gros gain sur le POST /enter+/leave HTTP : quand l'app se ferme
// brutalement (crash, réseau coupé), la socket se ferme et on nettoie la
// présence en base automatiquement — plus de sessions fantômes.
interface PresenceSocket extends WebSocket {
  shopId?: string;
  userId?: string;
  isAlive?: boolean;
}

// Salles en mémoire : shopId -> sockets connectées. Sert à diffuser le
// nouveau compteur à tous ceux qui regardent la même boutique.
const rooms = new Map<string, Set<PresenceSocket>>();

function joinRoom(shopId: string, socket: PresenceSocket) {
  let room = rooms.get(shopId);
  if (!room) {
    room = new Set();
    rooms.set(shopId, room);
  }
  room.add(socket);
}

function leaveRoom(shopId: string, socket: PresenceSocket) {
  const room = rooms.get(shopId);
  if (!room) return;
  room.delete(socket);
  if (room.size === 0) rooms.delete(shopId);
}

async function broadcastCount(shopId: string) {
  const data = await presenceRepository.activeCount(shopId);
  const appWide = await presenceRepository.activeUsersAppWide();
  const intensity = appWide > 0 ? Math.min(data / appWide, 1) : 0;
  const message = JSON.stringify({ type: 'presence', shopId, count: data, appWideCount: appWide, intensity });
  const room = rooms.get(shopId);
  if (!room) return;
  for (const socket of room) {
    if (socket.readyState === WebSocket.OPEN) socket.send(message);
  }
}

function authenticate(req: IncomingMessage): { userId: string; shopId: string } | null {
  // Params passés en query string : ws://host/ws/presence?token=...&shopId=...
  const url = new URL(req.url ?? '', 'http://localhost');
  const token = url.searchParams.get('token');
  const shopId = url.searchParams.get('shopId');
  if (!token || !shopId) return null;
  try {
    const payload = jwt.verify(token, env.jwtAccessSecret) as { id: string };
    return { userId: payload.id, shopId };
  } catch {
    return null;
  }
}

export function attachPresenceGateway(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws/presence' });

  wss.on('connection', async (socket: PresenceSocket, req: IncomingMessage) => {
    const auth = authenticate(req);
    if (!auth) {
      socket.close(4001, 'Authentification requise');
      return;
    }

    socket.userId = auth.userId;
    socket.shopId = auth.shopId;
    socket.isAlive = true;

    joinRoom(auth.shopId, socket);
    try {
      await presenceRepository.enter(auth.shopId, auth.userId);
      await broadcastCount(auth.shopId);
    } catch {
      // Boutique inexistante / erreur DB : on ferme proprement plutôt que
      // de laisser une socket à moitié enregistrée.
      leaveRoom(auth.shopId, socket);
      socket.close(4002, 'Impossible de rejoindre la boutique');
      return;
    }

    socket.on('pong', () => {
      socket.isAlive = true;
    });

    socket.on('close', async () => {
      leaveRoom(auth.shopId, socket);
      try {
        await presenceRepository.leave(auth.shopId, auth.userId);
        await broadcastCount(auth.shopId);
      } catch {
        // rien de plus à faire : la socket est déjà fermée
      }
    });

    socket.on('error', () => {
      // 'close' se déclenchera ensuite et fera le nettoyage
    });
  });

  // Heartbeat : toutes les 30 s, on ping chaque socket. Celles qui n'ont
  // pas répondu au ping précédent sont considérées mortes et terminées
  // (leur handler 'close' nettoie la présence en base).
  const heartbeat = setInterval(() => {
    for (const socket of wss.clients as Set<PresenceSocket>) {
      if (socket.isAlive === false) {
        socket.terminate();
        continue;
      }
      socket.isAlive = false;
      socket.ping();
    }
  }, 30000);

  wss.on('close', () => clearInterval(heartbeat));

  return wss;
}
