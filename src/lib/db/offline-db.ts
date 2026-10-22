import Dexie, { Table } from 'dexie';
import { OfflineAction } from '@/types/lms';

export class LMSOfflineDatabase extends Dexie {
  offlineQueue!: Table<OfflineAction, number>;

  constructor() {
    super('LMSOfflineDatabase');
    this.version(1).stores({
      offlineQueue: '++id, type, timestamp, synced',
    });
  }
}

export const offlineDb = new LMSOfflineDatabase();

// Prevent unhandled promise rejection crashes on devices where IndexedDB is blocked or disabled
if (typeof window !== 'undefined') {
  try {
    offlineDb.open().catch((err) => {
      console.warn('IndexedDB is not supported or is blocked on this device/browser:', err);
    });
  } catch (err) {
    console.warn('Failed to initialize IndexedDB:', err);
  }
}
