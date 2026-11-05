// Audio Engine: "Happy Birthday to You" + Romantic Harana Music Box
// 100% self-contained Web Audio API (zero external files, zero loading delay, ultra-fast)

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isPlayingMusic = false;
    this.musicTimer = null;
    this.tempo = 90; // Cheerful yet gentle birthday tempo
    this.stepIndex = 0;

    // Frequencies (Hz)
    this.notes = {
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
      C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
      C6: 1046.50
    };

    // "Happy Birthday to You" melody notes and duration ratios
    this.birthdayMelody = [
      // Hap-py Birth-day to you
      { note: 'G4', dur: 0.75 }, { note: 'G4', dur: 0.25 }, { note: 'A4', dur: 1.0 }, { note: 'G4', dur: 1.0 }, { note: 'C5', dur: 1.0 }, { note: 'B4', dur: 2.0 },
      // Hap-py Birth-day to you
      { note: 'G4', dur: 0.75 }, { note: 'G4', dur: 0.25 }, { note: 'A4', dur: 1.0 }, { note: 'G4', dur: 1.0 }, { note: 'D5', dur: 1.0 }, { note: 'C5', dur: 2.0 },
      // Hap-py Birth-day dear Pa-lang-ga
      { note: 'G4', dur: 0.75 }, { note: 'G4', dur: 0.25 }, { note: 'G5', dur: 1.0 }, { note: 'E5', dur: 1.0 }, { note: 'C5', dur: 1.0 }, { note: 'B4', dur: 1.0 }, { note: 'A4', dur: 1.5 },
      // Hap-py Birth-day to you!
      { note: 'F5', dur: 0.75 }, { note: 'F5', dur: 0.25 }, { note: 'E5', dur: 1.0 }, { note: 'C5', dur: 1.0 }, { note: 'D5', dur: 1.0 }, { note: 'C5', dur: 2.5 },

      // Sweet romantic transition chords (warm music box interlude)
      { note: 'E5', dur: 0.8 }, { note: 'G5', dur: 0.8 }, { note: 'C6', dur: 1.5 },
      { note: 'A5', dur: 0.8 }, { note: 'F5', dur: 0.8 }, { note: 'D5', dur: 1.2 },
      { note: 'G4', dur: 0.6 }, { note: 'C5', dur: 0.6 }, { note: 'E5', dur: 0.6 }, { note: 'G5', dur: 1.5 }
    ];
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a soft, resonant music box chime
  playChime(freq, duration = 0.8, gainVal = 0.18) {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 2, now); // Sweet harmonic bell tone

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(gainVal, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
    } catch (e) {
      console.warn("Audio chime error:", e);
    }
  }

  startMusic() {
    this.init();
    if (this.isPlayingMusic) return;
    this.isPlayingMusic = true;
    this.stepIndex = 0;
    this.playNextNote();
  }

  playNextNote() {
    if (!this.isPlayingMusic) return;

    const item = this.birthdayMelody[this.stepIndex % this.birthdayMelody.length];
    const freq = this.notes[item.note] || 440;
    const durSeconds = item.dur * (60 / this.tempo);

    this.playChime(freq, durSeconds * 1.5, 0.16);

    this.stepIndex++;
    this.musicTimer = setTimeout(() => {
      this.playNextNote();
    }, durSeconds * 1000);
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  toggleMusic(onUpdate) {
    this.init();
    if (this.isPlayingMusic) {
      this.stopMusic();
      if (onUpdate) onUpdate(false);
      return false;
    } else {
      this.startMusic();
      if (onUpdate) onUpdate(true);
      return true;
    }
  }

  // Sound effects
  playClick() {
    this.init();
    this.playChime(659.25, 0.15, 0.08);
  }

  playBlowCandles() {
    this.init();
    this.playChime(523.25, 0.3, 0.1);
    setTimeout(() => this.playChime(659.25, 0.4, 0.12), 150);
    setTimeout(() => this.playChime(783.99, 0.5, 0.15), 300);
    setTimeout(() => this.playChime(1046.50, 0.8, 0.18), 450);
  }

  playStamp() {
    this.init();
    this.playChime(523.25, 0.25, 0.18);
    setTimeout(() => this.playChime(783.99, 0.35, 0.15), 100);
  }

  playPop() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.07);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }
}

window.soundEngine = new SoundEngine();
