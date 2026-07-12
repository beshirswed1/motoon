class AudioFeedback {
  private ctx: AudioContext | null = null;

  private init() {
    if (typeof window !== 'undefined' && !this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    // Resume context if suspended (browser security policy)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /** Beautiful ascending arpeggio when a verse is completed successfully */
  playSuccess() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Play a beautiful, soft ascending arpeggio (C5 -> E5 -> G5 -> C6)
    this.playTone(523.25, 'sine', now, 0.15, undefined, 0.1); // C5
    this.playTone(659.25, 'sine', now + 0.08, 0.15, undefined, 0.1); // E5
    this.playTone(783.99, 'sine', now + 0.16, 0.15, undefined, 0.1); // G5
    this.playTone(1046.50, 'sine', now + 0.24, 0.35, undefined, 0.12); // C6
  }

  /** Gentle descending slide when a verse is skipped */
  playSkip() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Play a gentle descending sliding tone
    this.playTone(392.00, 'triangle', now, 0.25, 261.63, 0.12); // G4 to C4 slide
  }

  /** Short warning beep + haptic vibration for word errors */
  playError() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Play a gentle warning dual tone
    this.playTone(293.66, 'sine', now, 0.15, undefined, 0.15); // D4
    this.playTone(220.00, 'sine', now + 0.08, 0.25, undefined, 0.15); // A3
    // Trigger haptic vibration on mobile
    this.triggerHaptic([30, 40, 30]);
  }

  /** Soft, pleasant chime when the user presses the mic button to start */
  playStartChime() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // A single bright, crystalline bell-like tone
    this.playTone(880.00, 'sine', now, 0.08, undefined, 0.12);   // A5 short
    this.playTone(1174.66, 'sine', now + 0.06, 0.2, undefined, 0.10); // D6 ring
    // Light haptic tap
    this.triggerHaptic([15]);
  }

  /** Rich, satisfying completion melody when the user finishes the session */
  playCompletion() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Triumphant ascending fanfare: C5 -> E5 -> G5 -> B5 -> C6 (sustained)
    this.playTone(523.25, 'sine', now, 0.18, undefined, 0.10);       // C5
    this.playTone(659.25, 'sine', now + 0.12, 0.18, undefined, 0.10); // E5
    this.playTone(783.99, 'sine', now + 0.24, 0.18, undefined, 0.10); // G5
    this.playTone(987.77, 'sine', now + 0.36, 0.18, undefined, 0.12); // B5
    this.playTone(1046.50, 'sine', now + 0.48, 0.6, undefined, 0.14); // C6 long ring
    // Add a warm chord underneath
    this.playTone(261.63, 'triangle', now + 0.48, 0.6, undefined, 0.06); // C4 bass
    this.playTone(329.63, 'triangle', now + 0.48, 0.6, undefined, 0.06); // E4 bass
    // Celebratory haptic pattern
    this.triggerHaptic([40, 60, 40, 60, 80]);
  }

  /** Trigger device vibration (mobile only). Pattern is [vibrate, pause, vibrate, ...] in ms */
  triggerHaptic(pattern: number[]) {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (_e) {
      // Vibration API not available — silently ignore
    }
  }

  private playTone(
    freq: number, 
    type: OscillatorType, 
    start: number, 
    duration: number, 
    endFreq?: number, 
    volume = 0.15
  ) {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(endFreq, start + duration);
      }
      
      gainNode.gain.setValueAtTime(volume, start);
      gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    } catch (e) {
      console.warn("AudioContext playTone error:", e);
    }
  }
}

export const audioFeedback = new AudioFeedback();
