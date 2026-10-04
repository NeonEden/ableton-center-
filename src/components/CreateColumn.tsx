import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Music,
  FileText,
  SlidersHorizontal,
  Send,
  Play,
  Square,
  Wand2,
  UploadCloud,
  CheckCircle,
  Clock,
  Layers,
  Edit3
} from 'lucide-react';
import { SongSection, VisualBrief } from '../types/ableton';
import { isAudioPreviewPlaying, playBoomBapPreview, stopPreview } from '../utils/audioEngine';

interface Props {
  selectedTrackPath: string;
  visualBrief: VisualBrief;
  onUpdateBrief: (updated: Partial<VisualBrief>) => void;
  onDropImage: (file: File) => void;
  onGenerate: (type: 'lyria' | 'midi' | 'letra') => void;
  onApplyToDaw: (clipConfig: {
    trackPath: string;
    name: string;
    length: string;
    looping: boolean;
    notes?: string;
    sampleFile?: string;
    gainDb: number;
    warpMode: string;
    auto: string;
  }) => void;
  onMutateSelectedClip: (mutationParams: {
    temp: number;
    topk: number;
    density: number;
    guidance: number;
  }) => void;
  isBusy: boolean;
  generatedMidiData: {
    trackName: string;
    notesString: string;
    length: string;
    chords: string[];
  } | null;
  generatedLyrics: string | null;
}

export const CreateColumn: React.FC<Props> = ({
  selectedTrackPath,
  visualBrief,
  onUpdateBrief,
  onDropImage,
  onGenerate,
  onApplyToDaw,
  onMutateSelectedClip,
  isBusy,
  generatedMidiData,
  generatedLyrics
}) => {
  const [activeTab, setActiveTab] = useState<'brief' | 'generar' | 'mutar' | 'aplicar'>('generar');
  const [isPlayingWebAudio, setIsPlayingWebAudio] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Song sections structure
  const [sections, setSections] = useState<SongSection[]>([
    { id: 'sec_1', name: 'INTRO', bars: 4, energy: 2, description: 'Ruido de vinilo, bombo filtrado y Rhodes suave' },
    { id: 'sec_2', name: 'VERSO', bars: 16, energy: 3, description: 'Entra bajo Moog, batería boom bap con swing, caja seca' },
    { id: 'sec_3', name: 'ESTRIBILLO', bars: 8, energy: 5, description: 'Acordes abiertos, capas de cuerdas polvorientas' },
    { id: 'sec_4', name: 'PUENTE', bars: 8, energy: 3, description: 'Corte de ritmo, solo de Rhodes con tremolo' },
    { id: 'sec_5', name: 'OUTRO', bars: 4, energy: 1, description: 'Fade out con saturación de cinta y eco de cinta' }
  ]);

  // Mutation parameters
  const [mutationParams, setMutationParams] = useState({
    temp: 1.15,
    topk: 45,
    density: 0.35,
    guidance: 4.5
  });

  // DAW clip application form
  const [dawClipName, setDawClipName] = useState('05 Rhodes Chords [Cmaj9]');
  const [dawLength, setDawLength] = useState('4bar');
  const [dawLooping, setDawLooping] = useState(true);
  const [dawWarpMode, setDawWarpMode] = useState('beats');
  const [dawAutoPlay, setDawAutoPlay] = useState('play-clip');
  const [dawGainDb, setDawGainDb] = useState(-3);
  const [dawSampleFile, setDawSampleFile] = useState('C:/Ableton/Samples/Crate_Vinyl_Loop_90bpm.wav');
  const [useSampleFile, setUseSampleFile] = useState(false);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onDropImage(e.dataTransfer.files[0]);
    }
  };

  const handleSectionBarChange = (id: string, bars: number) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, bars: Math.max(1, bars) } : s))
    );
  };

  const totalBars = sections.reduce((acc, s) => acc + s.bars, 0);

  const toggleWebAudio = () => {
    if (isAudioPreviewPlaying()) {
      stopPreview();
      setIsPlayingWebAudio(false);
    } else {
      playBoomBapPreview(() => setIsPlayingWebAudio(false));
      setIsPlayingWebAudio(true);
    }
  };

  const handleApplyClick = () => {
    onApplyToDaw({
      trackPath: selectedTrackPath,
      name: dawClipName,
      length: dawLength,
      looping: dawLooping,
      notes: useSampleFile ? undefined : (generatedMidiData?.notesString || 'v100 n/4 C3 1|1\nv100 n/4 E3 1|1\nv100 n/4 G3 1|1\nv100 n/4 B3 1|1'),
      sampleFile: useSampleFile ? dawSampleFile : undefined,
      gainDb: dawGainDb,
      warpMode: dawWarpMode,
      auto: dawAutoPlay
    });
  };

  return (
    <section className="flex-1 bg-[#101217] flex flex-col h-full overflow-hidden select-none">
      {/* Top Header & Navigation Tabs */}
      <div className="p-3 border-b border-[#22252e] bg-[#13151b] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 p-1 bg-[#0b0c10] rounded-lg border border-[#1e222a]">
          <button
            onClick={() => setActiveTab('generar')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'generar'
                ? 'bg-[#ff7034] text-white shadow-xs'
                : 'text-[#8c94a5] hover:text-[#e0e4ec]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generar</span>
          </button>

          <button
            onClick={() => setActiveTab('brief')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'brief'
                ? 'bg-[#ff7034] text-white shadow-xs'
                : 'text-[#8c94a5] hover:text-[#e0e4ec]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Ref. Visual</span>
          </button>

          <button
            onClick={() => setActiveTab('mutar')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'mutar'
                ? 'bg-[#ff7034] text-white shadow-xs'
                : 'text-[#8c94a5] hover:text-[#e0e4ec]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Mutación</span>
          </button>

          <button
            onClick={() => setActiveTab('aplicar')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'aplicar'
                ? 'bg-[#ff7034] text-white shadow-xs'
                : 'text-[#8c94a5] hover:text-[#e0e4ec]'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Aplicar al DAW</span>
          </button>
        </div>

        {/* Real-time Web Audio Synthesizer Preview */}
        <button
          onClick={toggleWebAudio}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            isPlayingWebAudio
              ? 'bg-emerald-500 text-black border-emerald-400 animate-pulse'
              : 'bg-[#1b1f28] text-[#d6dae3] border-[#292f3d] hover:bg-[#232834]'
          }`}
          title="Preescucha instantánea Web Audio en C Mayor (90 BPM) con acordes Rhodes y ritmo MPC"
        >
          {isPlayingWebAudio ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isPlayingWebAudio ? 'Parar Preescucha' : 'Preescuchar Idea'}</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: GENERAR */}
        {activeTab === 'generar' && (
          <div className="space-y-4">
            {/* Generate Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => onGenerate('lyria')}
                disabled={isBusy}
                className="p-3 bg-[#181b24] hover:bg-[#202430] border border-[#2b3040] hover:border-[#ff7034]/60 rounded-lg text-left transition-all group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#f0f2f5] group-hover:text-[#ff7034] transition-colors">
                    Música (Lyria 3.5)
                  </span>
                  <Music className="w-4 h-4 text-[#ff7034]" />
                </div>
                <p className="text-[11px] text-[#7d8799] mt-1">
                  44.1 kHz estéreo continuo. Audio completo basado en el brief visual.
                </p>
              </button>

              <button
                onClick={() => onGenerate('midi')}
                disabled={isBusy}
                className="p-3 bg-[#181b24] hover:bg-[#202430] border border-[#2b3040] hover:border-[#ff7034]/60 rounded-lg text-left transition-all group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#f0f2f5] group-hover:text-[#ff7034] transition-colors">
                    MIDI (Melodía / Acordes)
                  </span>
                  <Wand2 className="w-4 h-4 text-[#7ea5e8]" />
                </div>
                <p className="text-[11px] text-[#7d8799] mt-1">
                  Progresión armónica Cmaj9, Am9 en formato bar|beat de Live.
                </p>
              </button>

              <button
                onClick={() => onGenerate('letra')}
                disabled={isBusy}
                className="p-3 bg-[#181b24] hover:bg-[#202430] border border-[#2b3040] hover:border-[#ff7034]/60 rounded-lg text-left transition-all group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#f0f2f5] group-hover:text-[#ff7034] transition-colors">
                    Letra (Rimas Boom Bap)
                  </span>
                  <FileText className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-[11px] text-[#7d8799] mt-1">
                  Métrica en español rioplatense sincronizada a 90 BPM.
                </p>
              </button>
            </div>

            {/* Song Structure Editor */}
            <div className="p-3.5 bg-[#14161d] border border-[#232732] rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#ff7034]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#e2e6ed]">
                    Estructura por Secciones
                  </h3>
                </div>
                <span className="text-xs font-mono font-semibold text-[#8c94a5]">
                  Total: <strong className="text-[#ff7034]">{totalBars} compases</strong> (~{Math.round((totalBars * 4 * 60) / 90)} s)
                </span>
              </div>

              <div className="space-y-1.5">
                {sections.map((sec) => (
                  <div
                    key={sec.id}
                    className="p-2 bg-[#0e1014] border border-[#1f222b] rounded flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-[90px]">
                      <span className="font-mono font-bold text-[#ff7034]">{sec.name}</span>
                    </div>

                    <p className="text-[11px] text-[#7d8799] flex-1 truncate">
                      {sec.description}
                    </p>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-[#6c7484]">Compases:</span>
                      <input
                        type="number"
                        min={1}
                        max={64}
                        value={sec.bars}
                        onChange={(e) => handleSectionBarChange(sec.id, parseInt(e.target.value, 10))}
                        className="w-12 bg-[#171922] border border-[#2b303d] rounded px-1.5 py-0.5 text-center font-mono font-bold text-[#f0f2f5] focus:outline-none focus:border-[#ff7034]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Generated Output Preview (MIDI chords or Lyrics) */}
            {generatedMidiData && (
              <div className="p-3.5 bg-[#14161d] border border-[#2b3040] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-[#f0f2f5]">
                      MIDI Generado: {generatedMidiData.trackName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {generatedMidiData.chords.map((ch) => (
                      <span
                        key={ch}
                        className="text-[10px] font-mono font-bold bg-[#1b202c] text-[#7ea5e8] px-2 py-0.5 rounded border border-[#2e374b]"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 bg-[#0a0c10] border border-[#1b1e27] rounded font-mono text-[11px] text-[#9ba4b4] max-h-36 overflow-y-auto leading-relaxed">
                  <pre>{generatedMidiData.notesString}</pre>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    onClick={() => setActiveTab('aplicar')}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-[#ff7034] hover:bg-[#ff854f] rounded-md transition-colors flex items-center gap-1.5"
                  >
                    <span>Llevar a Ableton Live</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {generatedLyrics && (
              <div className="p-3.5 bg-[#14161d] border border-[#2b3040] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-[#f0f2f5]">
                      Letra Generada (Rioplatense · 90 BPM)
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#0a0c10] border border-[#1b1e27] rounded text-xs text-[#cfd5e0] max-h-48 overflow-y-auto whitespace-pre-line leading-relaxed font-sans">
                  {generatedLyrics}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REFERENCIA VISUAL */}
        {activeTab === 'brief' && (
          <div className="space-y-4">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all ${
                dragOver
                  ? 'border-[#ff7034] bg-[#ff7034]/10'
                  : 'border-[#292e3b] bg-[#13151c] hover:border-[#3d4557]'
              }`}
            >
              <UploadCloud className="w-8 h-8 text-[#ff7034] mb-2" />
              <p className="text-xs font-semibold text-[#f0f2f5]">
                Arrastrá una imagen de referencia acá
              </p>
              <p className="text-[11px] text-[#7d8799] mt-0.5">
                Fotografías urbanas, vinilos, paletas oscuras u otoñales
              </p>

              <label className="mt-3 px-3 py-1.5 bg-[#1f232e] hover:bg-[#2a303f] text-xs font-medium text-[#d6dae3] rounded-md cursor-pointer border border-[#2d3444] transition-colors">
                <span>Examinar archivo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && onDropImage(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>

            {/* Visual Brief Editor */}
            <div className="p-4 bg-[#14161d] border border-[#232732] rounded-lg space-y-3">
              <div className="flex items-center justify-between border-b border-[#21242e] pb-2">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#ff7034]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#e2e6ed]">
                    Brief Musical Derivado
                  </h3>
                </div>
                <span className="text-[11px] text-[#8c94a5]">
                  Editable antes de generar
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-[#8c94a5]">Mood / Atmósfera</label>
                  <input
                    type="text"
                    value={visualBrief.mood}
                    onChange={(e) => onUpdateBrief({ mood: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-[#0e1014] border border-[#252934] rounded text-xs text-[#f0f2f5] focus:outline-none focus:border-[#ff7034]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[#8c94a5]">Textura y Espacio</label>
                  <input
                    type="text"
                    value={visualBrief.texture}
                    onChange={(e) => onUpdateBrief({ texture: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-[#0e1014] border border-[#252934] rounded text-xs text-[#f0f2f5] focus:outline-none focus:border-[#ff7034]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[#8c94a5]">Instrumentación sugerida</label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-[#0e1014] border border-[#252934] rounded min-h-12">
                  {visualBrief.instruments.map((inst, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-[#181c25] text-[#d6dae3] px-2 py-0.5 rounded border border-[#282f3e]"
                    >
                      {inst}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[#8c94a5]">Notas de producción</label>
                <textarea
                  rows={2}
                  value={visualBrief.notes}
                  onChange={(e) => onUpdateBrief({ notes: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-[#0e1014] border border-[#252934] rounded text-xs text-[#f0f2f5] focus:outline-none focus:border-[#ff7034]"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => onGenerate('midi')}
                  className="px-3 py-1.5 bg-[#ff7034] hover:bg-[#ff854f] text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generar acorde a este brief</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MUTACIÓN */}
        {activeTab === 'mutar' && (
          <div className="p-4 bg-[#14161d] border border-[#232732] rounded-lg space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#e2e6ed]">
                Controles de Mutación Creativa
              </h3>
              <p className="text-xs text-[#7d8799] mt-0.5">
                Varia el clip seleccionado en la pista <strong className="text-[#ff7034] font-mono">{selectedTrackPath}</strong> preservando el groove de 90 BPM.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Temp */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-mono text-[#8c94a5]">temp (Temperatura)</span>
                  <span className="font-mono font-bold text-[#ff7034]">{mutationParams.temp.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={2.0}
                  step={0.05}
                  value={mutationParams.temp}
                  onChange={(e) =>
                    setMutationParams((p) => ({ ...p, temp: parseFloat(e.target.value) }))
                  }
                  className="w-full"
                />
              </div>

              {/* TopK */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-mono text-[#8c94a5]">topk</span>
                  <span className="font-mono font-bold text-[#ff7034]">{mutationParams.topk}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={100}
                  step={1}
                  value={mutationParams.topk}
                  onChange={(e) =>
                    setMutationParams((p) => ({ ...p, topk: parseInt(e.target.value, 10) }))
                  }
                  className="w-full"
                />
              </div>

              {/* Density */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-mono text-[#8c94a5]">density (Densidad)</span>
                  <span className="font-mono font-bold text-[#ff7034]">{mutationParams.density.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={1.0}
                  step={0.05}
                  value={mutationParams.density}
                  onChange={(e) =>
                    setMutationParams((p) => ({ ...p, density: parseFloat(e.target.value) }))
                  }
                  className="w-full"
                />
              </div>

              {/* Guidance */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-mono text-[#8c94a5]">guidance (Guía armónica)</span>
                  <span className="font-mono font-bold text-[#ff7034]">{mutationParams.guidance.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={10.0}
                  step={0.5}
                  value={mutationParams.guidance}
                  onChange={(e) =>
                    setMutationParams((p) => ({ ...p, guidance: parseFloat(e.target.value) }))
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[#222631] flex justify-end">
              <button
                onClick={() => onMutateSelectedClip(mutationParams)}
                disabled={isBusy}
                className="px-4 py-2 bg-[#ff7034] hover:bg-[#ff854f] text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Mutar el clip seleccionado</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: APLICAR AL DAW */}
        {activeTab === 'aplicar' && (
          <div className="p-4 bg-[#14161d] border border-[#232732] rounded-lg space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#e2e6ed]">
                Inyección de Pista y Clip a Ableton Live
              </h3>
              <p className="text-xs text-[#7d8799] mt-0.5">
                Crea pista y clip en el DAW vía <code className="text-[#ff7034]">ppal-create-track</code> y <code className="text-[#ff7034]">ppal-create-clip</code>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-[#8c94a5]">Nombre del Clip</label>
                <input
                  type="text"
                  value={dawClipName}
                  onChange={(e) => setDawClipName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0e1014] border border-[#252934] rounded text-xs text-[#f0f2f5] focus:outline-none focus:border-[#ff7034]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[#8c94a5]">Duración (Compases)</label>
                <select
                  value={dawLength}
                  onChange={(e) => setDawLength(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0e1014] border border-[#252934] rounded text-xs text-[#f0f2f5] focus:outline-none focus:border-[#ff7034]"
                >
                  <option value="2bar">2 compases (2bar)</option>
                  <option value="4bar">4 compases (4bar)</option>
                  <option value="8bar">8 compases (8bar)</option>
                  <option value="16bar">16 compases (16bar)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[#8c94a5]">Modo de Warping</label>
                <select
                  value={dawWarpMode}
                  onChange={(e) => setDawWarpMode(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0e1014] border border-[#252934] rounded text-xs text-[#f0f2f5] focus:outline-none focus:border-[#ff7034]"
                >
                  <option value="beats">Beats (Transitorios nítidos)</option>
                  <option value="complex">Complex (Armónicos densos)</option>
                  <option value="texture">Texture (Ambientes)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[#8c94a5]">Ganancia Clip (dB)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={-12}
                    max={6}
                    step={0.5}
                    value={dawGainDb}
                    onChange={(e) => setDawGainDb(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="font-mono text-xs font-bold text-[#ff7034] w-12 text-right">
                    {dawGainDb > 0 ? `+${dawGainDb}` : dawGainDb} dB
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#0c0e12] border border-[#1d2028] rounded space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-[#d2d6e0]">
                  <input
                    type="checkbox"
                    checked={dawLooping}
                    onChange={(e) => setDawLooping(e.target.checked)}
                  />
                  <span>Looping activado</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[#d2d6e0]">
                  <input
                    type="checkbox"
                    checked={dawAutoPlay === 'play-clip'}
                    onChange={(e) => setDawAutoPlay(e.target.checked ? 'play-clip' : 'none')}
                  />
                  <span>Auto disparar tras crear (auto: play-clip)</span>
                </label>
              </div>

              <div className="flex items-center gap-4 text-xs pt-1 border-t border-[#1a1d24]">
                <label className="flex items-center gap-2 cursor-pointer text-[#a0a8b8]">
                  <input
                    type="radio"
                    name="srcKind"
                    checked={!useSampleFile}
                    onChange={() => setUseSampleFile(false)}
                  />
                  <span>Secuencia MIDI (notas bar|beat)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[#a0a8b8]">
                  <input
                    type="radio"
                    name="srcKind"
                    checked={useSampleFile}
                    onChange={() => setUseSampleFile(true)}
                  />
                  <span>Audio SampleFile (ruta absoluta .wav)</span>
                </label>
              </div>

              {useSampleFile && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={dawSampleFile}
                    onChange={(e) => setDawSampleFile(e.target.value)}
                    placeholder="C:/ruta/absoluta.wav"
                    className="w-full px-2.5 py-1 bg-[#15171e] border border-[#2b303d] rounded text-xs font-mono text-[#f0f2f5]"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleApplyClick}
                disabled={isBusy}
                className="px-5 py-2.5 bg-[#ff7034] hover:bg-[#ff854f] text-white text-xs font-bold uppercase tracking-wider rounded-md transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>Aplicar al DAW</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
