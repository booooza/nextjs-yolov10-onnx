const DB_NAME = "onnx-model-cache";
const DB_VERSION = 2;
const STORE_NAME = "models";


function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      resolve(db);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function saveModelToCache(key: string, buffer: ArrayBuffer) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).put(buffer, key);
  db.close();
}

export async function loadModelFromCache(key: string): Promise<ArrayBuffer | null> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const result = await new Promise<ArrayBuffer | null>((resolve, reject) => {
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return result;
}