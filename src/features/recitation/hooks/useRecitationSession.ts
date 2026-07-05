import { useState, useEffect, useCallback, useRef } from 'react';
import { speechService } from '@/services/ai/speech.service';
import { RecitationComparisonEngine } from '@/services/ai/comparison.service';
import type { Verse, ComparisonResult } from '@/types';

export type RecitationState = 'idle' | 'listening' | 'processing' | 'result' | 'error';

export function useRecitationSession(verse: Verse) {
  const [state, setState] = useState<RecitationState>('idle');
  const [spokenText, setSpokenText] = useState<string>('');
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // We use a ref to track the active state to clean up properly on unmount
  const isListeningRef = useRef(false);

  const start = useCallback(async () => {
    if (!speechService.isSupported()) {
      setError('Web Speech API is not supported in this browser.');
      setState('error');
      return;
    }

    setError(null);
    setSpokenText('');
    setResult(null);
    setState('listening');
    isListeningRef.current = true;

    try {
      await speechService.startListening({
        onResult: (text: string) => {
          setSpokenText(text);
        },
        onError: (err: any) => {
          console.error('Speech recognition error in hook:', err);
          setError(err.message || String(err));
          setState('error');
          isListeningRef.current = false;
        },
        onEnd: () => {
          // End events are handled by the stop trigger
        }
      });
    } catch (err: any) {
      console.error('Failed to start listening:', err);
      setError(err.message || String(err));
      setState('error');
      isListeningRef.current = false;
    }
  }, []);

  const stop = useCallback(async (): Promise<ComparisonResult | null> => {
    if (!isListeningRef.current) return null;

    setState('processing');
    isListeningRef.current = false;

    try {
      const finalSpoken = await speechService.stopListening();
      setSpokenText(finalSpoken);

      // Perform comparison
      const comparisonResult = RecitationComparisonEngine.compare(verse.text, finalSpoken);
      setResult(comparisonResult);
      setState('result');
      return comparisonResult;
    } catch (err: any) {
      console.error('Error during stop processing:', err);
      setError(err.message || String(err));
      setState('error');
      return null;
    }
  }, [verse.text]);

  const retry = useCallback(() => {
    setState('idle');
    setSpokenText('');
    setResult(null);
    setError(null);
    isListeningRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isListeningRef.current) {
        speechService.stopListening().catch((err) => {
          console.error('Error stopping speech service during unmount cleanup:', err);
        });
      }
    };
  }, []);

  return {
    state,
    spokenText,
    result,
    error,
    start,
    stop,
    retry,
  };
}
