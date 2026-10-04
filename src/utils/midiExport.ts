/**
 * Exportador de archivos MIDI estándar (.mid) Format 1
 * Implementación pura en TypeScript sin dependencias externas
 */

function writeVarLen(val: number): number[] {
  let buffer = val & 0x7f;
  const result: number[] = [];
  while ((val >>= 7)) {
    buffer <<= 8;
    buffer |= (val & 0x7f) | 0x80;
  }
  while (true) {
    result.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return result;
}

function stringToBytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i) & 0xff);
  }
  return bytes;
}

function noteNameToMidiNumber(name: string): number {
  const noteMap: Record<string, number> = {
    C: 0, 'C#': 1, Db: 1,
    D: 2, 'D#': 3, Eb: 3,
    E: 4,
    F: 5, 'F#': 6, Gb: 6,
    G: 7, 'G#': 8, Ab: 8,
    A: 9, 'A#': 10, Bb: 10,
    B: 11
  };
  const match = name.match(/^([A-G][#b]?)(-?\d+)$/);
  if (!match) return 60; // Default C4 / C3 middle
  const note = match[1];
  const octave = parseInt(match[2], 10);
  return (octave + 1) * 12 + (noteMap[note] ?? 0);
}

export interface MidiNoteEvent {
  note: string | number; // 'C3', 60
  startBarBeat: string; // '1|1', '1|3', etc.
  durationBars?: number; // duration in quarter notes or fraction
  velocity?: number; // 0-127
}

export interface MidiTrackData {
  name: string;
  channel?: number;
  notes: MidiNoteEvent[];
}

export function generateStandardMidiFile(
  tracksData: MidiTrackData[],
  tempo: number = 90,
  timeSignature: [number, number] = [4, 4]
): Uint8Array {
  const ticksPerQuarter = 480;
  const microSecondsPerQuarter = Math.round(60000000 / tempo);

  const headerChunk = [
    ...stringToBytes('MThd'),
    0x00, 0x00, 0x00, 0x06, // chunk length 6
    0x00, 0x01, // format 1 (multi-track)
    0x00, (tracksData.length + 1) & 0xff, // num tracks (tempo track + data tracks)
    (ticksPerQuarter >> 8) & 0xff, ticksPerQuarter & 0xff // division
  ];

  // Track 0: Conductor track (Tempo & Time Signature)
  const conductorEvents: number[] = [];
  
  // Time signature meta event: FF 58 04 nn dd cc bb
  // nn = numerator, dd = denominator negative power of 2 (2 = 4, 3 = 8)
  const denomPower = Math.round(Math.log2(timeSignature[1]));
  conductorEvents.push(
    0x00, // delta
    0xff, 0x58, 0x04,
    timeSignature[0] & 0xff,
    denomPower & 0xff,
    0x18, // 24 MIDI clocks per metronome click
    0x08  // 8 32nd notes in MIDI quarter note
  );

  // Set tempo meta event: FF 51 03 tt tt tt
  conductorEvents.push(
    0x00, // delta
    0xff, 0x51, 0x03,
    (microSecondsPerQuarter >> 16) & 0xff,
    (microSecondsPerQuarter >> 8) & 0xff,
    microSecondsPerQuarter & 0xff
  );

  // Track name
  const conductorName = stringToBytes('Master Tempo');
  conductorEvents.push(
    0x00,
    0xff, 0x03, conductorName.length,
    ...conductorName
  );

  // End of track: 00 FF 2F 00
  conductorEvents.push(0x00, 0xff, 0x2f, 0x00);

  const conductorChunk = [
    ...stringToBytes('MTrk'),
    (conductorEvents.length >> 24) & 0xff,
    (conductorEvents.length >> 16) & 0xff,
    (conductorEvents.length >> 8) & 0xff,
    conductorEvents.length & 0xff,
    ...conductorEvents
  ];

  const tracksBytes: number[][] = [conductorChunk];

  // Convert tracks
  tracksData.forEach((tr, trackIndex) => {
    const channel = (tr.channel ?? trackIndex) % 16;
    const trackEvents: number[] = [];

    // Track Name
    const nameBytes = stringToBytes(tr.name || `Pista ${trackIndex + 1}`);
    trackEvents.push(0x00, 0xff, 0x03, nameBytes.length, ...nameBytes);

    // Parse note events and sort by tick
    interface RawNote {
      tick: number;
      type: 'on' | 'off';
      noteNum: number;
      velocity: number;
    }
    const rawEvents: RawNote[] = [];

    tr.notes.forEach((n) => {
      const noteNum = typeof n.note === 'number' ? n.note : noteNameToMidiNumber(n.note);
      const vel = n.velocity ?? 100;
      
      // Parse bar|beat (1-indexed: 1|1 = tick 0, 1|2 = tick 480, 2|1 = tick 1920)
      let bar = 1;
      let beat = 1.0;
      if (typeof n.startBarBeat === 'string' && n.startBarBeat.includes('|')) {
        const parts = n.startBarBeat.split('|');
        bar = parseFloat(parts[0]) || 1;
        beat = parseFloat(parts[1]) || 1;
      }
      const tick = Math.max(0, Math.round(((bar - 1) * timeSignature[0] + (beat - 1)) * ticksPerQuarter));
      const durationTicks = Math.round((n.durationBars ?? 1.0) * ticksPerQuarter);

      rawEvents.push({ tick, type: 'on', noteNum, velocity: vel });
      rawEvents.push({ tick: tick + durationTicks, type: 'off', noteNum, velocity: 0 });
    });

    // Sort by tick
    rawEvents.sort((a, b) => a.tick - b.tick);

    let lastTick = 0;
    rawEvents.forEach((ev) => {
      const delta = Math.max(0, ev.tick - lastTick);
      lastTick = ev.tick;
      const varLenDelta = writeVarLen(delta);
      trackEvents.push(...varLenDelta);

      if (ev.type === 'on') {
        trackEvents.push(0x90 | channel, ev.noteNum & 0x7f, ev.velocity & 0x7f);
      } else {
        trackEvents.push(0x80 | channel, ev.noteNum & 0x7f, 0x00);
      }
    });

    // End of track
    trackEvents.push(0x00, 0xff, 0x2f, 0x00);

    const chunk = [
      ...stringToBytes('MTrk'),
      (trackEvents.length >> 24) & 0xff,
      (trackEvents.length >> 16) & 0xff,
      (trackEvents.length >> 8) & 0xff,
      trackEvents.length & 0xff,
      ...trackEvents
    ];
    tracksBytes.push(chunk);
  });

  const totalLength = headerChunk.length + tracksBytes.reduce((acc, t) => acc + t.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  result.set(headerChunk, offset);
  offset += headerChunk.length;

  tracksBytes.forEach((t) => {
    result.set(t, offset);
    offset += t.length;
  });

  return result;
}

export function downloadMidiFile(data: Uint8Array, filename: string = 'centro_creativo_proyecto.mid') {
  const blob = new Blob([data.buffer as ArrayBuffer], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
