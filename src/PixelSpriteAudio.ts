export class PixelSpriteAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled = true;
  private softMode = false;

  private ensureContext() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextCtor) return null;
      this.ctx = new AudioContextCtor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.syncMasterGain();
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    return this.ctx;
  }

  private syncMasterGain() {
    if (!this.masterGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    const baseVolume = 0.05;
    const target = this.enabled ? baseVolume * (this.softMode ? 0.5 : 1) : 0;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(target, now, 0.015);
  }

  private playTone({
    frequency,
    duration,
    glideTo,
    attack = 0.008,
    release = 0.07,
    gain = 1,
    startDelay = 0,
    triangleBlend = 0,
  }: {
    frequency: number;
    duration: number;
    glideTo?: number;
    attack?: number;
    release?: number;
    gain?: number;
    startDelay?: number;
    triangleBlend?: number;
  }) {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const startAt = ctx.currentTime + startDelay;
    const stopAt = startAt + duration;

    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0, startAt);
    envelope.gain.linearRampToValueAtTime(gain, startAt + attack);
    envelope.gain.setTargetAtTime(0, Math.max(startAt + attack, stopAt - release), 0.03);
    envelope.connect(this.masterGain);

    const sine = ctx.createOscillator();
    sine.type = 'sine';
    sine.frequency.setValueAtTime(frequency, startAt);
    if (glideTo !== undefined) {
      sine.frequency.linearRampToValueAtTime(glideTo, stopAt);
    }
    sine.connect(envelope);
    sine.start(startAt);
    sine.stop(stopAt + 0.02);

    if (triangleBlend > 0) {
      const triGain = ctx.createGain();
      triGain.gain.setValueAtTime(triangleBlend, startAt);
      triGain.connect(envelope);

      const tri = ctx.createOscillator();
      tri.type = 'triangle';
      tri.frequency.setValueAtTime(frequency, startAt);
      if (glideTo !== undefined) {
        tri.frequency.linearRampToValueAtTime(glideTo, stopAt);
      }
      tri.connect(triGain);
      tri.start(startAt);
      tri.stop(stopAt + 0.02);
    }
  }

  private playNoiseTail({ startDelay = 0.06, duration = 0.12, gain = 0.045 }: { startDelay?: number; duration?: number; gain?: number }) {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      channel[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3800;

    const noiseGain = ctx.createGain();
    const startAt = ctx.currentTime + startDelay;
    noiseGain.gain.setValueAtTime(0, startAt);
    noiseGain.gain.linearRampToValueAtTime(gain, startAt + 0.01);
    noiseGain.gain.linearRampToValueAtTime(0, startAt + duration);

    source.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    source.start(startAt);
    source.stop(startAt + duration + 0.01);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.syncMasterGain();
  }

  setSoftMode(softMode: boolean) {
    this.softMode = softMode;
    this.syncMasterGain();
  }

  click() {
    this.playTone({ frequency: 528, glideTo: 548, duration: 0.12, attack: 0.008, release: 0.07, gain: 0.9 });
  }

  addLayer() {
    this.playTone({ frequency: 528, glideTo: 639, duration: 0.16, attack: 0.01, release: 0.12, gain: 0.95, triangleBlend: 0.07 });
    this.playTone({ frequency: 639, duration: 0.15, startDelay: 0.14, gain: 0.22, release: 0.14 });
  }

  saveSuccess() {
    this.playTone({ frequency: 528, duration: 0.095, gain: 0.74, triangleBlend: 0.03 });
    this.playTone({ frequency: 678, duration: 0.1, startDelay: 0.075, gain: 0.8, triangleBlend: 0.05 });
    this.playTone({ frequency: 912, duration: 0.13, startDelay: 0.15, gain: 0.84, triangleBlend: 0.07 });
  }

  exportComplete() {
    this.playTone({ frequency: 678, duration: 0.115, gain: 0.8, triangleBlend: 0.05 });
    this.playTone({ frequency: 912, duration: 0.19, startDelay: 0.055, gain: 0.68, triangleBlend: 0.08 });
    this.playNoiseTail({ startDelay: 0.075, duration: 0.11, gain: 0.028 });
  }

  error() {
    this.playTone({ frequency: 372, glideTo: 336, duration: 0.085, attack: 0.01, release: 0.07, gain: 0.48, triangleBlend: 0.025 });
    this.playTone({ frequency: 320, duration: 0.07, startDelay: 0.045, attack: 0.008, release: 0.065, gain: 0.2, triangleBlend: 0.015 });
  }

  toggleOn() {
    this.playTone({ frequency: 639, duration: 0.1, gain: 0.75 });
  }

  toggleOff() {
    this.playTone({ frequency: 528, glideTo: 492, duration: 0.1, gain: 0.7 });
  }
}
