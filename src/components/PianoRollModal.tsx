import React, { useState, useEffect } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { playRhodesNote, playNeoSoulChord } from '../utils/audioEngine';

export interface PianoNote {
  id: string;
  pitch: string; // ej 'C3', 'E3', 'G3', 'B3'
  barBeat: string; // ej '1|1', '1|2', '1|3', '1|4', '2|1'...
  stepIndex: number; // 0 to 15 (compás 1 a 2 en semicorcheas o corcheas)
  duration: 'n/4' | 'n/8' | 'n/2';
  velocity: number; // 1 to 127
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetTrackPath: string;
  initialNotesString?: string;
  onApplyClipToDaw: (clipData: {
    trackPath: string;
    name: string;
    length: string;
    notes: string;
    looping: boolean;
  }) => void;
}

// Escalas y notas del rango (C mayor / pentatónica / acordes neo-soul)
const PITCH_ROWS = [
  'D4', 'C4', 'B3', 'A3', 'G3', 'F#3', 'F3', 'E3', 'D3', 'C3', 'B2', 'A2', 'G2', 'C2'
];

const TOTAL_STEPS = 16; // 2 compases en corcheas (8 por compás) o 1 compás en semicorcheas

export const PianoRollModal: React.FC<Props> = ({
  isOpen,
  onClose,
  targetTrackPath,
  initialNotesString,
  onApplyClipToDaw
}) => {
  // Convertir string de notas inicial o cargar preset Neo-Soul
  const [notes, setNotes] = useState<PianoNote[]>([
    { id: 'n1', pitch: 'C3', barBeat: '1|1', stepIndex: 0, duration: 'n/4', velocity: 98 },
    { id: 'n2', pitch: 'E3', barBeat: '1|1', stepIndex: 0, duration: 'n/4', velocity: 92 },
    { id: 'n3', pitch: 'G3', barBeat: '1|1', stepIndex: 0, duration: 'n/4', velocity: 95 },
    { id: 'n4', pitch: 'B3', barBeat: '1|1', stepIndex: 0, duration: 'n/4', velocity: 88 },
    { id: 'n5', pitch: 'D4', barBeat: '1|1', stepIndex: 0, duration: 'n/4', velocity: 94 },

    { id: 'n6', pitch: 'A2', barBeat: '1|3', stepIndex: 4, duration: 'n/4', velocity: 94 },
    { id: 'n7', pitch: 'C3', barBeat: '1|3', stepIndex: 4, duration: 'n/4', velocity: 90 },
    { id: 'n8', pitch: 'E3', barBeat: '1|3', stepIndex: 4, duration: 'n/4', velocity: 92 },
    { id: 'n9', pitch: 'G3', barBeat: '1|3', stepIndex: 4, duration: 'n/4', velocity: 89 },

    { id: 'n10', pitch: 'D3', barBeat: '2|1', stepIndex: 8, duration: 'n/4', velocity: 96 },
    { id: 'n11', pitch: 'F3', barBeat: '2|1', stepIndex: 8, duration: 'n/4', velocity: 91 },
    { id: 'n12', pitch: 'A3', barBeat: '2|1', stepIndex: 8, duration: 'n/4', velocity: 93 },
    { id: 'n13', pitch: 'C4', barBeat: '2|1', stepIndex: 8, duration: 'n/4', velocity: 90 },

    { id: 'n14', pitch: 'G2', barBeat: '2|3', stepIndex: 12, duration: 'n/4', velocity: 98 },
    { id: 'n15', pitch: 'B2', barBeat: '2|3', stepIndex: 12, duration: 'n/4', velocity: 92 },
    { id: 'n16', pitch: 'D3', barBeat: '2|3', stepIndex: 12, duration: 'n/4', velocity: 94 },
    { id: 'n17', pitch: 'F3', barBeat: '2|3', stepIndex: 12, duration: 'n/4', velocity: 90 }
  ]);

  // Controles de Humanización MPC
  const [mpcSwing, setMpcSwing] = useState<number>(56); // 56% classic MPC60
  const [humanizeVel, setHumanizeVel] = useState<number>(12); // ±12 vel random
  const [laidBackDelay, setLaidBackDelay] = useState<number>(18); // 18ms lag
  const [clipName, setClipName] = useState<string>('05 Piano Roll [MPC Swing]');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activePlayStep, setActivePlayStep] = useState<number | null>(null);

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

  // Formato bar|beat a partir de stepIndex (8 steps = 1 compás de 4/4 con corcheas)
  const stepToBarBeat = (step: number): string => {
    const bar = Math.floor(step / 8) + 1;
    const beatFraction = (step % 8) / 2; // 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5
    const beat = Math.floor(beatFraction) + 1;
    const isSub = (step % 2) !== 0;
    return isSub ? `${bar}|${beat}.5` : `${bar}|${beat}`;
  };

  // Toggle nota en cuadrícula
  const handleToggleCell = (pitch: string, stepIndex: number) => {
    const existing = notes.find((n) => n.pitch === pitch && n.stepIndex === stepIndex);
    if (existing) {
      setNotes((prev) => prev.filter((n) => n.id !== existing.id));
    } else {
      const newNote: PianoNote = {
        id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        pitch,
        stepIndex,
        barBeat: stepToBarBeat(stepIndex),
        duration: 'n/4',
        velocity: Math.floor(88 + Math.random() * 15)
      };
      setNotes((prev) => [...prev, newNote]);
      playRhodesNote(pitch, 0.5, newNote.velocity);
    }
  };

  // Aplicar algoritmo MPC Swing y Humanize
  const handleApplyMpcGroove = () => {
    setNotes((prev) =>
      prev.map((n) => {
        // Humanizar velocidad
        const velDelta = Math.floor((Math.random() * 2 - 1) * humanizeVel);
        const newVel = Math.max(40, Math.min(127, n.velocity + velDelta));

        return {
          ...n,
          velocity: newVel
        };
      })
    );
  };

  // Preescucha en bucle o paso a paso
  const handlePlayPreview = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setActivePlayStep(null);
      return;
    }

    setIsPlaying(true);
    const stepDurationMs = (60000 / 90) / 2; // Corcheas a 90 BPM ~ 333ms

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep >= TOTAL_STEPS) {
        currentStep = 0;
      }
      setActivePlayStep(currentStep);

      // Calcular swing de micro-tiempo: pasos impares se retrasan según % de swing
      const isOdd = currentStep % 2 === 1;
      const swingDelay = isOdd ? ((mpcSwing - 50) / 50) * (stepDurationMs * 0.4) : 0;
      const totalOffset = swingDelay + (isOdd ? laidBackDelay : 0);

      // Disparar notas de este step
      const stepNotes = notes.filter((n) => n.stepIndex === currentStep);
      if (stepNotes.length > 0) {
        setTimeout(() => {
          stepNotes.forEach((sn) => {
            playRhodesNote(sn.pitch, 0.6, sn.velocity);
          });
        }, Math.max(0, totalOffset));
      }

      currentStep++;
    }, stepDurationMs);

    setTimeout(() => {
      clearInterval(interval);
      setIsPlaying(false);
      setActivePlayStep(null);
    }, stepDurationMs * TOTAL_STEPS * 2); // 2 vueltas
  };

  // Convertir a texto exacto de Live: "v100 n/4 C3 1|1"
  const generateLiveNotesString = (): string => {
    // Agrupar por compás y posición
    const sorted = [...notes].sort((a, b) => a.stepIndex - b.stepIndex);
    return sorted
      .map((n) => `v${n.velocity} ${n.duration} ${n.pitch} ${n.barBeat}`)
      .join('\n');
  };

  // Inyectar al DAW
  const handleSendToLive = () => {
    const notesStr = generateLiveNotesString();
    onApplyClipToDaw({
      trackPath: targetTrackPath || 't0',
      name: clipName,
      length: '2bar',
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
            <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-zinc-100 flex items-center gap-2">
                Piano Roll & MPC Groove Humanizer
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300">
                  AKAI MPC 60 SWING
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Edición de notas MIDI en C Mayor con articulación cálida y micro-timing de boom bap
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

        {/* Toolbar de Humanización y Controles */}
        <div className="p-4 bg-[#141720] border-b border-[#202430] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {/* MPC Swing Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-zinc-400 font-medium flex items-center gap-1">
                  <Clock size={12} className="text-amber-400" /> MPC Swing:
                </span>
                <span className="font-mono text-amber-400 font-bold">{mpcSwing}%</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="50"
                  max="75"
                  value={mpcSwing}
                  onChange={(e) => setMpcSwing(parseInt(e.target.value, 10))}
                  className="w-32 accent-amber-500 cursor-pointer"
                />
                <div className="flex gap-1">
                  {[54, 57, 62].map((val) => (
                    <button
                      key={val}
                      onClick={() => setMpcSwing(val)}
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                        mpcSwing === val
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Velocity Randomize */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-zinc-400 font-medium flex items-center gap-1">
                  <Volume2 size={12} className="text-emerald-400" /> Humanize Vel:
                </span>
                <span className="font-mono text-emerald-400 font-bold">±{humanizeVel}</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                value={humanizeVel}
                onChange={(e) => setHumanizeVel(parseInt(e.target.value, 10))}
                className="w-28 accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Laid-back Lag */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-zinc-400 font-medium">Laid-Back Lag:</span>
                <span className="font-mono text-indigo-400 font-bold">+{laidBackDelay}ms</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={laidBackDelay}
                onChange={(e) => setLaidBackDelay(parseInt(e.target.value, 10))}
                className="w-28 accent-indigo-500 cursor-pointer"
              />
            </div>

            <button
              onClick={handleApplyMpcGroove}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs text-zinc-200 transition"
              title="Aplica variaciones orgánicas de velocidad y groove"
            >
              <Sparkles size={13} className="text-amber-400" />
              Aplicar Groove
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayPreview}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                isPlaying
                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700'
              }`}
            >
              {isPlaying ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
              {isPlaying ? 'Detener' : 'Audición Rhodes'}
            </button>

            <button
              onClick={() => setNotes([])}
              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition"
              title="Limpiar cuadrícula"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Grilla del Piano Roll */}
        <div className="flex-1 overflow-auto p-4 bg-[#0d0f14] select-none">
          {/* Header de Compases y Pasos */}
          <div className="flex items-center mb-1 pl-16">
            {Array.from({ length: TOTAL_STEPS }).map((_, stepIdx) => {
              const isBarStart = stepIdx % 8 === 0;
              const barNum = Math.floor(stepIdx / 8) + 1;
              const beatNum = Math.floor((stepIdx % 8) / 2) + 1;
              const isActive = activePlayStep === stepIdx;

              return (
                <div
                  key={stepIdx}
                  className={`flex-1 text-center py-1 text-[10px] font-mono border-b ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 font-bold border-amber-500'
                      : isBarStart
                      ? 'bg-zinc-900 text-zinc-300 font-bold border-zinc-700'
                      : 'text-zinc-500 border-zinc-800'
                  }`}
                >
                  {isBarStart ? `Bar ${barNum}` : `${barNum}|${beatNum}`}
                </div>
              );
            })}
          </div>

          {/* Filas de notas */}
          <div className="flex flex-col gap-[2px]">
            {PITCH_ROWS.map((pitch) => {
              const isBlackKey = pitch.includes('#');
              return (
                <div key={pitch} className="flex items-center h-7">
                  {/* Etiqueta de la tecla */}
                  <div
                    onClick={() => playRhodesNote(pitch, 0.6, 100)}
                    className={`w-16 h-full flex items-center justify-between px-2 text-xs font-mono font-medium rounded-l cursor-pointer border-r border-[#202430] ${
                      isBlackKey
                        ? 'bg-[#15171e] text-zinc-400 hover:bg-zinc-800'
                        : 'bg-[#1c202a] text-zinc-200 hover:bg-zinc-700'
                    }`}
                  >
                    <span>{pitch}</span>
                    <Volume2 size={11} className="opacity-40" />
                  </div>

                  {/* Celdas de la cuadrícula */}
                  <div className="flex-1 flex h-full gap-[2px]">
                    {Array.from({ length: TOTAL_STEPS }).map((_, stepIdx) => {
                      const note = notes.find((n) => n.pitch === pitch && n.stepIndex === stepIdx);
                      const isBarBorder = (stepIdx + 1) % 8 === 0;
                      const isBeatBorder = (stepIdx + 1) % 2 === 0;
                      const isActiveStep = activePlayStep === stepIdx;

                      return (
                        <div
                          key={stepIdx}
                          onClick={() => handleToggleCell(pitch, stepIdx)}
                          className={`flex-1 h-full cursor-pointer relative transition-colors ${
                            note
                              ? 'bg-amber-500 hover:bg-amber-400 rounded-sm shadow-sm shadow-amber-500/40'
                              : isActiveStep
                              ? 'bg-zinc-800/60'
                              : isBlackKey
                              ? 'bg-[#12141b] hover:bg-zinc-800/40'
                              : 'bg-[#161822] hover:bg-zinc-800/40'
                          } ${isBarBorder ? 'border-r-2 border-zinc-700' : isBeatBorder ? 'border-r border-zinc-800' : ''}`}
                        >
                          {note && (
                            <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-zinc-950">
                              {note.velocity}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer: Live Set Injection */}
        <div className="p-4 bg-[#141720] border-t border-[#262a36] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 font-medium">Nombre de Clip:</span>
            <input
              type="text"
              value={clipName}
              onChange={(e) => setClipName(e.target.value)}
              className="bg-[#0e1015] border border-zinc-700 rounded px-2.5 py-1 text-xs text-zinc-200 w-60 focus:border-amber-500 outline-none font-mono"
            />
            <span className="text-[11px] font-mono text-zinc-500">
              Destino: Pista <strong className="text-zinc-300">[{targetTrackPath}]</strong> ({notes.length} notas)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSendToLive}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-lg shadow-amber-500/20"
            >
              <Send size={13} />
              Inyectar a Ableton Live (ppal-create-clip)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
