import { MoveType } from '../types';

class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private initialized: boolean = false;

  private init() {
    if (!this.initialized) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3; // Master volume
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Ensure context is ready (call on user interaction)
  public ensureContext() {
    this.init();
  }

  private createOscillator(type: OscillatorType, freq: number, startTime: number, duration: number): OscillatorNode {
    if (!this.ctx || !this.masterGain) throw new Error("AudioContext not initialized");
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    return osc;
  }

  private createGain(startTime: number, duration: number, attack = 0.05, decay = 0.1): GainNode {
    if (!this.ctx || !this.masterGain) throw new Error("AudioContext not initialized");
    const gain = this.ctx.createGain();
    gain.connect(this.masterGain);
    
    // Envelope
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(1, startTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    return gain;
  }

  public playMove(move: MoveType) {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    switch (move) {
      case MoveType.CHARGE:
        this.playCharge(t);
        break;
      case MoveType.LASER:
        this.playLaser(t);
        break;
      case MoveType.SHIELD:
        this.playShield(t);
        break;
      case MoveType.FIELD:
        this.playField(t);
        break;
      case MoveType.DESTROY:
        this.playDestroy(t);
        break;
    }
  }

  private playCharge(t: number) {
    if (!this.ctx || !this.masterGain) return;
    // Rising tone
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.4);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.1);
    gain.gain.linearRampToValueAtTime(0, t + 0.4);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  private playLaser(t: number) {
    if (!this.ctx || !this.masterGain) return;
    // Pew pew - fast pitch drop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.2);
    
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    // Filter to make it zap-like
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, t);
    filter.frequency.linearRampToValueAtTime(500, t + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(t);
    osc.stop(t + 0.2);
  }

  private playShield(t: number) {
    if (!this.ctx || !this.masterGain) return;
    // Low hum/wobble
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    
    // Tremolo
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 15;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 50;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start(t);
    lfo.stop(t + 0.5);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.1);
    gain.gain.linearRampToValueAtTime(0, t + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  private playField(t: number) {
    if (!this.ctx || !this.masterGain) return;
    // High tech shimmer
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'square';
    osc1.frequency.setValueAtTime(440, t);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(450, t); // Dissonance

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
    gain.gain.linearRampToValueAtTime(0, t + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.6);
    osc2.stop(t + 0.6);
  }

  private playDestroy(t: number) {
    if (!this.ctx || !this.masterGain) return;
    // Heavy Beam - noise + low saw
    const duration = 1.0;

    // 1. Low growl
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.linearRampToValueAtTime(50, t + duration);
    
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.5, t);
    oscGain.gain.linearRampToValueAtTime(0, t + duration);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + duration);

    // 2. Noise burst
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1000, t);
    noiseFilter.frequency.linearRampToValueAtTime(100, t + duration);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, t);
    noiseGain.gain.linearRampToValueAtTime(0, t + duration);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(t);
  }

  public playImpact() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Crunch
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    noise.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);
  }

  public playUI(type: 'click' | 'hover' = 'click') {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    if (type === 'click') {
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.05);
        gain.gain.setValueAtTime(0.2, t);
    } else {
        osc.frequency.setValueAtTime(400, t);
        gain.gain.setValueAtTime(0.05, t);
    }
    
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }
}

export const audioManager = new AudioService();