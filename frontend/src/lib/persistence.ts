import { openDB, DBSchema } from 'idb';
import { Process } from '@cpu-vis/shared';

interface LocalScenario {
  id: string;
  name: string;
  processes: Process[];
  createdAt: string;
  synced: boolean;
}

interface QuantixDB extends DBSchema {
  scenarios: {
    key: string;
    value: LocalScenario;
    indexes: { 'by-date': string };
  };
}

const DB_NAME = 'quantix-db';
const STORE_NAME = 'scenarios';

const dbPromise = openDB<QuantixDB>(DB_NAME, 1, {
  upgrade(db) {
    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    store.createIndex('by-date', 'createdAt');
  },
});

export const persistence = {
  async saveScenario(name: string, processes: Process[]): Promise<LocalScenario> {
    const scenario: LocalScenario = {
      id: crypto.randomUUID(),
      name,
      processes,
      createdAt: new Date().toISOString(),
      synced: false,
    };
    const db = await dbPromise;
    await db.put(STORE_NAME, scenario);
    return scenario;
  },

  async getScenarios(): Promise<LocalScenario[]> {
    const db = await dbPromise;
    return db.getAllFromIndex(STORE_NAME, 'by-date');
  },

  async deleteScenario(id: string): Promise<void> {
    const db = await dbPromise;
    await db.delete(STORE_NAME, id);
  },

  async getScenario(id: string): Promise<LocalScenario | undefined> {
    const db = await dbPromise;
    return db.get(STORE_NAME, id);
  },
};
