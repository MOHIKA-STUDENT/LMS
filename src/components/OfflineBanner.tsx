'use client';

import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { offlineDb } from '@/lib/db/offline-db';
import { processOfflineQueue, registerOnlineSyncListener } from '@/lib/sync/sync-engine';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const pendingItems = useLiveQuery(
    () => offlineDb.offlineQueue.where('synced').equals(0).toArray(),
    []
  );

  const pendingCount = pendingItems?.length || 0;

  useEffect(() => {
    setIsOnline(navigator.onLine);
    registerOnlineSyncListener();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await processOfflineQueue();
    setIsSyncing(false);
  };

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`w-full py-2 px-4 text-sm flex items-center justify-between text-white transition-colors duration-300 ${
      !isOnline ? 'bg-amber-600' : 'bg-indigo-600'
    }`}>
      <div className="flex items-center space-x-2 container mx-auto">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4 text-amber-200 animate-pulse" />
            <span className="font-medium">
              You are working offline. {pendingCount} change(s) saved locally in IndexedDB.
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span className="font-medium">
              Internet reconnected. {pendingCount} item(s) pending sync to server.
            </span>
          </>
        )}
      </div>

      {isOnline && pendingCount > 0 && (
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="ml-4 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      )}
    </div>
  );
}
