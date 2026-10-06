import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Square,
  Music,
  Send,
  Sparkles,
  Sliders,
  ChevronRight,
  Layers,
  Check,
  Disc3,
  Volume2
} from 'lucide-react';
import { playNeoSoulChord, playRhodesNote } from '../utils/audioEngine';

export interface ChordItem {
  symbol: string;
  name: string;
  notes: string[]; // ej ['C3', 'E3', 'G3', 'B3', 'D4']
  rootlessNotes: string[]; // ej ['E3', 'G3', 'B3', 'D4'] (omite C3)
  drop2Notes: string[];
}

export interface ProgressionTemplate {
  id: string;
  title: string;
  artistInspiration: string;
  mood: string;
  scale: string;
  chords: ChordItem[];
  suggestedBpm: number;
}

export const NEO_SOUL_PROGRESSIONS: ProgressionTemplate[] = [
  {
    id: 'prog_dilla_251',
    title: 'Dilla 2-5-1 Laid Back',
    artistInspiration: 'J Dilla / Slum Village / The Roots',
    mood: 'Meloso, elegante con tensión y resolución suave',
    scale: 'C Major',
    suggestedBpm: 90,
    chords: [
      {
        symbol: 'Dm9',
        name: 'Re menor novena',
        notes: ['D3', 'F3', 'A3', 'C4', 'E4'],
        rootlessNotes: ['F3', 'A3', 'C4', 'E4'],
        drop2Notes: ['D3', 'A3', 'C4', 'F4']
      },
      {
        symbol: 'G13',
        name: 'Sol treceava (tensión jazzera)',
        notes: ['G2', 'F3', 'B3', 'E4'],
        rootlessNotes: ['F3', 'B3', 'E4'],
        drop2Notes: ['G2', 'B3', 'F4', 'E4']
      },
      {
        symbol: 'Cmaj9',
        name: 'Do mayor séptima con novena',
        notes: ['C3', 'E3', 'G3', 'B3', 'D4'],
        rootlessNotes: ['E3', 'G3', 'B3', 'D4'],
        drop2Notes: ['C3', 'G3', 'B3', 'E4']
      },
      {
        symbol: 'Am9',
        name: 'La menor novena',
        notes: ['A2', 'C3', 'E3', 'G3', 'B3'],
        rootlessNotes: ['C3', 'E3', 'G3', 'B3'],
        drop2Notes: ['A2', 'E3', 'G3', 'C4']
      }
    ]
  },
  {
    id: 'prog_erykah_flower',
    title: 'Soul Flower Nocturno',
    artistInspiration: 'Erykah Badu / D’Angelo (Voodoo era)',
    mood: 'Cálido, profundo, acordes oscuros con dominante alterado',
    scale: 'C Major / A Minor',
    suggestedBpm: 88,
    chords: [
      {
        symbol: 'Cmaj9',
        name: 'Do mayor novena',
        notes: ['C3', 'E3', 'G3', 'B3', 'D4'],
        rootlessNotes: ['E3', 'G3', 'B3', 'D4'],
        drop2Notes: ['C3', 'G3', 'B3', 'E4']
      },
      {
        symbol: 'Bm7b5',
        name: 'Si semidisminuido',
        notes: ['B2', 'D3', 'F3', 'A3'],
        rootlessNotes: ['D3', 'F3', 'A3'],
        drop2Notes: ['B2', 'F3', 'A3', 'D4']
      },
      {
        symbol: 'E7#9',
        name: 'Mi dominante Hendrix / Purple',
        notes: ['E2', 'G#3', 'D4', 'G4'],
        rootlessNotes: ['G#3', 'D4', 'G4'],
        drop2Notes: ['E2', 'D4', 'G#4', 'G4']
      },
      {
        symbol: 'Am9',
        name: 'La menor novena resolutiva',
        notes: ['A2', 'C3', 'E3', 'G3', 'B3'],
        rootlessNotes: ['C3', 'E3', 'G3', 'B3'],
        drop2Notes: ['A2', 'E3', 'G3', 'C4']
      }
    ]
  },
  {
    id: 'prog_glasper_modal',
    title: 'Glasper Modal Shift',
    artistInspiration: 'Robert Glasper Experiment',
    mood: 'Intercambio modal con acordes mayores no diatónicos',
    scale: 'C Major',
    suggestedBpm: 92,
    chords: [
      {
        symbol: 'Cmaj9',
        name: 'Do mayor novena',
        notes: ['C3', 'E3', 'G3', 'B3', 'D4'],
        rootlessNotes: ['E3', 'G3', 'B3', 'D4'],
        drop2Notes: ['C3', 'G3', 'B3', 'E4']
      },
      {
        symbol: 'Ebmaj9',
        name: 'Mi bemol mayor novena (intercambio modal)',
        notes: ['Eb3', 'G3', 'Bb3', 'D4', 'F4'],
        rootlessNotes: ['G3', 'Bb3', 'D4', 'F4'],
        drop2Notes: ['Eb3', 'Bb3', 'D4', 'G4']
      },
      {
        symbol: 'Abmaj7',
        name: 'La bemol mayor séptima',
        notes: ['Ab2', 'C3', 'Eb3', 'G3'],
        rootlessNotes: ['C3', 'Eb3', 'G3'],
        drop2Notes: ['Ab2', 'Eb3', 'G3', 'C4']
      },
      {
        symbol: 'G7sus13',
        name: 'Sol dominante suspendido con treceava',
        notes: ['G2', 'F3', 'C4', 'E4'],
        rootlessNotes: ['F3', 'C4', 'E4'],
        drop2Notes: ['G2', 'C4', 'F4', 'E4']
      }
    ]
  },
  {
    id: 'prog_pete_rock_90s',
    title: 'Pete Rock Vinyl Soul Groove',
    artistInspiration: 'Pete Rock & CL Smooth / Q-Tip',
    mood: 'Puro hip-hop de los 90s, cajas secas y acordes sampleados',
    scale: 'C Major',
    suggestedBpm: 90,
    chords: [
      {
        symbol: 'Dm7',
        name: 'Re menor séptima',
        notes: ['D3', 'F3', 'A3', 'C4'],
        rootlessNotes: ['F3', 'A3', 'C4'],
        drop2Notes: ['D3', 'A3', 'C4', 'F4']
      },
      {
        symbol: 'Em7',
        name: 'Mi menor séptima',
        notes: ['E3', 'G3', 'B3', 'D4'],
        rootlessNotes: ['G3', 'B3', 'D4'],
        drop2Notes: ['E3', 'B3', 'D4', 'G4']
      },
      {
        symbol: 'Fmaj7#11',
        name: 'Fa mayor lidio con oncena aumentada',
        notes: ['F2', 'A3', 'C4', 'E4', 'B4'],
        rootlessNotes: ['A3', 'C4', 'E4', 'B4'],
        drop2Notes: ['F2', 'C4', 'E4', 'A4']
      },
      {
        symbol: 'G13',
        name: 'Sol treceava',
        notes: ['G2', 'F3', 'B3', 'E4'],
        rootlessNotes: ['F3', 'B3', 'E4'],
        drop2Notes: ['G2', 'B3', 'F4', 'E4']
      }
    ]
  }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetTrackPath: string;
  onApplyClipToDaw: (clipData: {
    trackPath: string;
    name: string;
    length: string;
    notes: string;
    looping: boolean;
  }) => void;
}

export const ChordPaletteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  targetTrackPath,
  onApplyClipToDaw
}) => {
  const [selectedProg, setSelectedProg] = useState<ProgressionTemplate>(NEO_SOUL_PROGRESSIONS[0]);
  const [voicingStyle, setVoicingStyle] = useState<'standard' | 'rootless' | 'drop2'>('rootless');
  const [strumMs, setStrumMs] = useState<number>(25); // 25ms finger roll
  const [isPlayingAll, setIsPlayingAll] = useState<boolean>(false);
  const [activeChordIdx, setActiveChordIdx] = useState<number | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Obtener notas según estilo de voicing elegido
  const getNotesForChord = (chord: ChordItem): string[] => {
    if (voicingStyle === 'rootless') return chord.rootlessNotes;
    if (voicingStyle === 'drop2') return chord.drop2Notes;
    return chord.notes;
  };

  // Tocar un solo acorde
  const handlePlayChord = (chord: ChordItem, idx: number) => {
    setActiveChordIdx(idx);
    const activeNotes = getNotesForChord(chord);
    playNeoSoulChord(activeNotes, 1.8, 95, strumMs);
    setTimeout(() => setActiveChordIdx(null), 1200);
  };

  // Tocar toda la progresión
  const handlePlayAll = () => {
    if (isPlayingAll) {
      setIsPlayingAll(false);
      setActiveChordIdx(null);
      return;
    }

    setIsPlayingAll(true);
    const chords = selectedProg.chords;
    const chordDurationMs = 1333; // 2 beats a 90 BPM

    chords.forEach((chord, i) => {
      setTimeout(() => {
        setActiveChordIdx(i);
        const activeNotes = getNotesForChord(chord);
        playNeoSoulChord(activeNotes, 1.6, 92, strumMs);
      }, i * chordDurationMs);
    });

    setTimeout(() => {
      setIsPlayingAll(false);
      setActiveChordIdx(null);
    }, chords.length * chordDurationMs + 500);
  };

  // Generar string para Ableton Live (`ppal-create-clip`)
  const handleInjectToLive = () => {
    const lines: string[] = [];
    const chords = selectedProg.chords;

    chords.forEach((chord, idx) => {
      // 4 acordes repartidos en 2 compases (2 beats cada uno): 1|1, 1|3, 2|1, 2|3
      const bar = Math.floor(idx / 2) + 1;
      const beat = (idx % 2 === 0) ? 1 : 3;
      const barBeat = `${bar}|${beat}`;
      const activeNotes = getNotesForChord(chord);

      lines.push(`// Compás ${bar}: ${chord.symbol} (${voicingStyle})`);
      activeNotes.forEach((pitch, nIdx) => {
        const vel = 92 - nIdx * 2;
        lines.push(`v${vel} n/2 ${pitch} ${barBeat}`);
      });
    });

    onApplyClipToDaw({
      trackPath: targetTrackPath || 't1',
      name: `${selectedProg.title} [${voicingStyle.toUpperCase()}]`,
      length: '4bar',
      notes: lines.join('\n'),
      looping: true
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#12141a] border border-[#262a36] rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#262a36] bg-[#161922]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Music size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-zinc-100 flex items-center gap-2">
                Banco Armónico Neo-Soul & Voicing Engine
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/30 text-indigo-300">
                  C MAYOR / A MENOR
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Progresiones de acordes con voicings Drop-2 y Rootless para dejar espacio al bajo Moog
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {/* Selector de Progresiones */}
          <div className="grid grid-cols-2 gap-3">
            {NEO_SOUL_PROGRESSIONS.map((prog) => {
              const isSelected = selectedProg.id === prog.id;
              return (
                <div
                  key={prog.id}
                  onClick={() => setSelectedProg(prog)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-950/30 border-indigo-500/60 shadow-lg shadow-indigo-950/40'
                      : 'bg-[#151720] border-[#232734] hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                        {prog.title}
                        {isSelected && <Check size={12} className="text-indigo-400" />}
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{prog.artistInspiration}</p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">{prog.suggestedBpm} BPM</span>
                  </div>

                  {/* Chord Badges */}
                  <div className="flex items-center gap-1.5 mt-3">
                    {prog.chords.map((c, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium"
                      >
                        {c.symbol}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Opciones de Voicing & Strum */}
          <div className="p-4 rounded-lg bg-[#151720] border border-[#232734] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-xs text-zinc-400 font-medium">Tipo de Voicing:</span>
              <div className="flex rounded-lg bg-[#0e1015] p-1 border border-zinc-800">
                <button
                  onClick={() => setVoicingStyle('rootless')}
                  className={`px-3 py-1 rounded text-xs font-medium transition ${
                    voicingStyle === 'rootless'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Elimina la fundamental para no chocar con el bajo Moog"
                >
                  Rootless (Sin Bajo)
                </button>
                <button
                  onClick={() => setVoicingStyle('drop2')}
                  className={`px-3 py-1 rounded text-xs font-medium transition ${
                    voicingStyle === 'drop2'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Segunda voz más alta en octava baja (amplia y brillante)"
                >
                  Drop-2
                </button>
                <button
                  onClick={() => setVoicingStyle('standard')}
                  className={`px-3 py-1 rounded text-xs font-medium transition ${
                    voicingStyle === 'standard'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Fundamental Completa
                </button>
              </div>
            </div>

            {/* Strum Delay */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400 font-medium">Strum / Finger Roll:</span>
              <input
                type="range"
                min="0"
                max="60"
                value={strumMs}
                onChange={(e) => setStrumMs(parseInt(e.target.value, 10))}
                className="w-24 accent-indigo-500 cursor-pointer"
              />
              <span className="font-mono text-xs text-indigo-400 font-bold">{strumMs}ms</span>
            </div>
          </div>

          {/* Tarjetas de Acordes con Disparo Individual */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-300">
                Acordes de la Progresión ({selectedProg.title}):
              </span>
              <span className="text-[11px] text-zinc-500">
                Haz clic en cada tarjeta para escucharla individualmente
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {selectedProg.chords.map((chord, idx) => {
                const isActive = activeChordIdx === idx;
                const notesList = getNotesForChord(chord);

                return (
                  <div
                    key={idx}
                    onClick={() => handlePlayChord(chord, idx)}
                    className={`p-3 rounded-lg border cursor-pointer transition flex flex-col justify-between h-28 relative ${
                      isActive
                        ? 'bg-indigo-500/20 border-indigo-400 shadow-md shadow-indigo-500/30'
                        : 'bg-[#151720] border-[#262b3a] hover:border-zinc-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold font-mono text-indigo-300">{chord.symbol}</span>
                        <Volume2 size={13} className={isActive ? 'text-indigo-400 animate-pulse' : 'text-zinc-600'} />
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{chord.name}</p>
                    </div>

                    <div>
                      <span className="text-[9px] text-zinc-500 block mb-1">Voces ({voicingStyle}):</span>
                      <div className="flex flex-wrap gap-1">
                        {notesList.map((n, i) => (
                          <span
                            key={i}
                            className="text-[9px] font-mono px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#141720] border-t border-[#262a36] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayAll}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                isPlayingAll
                  ? 'bg-indigo-500 text-white'
                  : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700'
              }`}
            >
              {isPlayingAll ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
              {isPlayingAll ? 'Detener Progresión' : 'Audición Progresión Completa'}
            </button>
            <span className="text-xs text-zinc-400">
              Destino: Pista <strong className="text-zinc-200">[{targetTrackPath}]</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition"
            >
              Cerrar
            </button>
            <button
              onClick={handleInjectToLive}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20"
            >
              <Send size={13} />
              Inyectar Progresión a Ableton Live (ppal-create-clip)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
