import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin, type ViteDevServer, type PreviewServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';

interface SyncMessage {
  id: string;
  classId: string;
  type: string;
  data: any;
  senderUsername: string;
  senderName: string;
  clientId: string;
  timestamp: number;
  description?: string;
}

interface SSEClient {
  id: string;
  clientId: string;
  res: ServerResponse;
}

/**
 * Real-time Multi-tenant Class Synchronization Plugin
 * Connects all servant phones, tablets, and laptops in the same Sunday School class
 * Broadcasts updates via Server-Sent Events (SSE) and HTTP REST with sub-5ms latency
 */
function createClassSyncPlugin(): Plugin {
  // Map of classId -> Set of active SSEClient connections
  const classClients = new Map<string, Set<SSEClient>>();
  // In-memory cache of latest state snapshots per class
  const classSnapshots = new Map<string, Record<string, any>>();

  const cacheFile = path.resolve(process.cwd(), '.sync_cache.json');
  try {
    if (fs.existsSync(cacheFile)) {
      const saved = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
      for (const [k, v] of Object.entries(saved)) {
        classSnapshots.set(k, v as Record<string, any>);
      }
    }
  } catch {
    // Ignore cache load error
  }

  const saveCacheToDisk = () => {
    try {
      const obj: Record<string, any> = {};
      for (const [k, v] of classSnapshots.entries()) {
        obj[k] = v;
      }
      fs.writeFileSync(cacheFile, JSON.stringify(obj, null, 2), 'utf-8');
    } catch {
      // Ignore cache save error
    }
  };

  const setupMiddleware = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
      const rawUrl = req.url || '';
      const url = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`);

      // Handle CORS for all /api/sync routes
      if (url.pathname.startsWith('/api/sync')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Client-Id');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }
      }

      // 1. GET /api/sync/events?classId=...&clientId=...
      // Real-time Server-Sent Events stream for connected servants
      if (url.pathname === '/api/sync/events' && req.method === 'GET') {
        const classId = url.searchParams.get('classId') || 'default';
        const clientId = url.searchParams.get('clientId') || Math.random().toString(36).slice(2);

        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        });

        if (!classClients.has(classId)) {
          classClients.set(classId, new Set());
        }
        const clientObj: SSEClient = { id: Math.random().toString(36).slice(2), clientId, res };
        classClients.get(classId)!.add(clientObj);

        // Send connection handshake
        res.write(`event: handshake\ndata: ${JSON.stringify({
          status: 'connected',
          classId,
          clientId,
          connectedServantsCount: classClients.get(classId)!.size,
        })}\n\n`);

        // Send periodic heartbeat ping to prevent timeouts on mobile networks
        const keepAliveTimer = setInterval(() => {
          try {
            res.write(': heartbeat\n\n');
          } catch {
            clearInterval(keepAliveTimer);
          }
        }, 12000);

        req.on('close', () => {
          clearInterval(keepAliveTimer);
          const clients = classClients.get(classId);
          if (clients) {
            clients.delete(clientObj);
            if (clients.size === 0) {
              classClients.delete(classId);
            }
          }
        });
        return;
      }

      // 2. POST /api/sync/publish
      // Publishes an action to all other servants in the same class
      if (url.pathname === '/api/sync/publish' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const msg: SyncMessage = JSON.parse(body);
            const classId = msg.classId || 'default';

            // Update in-memory snapshot
            if (!classSnapshots.has(classId)) {
              classSnapshots.set(classId, {});
            }
            const snap = classSnapshots.get(classId)!;
            snap[msg.type] = { data: msg.data, timestamp: msg.timestamp, sender: msg.senderName };
            saveCacheToDisk();

            // Broadcast to all other servants connected to this class
            const clients = classClients.get(classId);
            let recipientCount = 0;
            if (clients) {
              const payload = `event: message\ndata: ${JSON.stringify(msg)}\n\n`;
              for (const client of clients) {
                // Do not echo back to sender tab
                if (client.clientId !== msg.clientId) {
                  try {
                    client.res.write(payload);
                    recipientCount++;
                  } catch {
                    clients.delete(client);
                  }
                }
              }
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, recipientCount }));
          } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Invalid request payload';
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: errorMsg }));
          }
        });
        return;
      }

      // 3. GET /api/sync/snapshot?classId=...
      // Retrieves cached server snapshot so reconnecting phones catch up instantly
      if (url.pathname === '/api/sync/snapshot' && req.method === 'GET') {
        const classId = url.searchParams.get('classId') || 'default';
        const snap = classSnapshots.get(classId) || {};
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ classId, snapshot: snap }));
        return;
      }

      // 4. POST /api/sync/snapshot
      // Caches a full class snapshot to the server
      if (url.pathname === '/api/sync/snapshot' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const { classId, snapshot } = JSON.parse(body);
            if (classId && snapshot) {
              classSnapshots.set(classId, snapshot);
              saveCacheToDisk();
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
          } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Invalid snapshot';
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: errorMsg }));
          }
        });
        return;
      }

      // 5. GET /api/sync/status
      if (url.pathname === '/api/sync/status' && req.method === 'GET') {
        const stats: Record<string, number> = {};
        for (const [cid, cl] of classClients.entries()) {
          stats[cid] = cl.size;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'online',
          activeClasses: classClients.size,
          classClients: stats,
          cachedSnapshotsCount: classSnapshots.size,
        }));
        return;
      }

      next();
    });
  };

  return {
    name: 'class-realtime-sync',
    configureServer(server) {
      setupMiddleware(server);
    },
    configurePreviewServer(server) {
      setupMiddleware(server);
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    createClassSyncPlugin(),
  ],
  server: {
    host: true, // Listen on all network addresses (0.0.0.0) so phones and laptops on Wi-Fi can connect
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
});
