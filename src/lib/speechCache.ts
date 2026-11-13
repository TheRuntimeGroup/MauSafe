const DB_NAME = "mausafe-speech";
const STORE_NAME = "audio";
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 100;

type CachedAudio = {
  key: string;
  blob: Blob;
  createdAt: number;
};

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      const store = database.createObjectStore(STORE_NAME, { keyPath: "key" });
      store.createIndex("createdAt", "createdAt");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return databasePromise;
}

export async function getCachedAudio(key: string): Promise<Blob | null> {
  try {
    const database = await openDatabase();
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => {
        const record = request.result as CachedAudio | undefined;
        if (!record) {
          resolve(null);
          return;
        }
        if (Date.now() - record.createdAt > MAX_AGE) {
          store.delete(key);
          resolve(null);
          return;
        }
        resolve(record.blob);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

export async function cacheAudio(key: string, blob: Blob): Promise<void> {
  try {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.put({ key, blob, createdAt: Date.now() } satisfies CachedAudio);

      let excessEntries = 0;
      const countRequest = store.count();
      countRequest.onsuccess = () => {
        excessEntries = Math.max(0, countRequest.result - MAX_ENTRIES);
        const cursorRequest = store.index("createdAt").openCursor();
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (!cursor) return;
          const record = cursor.value as CachedAudio;
          const expired = Date.now() - record.createdAt > MAX_AGE;
          if (expired || excessEntries > 0) {
            cursor.delete();
            if (!expired) excessEntries -= 1;
          }
          cursor.continue();
        };
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch {
    // Playback still works when persistent caching is unavailable.
  }
}
