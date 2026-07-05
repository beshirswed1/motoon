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
  private transcript: string = '';
  private isListening: boolean = false;
  private resolveEnd: ((value: string) => void) | null = null;
  private activeOpts: SpeechRecognitionOptions = {};

  private init() {
    if (this.recognition) return;
    
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'ar-SA';

        this.recognition.onresult = (event: any) => {
          let fullTranscript = '';
          for (let i = 0; i < event.results.length; ++i) {
            fullTranscript += (fullTranscript ? ' ' : '') + event.results[i][0].transcript;
          }
          
          this.transcript = fullTranscript.trim();
          
          if (this.activeOpts.onResult) {
            this.activeOpts.onResult(this.transcript);
          }
        };

        this.recognition.onerror = (event: any) => {
          console.error('WebSpeech Recognition Error:', event.error);
          if (this.activeOpts.onError) {
            this.activeOpts.onError(event);
          }
        };

        this.recognition.onend = () => {
          this.isListening = false;
          if (this.activeOpts.onEnd) {
            this.activeOpts.onEnd();
          }
          if (this.resolveEnd) {
            this.resolveEnd(this.transcript);
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

    this.transcript = '';
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
      return this.transcript;
    }

    return new Promise<string>((resolve) => {
      this.resolveEnd = resolve;
      try {
        this.recognition.stop();
      } catch (err) {
        console.error('Error stopping speech recognition:', err);
        resolve(this.transcript);
      }
    });
  }
}

export const speechService: SpeechRecognitionService = new WebSpeechService();
