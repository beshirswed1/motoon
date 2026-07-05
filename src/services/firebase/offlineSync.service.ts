import { Store } from '@reduxjs/toolkit';
import { dequeueAction, selectOfflineQueue, setSyncing } from '@/store/slices/offlineQueueSlice';
import { progressService } from './progress.service';
import { notificationsService } from './notifications.service';

const services: Record<string, any> = {
  progressService,
  notificationsService,
};

export const offlineSyncService = {
  initialize: (store: Store) => {
    if (typeof window === 'undefined') return;

    const processQueue = async () => {
      const state = store.getState();
      const queue = selectOfflineQueue(state);
      const isSyncing = state.offlineQueue.isSyncing;

      if (queue.length === 0 || isSyncing) return;

      store.dispatch(setSyncing(true));

      for (const action of queue) {
        const service = services[action.service];
        if (service && typeof service[action.method] === 'function') {
          try {
            await service[action.method](action.payload);
            // Dequeue action on success
            store.dispatch(dequeueAction(action.id));
          } catch (error) {
            console.error(`Offline sync failed for action ${action.id}:`, error);
            // Break loop to retry later when connection stabilizes
            break;
          }
        } else {
          console.warn(`Service ${action.service} or method ${action.method} not found. Dequeuing...`);
          store.dispatch(dequeueAction(action.id));
        }
      }

      store.dispatch(setSyncing(false));
    };

    // Listen to network status changes
    window.addEventListener('online', processQueue);

    // Initial check on load
    if (navigator.onLine) {
      processQueue();
    }
  }
};
