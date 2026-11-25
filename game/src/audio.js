// Dapur Kilat — sound effects. One job: tiny WebAudio bleeps, no audio files.
// Everything is an oscillator + gain envelope; nothing loads over the network.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.enabled = false;
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.enabled = true;
  }

  tone(freq, dur, type = 'sine', vol = 0.12, slideTo = null) {
    if (!this.enabled || this.muted || !this.ctx) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  pickup() { this.tone(520, 0.08, 'triangle', 0.10, 760); }
  place() { this.tone(340, 0.07, 'triangle', 0.10, 260); }
  chop() { this.tone(180, 0.05, 'square', 0.08, 120); }
  chopDone() { this.tone(660, 0.10, 'triangle', 0.10, 990); }
  sizzle() { this.tone(1200, 0.18, 'sawtooth', 0.03, 900); }
  cooked() { this.tone(880, 0.12, 'sine', 0.10, 1320); }
  serve() { this.tone(523, 0.10, 'triangle', 0.12); setTimeout(() => this.tone(784, 0.16, 'triangle', 0.12), 90); }
  ding() { this.tone(1046, 0.14, 'sine', 0.10, 1568); }
  fail() { this.tone(220, 0.25, 'sawtooth', 0.08, 110); }
  win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.18, 'triangle', 0.12), i * 110)); }
  click() { this.tone(700, 0.05, 'square', 0.06); }
}
