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

  playSkip() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Play a gentle descending sliding tone
    this.playTone(392.00, 'triangle', now, 0.25, 261.63, 0.12); // G4 to C4 slide
  }

  playError() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Play a gentle warning dual tone
    this.playTone(293.66, 'sine', now, 0.15, undefined, 0.15); // D4
    this.playTone(220.00, 'sine', now + 0.08, 0.25, undefined, 0.15); // A3
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
