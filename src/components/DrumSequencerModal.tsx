import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Square,
  Sparkles,
  Sliders,
  Send,
  Trash2,
  RotateCcw,
  Volume2,
  Clock,
  Layers,
  ChevronRight,
  Zap,
  Disc3,
  Flame
} from 'lucide-react';
import { playDrumVoice } from '../utils/audioEngine';

export type DrumVoiceId = 'kick' | 'snare' | 'ghost' | 'rimshot' | 'hatClosed' | 'hatOpen' | 'shaker';

export interface DrumTrackConfig {
  id: DrumVoiceId;
  name: string;
  midiNote: string; // ej 'C1', 'D1', 'F#1'
  color: string;
  defaultVel: number;
}

export const DRUM_VOICES: DrumTrackConfig[] = [
  { id: 'kick', name: 'Kick Sub (45Hz)', midiNote: 'C1', color: '#ff7034', defaultVel: 108 },
  { id: 'snare', name: 'Snare Main', midiNote: 'D1', color: '#3b82f6', defaultVel: 102 },
  { id: 'ghost', name: 'Ghost Snare', midiNote: 'D1', color: '#60a5fa', defaultVel: 42 },
  { id: 'rimshot', name: 'Rimshot Seco', midiNote: 'C#1', color: '#a855f7', defaultVel: 88 },
  { id: 'hatClosed', name: 'Hi-Hat Cerrado', midiNote: 'F#1', color: '#10b981', defaultVel: 85 },
  { id: 'hatOpen', name: 'Hi-Hat Abierto', midiNote: 'A#1', color: '#34d399', defaultVel: 90 },
  { id: 'shaker', name: 'Shaker / Perc', midiNote: 'F#2', color: '#f59e0b', defaultVel: 75 }
];

// Presets de ritmo auténticos de hip-hop soul y boom bap
export interface DrumPatternPreset {
  id: string;
  name: string;
  description: string;
  swing: number;
  pattern: Record<DrumVoiceId, number[]>; // Array of 16 velocities (0 = off, >0 = on)
}

export const BOOM_BAP_DRUM_PRESETS: DrumPatternPreset[] = [
  {
    id: 'dilla_pocket',
    name: 'J Dilla / Slum Village Pocket',
    description: 'Cajas fantasma sincopadas, hi-hats retrasados y bombo pesado con swing del 57%',
    swing: 57,
    pattern: {
      kick:      [110, 0, 0, 0,   0, 0, 95, 0,   0, 0, 105, 0,  0, 0, 0, 0],
      snare:     [0, 0, 0, 0,   104, 0, 0, 0,   0, 0, 0, 0,   102, 0, 0, 0],
      ghost:     [0, 0, 0, 0,   0, 0, 0, 42,   0, 0, 0, 48,   0, 0, 45, 0],
      rimshot:   [0, 0, 0, 0,   0, 0, 0, 0,     0, 0, 0, 0,   0, 0, 0, 0],
      hatClosed: [88, 65, 82, 60, 88, 65, 82, 60, 88, 65, 82, 60, 88, 65, 82, 60],
      hatOpen:   [0, 0, 0, 0,   0, 0, 0, 0,     0, 0, 0, 0,   0, 0, 80, 0],
      shaker:    [0, 0, 68, 0,  0, 0, 72, 0,    0, 0, 68, 0,  0, 0, 75, 0]
    }
  },
  {
    id: 'premier_classic',
    name: 'DJ Premier / 90s Boom Bap Hard',
    description: 'Caja cortante en 2 y 4, doble bombo en el beat 3 y rimshot auxiliar',
    swing: 54,
    pattern: {
      kick:      [115, 0, 0, 0,  0, 0, 0, 0,    108, 0, 102, 0,  0, 0, 0, 0],
      snare:     [0, 0, 0, 0,   110, 0, 0, 0,   0, 0, 0, 0,     112, 0, 0, 0],
      ghost:     [0, 0, 0, 0,   0, 0, 0, 0,     0, 0, 0, 40,     0, 0, 0, 0],
      rimshot:   [0, 0, 0, 0,   0, 0, 85, 0,    0, 0, 0, 0,     0, 0, 0, 0],
      hatClosed: [92, 0, 85, 0, 90, 0, 85, 0,   92, 0, 85, 0,   90, 0, 85, 0],
      hatOpen:   [0, 0, 0, 0,   0, 0, 0, 0,     0, 0, 0, 88,    0, 0, 0, 0],
      shaker:    [0, 0, 0, 0,   0, 0, 0, 0,     0, 0, 0, 0,     0, 0, 0, 0]
    }
  },
  {
    id: 'questlove_soul',
    name: 'Questlove Neo-Soul Rim & Shaker',
    description: 'Toque orgánico con rimshot cálido, ghost notes en contratiempos y shaker fluido',
    swing: 56,
    pattern: {
      kick:      [105, 0, 0, 0,  0, 0, 92, 0,   0, 0, 0, 0,     0, 0, 98, 0],
      snare:     [0, 0, 0, 0,   0, 0, 0, 0,     0, 0, 0, 0,     0, 0, 0, 0],
      ghost:     [0, 0, 38, 0,  0, 0, 42, 0,    0, 0, 40, 0,    0, 0, 0, 45],
      rimshot:   [0, 0, 0, 0,   95, 0, 0, 0,    0, 0, 0, 0,     98, 0, 0, 0],
      hatClosed: [82, 60, 80, 58, 82, 60, 80, 58, 82, 60, 80, 58, 82, 60, 80, 58],
      hatOpen:   [0, 0, 0, 0,   0, 0, 0, 0,     0, 0, 0, 0,     0, 0, 75, 0],
      shaker:    [70, 60, 72, 62, 70, 60, 72, 62, 70, 60, 72, 62, 70, 60, 72, 62]
    }
  }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetTrackPath: string;
  onApplyDrumClipToDaw: (clipData: {
    trackPath: string;
    name: string;
    length: string;
    notes: string;
    looping: boolean;
  }) => void;
}

export const DrumSequencerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  targetTrackPath,
  onApplyDrumClipToDaw
}) => {
  const [pattern, setPattern] = useState<Record<DrumVoiceId, number[]>>(BOOM_BAP_DRUM_PRESETS[0].pattern);
  const [selectedPreset, setSelectedPreset] = useState<string>(BOOM_BAP_DRUM_PRESETS[0].id);
  const [mpcSwing, setMpcSwing] = useState<number>(57);
  const [clipName, setClipName] = useState<string>('01 Boom Bap Drums [MPC Pattern]');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const playbackRef = useRef<{ intervalId: number | null }>({ intervalId: null });

  if (!isOpen) return null;

  // Toggle or adjust step velocity
  const handleToggleStep = (voice: DrumVoiceId, stepIdx: number) => {
    const current = pattern[voice][stepIdx];
    const defaultVel = DRUM_VOICES.find((v) => v.id === voice)?.defaultVel || 90;
    const nextVel = current > 0 ? 0 : defaultVel;

    setPattern((prev) => ({
      ...prev,
      [voice]: prev[voice].map((v, i) => (i === stepIdx ? nextVel : v))
    }));

    if (nextVel > 0) {
      playDrumVoice(voice, nextVel);
    }
  };

  // Cargar preset
  const handleLoadPreset = (presetId: string) => {
    const p = BOOM_BAP_DRUM_PRESETS.find((x) => x.id === presetId);
    if (!p) return;
    setSelectedPreset(presetId);
    setPattern(p.pattern);
    setMpcSwing(p.swing);
    setClipName(`01 ${p.name.split('/')[0].trim()} [MPC]`);
  };

  // Generador de Ghost Notes automáticas
  const handleGenerateGhostNotes = () => {
    // Inserta ghost notes dinámicas en los pasos de semicorcheas impares donde no haya caja principal
    setPattern((prev) => {
      const snareMain = prev.snare;
      const currentGhosts = [...prev.ghost];

      // Lugares clásicos de ghost snare de boom bap: pasos 2, 6, 10, 14 (o contratiempos sutiles)
      const targetGhostSteps = [2, 6, 7, 10, 11, 14];

      targetGhostSteps.forEach((s) => {
        // Solo si no hay golpe principal de caja
        if (snareMain[s] === 0) {
          // Velocidad humana entre 32 y 48
          currentGhosts[s] = Math.floor(34 + Math.random() * 14);
        }
      });

      return {
        ...prev,
        ghost: currentGhosts
      };
    });

    // Pequeño feedback auditivo
    playDrumVoice('ghost', 45);
  };

  // Limpiar pista o todo
  const handleClearAll = () => {
    const empty: Record<DrumVoiceId, number[]> = {
      kick: Array(16).fill(0),
      snare: Array(16).fill(0),
      ghost: Array(16).fill(0),
      rimshot: Array(16).fill(0),
      hatClosed: Array(16).fill(0),
      hatOpen: Array(16).fill(0),
      shaker: Array(16).fill(0)
    };
    setPattern(empty);
  };

  // Reproductor Web Audio del secuenciador
  const handleTogglePlayback = () => {
    if (isPlaying) {
      if (playbackRef.current.intervalId) {
        clearInterval(playbackRef.current.intervalId);
        playbackRef.current.intervalId = null;
      }
      setIsPlaying(false);
      setActiveStep(null);
      return;
    }

    setIsPlaying(true);
    const bpm = 90;
    const stepDurationMs = (60000 / bpm) / 4; // Semicorcheas a 90 BPM ~ 166.6ms

    let current = 0;
    playbackRef.current.intervalId = window.setInterval(() => {
      setActiveStep(current);

      // Calcular swing MPC para los pasos impares (1, 3, 5, 7, 9, 11, 13, 15)
      const isOdd = current % 2 === 1;
      const swingDelay = isOdd ? ((mpcSwing - 50) / 50) * (stepDurationMs * 0.45) : 0;

      // Disparar las voces activas en este paso
      DRUM_VOICES.forEach((v) => {
        const vel = pattern[v.id][current];
        if (vel > 0) {
          setTimeout(() => {
            playDrumVoice(v.id, vel);
          }, swingDelay);
        }
      });

      current = (current + 1) % 16;
    }, stepDurationMs);
  };

  // Detener al desmontar o cerrar
  useEffect(() => {
    return () => {
      if (playbackRef.current.intervalId) {
        clearInterval(playbackRef.current.intervalId);
      }
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (playbackRef.current.intervalId) {
          clearInterval(playbackRef.current.intervalId);
          playbackRef.current.intervalId = null;
        }
        setIsPlaying(false);
        setActiveStep(null);
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  // Convertir a sintaxis de Live `notes`: "v105 n/16 C1 1|1"
  const generateLiveNotes = (): string => {
    const lines: string[] = [];

    for (let step = 0; step < 16; step++) {
      // 16 pasos = 1 compás de 4/4 en semicorcheas: 1|1, 1|1.25, 1|1.5, 1|1.75, 1|2 ...
      const beat = Math.floor(step / 4) + 1;
      const fraction = (step % 4);
      const fracStr = fraction === 0 ? '' : fraction === 1 ? '.25' : fraction === 2 ? '.5' : '.75';
      const barBeat = `1|${beat}${fracStr}`;

      DRUM_VOICES.forEach((v) => {
        const vel = pattern[v.id][step];
        if (vel > 0) {
          lines.push(`v${vel} n/16 ${v.midiNote} ${barBeat}`);
        }
      });
    }

    return lines.join('\n');
  };

  // Inyectar en Ableton Live
  const handleSendToLive = () => {
    const notesStr = generateLiveNotes();
    onApplyDrumClipToDaw({
      trackPath: targetTrackPath || 't0',
      name: clipName,
      length: '1bar',
      notes: notesStr,
      looping: true
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#12141a] border border-[#262a36] rounded-xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#262a36] bg-[#161922]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Disc3 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-zinc-100 flex items-center gap-2">
                Secuenciador de Baterías MPC & Generador de Ghost Notes
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-950/60 border border-orange-500/30 text-orange-300">
                  STEP SEQUENCER 16P
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Programación de ritmo boom bap con dinámicas sutiles de caja, swing MPC y exportación directa a Live
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isPlaying) handleTogglePlayback();
              onClose();
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar de Presets y Herramientas */}
        <div className="p-4 bg-[#141720] border-b border-[#202430] flex flex-wrap items-center justify-between gap-4">
          {/* Selector de Presets */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 font-medium">Presets Boom Bap:</span>
            <div className="flex gap-2">
              {BOOM_BAP_DRUM_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleLoadPreset(p.id)}
                  className={`px-3 py-1.5 rounded text-xs font-medium border transition ${
                    selectedPreset === p.id
                      ? 'bg-orange-500/20 border-orange-500/60 text-orange-300 shadow-sm'
                      : 'bg-[#181a24] border-zinc-700/60 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {p.name.split('/')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          {/* Generador de Ghost Notes & Swing */}
          <div className="flex items-center gap-4">
            {/* MPC Swing */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium flex items-center gap-1">
                <Clock size={12} className="text-orange-400" /> Swing:
              </span>
              <input
                type="range"
                min="50"
                max="70"
                value={mpcSwing}
                onChange={(e) => setMpcSwing(parseInt(e.target.value, 10))}
                className="w-24 accent-orange-500 cursor-pointer"
              />
              <span className="font-mono text-xs text-orange-400 font-bold">{mpcSwing}%</span>
            </div>

            {/* Generador de Ghost Notes */}
            <button
              onClick={handleGenerateGhostNotes}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/40 text-xs text-blue-300 transition cursor-pointer"
              title="Añade notas fantasma sutiles en los contratiempos para darle el pocket característico a la caja"
            >
              <Sparkles size={13} className="text-blue-400" />
              <span>+ Ghost Notes Auto</span>
            </button>

            {/* Audición Play/Stop */}
            <button
              onClick={handleTogglePlayback}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                isPlaying
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700'
              }`}
            >
              {isPlaying ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
              <span>{isPlaying ? 'Parar' : 'Audición'}</span>
            </button>

            <button
              onClick={handleClearAll}
              className="p-1.5 text-zinc-500 hover:text-rose-400 rounded transition"
              title="Limpiar secuencia"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Grilla del Secuenciador de 16 Pasos */}
        <div className="flex-1 overflow-auto p-5 bg-[#0d0f14] select-none flex flex-col gap-2">
          {/* Cabecera de Compases (16 pasos con división de tiempos 1, 2, 3, 4) */}
          <div className="flex items-center pl-40 pr-2">
            {Array.from({ length: 16 }).map((_, stepIdx) => {
              const isBeatStart = stepIdx % 4 === 0;
              const beatNum = Math.floor(stepIdx / 4) + 1;
              const subBeat = (stepIdx % 4) + 1;
              const isActive = activeStep === stepIdx;

              return (
                <div
                  key={stepIdx}
                  className={`flex-1 text-center py-1 text-[10px] font-mono border-b ${
                    isActive
                      ? 'bg-orange-500/20 text-orange-300 font-bold border-orange-500'
                      : isBeatStart
                      ? 'bg-zinc-900 text-zinc-200 font-bold border-zinc-700'
                      : 'text-zinc-500 border-zinc-800/80'
                  } ${isBeatStart ? 'border-l border-zinc-700' : ''}`}
                >
                  {isBeatStart ? `Beat ${beatNum}` : `.${subBeat}`}
                </div>
              );
            })}
          </div>

          {/* Filas por voz de batería */}
          {DRUM_VOICES.map((voice) => {
            return (
              <div key={voice.id} className="flex items-center h-10 gap-2">
                {/* Etiqueta de la voz con disparador de prueba */}
                <div
                  onClick={() => playDrumVoice(voice.id, voice.defaultVel)}
                  className="w-38 h-full flex items-center justify-between px-3 text-xs font-mono font-medium rounded bg-[#161822] hover:bg-[#1e212e] border border-zinc-800 cursor-pointer shrink-0 transition"
                  title="Haz clic para escuchar este golpe"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: voice.color }}
                    />
                    <span className="truncate text-zinc-200">{voice.name}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">{voice.midiNote}</span>
                </div>

                {/* 16 Celdas de pasos */}
                <div className="flex-1 flex h-full gap-1.5">
                  {Array.from({ length: 16 }).map((_, stepIdx) => {
                    const vel = pattern[voice.id][stepIdx];
                    const isOn = vel > 0;
                    const isBeatStart = stepIdx % 4 === 0;
                    const isActiveStep = activeStep === stepIdx;

                    return (
                      <div
                        key={stepIdx}
                        onClick={() => handleToggleStep(voice.id, stepIdx)}
                        className={`flex-1 h-full rounded cursor-pointer relative transition-all flex items-center justify-center border ${
                          isOn
                            ? 'border-transparent shadow-md'
                            : 'border-zinc-800/80 hover:border-zinc-700'
                        } ${
                          isActiveStep && !isOn
                            ? 'bg-zinc-800/50'
                            : !isOn
                            ? isBeatStart
                              ? 'bg-[#151720]'
                              : 'bg-[#101218]'
                            : ''
                        }`}
                        style={{
                          backgroundColor: isOn ? voice.color : undefined,
                          opacity: isOn ? (vel / 127) * 0.9 + 0.2 : undefined
                        }}
                      >
                        {isOn && (
                          <span
                            className={`text-[9px] font-mono font-bold ${
                              vel > 90 ? 'text-zinc-950' : 'text-zinc-100'
                            }`}
                          >
                            {vel}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: Live Set Injection */}
        <div className="p-4 bg-[#141720] border-t border-[#262a36] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 font-medium">Nombre de Clip:</span>
            <input
              type="text"
              value={clipName}
              onChange={(e) => setClipName(e.target.value)}
              className="bg-[#0e1015] border border-zinc-700 rounded px-2.5 py-1 text-xs text-zinc-200 w-64 focus:border-orange-500 outline-none font-mono"
            />
            <span className="text-[11px] font-mono text-zinc-500">
              Destino: Pista <strong className="text-zinc-300">[{targetTrackPath}]</strong> (Drum Rack)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isPlaying) handleTogglePlayback();
                onClose();
              }}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition"
            >
              Cerrar
            </button>
            <button
              onClick={handleSendToLive}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-zinc-950 text-xs font-bold transition shadow-lg shadow-orange-500/20"
            >
              <Send size={13} />
              Inyectar Batería a Ableton Live (ppal-create-clip)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
