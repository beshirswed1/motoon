/**
 * useRecitationEngine.ts — Module 7: React Orchestration Hook
 *
 * Wires all engine modules together into a single React hook.
 * The component only needs to call this hook and render the state.
 */

'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import type { Verse, ComparisonResult } from '@/types';
import { ExpectedTextEngine } from './expected-text';
import { RecitationStateMachine, type WordState, type ProcessResult } from './state-machine';
import { SpeechAdapter } from './speech-adapter';
import { computeStats, buildAllResults, buildVerseResult, type SessionStats } from './evaluation';
import { audioFeedback } from '../utils/audio';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RecitationEngineState {
  /** All word states for rendering */
  wordStates: readonly WordState[];
  /** Current word index being listened to */
  currentIndex: number;
  /** Current verse index */
  currentVerseIndex: number;
  /** Whether speech recognition is active */
  isListening: boolean;
  /** Whether the entire recitation is complete */
  isComplete: boolean;
  /** Session statistics */
  stats: SessionStats;
  /** Error message, if any */
  error: string | null;
  /** Whether sound effects are enabled */
  soundEnabled: boolean;
  /** Whether words are shown or hidden */
  showWords: boolean;
  /** Map of verseIndex → number of revealed words */
  revealedWords: Record<number, number>;
  /** Speech recognition support flag */
  isSupported: boolean;
}

export interface RecitationEngineActions {
  /** Start speech recognition */
  startListening: () => Promise<void>;
  /** Stop speech recognition */
  stopListening: () => void;
  /** Toggle speech recognition on/off */
  toggleListening: () => void;
  /** Reset the entire session */
  reset: () => void;
  /** Skip the current word */
  skipWord: () => void;
  /** Skip the entire current verse */
  skipVerse: () => void;
  /** Reveal the next hidden word in the current verse */
  revealWord: () => void;
  /** Toggle word visibility */
  toggleShowWords: () => void;
  /** Toggle sound effects */
  toggleSound: () => void;
  /** Get ComparisonResult for a specific verse */
  getVerseResult: (verseIndex: number) => ComparisonResult;
  /** Get all verse results (for finishing the session) */
  getAllResults: () => Record<number, ComparisonResult>;
  /** Get word states for a specific verse */
  getVerseStates: (verseIndex: number) => WordState[];
}

export type RecitationEngine = RecitationEngineState & RecitationEngineActions;

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useRecitationEngine(verses: Verse[]): RecitationEngine {
  // --- Core engine instances (stable across renders) ---
  const expectedTextRef = useRef<ExpectedTextEngine | null>(null);
  const stateMachineRef = useRef<RecitationStateMachine | null>(null);
  const speechAdapterRef = useRef<SpeechAdapter | null>(null);

  // --- React state ---
  const [wordStates, setWordStates] = useState<readonly WordState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showWords, setShowWords] = useState(false);
  const [revealedWords, setRevealedWords] = useState<Record<number, number>>({});

  // Refs for sound-enabled state (to avoid stale closures)
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  // --- Initialize engine on mount / when verses change ---
  useMemo(() => {
    const texts = verses.map((v) => v.text);
    const engine = new ExpectedTextEngine(texts);
    const machine = new RecitationStateMachine(engine);

    expectedTextRef.current = engine;
    stateMachineRef.current = machine;

    if (!speechAdapterRef.current) {
      speechAdapterRef.current = new SpeechAdapter();
    }

    // Set initial state
    setWordStates(machine.getStates());
    setCurrentIndex(machine.getCurrentIndex());
    setRevealedWords({});
    setError(null);
  }, [verses]);

  // --- Sync state from machine → React ---
  const syncState = useCallback(() => {
    const machine = stateMachineRef.current;
    if (!machine) return;
    setWordStates([...machine.getStates()]);
    setCurrentIndex(machine.getCurrentIndex());
  }, []);

  // --- Handle a new spoken word from the speech adapter ---
  const handleNewWord = useCallback(
    (word: string) => {
      const machine = stateMachineRef.current;
      if (!machine) return;

      const result: ProcessResult = machine.processSpokenWord(word);

      // Play sound effects based on result
      if (soundEnabledRef.current) {
        if (result.action === 'matched') {
          // Subtle positive feedback — no sound for individual correct words
          // to avoid audio spam. Sound plays on verse completion instead.
        } else if (result.action === 'incorrect') {
          audioFeedback.playError();
        }

        // Play verse transition chime
        if (result.newVerseStarted) {
          audioFeedback.playSuccess();
        }
      }

      syncState();
    },
    [syncState]
  );

  // --- Speech control ---
  const startListening = useCallback(async () => {
    const adapter = speechAdapterRef.current;
    if (!adapter) return;

    if (!adapter.isSupported()) {
      setError(
        'التعرف على الصوت غير مدعوم في هذا المتصفح. يرجى استخدام متصفح يدعم Web Speech API مثل Google Chrome.'
      );
      return;
    }

    setError(null);
    setIsListening(true);
    if (soundEnabledRef.current) audioFeedback.playStartChime();

    try {
      await adapter.start({
        onNewWord: handleNewWord,
        onError: (err: string) => {
          console.error('Speech recognition error:', err);
          setError(
            'حدث خطأ في التعرف على الصوت. تأكد من إذن المايكروفون وحاول مجدداً.'
          );
          setIsListening(false);
        },
        onEnd: () => {
          setIsListening(false);
        },
      });
    } catch (err) {
      console.error('Failed to start speech:', err);
      setError(
        'فشل تشغيل المايكروفون. يرجى التحقق من التوصيل والإعدادات.'
      );
      setIsListening(false);
    }
  }, [handleNewWord]);

  const stopListening = useCallback(() => {
    const adapter = speechAdapterRef.current;
    if (!adapter) return;
    setIsListening(false);
    adapter.stop();
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // --- Session controls ---
  const reset = useCallback(() => {
    const machine = stateMachineRef.current;
    const adapter = speechAdapterRef.current;
    if (!machine) return;

    stopListening();
    machine.reset();
    adapter?.reset();
    setRevealedWords({});
    setError(null);
    syncState();
  }, [stopListening, syncState]);

  const skipWord = useCallback(() => {
    const machine = stateMachineRef.current;
    if (!machine) return;
    machine.skipCurrentWord();
    if (soundEnabledRef.current) audioFeedback.playSkip();
    syncState();
  }, [syncState]);

  const skipVerse = useCallback(() => {
    const machine = stateMachineRef.current;
    if (!machine) return;
    machine.skipCurrentVerse();
    if (soundEnabledRef.current) audioFeedback.playSkip();
    syncState();
  }, [syncState]);

  const revealWord = useCallback(() => {
    const machine = stateMachineRef.current;
    const engine = expectedTextRef.current;
    if (!machine || !engine) return;

    const verseIndex = machine.currentVerseIndex;
    const boundary = engine.getVerseBoundary(verseIndex);
    if (!boundary) return;

    const currentRevealed = revealedWords[verseIndex] || 0;
    if (currentRevealed < boundary.wordCount) {
      setRevealedWords((prev) => ({
        ...prev,
        [verseIndex]: currentRevealed + 1,
      }));
      if (soundEnabledRef.current) audioFeedback.playError();
    }
  }, [revealedWords]);

  const toggleShowWords = useCallback(() => {
    setShowWords((prev) => !prev);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  // --- Result getters ---
  const getVerseResult = useCallback(
    (verseIndex: number): ComparisonResult => {
      const engine = expectedTextRef.current;
      const machine = stateMachineRef.current;
      if (!engine || !machine) {
        return {
          accuracy: 0,
          matchedWords: [],
          missingWords: [],
          extraWords: [],
          replacedWords: [],
          reorderedWords: [],
          totalWords: 0,
          correctWords: 0,
        };
      }

      const boundary = engine.getVerseBoundary(verseIndex);
      if (!boundary) {
        return {
          accuracy: 0,
          matchedWords: [],
          missingWords: [],
          extraWords: [],
          replacedWords: [],
          reorderedWords: [],
          totalWords: 0,
          correctWords: 0,
        };
      }

      const verseStates = machine.getVerseStates(verseIndex);
      const isNotRead = verseIndex > machine.currentVerseIndex;

      return buildVerseResult(
        verseStates,
        boundary,
        revealedWords[verseIndex] || 0,
        isNotRead
      );
    },
    [revealedWords]
  );

  const getAllResults = useCallback((): Record<number, ComparisonResult> => {
    const engine = expectedTextRef.current;
    const machine = stateMachineRef.current;
    if (!engine || !machine) return {};

    return buildAllResults(
      machine.getStates(),
      engine.verses,
      machine.currentVerseIndex,
      revealedWords
    );
  }, [revealedWords]);

  const getVerseStates = useCallback(
    (verseIndex: number): WordState[] => {
      const machine = stateMachineRef.current;
      if (!machine) return [];
      return machine.getVerseStates(verseIndex);
    },
    // wordStates in the dependency ensures we return fresh data after state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wordStates]
  );

  // --- Computed values ---
  const stats = useMemo(() => computeStats(wordStates), [wordStates]);

  const isComplete = useMemo(() => {
    const machine = stateMachineRef.current;
    return machine ? machine.isComplete : false;
  }, [wordStates]);

  const currentVerseIndex = useMemo(() => {
    const machine = stateMachineRef.current;
    return machine ? machine.currentVerseIndex : 0;
  }, [wordStates]);

  const isSupported = useMemo(() => {
    const adapter = speechAdapterRef.current;
    return adapter ? adapter.isSupported() : false;
  }, []);

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      speechAdapterRef.current?.stop();
    };
  }, []);

  return {
    // State
    wordStates,
    currentIndex,
    currentVerseIndex,
    isListening,
    isComplete,
    stats,
    error,
    soundEnabled,
    showWords,
    revealedWords,
    isSupported,

    // Actions
    startListening,
    stopListening,
    toggleListening,
    reset,
    skipWord,
    skipVerse,
    revealWord,
    toggleShowWords,
    toggleSound,
    getVerseResult,
    getAllResults,
    getVerseStates,
  };
}
