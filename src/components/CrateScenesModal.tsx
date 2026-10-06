import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Square,
  Sparkles,
  Sliders,
  Send,
  Zap,
  Layers,
  CheckCircle2,
  Clock,
  Volume2,
  RefreshCw,
  Flame,
  ArrowRight
} from 'lucide-react';
import { InfiniteCrateState } from '../types/ableton';
import { abletonClient } from '../services/abletonApi';

export interface CrateScene {
  id: string;
  name: string;
  description: string;
  mood: string;
  bright: number;
  density: number;
  guidance: number;
  temp: number;
  topk: number;
  muteBass: boolean;
  muteDrums: boolean;
  muteOther: boolean;
  slots: { id: number; weight: number; label: string }[];
}

export const PRESET_CRATE_SCENES: CrateScene[] = [
  {
    id: 'scene_intro_vinyl',
    name: '1. Intro Vinilo & Rhodes Cálido',
    description: 'Batería y bajo silenciados, textura de púa y cinta alta, teclas suaves.',
    mood: 'Introspectivo, solitario, polvo analógico',
    bright: 0.35,
    density: 0.15,
    guidance: 3.5,
    temp: 1.05,
    topk: 35,
    muteBass: true,
    muteDrums: true,
    muteOther: false,
    slots: [
      { id: 1, weight: 0.0, label: 'boom bap drums' },
      { id: 2, weight: 0.85, label: 'warm vinyl keys' },
      { id: 3, weight: 0.0, label: 'soulful bass' },
      { id: 4, weight: 0.2, label: 'dusty strings' },
      { id: 5, weight: 0.45, label: 'airy pad' },
      { id: 6, weight: 0.90, label: 'tape hiss' },
      { id: 7, weight: 0.0, label: 'rimshot perc' },
      { id: 8, weight: 0.25, label: 'low choir' },
      { id: 9, weight: 0.75, label: 'vinyl noise' }
    ]
  },
  {
    id: 'scene_verse_drop',
    name: '2. Drop de Verso Boom Bap',
    description: 'Entran la batería y el bajo Moog con peso contundente, equilibrio oscuro.',
    mood: 'Groove pesado, cabeceo constante a 90 BPM',
    bright: 0.50,
    density: 0.30,
    guidance: 4.2,
    temp: 1.10,
    topk: 40,
    muteBass: false,
    muteDrums: false,
    muteOther: false,
    slots: [
      { id: 1, weight: 0.95, label: 'boom bap drums' },
      { id: 2, weight: 0.65, label: 'warm vinyl keys' },
      { id: 3, weight: 0.90, label: 'soulful bass' },
      { id: 4, weight: 0.20, label: 'dusty strings' },
      { id: 5, weight: 0.20, label: 'airy pad' },
      { id: 6, weight: 0.40, label: 'tape hiss' },
      { id: 7, weight: 0.50, label: 'rimshot perc' },
      { id: 8, weight: 0.10, label: 'low choir' },
      { id: 9, weight: 0.35, label: 'vinyl noise' }
    ]
  },
  {
    id: 'scene_hook_strings',
    name: '3. Estribillo / Cuerdas Elevadas & Coro',
    description: 'Máxima densidad emocional con strings polvorientos y coro de fondo.',
    mood: 'Clímax conmovedor, apertura estéreo amplia',
    bright: 0.65,
    density: 0.45,
    guidance: 4.8,
    temp: 1.15,
    topk: 45,
    muteBass: false,
    muteDrums: false,
    muteOther: false,
    slots: [
      { id: 1, weight: 0.88, label: 'boom bap drums' },
      { id: 2, weight: 0.60, label: 'warm vinyl keys' },
      { id: 3, weight: 0.85, label: 'soulful bass' },
      { id: 4, weight: 0.95, label: 'dusty strings' },
      { id: 5, weight: 0.60, label: 'airy pad' },
      { id: 6, weight: 0.35, label: 'tape hiss' },
      { id: 7, weight: 0.40, label: 'rimshot perc' },
      { id: 8, weight: 0.75, label: 'low choir' },
      { id: 9, weight: 0.30, label: 'vinyl noise' }
    ]
  },
  {
    id: 'scene_bridge_solo',
    name: '4. Puente / Solo de Teclas Íntimo',
    description: 'Batería en mute, bajo flotante y predominancia total del Fender Rhodes.',
    mood: 'Espacial, suspendido, respiración en el beat',
    bright: 0.40,
    density: 0.20,
    guidance: 3.8,
    temp: 1.00,
    topk: 35,
    muteBass: false,
    muteDrums: true,
    muteOther: false,
    slots: [
      { id: 1, weight: 0.0, label: 'boom bap drums' },
      { id: 2, weight: 1.0, label: 'warm vinyl keys' },
      { id: 3, weight: 0.70, label: 'soulful bass' },
      { id: 4, weight: 0.15, label: 'dusty strings' },
      { id: 5, weight: 0.50, label: 'airy pad' },
      { id: 6, weight: 0.65, label: 'tape hiss' },
      { id: 7, weight: 0.0, label: 'rimshot perc' },
      { id: 8, weight: 0.30, label: 'low choir' },
      { id: 9, weight: 0.55, label: 'vinyl noise' }
    ]
  },
  {
    id: 'scene_outro_fade',
    name: '5. Outro / Tape Hiss Fade',
    description: 'Desvanecimiento de instrumentos, quedando solo ruido de vinilo y armónicos lejanos.',
    mood: 'Despedida otoñal, grano analógico final',
    bright: 0.30,
    density: 0.10,
    guidance: 3.0,
    temp: 1.05,
    topk: 30,
    muteBass: true,
    muteDrums: true,
    muteOther: false,
    slots: [
      { id: 1, weight: 0.0, label: 'boom bap drums' },
      { id: 2, weight: 0.35, label: 'warm vinyl keys' },
      { id: 3, weight: 0.0, label: 'soulful bass' },
      { id: 4, weight: 0.0, label: 'dusty strings' },
      { id: 5, weight: 0.20, label: 'airy pad' },
      { id: 6, weight: 0.95, label: 'tape hiss' },
      { id: 7, weight: 0.0, label: 'rimshot perc' },
      { id: 8, weight: 0.0, label: 'low choir' },
      { id: 9, weight: 0.90, label: 'vinyl noise' }
    ]
  }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  crateState: InfiniteCrateState;
  onApplySceneToLive: (scene: CrateScene) => Promise<void>;
  onMorphSceneToLive: (targetScene: CrateScene, barsDuration: number) => Promise<void>;
  isMorphing: boolean;
  morphProgress: number; // 0 to 100
}

export const CrateScenesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  crateState,
  onApplySceneToLive,
  onMorphSceneToLive,
  isMorphing,
  morphProgress
}) => {
  const [selectedScene, setSelectedScene] = useState<CrateScene>(PRESET_CRATE_SCENES[1]);
  const [morphBars, setMorphBars] = useState<number>(4);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#12141a] border border-[#262a36] rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#262a36] bg-[#161922]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-zinc-100 flex items-center gap-2">
                Escenas y Morfosis de The Infinite Crate
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                  LYRIA RT MORPH
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Cambia la textura, batería y armonía de Lyria según la sección de la canción en tiempo real
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

        {/* Morph Progress Bar si está activo */}
        {isMorphing && (
          <div className="bg-[#19221a] border-b border-emerald-500/40 p-2.5 flex items-center justify-between px-6">
            <div className="flex items-center gap-2 text-xs text-emerald-300 font-medium">
              <RefreshCw size={14} className="animate-spin text-emerald-400" />
              <span>Morfosis progresiva hacia "{selectedScene.name}" en curso…</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-48 h-2 bg-zinc-900 rounded-full overflow-hidden border border-emerald-500/40">
                <div
                  className="h-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${morphProgress}%` }}
                />
              </div>
              <span className="font-mono text-xs text-emerald-400 font-bold">{Math.round(morphProgress)}%</span>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {/* Selector de Escenas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-300">
                Escenas de Producción para tu Canción:
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">
                Dispositivo: {crateState.devicePath || 't1/d1'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PRESET_CRATE_SCENES.map((scene) => {
                const isSelected = selectedScene.id === scene.id;
                return (
                  <div
                    key={scene.id}
                    onClick={() => setSelectedScene(scene)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/30'
                        : 'bg-[#151720] border-[#222634] hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                          {scene.name}
                          {isSelected && <CheckCircle2 size={13} className="text-emerald-400" />}
                        </h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                          {scene.muteDrums ? 'Sin Drums' : 'Drums ON'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">{scene.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-zinc-800/40 flex items-center justify-between text-[10px]">
                      <span className="text-emerald-400/90 italic">{scene.mood}</span>
                      <span className="font-mono text-zinc-500">
                        B:{scene.bright} D:{scene.density}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detalle de la Escena Seleccionada (Potes + 9 Slots) */}
          <div className="p-4 rounded-lg bg-[#14161e] border border-[#232734] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                Parámetros de "{selectedScene.name}"
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    selectedScene.muteBass
                      ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                      : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  }`}
                >
                  Bajo: {selectedScene.muteBass ? 'MUTE' : 'ON'}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    selectedScene.muteDrums
                      ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                      : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  }`}
                >
                  Drums: {selectedScene.muteDrums ? 'MUTE' : 'ON'}
                </span>
              </div>
            </div>

            {/* Potes de la Escena */}
            <div className="grid grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-[#0d0f14] border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">bright</span>
                <span className="text-emerald-400 font-bold">{selectedScene.bright.toFixed(2)}</span>
              </div>
              <div className="p-2 rounded bg-[#0d0f14] border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">density</span>
                <span className="text-emerald-400 font-bold">{selectedScene.density.toFixed(2)}</span>
              </div>
              <div className="p-2 rounded bg-[#0d0f14] border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">guidance</span>
                <span className="text-emerald-400 font-bold">{selectedScene.guidance.toFixed(1)}</span>
              </div>
              <div className="p-2 rounded bg-[#0d0f14] border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">temp</span>
                <span className="text-emerald-400 font-bold">{selectedScene.temp.toFixed(2)}</span>
              </div>
            </div>

            {/* Matriz de los 9 Slots de Prompts */}
            <div>
              <span className="text-[11px] font-medium text-zinc-400 block mb-2">
                Pesos de los 9 Slots en esta Escena:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {selectedScene.slots.map((s) => (
                  <div
                    key={s.id}
                    className="p-2 rounded bg-[#0e1015] border border-zinc-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="text-[10px] font-mono text-zinc-500">#{s.id}</span>
                      <p className="text-[11px] text-zinc-200 truncate">{s.label}</p>
                    </div>
                    <span
                      className={`font-mono text-xs font-bold ${
                        s.weight > 0 ? 'text-emerald-400' : 'text-zinc-600'
                      }`}
                    >
                      {s.weight.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Acciones de Aplicación al DAW */}
        <div className="p-4 bg-[#141720] border-t border-[#262a36] flex flex-wrap items-center justify-between gap-4">
          {/* Selector de compases de Morfosis */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400">Duración de Morfosis:</span>
            <div className="flex rounded bg-[#0e1015] p-0.5 border border-zinc-800 text-xs font-mono">
              {[2, 4, 8].map((b) => (
                <button
                  key={b}
                  onClick={() => setMorphBars(b)}
                  className={`px-2 py-0.5 rounded transition ${
                    morphBars === b ? 'bg-emerald-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {b} compases
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition"
            >
              Cerrar
            </button>

            {/* Inmediato */}
            <button
              onClick={() => onApplySceneToLive(selectedScene)}
              disabled={isMorphing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold transition disabled:opacity-50"
              title="Aplica todos los valores instantáneamente al DAW"
            >
              <Zap size={13} className="text-emerald-400" />
              Aplicar Inmediato
            </button>

            {/* Morfosis Suave */}
            <button
              onClick={() => onMorphSceneToLive(selectedScene, morphBars)}
              disabled={isMorphing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              title={`Interpola suavemente hacia esta escena durante ${morphBars} compases`}
            >
              <RefreshCw size={13} className={isMorphing ? 'animate-spin' : ''} />
              Morfosis en {morphBars} Compases
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
