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
