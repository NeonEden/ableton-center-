import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Disc3,
  Play,
  Square,
  Layers,
  Scissors,
  Send,
  Sparkles,
  Volume2,
  FolderOpen,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { abletonClient } from '../services/abletonApi';
import { playMpcChop } from '../utils/audioEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetTrackPath: string;
  onApplySampleClip: (clipData: {
    trackPath: string;
    name: string;
    length: string;
    sampleFile: string;
    gainDb: number;
    warpMode: string;
    auto: string;
  }) => void;
}

export interface SampleLibraryItem {
  name: string;
  path: string;
  kind: 'audio' | 'preset' | 'live-clip';
  bpm?: number;
  duration?: string;
  category: string;
}

const DEFAULT_SAMPLE_ITEMS: SampleLibraryItem[] = [
  {
    name: 'Crate_Vinyl_Break_90bpm.wav',
    path: 'C:/Ableton/User Library/Samples/Breaks/Crate_Vinyl_Break_90bpm.wav',
    kind: 'audio',
    bpm: 90,
    duration: '5.3s',
    category: 'Breaks / Acústico'
  },
  {
    name: 'Rhodes_SoulChords_Cmaj9_Tape.wav',
    path: 'C:/Ableton/User Library/Samples/Soul/Rhodes_SoulChords_Cmaj9_Tape.wav',
    kind: 'audio',
    bpm: 90,
    duration: '10.6s',
    category: 'Teclados / Rhodes'
  },
  {
    name: 'Acoustic_Kick_Thump_Warm_24bit.wav',
    path: 'C:/Ableton/User Library/Samples/Drums/Acoustic_Kick_Thump_Warm_24bit.wav',
    kind: 'audio',
    bpm: 90,
    duration: '0.8s',
    category: 'One-Shot / Bombo'
  },
  {
    name: 'Snare_Rimshot_MPC60_Dirty.wav',
    path: 'C:/Ableton/User Library/Samples/Drums/Snare_Rimshot_MPC60_Dirty.wav',
    kind: 'audio',
    bpm: 90,
    duration: '0.6s',
    category: 'One-Shot / Caja'
  },
  {
    name: 'Moog_Sub_Bass_C1_Dist.wav',
    path: 'C:/Ableton/User Library/Samples/Bass/Moog_Sub_Bass_C1_Dist.wav',
    kind: 'audio',
    bpm: 90,
    duration: '2.4s',
    category: 'Bajo / Analógico'
  },
  {
    name: 'Vocal_Chop_Soul_Falsetto_Cmaj.wav',
    path: 'C:/Ableton/User Library/Samples/Vocals/Vocal_Chop_Soul_Falsetto_Cmaj.wav',
    kind: 'audio',
    bpm: 90,
    duration: '3.1s',
    category: 'Voces / Soul'
  }
];

const PAD_LABELS = [
  'Pad 1: Sub Kick', 'Pad 2: Punch Kick', 'Pad 3: Low Tom', 'Pad 4: 808 Thump',
  'Pad 5: Snare 1', 'Pad 6: Rimshot', 'Pad 7: Clap Soul', 'Pad 8: Hi-Hat Closed',
  'Pad 9: Chop Cmaj9', 'Pad 10: Chop Am9', 'Pad 11: Chop Dm9', 'Pad 12: Chop G13',
  'Pad 13: Vocal Stab', 'Pad 14: Vinyl Noise', 'Pad 15: Bell Echo', 'Pad 16: Crash Fade'
];

export const SampleSlicerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  targetTrackPath,
  onApplySampleClip
}) => {
  const [searchQuery, setSearchQuery] = useState('break*90bpm');
  const [searchResults, setSearchResults] = useState<SampleLibraryItem[]>(DEFAULT_SAMPLE_ITEMS);
  const [selectedSample, setSelectedSample] = useState<SampleLibraryItem>(DEFAULT_SAMPLE_ITEMS[0]);
  const [isSearching, setIsSearching] = useState(false);
  const [activePad, setActivePad] = useState<number | null>(null);
  const [sliceCount, setSliceCount] = useState<number>(16);
  const [gainDb, setGainDb] = useState<number>(-3);
  const [warpMode, setWarpMode] = useState<string>('beats');

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

  // Búsqueda real o simulada con `ppal-library`
  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const res = await abletonClient.callTool('ppal-library', {
        action: 'search',
        kind: 'audio',
        query: searchQuery,
        limit: 10,
        verifyPaths: true
      });

      if (!res.isError && res.result && Array.isArray(res.result.items)) {
        setSearchResults(res.result.items);
      } else {
        // Filtrar locales
        const filtered = DEFAULT_SAMPLE_ITEMS.filter((item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase().replace('*', '')) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase().replace('*', ''))
        );
        setSearchResults(filtered.length > 0 ? filtered : DEFAULT_SAMPLE_ITEMS);
      }
    } catch {
      // Fallback
    } finally {
      setIsSearching(false);
    }
  };

  // Disparar pad MPC con Web Audio
  const handleTriggerPad = (padIdx: number) => {
    setActivePad(padIdx);
    playMpcChop(padIdx);
    setTimeout(() => {
      setActivePad((curr) => (curr === padIdx ? null : curr));
    }, 200);
  };

  // Inyectar a Live
  const handleInjectClip = () => {
    onApplySampleClip({
      trackPath: targetTrackPath || 't0',
      name: `${selectedSample.name.replace('.wav', '')} [Chop MPC]`,
      length: '4bar',
      sampleFile: selectedSample.path,
      gainDb,
      warpMode,
      auto: 'play-clip'
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
              <Scissors size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-zinc-100 flex items-center gap-2">
                Sample Crate & 16-Pad MPC Slicer
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-950/60 border border-orange-500/30 text-orange-300">
                  PPAL-LIBRARY + SLICER
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Buscador de librería local de Ableton Live y rebanado en 16 cortes interactivos estilo Akai MPC
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

        {/* Content Body: 2 Columns (Buscador izquierda + Pads Slicer derecha) */}
        <div className="flex-1 overflow-hidden grid grid-cols-12 divide-x divide-[#202430]">
          {/* Columna Izquierda: Buscador de Librería ppal-library */}
          <div className="col-span-5 p-4 flex flex-col gap-3 overflow-hidden bg-[#101217]">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="kick*acoustic, break, rhodes…"
                  className="w-full bg-[#161820] border border-zinc-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 focus:border-orange-500 outline-none font-mono"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold text-xs transition flex items-center gap-1"
              >
                {isSearching ? '…' : 'Buscar'}
              </button>
            </div>

            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              Muestras encontradas en Live ({searchResults.length}):
            </span>

            {/* Lista de resultados */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
              {searchResults.map((item, idx) => {
                const isSelected = selectedSample.path === item.path;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedSample(item)}
                    className={`p-3 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-orange-950/30 border-orange-500/60 shadow-md shadow-orange-950/20'
                        : 'bg-[#151720] border-[#202430] hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-zinc-200 truncate flex items-center gap-1.5">
                          {item.name}
                          {isSelected && <CheckCircle2 size={12} className="text-orange-400 shrink-0" />}
                        </h4>
                        <p className="text-[10px] font-mono text-zinc-500 truncate mt-0.5">{item.path}</p>
                      </div>
                      {item.bpm && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0">
                          {item.bpm} BPM
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/40 text-[10px] text-zinc-400">
                      <span>{item.category}</span>
                      <span className="font-mono text-zinc-500">{item.duration}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Columna Derecha: Waveform & 16-Pad Akai MPC Matrix */}
          <div className="col-span-7 p-5 flex flex-col gap-4 overflow-y-auto bg-[#13151c]">
            {/* Waveform Mock con 16 Rebanadas Marcadas */}
            <div className="p-3.5 rounded-lg bg-[#0c0d12] border border-[#232734] flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-semibold truncate max-w-sm flex items-center gap-1.5">
                  <Disc3 size={13} className="text-orange-400" />
                  {selectedSample.name}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">16 Chops equidistantes</span>
              </div>

              {/* Waveform Canvas interactivo */}
              <div className="h-16 w-full bg-[#141720] rounded border border-zinc-800 relative overflow-hidden flex items-center">
                {/* Visualizador de barras de onda */}
                <div className="absolute inset-0 flex items-center justify-between px-1 opacity-70">
                  {Array.from({ length: 48 }).map((_, bIdx) => {
                    const h = Math.sin(bIdx * 0.3) * 24 + Math.random() * 20 + 8;
                    return (
                      <div
                        key={bIdx}
                        className="w-1 bg-orange-500/80 rounded-full"
                        style={{ height: `${h}px` }}
                      />
                    );
                  })}
                </div>

                {/* 16 Líneas de corte vertical */}
                {Array.from({ length: 16 }).map((_, cIdx) => (
                  <div
                    key={cIdx}
                    className={`absolute top-0 bottom-0 border-r ${
                      activePad === cIdx ? 'border-orange-400 bg-orange-500/20 z-10' : 'border-zinc-700/60'
                    }`}
                    style={{ left: `${(cIdx / 16) * 100}%`, width: `${(1 / 16) * 100}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Matriz 4x4 de Pads Akai MPC */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-300">
                  Matriz de 16 Pads MPC (Toca o haz clic):
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Audio en tiempo real</span>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                {Array.from({ length: 16 }).map((_, padIdx) => {
                  const isActive = activePad === padIdx;
                  return (
                    <button
                      key={padIdx}
                      onClick={() => handleTriggerPad(padIdx)}
                      className={`h-20 rounded-lg border font-mono text-left p-2.5 flex flex-col justify-between transition-all select-none ${
                        isActive
                          ? 'bg-orange-500 text-zinc-950 border-orange-300 shadow-lg shadow-orange-500/50 scale-[0.98]'
                          : 'bg-[#181a24] hover:bg-[#202330] border-[#292d3c] text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-[11px] font-bold ${isActive ? 'text-zinc-950' : 'text-orange-400'}`}>
                          #{padIdx + 1}
                        </span>
                        <Volume2 size={11} className={isActive ? 'text-zinc-950' : 'text-zinc-600'} />
                      </div>
                      <span className={`text-[9px] line-clamp-1 ${isActive ? 'text-zinc-900 font-bold' : 'text-zinc-400'}`}>
                        {PAD_LABELS[padIdx]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Opciones de Importación hacia Ableton Live */}
            <div className="p-3 rounded-lg bg-[#151720] border border-[#232734] flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Ganancia:</span>
                  <input
                    type="number"
                    value={gainDb}
                    onChange={(e) => setGainDb(parseFloat(e.target.value))}
                    className="w-14 bg-[#0e1015] border border-zinc-700 rounded px-1.5 py-0.5 text-zinc-200 font-mono"
                  />
                  <span className="text-zinc-500">dB</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Warp:</span>
                  <select
                    value={warpMode}
                    onChange={(e) => setWarpMode(e.target.value)}
                    className="bg-[#0e1015] border border-zinc-700 rounded px-2 py-0.5 text-zinc-200 font-mono"
                  >
                    <option value="beats">beats (transitorios)</option>
                    <option value="complex">complex</option>
                    <option value="texture">texture</option>
                  </select>
                </div>
              </div>

              <span className="text-[11px] text-zinc-500">
                Destino: Pista <strong className="text-zinc-200">[{targetTrackPath}]</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#141720] border-t border-[#262a36] flex items-center justify-between">
          <div className="text-xs text-zinc-400">
            Ruta verificada de sample: <span className="font-mono text-zinc-300">{selectedSample.path}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition"
            >
              Cerrar
            </button>
            <button
              onClick={handleInjectClip}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-zinc-950 text-xs font-bold transition shadow-lg shadow-orange-500/20"
            >
              <Send size={13} />
              Inyectar Clip con Sample a Ableton Live (ppal-create-clip)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
