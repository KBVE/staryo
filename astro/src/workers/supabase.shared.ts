/// <reference lib="webworker" />
// src/workers/supabase.shared.ts
/* eslint-disable no-restricted-globals */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type Req =
  | { id: string; type: 'init'; payload: { url: string; anonKey: string; options?: any } }
  | { id: string; type: 'getSession' }
  | { id: string; type: 'signInWithPassword'; payload: { email: string; password: string } }
  | { id: string; type: 'signOut' }
  | { id: string; type: 'from.select'; payload: { table: string; columns?: string; match?: Record<string, any>; limit?: number } }
  | { id: string; type: 'rpc'; payload: { fn: string; args?: Record<string, any> } }
  | { id: string; type: 'realtime.subscribe'; payload: { key: string; params: any } }
  | { id: string; type: 'realtime.unsubscribe'; payload: { key: string } };

type Res =
  | { id: string; ok: true; data?: any }
  | { id: string; ok: false; error: string };

const ports = new Set<MessagePort>();

// ---- Minimal async storage backed by IndexedDB (works in workers) ----
interface AsyncStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

class IDBStorage implements AsyncStorage {
  private dbp: Promise<IDBDatabase>;
  constructor(private dbName = 'sb-auth', private storeName = 'kv') {
    this.dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(storeName);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  private async withStore(mode: IDBTransactionMode) {
    const db = await this.dbp;
    return db.transaction(this.storeName, mode).objectStore(this.storeName);
  }
  async getItem(key: string) {
    const store = await this.withStore('readonly');
    return new Promise<string | null>((resolve, reject) => {
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as string) ?? null);
      req.onerror = () => reject(req.error);
    });
  }
  async setItem(key: string, value: string) {
    const store = await this.withStore('readwrite');
    await new Promise<void>((resolve, reject) => {
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
  async removeItem(key: string) {
    const store = await this.withStore('readwrite');
    await new Promise<void>((resolve, reject) => {
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

// ---- Supabase management ----
let client: SupabaseClient | null = null;
const storage = new IDBStorage();

const subscriptions = new Map<
  string,
  { unsubscribe: () => Promise<void> | void }
>();

async function ensureClient(url: string, anonKey: string, options: any = {}) {
  if (client) return client;

  // Validate URL format
  try {
    new URL(url);
  } catch {
    throw new Error(`Invalid Supabase URL: ${url}`);
  }

  client = createClient(url, anonKey, {
    auth: {
      storage,
      persistSession: true,
      autoRefreshToken: true,
      // If you use PKCE/OAuth in your app UI, keep those flows in the page.
    },
    realtime: { params: { eventsPerSecond: 5 } },
    ...options,
  });

  // Broadcast session updates to all tabs
  client.auth.onAuthStateChange(async (_event, session) => {
    for (const p of ports) {
      p.postMessage({ type: 'auth', session });
    }
  });

  return client;
}

function reply(port: MessagePort, msg: Res) {
  port.postMessage(msg);
}

(self as unknown as SharedWorkerGlobalScope).onconnect = (evt: MessageEvent) => {
  const port = evt.ports[0];
  ports.add(port);

  port.onmessage = async (e: MessageEvent<Req>) => {
    const m = e.data;
    try {
      switch (m.type) {
        case 'init': {
          const c = await ensureClient(m.payload.url, m.payload.anonKey, m.payload.options);
          const { data, error } = await c.auth.getSession();
          if (error) throw error;
          reply(port, { id: m.id, ok: true, data: { session: data.session } });
          break;
        }

        case 'getSession': {
          if (!client) throw new Error('Not initialized');
          const { data, error } = await client.auth.getSession();
          if (error) throw error;
          reply(port, { id: m.id, ok: true, data });
          break;
        }

        case 'signInWithPassword': {
          if (!client) throw new Error('Not initialized');
          const { email, password } = m.payload;
          const { data, error } = await client.auth.signInWithPassword({ email, password });
          if (error) throw error;
          reply(port, { id: m.id, ok: true, data });
          break;
        }

        case 'signOut': {
          if (!client) throw new Error('Not initialized');
          const { error } = await client.auth.signOut();
          if (error) throw error;
          reply(port, { id: m.id, ok: true });
          break;
        }

        case 'from.select': {
          if (!client) throw new Error('Not initialized');
          const q = client.from(m.payload.table).select(m.payload.columns ?? '*');
          let query = q;
          if (m.payload.match) query = query.match(m.payload.match);
          if (m.payload.limit) query = query.limit(m.payload.limit);
          const { data, error } = await query;
          if (error) throw error;
          reply(port, { id: m.id, ok: true, data });
          break;
        }

        case 'rpc': {
          if (!client) throw new Error('Not initialized');
          const { fn, args } = m.payload;
          const { data, error } = await client.rpc(fn, args ?? {});
          if (error) throw error;
          reply(port, { id: m.id, ok: true, data });
          break;
        }

        case 'realtime.subscribe': {
          if (!client) throw new Error('Not initialized');
          const { key, params } = m.payload;

          // Example: Postgres changes
          const channel = client
            .channel(key)
            .on('postgres_changes', params, (payload) => {
              // fan out to every connected port
              for (const p of ports) {
                p.postMessage({ type: 'realtime', key, payload });
              }
            });

          await channel.subscribe();
          subscriptions.set(key, {
            unsubscribe: async () => {
              await channel.unsubscribe();
            },
          });
          reply(port, { id: m.id, ok: true });
          break;
        }

        case 'realtime.unsubscribe': {
          const sub = subscriptions.get(m.payload.key);
          if (sub) {
            await sub.unsubscribe();
            subscriptions.delete(m.payload.key);
          }
          reply(port, { id: m.id, ok: true });
          break;
        }

        default: {
          const _exhaustive: never = m;
          reply(port, { id: (_exhaustive as any).id, ok: false, error: 'Unknown message type' });
        }
      }
    } catch (err: any) {
      reply(port, { id: m.id, ok: false, error: String(err?.message ?? err) });
    }
  };

  port.start();
  port.postMessage({ type: 'ready' });

  port.onmessageerror = () => {
    ports.delete(port);
  };
  port.close = () => {
    ports.delete(port);
  };
};
