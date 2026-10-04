/**
 * Motor de síntesis y medición de audio Web Audio API
 * Genera preescuchas de boom bap / neo soul en C Mayor (90 BPM)
 * y provee FFT / mediciones reales para el analizador.
 */

let audioCtx: AudioContext | null = null;
let analyserNode: AnalyserNode | null = null;
let masterGain: GainNode | null = null;
let isPlayingPreview = false;
let previewTimeoutId: number | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 1024;
    analyserNode.smoothingTimeConstant = 0.85;

    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.8;
    masterGain.connect(analyserNode);
    analyserNode.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function getAnalyserNode(): AnalyserNode | null {
  return analyserNode;
}

// Frecuencias exactas para acordes Neo Soul en C Mayor / A menor:
// Cmaj9 (C3, E3, G3, B3, D4), Am9, Dm9, G13
const CHORDS_C_MAJOR = [
  [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9
  [110.00, 146.83, 174.61, 220.00, 261.63], // Am9
  [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9
  [98.00, 146.83, 174.61, 220.00, 246.94]   // G13(sus)
];

export function playBoomBapPreview(onStop?: () => void) {
  const ctx = getAudioContext();
  if (isPlayingPreview) {
    stopPreview();
    return false;
  }

  isPlayingPreview = true;
  const now = ctx.currentTime;
  const bpm = 90;
  const beatSec = 60 / bpm; // 0.666s
  const barSec = beatSec * 4; // 2.666s
  const totalDuration = barSec * 2; // 2 compases = ~5.3s

  // 1. Kick (Sub bass 45-55 Hz boom bap thump)
  for (let bar = 0; bar < 2; bar++) {
    const barStart = now + bar * barSec;
    // Kick on beat 1, beat 2.5, beat 3.75
    [0, 1.5, 2.75].forEach((beatOffset) => {
      const t = barStart + beatOffset * beatSec;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(46, t + 0.08);

      gain.gain.setValueAtTime(0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(masterGain!);
      osc.start(t);
      osc.stop(t + 0.4);
    });

    // Snare / Rimshot on beat 2 and 4
    [1, 3].forEach((beatOffset) => {
      const t = barStart + beatOffset * beatSec;
      // Body tone
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(185, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.06);
      oscGain.gain.setValueAtTime(0.4, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(oscGain);
      oscGain.connect(masterGain!);
      osc.start(t);
      osc.stop(t + 0.15);

      // Noise burst (vinyl snare snap)
      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      filter.Q.value = 1.2;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(masterGain!);
      noise.start(t);
      noise.stop(t + 0.16);
    });

    // Hi-hats with swing on 8ths
    for (let h = 0; h < 8; h++) {
      const swing = h % 2 === 1 ? 0.04 : 0.0;
      const t = barStart + (h * 0.5) * beatSec + swing;
      const bufferSize = ctx.sampleRate * 0.04;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7500;
      const hGain = ctx.createGain();
      hGain.gain.setValueAtTime(h % 2 === 0 ? 0.12 : 0.06, t);
      hGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);

      noise.connect(filter);
      filter.connect(hGain);
      hGain.connect(masterGain!);
      noise.start(t);
      noise.stop(t + 0.04);
    }

    // Warm Rhodes chords (2 per bar)
    for (let c = 0; c < 2; c++) {
      const chordIdx = (bar * 2 + c) % CHORDS_C_MAJOR.length;
      const chordNotes = CHORDS_C_MAJOR[chordIdx];
      const t = barStart + c * 2 * beatSec;

      chordNotes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        // Warm tape saturation simulated via lowpass
        const lpf = ctx.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.value = 1400; // Cálido y oscuro

        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);

        osc.connect(lpf);
        lpf.connect(gain);
        gain.connect(masterGain!);
        osc.start(t);
        osc.stop(t + 1.9);
      });
    }
  }

  previewTimeoutId = window.setTimeout(() => {
    isPlayingPreview = false;
    if (onStop) onStop();
  }, totalDuration * 1000);

  return true;
}

export function stopPreview() {
  if (previewTimeoutId) {
    clearTimeout(previewTimeoutId);
    previewTimeoutId = null;
  }
  if (masterGain && audioCtx) {
    masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    setTimeout(() => {
      if (masterGain) masterGain.gain.value = 0.8;
    }, 60);
  }
  isPlayingPreview = false;
}

export function isAudioPreviewPlaying(): boolean {
  return isPlayingPreview;
}
