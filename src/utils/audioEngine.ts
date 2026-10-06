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

// Convert MIDI pitch number or note name (e.g. 'C3', '60') to Hz
export function noteToFreq(note: string | number): number {
  if (typeof note === 'number') {
    return 440 * Math.pow(2, (note - 69) / 12);
  }
  const noteMap: Record<string, number> = {
    C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
    G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11
  };
  const match = note.match(/^([A-G][b#]?)(-?\d+)$/);
  if (!match) return 261.63; // Default C4
  const semitone = noteMap[match[1]] ?? 0;
  const octave = parseInt(match[2], 10);
  const midiNum = (octave + 1) * 12 + semitone;
  return 440 * Math.pow(2, (midiNum - 69) / 12);
}

// Tocar una nota de Rhodes cálido
export function playRhodesNote(note: string | number, durationSec = 0.8, velocity = 100) {
  const ctx = getAudioContext();
  const freq = noteToFreq(note);
  const now = ctx.currentTime;
  const gainVal = Math.min(0.25, (velocity / 127) * 0.18);

  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);

  // Armónico sutil para emular la barra metálica de un Fender Rhodes
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(freq * 2, now);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1400, now);
  filter.frequency.exponentialRampToValueAtTime(700, now + durationSec);

  gain.gain.setValueAtTime(gainVal, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain!);

  osc.start(now);
  osc2.start(now);
  osc.stop(now + durationSec + 0.05);
  osc2.stop(now + durationSec + 0.05);
}

// Tocar un acorde Neo-Soul con rasgueo/strum opcional
export function playNeoSoulChord(notes: (string | number)[], durationSec = 1.8, velocity = 95, strumMs = 25) {
  notes.forEach((note, idx) => {
    setTimeout(() => {
      playRhodesNote(note, durationSec, velocity - idx * 3);
    }, idx * strumMs);
  });
}

// Emular disparo de Chop de MPC (vinilo, kick, caja, corte de muestra)
export function playMpcChop(padIndex: number) {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Distintos timbres para simular un kit de vinilo cortado
  const baseFreqs = [
    52, 60, 68, 78,   // Fila 1: Sub Kicks y 808
    170, 195, 220, 240, // Fila 2: Snares y Rimshots
    330, 392, 440, 523, // Fila 3: Sample Chops / Rhodes stabs
    659, 784, 880, 1046 // Fila 4: Vinyl vocal chops & bells
  ];

  const freq = baseFreqs[padIndex % 16] || 220;

  if (padIndex < 4) {
    // Kick punchy
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(freq, now + 0.09);
    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc.connect(gain);
    gain.connect(masterGain!);
    osc.start(now);
    osc.stop(now + 0.35);
  } else if (padIndex < 8) {
    // Snare / Clap / Rim
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(masterGain!);
    osc.start(now);
    osc.stop(now + 0.18);

    // Noise snap
    const bufferSize = ctx.sampleRate * 0.12;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 2400;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.28, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    noise.connect(f);
    f.connect(nGain);
    nGain.connect(masterGain!);
    noise.start(now);
    noise.stop(now + 0.14);
  } else {
    // Chops melódicos / Stabs con textura de vinilo
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = padIndex > 11 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, now);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1600;

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain!);
    osc.start(now);
    osc.stop(now + 0.48);
  }
}

// Disparar voces individuales de batería con velocidad y modelado de transitorios
export function playDrumVoice(
  voice: 'kick' | 'snare' | 'ghost' | 'rimshot' | 'hatClosed' | 'hatOpen' | 'shaker',
  velocity = 100
) {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const vol = (velocity / 127);

  if (voice === 'kick') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.exponentialRampToValueAtTime(46, now + 0.08);

    gain.gain.setValueAtTime(0.75 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(masterGain!);
    osc.start(now);
    osc.stop(now + 0.38);
  } else if (voice === 'snare' || voice === 'ghost') {
    const isGhost = voice === 'ghost';
    const snareVol = isGhost ? 0.25 * vol : 0.65 * vol;

    // Body
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(125, now + 0.06);
    oscGain.gain.setValueAtTime(snareVol * 0.6, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(oscGain);
    oscGain.connect(masterGain!);
    osc.start(now);
    osc.stop(now + 0.14);

    // Snare wires / noise
    const bufferSize = ctx.sampleRate * (isGhost ? 0.08 : 0.15);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * (isGhost ? 0.02 : 0.04)));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = isGhost ? 1600 : 2200;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(snareVol, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + (isGhost ? 0.08 : 0.16));

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(masterGain!);
    noise.start(now);
    noise.stop(now + (isGhost ? 0.09 : 0.18));
  } else if (voice === 'rimshot') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    gain.gain.setValueAtTime(0.4 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(masterGain!);
    osc.start(now);
    osc.stop(now + 0.07);
  } else if (voice === 'hatClosed' || voice === 'shaker') {
    const dur = voice === 'shaker' ? 0.06 : 0.035;
    const bufferSize = ctx.sampleRate * dur;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = voice === 'shaker' ? 6000 : 8500;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain!);
    noise.start(now);
    noise.stop(now + dur + 0.01);
  } else if (voice === 'hatOpen') {
    const dur = 0.25;
    const bufferSize = ctx.sampleRate * dur;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.1));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7500;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain!);
    noise.start(now);
    noise.stop(now + dur + 0.02);
  }
}


