import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { attachPresenceGateway } from './realtime/presence.gateway';

const app = createApp();
const server = http.createServer(app);

// Présence temps réel (Phase 8) : le WebSocket partage le même serveur HTTP
// (donc le même port et le même tunnel Cloudflare), sur le chemin
// /ws/presence.
attachPresenceGateway(server);

server.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`SoukQuik API listening on http://localhost:${env.port}`);
});
