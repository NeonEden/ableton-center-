import React from 'react';
import {
  RefreshCw,
  Play,
  Square,
  Sliders,
  Keyboard,
  Download,
  Save,
  Radio,
  Undo2,
  Redo2,
  History,
  Music,
  Scissors,
  Disc3,
  Layers
} from 'lucide-react';
import { LiveSet } from '../types/ableton';

interface Props {
  liveSet: LiveSet;
  isConnected: boolean;
  isSimulated: boolean;
  isBusy: boolean;
  busyMessage?: string;
  isPlaying: boolean;
  saveStatus: 'saved' | 'saving' | 'idle';
  lastSavedTime: string;
  canUndo: boolean;
  canRedo: boolean;
  undoDescription: string;
  redoDescription: string;
  undoCount: number;
  onUndo: () => void;
  onRedo: () => void;
  onOpenHistory: () => void;
  onRefreshSet: () => void;
  onTogglePlayback: () => void;
  onOpenShortcuts: () => void;
  onOpenVstBrowser: () => void;
  onExportMidi: () => void;
  onUpdateTempo: (bpm: number) => void;
  onToggleSimulationMode: () => void;
  onOpenPianoRoll?: () => void;
  onOpenChordPalette?: () => void;
  onOpenSampleSlicer?: () => void;
  onOpenDrumSequencer?: () => void;
  onOpenCrateScenes?: () => void;
}

export const TopBar: React.FC<Props> = ({
  liveSet,
  isConnected,
  isSimulated,
  isBusy,
  busyMessage,
  isPlaying,
  saveStatus,
  lastSavedTime,
  canUndo,
  canRedo,
  undoDescription,
  redoDescription,
  undoCount,
  onUndo,
  onRedo,
  onOpenHistory,
  onRefreshSet,
  onTogglePlayback,
  onOpenShortcuts,
  onOpenVstBrowser,
  onExportMidi,
  onUpdateTempo,
  onToggleSimulationMode,
  onOpenPianoRoll,
  onOpenChordPalette,
  onOpenSampleSlicer,
  onOpenDrumSequencer,
  onOpenCrateScenes
}) => {
  return (
    <header className="h-14 bg-[#111317] border-b border-[#232731] px-4 flex items-center justify-between gap-4 select-none shrink-0 z-30">
      {/* Zone 1: Brand, DAW Status & Undo/Redo Cluster */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-[#f4f5f8] uppercase">
            Centro Creativo
          </span>
          <span className="text-xs text-[#6e7787] font-mono">
            / Live 12.4.6 Suite
          </span>
        </div>

        {/* DAW Connection Indicator */}
        <button
          onClick={onToggleSimulationMode}
          title={
            isConnected
              ? 'Conectado a Producer_Pal (localhost:3350). Hacé clic para alternar a modo simulado.'
              : 'Sin DAW local activo. Operando en Modo Simulado. Hacé clic para reintentar.'
          }
          className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#181b22] border border-[#262a34] text-xs font-mono transition-colors hover:border-[#3a4150]"
        >
          {isConnected ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ● conectado
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[#ff9e6a] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#ff7034]" />
              ○ sin DAW (Modo simulado)
            </span>
          )}
        </button>

        {/* Undo / Redo / History Controls */}
        <div className="flex items-center gap-1 bg-[#161922] p-0.5 rounded-lg border border-[#262a34]">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title={canUndo ? `Deshacer: ${undoDescription} (Ctrl+Z)` : 'Nada para deshacer'}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors text-[#d2d6e0] hover:bg-[#222734] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5 text-[#ff7034]" />
            <span className="hidden xl:inline text-[11px]">Undo</span>
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo}
            title={canRedo ? `Rehacer: ${redoDescription} (Ctrl+Y)` : 'Nada para rehacer'}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors text-[#d2d6e0] hover:bg-[#222734] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
          >
            <Redo2 className="w-3.5 h-3.5 text-[#7ea5e8]" />
            <span className="hidden xl:inline text-[11px]">Redo</span>
          </button>

          <button
            onClick={onOpenHistory}
            title="Abrir historial completo de estados DAW (stack de acciones)"
            className="p-1 text-[#8c93a0] hover:text-white hover:bg-[#222734] rounded transition-colors"
          >
            <History className="w-3.5 h-3.5" />
          </button>
        </div>

        {isBusy && (
          <div className="hidden 2xl:flex items-center gap-2 text-xs text-[#ffa375] bg-[#ff7034]/10 border border-[#ff7034]/30 px-2.5 py-0.5 rounded">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-mono">{busyMessage || 'trabajando… (puede tardar 20-60 s)'}</span>
          </div>
        )}
      </div>

      {/* Zone 2: Project Transport & Musical Parameters */}
      <div className="hidden lg:flex items-center gap-4 bg-[#161920] px-3 py-1 rounded-lg border border-[#262a34]">
        {/* Play/Stop Button */}
        <button
          onClick={onTogglePlayback}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${
            isPlaying
              ? 'bg-emerald-500 text-black hover:bg-emerald-400'
              : 'bg-[#222733] text-[#d6dae3] hover:bg-[#2c3242]'
          }`}
          title="Espacio: Reproducir / Detener sesión en Ableton"
        >
          {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isPlaying ? 'Detener' : 'Play'}</span>
        </button>

        <div className="h-4 w-[1px] bg-[#2d323f]" />

        {/* Tempo */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#7d8799] uppercase tracking-wide">Tempo</span>
          <div className="flex items-center bg-[#111317] px-2 py-0.5 rounded border border-[#2b303d]">
            <input
              type="number"
              value={liveSet.tempo}
              onChange={(e) => onUpdateTempo(Number(e.target.value))}
              min={40}
              max={240}
              className="w-12 bg-transparent text-xs font-mono font-bold text-[#ff7034] text-center focus:outline-none"
            />
            <span className="text-[10px] text-[#6c7484] font-mono">BPM</span>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-[#2d323f]" />

        {/* Compás */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#7d8799] uppercase tracking-wide">Compás</span>
          <span className="text-xs font-mono font-semibold text-[#f0f2f5] bg-[#111317] px-2 py-0.5 rounded border border-[#2b303d]">
            {liveSet.timeSignature || '4/4'}
          </span>
        </div>

        <div className="h-4 w-[1px] bg-[#2d323f]" />

        {/* Escala */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#7d8799] uppercase tracking-wide">Escala</span>
          <span className="text-xs font-mono font-semibold text-[#f0f2f5] bg-[#111317] px-2 py-0.5 rounded border border-[#2b303d]">
            {liveSet.scale || 'C Major'}
          </span>
        </div>
      </div>

      {/* Zone 3: Actions & Shortcuts */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Releer Set Button */}
        <button
          onClick={onRefreshSet}
          disabled={isBusy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[#f0f2f5] bg-[#20242e] hover:bg-[#2b303d] border border-[#2e3442] transition-colors disabled:opacity-50"
          title="Tecla R: Lee pistas, clips y parámetros de Ableton Live"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin text-[#ff7034]' : 'text-[#8c93a0]'}`} />
          <span>Releer el set</span>
        </button>

        {/* Piano Roll & MPC Groove */}
        {onOpenPianoRoll && (
          <button
            onClick={onOpenPianoRoll}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-amber-300 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-600/40 transition-colors"
            title="Piano Roll Interactivo con MPC Swing y Humanizer"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">Piano Roll</span>
          </button>
        )}

        {/* Neo-Soul Chord Palette */}
        {onOpenChordPalette && (
          <button
            onClick={onOpenChordPalette}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-indigo-300 bg-indigo-950/30 hover:bg-indigo-900/40 border border-indigo-600/40 transition-colors"
            title="Banco Armónico Neo-Soul & Voicings Drop-2 / Rootless"
          >
            <Music className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden xl:inline">Acordes Soul</span>
          </button>
        )}

        {/* 16-Pad MPC Sample Slicer */}
        {onOpenSampleSlicer && (
          <button
            onClick={onOpenSampleSlicer}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-orange-300 bg-orange-950/30 hover:bg-orange-900/40 border border-orange-600/40 transition-colors"
            title="Sample Crate & 16-Pad MPC Slicer (ppal-library)"
          >
            <Scissors className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden xl:inline">Slicer MPC</span>
          </button>
        )}

        {/* MPC Drum Sequencer */}
        {onOpenDrumSequencer && (
          <button
            onClick={onOpenDrumSequencer}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-amber-300 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-600/40 transition-colors"
            title="Secuenciador de Baterías MPC & Ghost Notes"
          >
            <Disc3 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">Batería MPC</span>
          </button>
        )}

        {/* Crate Scenes Morphing */}
        {onOpenCrateScenes && (
          <button
            onClick={onOpenCrateScenes}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-emerald-300 bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-600/40 transition-colors"
            title="Escenas y Morfosis de The Infinite Crate (Lyria RT)"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xl:inline">Escenas Crate</span>
          </button>
        )}

        {/* VST3 Plugins */}
        <button
          onClick={onOpenVstBrowser}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#d2d6e0] bg-[#181b22] hover:bg-[#222732] border border-[#282d38] transition-colors"
          title="Tecla V: Biblioteca de 528 plugins VST3"
        >
          <Sliders className="w-3.5 h-3.5 text-[#ff7034]" />
          <span className="hidden sm:inline">Plugins VST3</span>
        </button>

        {/* Export MIDI */}
        <button
          onClick={onExportMidi}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#d2d6e0] bg-[#181b22] hover:bg-[#222732] border border-[#282d38] transition-colors"
          title="Tecla E: Exportar proyecto a archivo .mid estándar"
        >
          <Download className="w-3.5 h-3.5 text-[#7ea5e8]" />
          <span className="hidden sm:inline">Exportar MIDI</span>
        </button>

        {/* Keyboard Shortcuts */}
        <button
          onClick={onOpenShortcuts}
          className="p-1.5 rounded-md text-[#8c93a0] hover:text-white bg-[#181b22] hover:bg-[#222732] border border-[#282d38] transition-colors"
          title="Atajos de teclado configurables"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* AutoSave Indicator */}
        <div
          className="hidden md:flex items-center gap-1 text-[11px] font-mono text-[#6c7484] pl-2 border-l border-[#262a34]"
          title={`Guardado local automático: ${lastSavedTime}`}
        >
          <Save className={`w-3 h-3 ${saveStatus === 'saving' ? 'text-[#ff7034] animate-pulse' : 'text-emerald-500'}`} />
          <span>{saveStatus === 'saving' ? 'Guardando...' : lastSavedTime}</span>
        </div>
      </div>
    </header>
  );
};
