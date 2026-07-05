import { createSlice, type PayloadAction, createSelector } from '@reduxjs/toolkit';
import type { ComparisonResult, RecitationResult } from '@/types/recitation.types';

export interface RecitationSessionState {
  status: 'idle' | 'listening' | 'processing' | 'result' | 'error';
  currentVerseIndex: number;
  spokenText: string | null;
  result: ComparisonResult | null;
  sessionResults: RecitationResult[];
  error: string | null;
}

const initialState: RecitationSessionState = {
  status: 'idle',
  currentVerseIndex: 0,
  spokenText: null,
  result: null,
  sessionResults: [],
  error: null,
};

const recitationSlice = createSlice({
  name: 'recitation',
  initialState,
  reducers: {
    startSession(state, action: PayloadAction<{ currentVerseIndex?: number } | undefined>) {
      state.status = 'idle';
      state.currentVerseIndex = action.payload?.currentVerseIndex ?? 0;
      state.spokenText = null;
      state.result = null;
      state.sessionResults = [];
      state.error = null;
    },
    setStatus(state, action: PayloadAction<RecitationSessionState['status']>) {
      state.status = action.payload;
      if (action.payload !== 'error') {
        state.error = null;
      }
    },
    setSpokenText(state, action: PayloadAction<string | null>) {
      state.spokenText = action.payload;
    },
    setResult(state, action: PayloadAction<ComparisonResult | null>) {
      state.result = action.payload;
      state.status = action.payload ? 'result' : 'idle';
    },
    addSessionResult(state, action: PayloadAction<RecitationResult>) {
      // Avoid duplicate results for the same verse index
      state.sessionResults = state.sessionResults.filter(
        (r) => r.verseIndex !== action.payload.verseIndex
      );
      state.sessionResults.push(action.payload);
    },
    nextVerse(state) {
      state.currentVerseIndex += 1;
      state.spokenText = null;
      state.result = null;
      state.status = 'idle';
      state.error = null;
    },
    setRecitationError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.status = 'error';
    },
    resetSession() {
      return initialState;
    },
  },
});

export const {
  startSession,
  setStatus,
  setSpokenText,
  setResult,
  addSessionResult,
  nextVerse,
  setRecitationError,
  resetSession,
} = recitationSlice.actions;

// Selectors
const selectRecitationState = (state: { recitation: RecitationSessionState }) => state.recitation;

export const selectRecitationStatus = createSelector([selectRecitationState], (rec) => rec.status);
export const selectCurrentVerseIndex = createSelector([selectRecitationState], (rec) => rec.currentVerseIndex);
export const selectSpokenText = createSelector([selectRecitationState], (rec) => rec.spokenText);
export const selectRecitationResult = createSelector([selectRecitationState], (rec) => rec.result);
export const selectSessionResults = createSelector([selectRecitationState], (rec) => rec.sessionResults);
export const selectRecitationError = createSelector([selectRecitationState], (rec) => rec.error);

export default recitationSlice.reducer;
