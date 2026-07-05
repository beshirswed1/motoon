import { combineReducers, configureStore, type Action, type ThunkAction } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, createTransform } from 'redux-persist';
import createWebStorage from 'redux-persist/lib/storage/createWebStorage';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import recitationReducer from './slices/recitationSlice';
import offlineQueueReducer from './slices/offlineQueueSlice';

// SSR-Safe storage fallback for Next.js
const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: unknown) {
      return Promise.resolve(value);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
};

const storage = typeof window !== 'undefined' ? createWebStorage('local') : createNoopStorage();

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  recitation: recitationReducer,
  offlineQueue: offlineQueueReducer,
});

const authTransform = createTransform(
  // transform state on its way to being serialized and saved.
  (inboundState) => inboundState,
  // transform state being rehydrated
  (outboundState: any) => {
    if (!outboundState) return outboundState;
    return {
      ...outboundState,
      initialized: false,
      loading: true,
      error: null,
    };
  },
  { whitelist: ['auth'] }
);

const persistConfig = {
  key: 'motoon_root',
  storage,
  whitelist: ['auth', 'ui'], // STRICT PERSISTENCE: whitelist only auth and ui preferences
  transforms: [authTransform as any],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export function makeStore() {
  return configureStore({
    reducer: persistedReducer,
    devTools: process.env.NODE_ENV !== 'production',
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [
            FLUSH,
            REHYDRATE,
            PAUSE,
            PERSIST,
            PURGE,
            REGISTER,
            'auth/setUser',
            'auth/updateUser',
          ],
          ignoredPaths: [
            'auth.user.createdAt',
            'auth.user.updatedAt',
            'auth.user.deletedAt',
            'auth.user.lastLoginAt',
            'auth.user.lastLogin',
          ],
        },
      }),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = AppStore['dispatch'];
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
export const persistor = (store: AppStore) => persistStore(store);
