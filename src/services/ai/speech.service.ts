/**
 * speech.service.ts
 * AI Speech-to-Text service for Quranic recitation evaluation.
 * Uses browser Web Speech API with fallback support.
 */

import { httpsCallable, getFunctions } from 'firebase/functions';
import { app } from '@/firebase/config';
import type { SpeechAnalysisResult } from '@/types';

// Existing interfaces and functions for backward compatibility
interface SpeechRequest {
  audioBase64: string;
  mimeType: 'audio/webm' | 'audio/ogg' | 'audio/mp4' | 'audio/wav';
  expectedText: string;
  languageCode?: string;
}

export async function analyzeRecitation(
  request: SpeechRequest
): Promise<SpeechAnalysisResult> {
  const functions = getFunctions(app);
  const analyzeFn = httpsCallable<SpeechRequest, SpeechAnalysisResult>(
    functions,
    'analyzeRecitation'
  );

  const result = await analyzeFn({
    ...request,
    languageCode: request.languageCode ?? 'ar-SA',
  });

  return result.data;
}

export async function convertBlobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function uploadAudioRecording(
  userId: string,
  sessionId: string,
  blob: Blob
): Promise<string> {
  const { ref, uploadBytes, getDownloadURL, getStorage } = await import('firebase/storage');
  const { app } = await import('@/firebase/config');

  const storage = getStorage(app);
  const path = `recordings/${userId}/${sessionId}/${Date.now()}.webm`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, blob, {
    contentType: blob.type,
    customMetadata: { userId, sessionId },
  });

  return getDownloadURL(storageRef);
}

// --- Web Speech API Service Interface Pattern ---

export interface SpeechRecognitionOptions {
  onResult?: (text: string) => void;
  onError?: (err: any) => void;
  onEnd?: () => void;
}

export interface SpeechRecognitionService {
  startListening(opts?: SpeechRecognitionOptions): Promise<void>;
  stopListening(): Promise<string>;
  isSupported(): boolean;
}

class WebSpeechService implements SpeechRecognitionService {
  private recognition: any = null;
  private accumulatedFinalText: string = '';
  private finalTranscriptParts: string[] = [];
  private interimText: string = '';
  private isListening: boolean = false;
  private resolveEnd: ((value: string) => void) | null = null;
  private activeOpts: SpeechRecognitionOptions = {};

  private get transcript(): string {
    const final = this.finalTranscript;
    const interim = this.interimText.trim();
    if (final && interim) return final + ' ' + interim;
    return final || interim;
  }

  private get finalTranscript(): string {
    const accumulated = this.accumulatedFinalText.trim();
    const currentFinal = this.finalTranscriptParts.join(' ').trim();
    if (accumulated && currentFinal) return accumulated + ' ' + currentFinal;
    return accumulated || currentFinal;
  }

  private init() {
    if (this.recognition) return;
    
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'ar-SA';
        this.recognition.maxAlternatives = 1;

        this.recognition.onresult = (event: any) => {
          // Rebuild final parts from all finalized results
          // and capture only the latest interim result
          const newFinalParts: string[] = [];
          let currentInterim = '';

          for (let i = 0; i < event.results.length; ++i) {
            const result = event.results[i];
            const text = result[0].transcript.trim();
            if (!text) continue;

            if (result.isFinal) {
              newFinalParts.push(text);
            } else {
              // Only the latest interim matters (previous interims are replaced by the API)
              currentInterim = text;
            }
          }

          this.finalTranscriptParts = newFinalParts;
          this.interimText = currentInterim;
          
          if (this.activeOpts.onResult) {
            this.activeOpts.onResult(this.transcript);
          }
        };

        this.recognition.onerror = (event: any) => {
          console.error('WebSpeech Recognition Error:', event.error);
          // Auto-restart on network or no-speech errors to keep listening
          if (event.error === 'network' || event.error === 'no-speech') {
            if (this.isListening) {
              try {
                this.recognition.stop();
                setTimeout(() => {
                  if (this.isListening) {
                    try { this.recognition.start(); } catch (_e) { /* ignore */ }
                  }
                }, 300);
              } catch (_e) { /* ignore */ }
            }
            return;
          }
          if (this.activeOpts.onError) {
            this.activeOpts.onError(event);
          }
        };

        this.recognition.onend = () => {
          // Accumulate the current session's final text before restart
          const currentFinal = this.finalTranscriptParts.join(' ').trim();
          if (currentFinal) {
            this.accumulatedFinalText += (this.accumulatedFinalText ? ' ' : '') + currentFinal;
          }
          this.finalTranscriptParts = [];
          this.interimText = '';

          // Auto-restart if we're still supposed to be listening (browser stops after silence)
          if (this.isListening) {
            try {
              this.recognition.start();
              return;
            } catch (_e) {
              // Fall through to normal end handling
            }
          }
          
          this.isListening = false;
          if (this.activeOpts.onEnd) {
            this.activeOpts.onEnd();
          }
          if (this.resolveEnd) {
            this.resolveEnd(this.finalTranscript);
            this.resolveEnd = null;
          }
        };
      }
    }
  }

  isSupported(): boolean {
    this.init();
    return !!this.recognition;
  }

  async startListening(opts?: SpeechRecognitionOptions): Promise<void> {
    this.init();
    if (!this.isSupported()) {
      throw new Error('Web Speech API is not supported in this browser.');
    }

    if (this.isListening) {
      return;
    }

    this.accumulatedFinalText = '';
    this.finalTranscriptParts = [];
    this.interimText = '';
    this.activeOpts = opts || {};
    this.isListening = true;
    this.resolveEnd = null;

    try {
      this.recognition.start();
    } catch (err) {
      this.isListening = false;
      throw err;
    }
  }

  async stopListening(): Promise<string> {
    this.init();
    if (!this.isSupported() || !this.isListening) {
      return this.finalTranscript;
    }

    // Mark as not listening BEFORE stopping to prevent auto-restart in onend
    this.isListening = false;

    return new Promise<string>((resolve) => {
      this.resolveEnd = resolve;
      try {
        this.recognition.stop();
      } catch (err) {
        console.error('Error stopping speech recognition:', err);
        resolve(this.finalTranscript);
      }
    });
  }
}

export const speechService: SpeechRecognitionService = new WebSpeechService();
