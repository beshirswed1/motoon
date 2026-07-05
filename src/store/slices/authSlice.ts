import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { User } from '../../types/user.types';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
  initialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload as any; // Allow Timestamp in state
      state.loading = false;
      state.error = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
    },
    setInitialized(state, action: PayloadAction<boolean>) {
      state.initialized = action.payload;
      if (action.payload) {
        state.loading = false;
      }
    },
    clearAuth(state) {
      state.user = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const { setUser, setLoading, setError, setInitialized, clearAuth } = authSlice.actions;

// Memoized selectors using createSelector
const selectAuthState = (state: { auth: AuthState }) => state.auth;

export const selectUser = createSelector(
  [selectAuthState],
  (auth) => auth.user
);

export const selectIsAuthenticated = createSelector(
  [selectUser],
  (user) => !!user
);

export const selectIsAdmin = createSelector(
  [selectUser],
  (user) => user?.role === 'admin'
);

export default authSlice.reducer;
