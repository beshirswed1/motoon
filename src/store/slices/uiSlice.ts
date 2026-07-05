import { createSlice, type PayloadAction, createSelector } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';

type ThemeMode = 'light' | 'dark' | 'system';
type SidebarState = 'expanded' | 'collapsed';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number; // duration in ms
}

export interface UIState {
  theme: ThemeMode;
  sidebar: SidebarState;
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  activeModal: string | null;
  toasts: Toast[];
  notifications: {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    timestamp: number;
  }[];
}

const initialState: UIState = {
  theme: 'system',
  sidebar: 'expanded',
  isMobileMenuOpen: false,
  isSearchOpen: false,
  activeModal: null,
  toasts: [],
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.theme = action.payload;
    },
    toggleSidebar(state) {
      state.sidebar = state.sidebar === 'expanded' ? 'collapsed' : 'expanded';
    },
    setSidebarState(state, action: PayloadAction<SidebarState>) {
      state.sidebar = action.payload;
    },
    toggleMobileMenu(state) {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    setMobileMenu(state, action: PayloadAction<boolean>) {
      state.isMobileMenuOpen = action.payload;
    },
    toggleSearch(state) {
      state.isSearchOpen = !state.isSearchOpen;
    },
    openModal(state, action: PayloadAction<string>) {
      state.activeModal = action.payload;
    },
    closeModal(state) {
      state.activeModal = null;
    },
    addToast(state, action: PayloadAction<Omit<Toast, 'id'>>) {
      state.toasts.push({
        ...action.payload,
        id: `toast_${nanoid(12)}`,
        duration: action.payload.duration ?? 3000,
      });
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearToasts(state) {
      state.toasts = [];
    },
    addNotification(
      state,
      action: PayloadAction<Omit<UIState['notifications'][0], 'id' | 'timestamp'>>
    ) {
      state.notifications.push({
        ...action.payload,
        id: nanoid(8),
        timestamp: Date.now(),
      });
    },
    removeNotification(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    clearNotifications(state) {
      state.notifications = [];
    },
  },
});

export const {
  setTheme,
  toggleSidebar,
  setSidebarState,
  toggleMobileMenu,
  setMobileMenu,
  toggleSearch,
  openModal,
  closeModal,
  addToast,
  removeToast,
  clearToasts,
  addNotification,
  removeNotification,
  clearNotifications,
} = uiSlice.actions;

// Selectors
const selectUiState = (state: { ui: UIState }) => state.ui;

export const selectTheme = createSelector([selectUiState], (ui) => ui.theme);
export const selectSidebar = createSelector([selectUiState], (ui) => ui.sidebar);
export const selectSidebarOpen = createSelector([selectUiState], (ui) => ui.sidebar === 'expanded');
export const selectToasts = createSelector([selectUiState], (ui) => ui.toasts);

export default uiSlice.reducer;
