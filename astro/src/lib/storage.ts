// src/lib/storage.ts
// Shared IndexedDB storage implementation for Supabase
// This ensures the window client and SharedWorker share the same session storage

interface AsyncStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export class IDBStorage implements AsyncStorage {
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
