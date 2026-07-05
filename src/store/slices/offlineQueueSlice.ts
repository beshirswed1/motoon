import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';

export interface OfflineAction {
  id: string;
  service: string;  // name of target service, e.g., 'progressService'
  method: string;   // name of method to call, e.g., 'createOrUpdate'
  payload: unknown;     // arguments to pass to the method
  timestamp: number;
}

export interface OfflineQueueState {
  queue: OfflineAction[];
  isSyncing: boolean;
}

const initialState: OfflineQueueState = {
  queue: [],
  isSyncing: false,
};

const offlineQueueSlice = createSlice({
  name: 'offlineQueue',
  initialState,
  reducers: {
    enqueueAction(state, action: PayloadAction<Omit<OfflineAction, 'id' | 'timestamp'>>) {
      state.queue.push({
        ...action.payload,
        id: `offline_${nanoid(12)}`,
        timestamp: Date.now(),
      });
    },
    dequeueAction(state, action: PayloadAction<string>) {
      state.queue = state.queue.filter((item) => item.id !== action.payload);
    },
    setSyncing(state, action: PayloadAction<boolean>) {
      state.isSyncing = action.payload;
    },
    clearQueue(state) {
      state.queue = [];
      state.isSyncing = false;
    },
  },
});

export const { enqueueAction, dequeueAction, setSyncing, clearQueue } = offlineQueueSlice.actions;

// Selectors
export const selectOfflineQueue = (state: { offlineQueue: OfflineQueueState }) => state.offlineQueue.queue;
export const selectIsSyncing = (state: { offlineQueue: OfflineQueueState }) => state.offlineQueue.isSyncing;

export default offlineQueueSlice.reducer;
