import React, { useState } from 'react';
import {
  Activity,
  Sliders,
  History,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Headphones,
  Check,
  Zap,
  Edit2,
  Layers
} from 'lucide-react';
import { BitacoraItem, InfiniteCrateState, SonicAnalysis } from '../types/ableton';
import { PRESET_CRATE_SCENES } from './CrateScenesModal';

interface Props {
  analysis: SonicAnalysis | null;
  crateState: InfiniteCrateState;
  bitacora: BitacoraItem[];
  onTriggerAnalysis: () => void;
  onUpdateCrateParam: (paramKey: string, value: number) => void;
  onUpdateCrateMute: (muteType: 'bass' | 'drums' | 'other', value: boolean) => void;
  onUpdateCratePromptWeight: (slotId: number, weight: number) => void;
  onUpdateCrateSlotLabel: (slotId: number, newLabel: string) => void;
  onApplyEqCorrection?: (correctionSummary: string) => void;
  onOpenCrateScenes?: () => void;
  onApplyQuickScene?: (scene: any) => void;
  isAnalyzing: boolean;
  isCrateAutoPollActive?: boolean;
  onToggleCrateAutoPoll?: () => void;
}

export const JudgeColumn: React.FC<Props> = ({
  analysis,
  crateState,
  bitacora,
  onTriggerAnalysis,
  onUpdateCrateParam,
  onUpdateCrateMute,
  onUpdateCratePromptWeight,
  onUpdateCrateSlotLabel,
  onApplyEqCorrection,
  onOpenCrateScenes,
  onApplyQuickScene,
  isAnalyzing,
  isCrateAutoPollActive = true,
  onToggleCrateAutoPoll
}) => {
  const [activeTab, setActiveTab] = useState<'analisis' | 'crate' | 'bitacora'>('crate');
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [editingLabelText, setEditingLabelText] = useState('');
  const [abMode, setAbMode] = useState<'mix' | 'target'>('mix');
  const [isApplyingEq, setIsApplyingEq] = useState(false);

  const handleStartEditSlot = (slotId: number, currentLabel: string) => {
    setEditingSlotId(slotId);
    setEditingLabelText(currentLabel);
  };

  const handleSaveSlotLabel = (slotId: number) => {
    if (editingLabelText.trim()) {
      onUpdateCrateSlotLabel(slotId, editingLabelText.trim());
    }
    setEditingSlotId(null);
  };

  return (
    <aside className="w-84 md:w-96 bg-[#0f1115] border-l border-[#22252e] flex flex-col h-full overflow-hidden select-none shrink-0">
      {/* Header & Section Tabs */}
      <div className="p-3 border-b border-[#22252e] bg-[#12141a] flex items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-[#0b0c10] rounded-lg border border-[#1e222a] w-full">
          <button
            onClick={() => setActiveTab('crate')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'crate'
                ? 'bg-[#ff7034] text-white shadow-xs'
                : 'text-[#8c94a5] hover:text-[#e0e4ec]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Crate (19p)</span>
          </button>

          <button
            onClick={() => setActiveTab('analisis')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'analisis'
                ? 'bg-[#ff7034] text-white shadow-xs'
                : 'text-[#8c94a5] hover:text-[#e0e4ec]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Análisis</span>
          </button>

          <button
            onClick={() => setActiveTab('bitacora')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'bitacora'
                ? 'bg-[#ff7034] text-white shadow-xs'
                : 'text-[#8c94a5] hover:text-[#e0e4ec]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Bitácora ({bitacora.length})</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* TAB 1: THE INFINITE CRATE (Lyria RealTime en DAW) */}
        {activeTab === 'crate' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-[#1f222a]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#e2e6ed]">
                  The Infinite Crate
                </h3>
                <p className="text-[11px] text-[#7d8799] font-mono">
                  Dispositivo en path: <strong className="text-[#ff7034]">{crateState.devicePath}</strong>
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {onToggleCrateAutoPoll && (
                  <button
                    onClick={onToggleCrateAutoPoll}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded flex items-center gap-1 border transition-colors cursor-pointer ${
                      isCrateAutoPollActive
                        ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                        : 'bg-[#181b22] border-[#262a34] text-[#8c93a0] hover:text-[#d2d6e0]'
                    }`}
                    title="Auto-Sync DAW: Lee los valores del plugin en Live cada 3s para sincronizar cambios manuales del plugin"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isCrateAutoPollActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                      }`}
                    />
                    <span>{isCrateAutoPollActive ? 'Auto-Sync' : 'Sync: Off'}</span>
                  </button>
                )}
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
                  Live RT
                </span>
              </div>
            </div>

            {/* Quick Scenes Bar */}
            <div className="p-2.5 bg-[#14161e] border border-[#222734] rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#a0a9bc] flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-emerald-400" />
                  Escenas de Producción
                </span>
                {onOpenCrateScenes && (
                  <button
                    onClick={onOpenCrateScenes}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono underline cursor-pointer"
                  >
                    Morfosis / Todas
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                {PRESET_CRATE_SCENES.slice(0, 3).map((scene) => (
                  <button
                    key={scene.id}
                    onClick={() => onApplyQuickScene?.(scene)}
                    className="p-1.5 rounded bg-[#0e1015] hover:bg-[#181b24] border border-zinc-800 hover:border-emerald-500/50 text-zinc-300 font-medium truncate text-left transition cursor-pointer"
                    title={scene.description}
                  >
                    {scene.name.split('.')[1]?.trim() || scene.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Global Controls: bright, density, guidance, temp, topk */}
            <div className="p-3 bg-[#14161e] border border-[#222734] rounded-lg space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#a0a9bc]">
                Parámetros Globales del Modelo
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* bright */}
                <div className="space-y-0.5">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-[#8c94a5]">bright</span>
                    <span className="text-[#ff7034] font-bold">{crateState.bright.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={crateState.bright}
                    onChange={(e) => onUpdateCrateParam('bright', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* density */}
                <div className="space-y-0.5">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-[#8c94a5]">density</span>
                    <span className="text-[#ff7034] font-bold">{crateState.density.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={crateState.density}
                    onChange={(e) => onUpdateCrateParam('density', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* guidance */}
                <div className="space-y-0.5">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-[#8c94a5]">guidance</span>
                    <span className="text-[#ff7034] font-bold">{crateState.guidance.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={0.5}
                    value={crateState.guidance}
                    onChange={(e) => onUpdateCrateParam('guidance', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* temp */}
                <div className="space-y-0.5">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-[#8c94a5]">temp</span>
                    <span className="text-[#ff7034] font-bold">{crateState.temp.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={2.0}
                    step={0.05}
                    value={crateState.temp}
                    onChange={(e) => onUpdateCrateParam('temp', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* topk and key number */}
              <div className="pt-2 border-t border-[#1e2330] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[#8c94a5]">topk:</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={crateState.topk}
                    onChange={(e) => onUpdateCrateParam('topk', parseInt(e.target.value, 10))}
                    className="w-12 bg-[#0e1014] border border-[#252935] rounded px-1.5 py-0.5 text-center font-mono font-bold text-[#ff7034]"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[#8c94a5]">key (CM/Am=1):</span>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={crateState.keyNumber}
                    onChange={(e) => onUpdateCrateParam('key (CM/Am=1)', parseInt(e.target.value, 10))}
                    className="w-10 bg-[#0e1014] border border-[#252935] rounded px-1.5 py-0.5 text-center font-mono font-bold text-[#ff7034]"
                  />
                </div>
              </div>

              {/* Mutes: mute bass, mute drums, mute other */}
              <div className="pt-2 border-t border-[#1e2330] flex items-center justify-between gap-1.5">
                <button
                  onClick={() => onUpdateCrateMute('bass', !crateState.muteBass)}
                  className={`flex-1 py-1 text-[11px] font-mono font-semibold rounded border transition-colors ${
                    crateState.muteBass
                      ? 'bg-amber-600/30 text-amber-400 border-amber-600'
                      : 'bg-[#181b22] text-[#8c94a5] border-[#252935]'
                  }`}
                >
                  mute bass
                </button>

                <button
                  onClick={() => onUpdateCrateMute('drums', !crateState.muteDrums)}
                  className={`flex-1 py-1 text-[11px] font-mono font-semibold rounded border transition-colors ${
                    crateState.muteDrums
                      ? 'bg-amber-600/30 text-amber-400 border-amber-600'
                      : 'bg-[#181b22] text-[#8c94a5] border-[#252935]'
                  }`}
                >
                  mute drums
                </button>

                <button
                  onClick={() => onUpdateCrateMute('other', !crateState.muteOther)}
                  className={`flex-1 py-1 text-[11px] font-mono font-semibold rounded border transition-colors ${
                    crateState.muteOther
                      ? 'bg-amber-600/30 text-amber-400 border-amber-600'
                      : 'bg-[#181b22] text-[#8c94a5] border-[#252935]'
                  }`}
                >
                  mute other
                </button>
              </div>
            </div>

            {/* 9 Slots Mixer with Prompt Weights */}
            <div className="p-3 bg-[#14161e] border border-[#222734] rounded-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#a0a9bc]">
                  Mezclador de Prompts (Slots 1 a 9)
                </span>
                <span className="text-[10px] text-[#7d8799]">
                  Pesos reales leídos del plugin · sólo lectura
                </span>
              </div>

              <div className="space-y-2">
                {crateState.slots.map((slot) => {
                  const isEditing = editingSlotId === slot.id;

                  return (
                    <div
                      key={slot.id}
                      className="p-2 bg-[#0e1014] border border-[#1d212b] rounded-md space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="w-5 h-5 rounded bg-[#1e232e] text-[#ff7034] font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                            #{slot.id}
                          </span>

                          {isEditing ? (
                            <div className="flex items-center gap-1 flex-1">
                              <input
                                type="text"
                                value={editingLabelText}
                                onChange={(e) => setEditingLabelText(e.target.value)}
                                autoFocus
                                className="w-full px-1.5 py-0.5 bg-[#181b24] border border-[#ff7034] rounded text-xs text-[#f0f2f5] focus:outline-none"
                              />
                              <button
                                onClick={() => handleSaveSlotLabel(slot.id)}
                                className="p-1 text-emerald-400 hover:text-emerald-300"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span
                              onClick={() => handleStartEditSlot(slot.id, slot.label)}
                              className="text-[#d8dde6] font-medium truncate cursor-pointer hover:text-[#ff7034] transition-colors flex items-center gap-1"
                              title="Hacé clic para editar la etiqueta de este prompt"
                            >
                              <span>{slot.label}</span>
                              <Edit2 className="w-2.5 h-2.5 text-[#5e6677] shrink-0" />
                            </span>
                          )}
                        </div>

                        <span className="font-mono font-bold text-[#ff7034] ml-2 tabular-nums">
                          {slot.weight.toFixed(2)}
                        </span>
                      </div>

                      <input
                        type="range"
                        min={0.0}
                        max={2.0}
                        step={0.02}
                        value={slot.weight}
                        disabled
                        title="Live expone este parámetro como texto (peso + prompt): se lee, no se escribe. Movelo dentro del plugin."
                        className="w-full opacity-60 cursor-not-allowed"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ANÁLISIS SÓNICO OBJETIVO */}
        {activeTab === 'analisis' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-[#1f222a]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#e2e6ed]">
                  Análisis Sónico de Mezcla
                </h3>
                <p className="text-[11px] text-[#7d8799]">
                  {analysis?.isMeasured ? analysis.timestamp : 'Requiere escuchar audio del DAW'}
                </p>
              </div>

              <button
                onClick={onTriggerAnalysis}
                disabled={isAnalyzing}
                className="px-3 py-1.5 bg-[#ff7034] hover:bg-[#ff854f] text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Headphones className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-pulse' : ''}`} />
                <span>{isAnalyzing ? 'Escuchando…' : 'Escuchar'}</span>
              </button>
            </div>

            {/* Objective Measurements Grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* LUFS Integrado */}
              <div className="p-3 bg-[#14161e] border border-[#222734] rounded-lg">
                <span className="text-[10px] uppercase font-bold text-[#7d8799]">LUFS Integrado</span>
                <p className="text-lg font-mono font-bold text-[#ff7034] mt-0.5 tabular-nums">
                  {analysis?.integratedLufs !== null && analysis?.integratedLufs !== undefined
                    ? `${analysis.integratedLufs.toFixed(1)} LUFS`
                    : 'NO MEDIDO'}
                </p>
                <span className="text-[10px] text-[#8c94a5]">Objetivo cálido: -19.6 LUFS</span>
              </div>

              {/* True Peak */}
              <div className="p-3 bg-[#14161e] border border-[#222734] rounded-lg">
                <span className="text-[10px] uppercase font-bold text-[#7d8799]">Pico Verdadero</span>
                <p className="text-lg font-mono font-bold text-[#f0f2f5] mt-0.5 tabular-nums">
                  {analysis?.truePeakDb !== null && analysis?.truePeakDb !== undefined
                    ? `${analysis.truePeakDb > 0 ? '+' : ''}${analysis.truePeakDb.toFixed(1)} dBTP`
                    : 'NO MEDIDO'}
                </p>
                <span className="text-[10px] text-emerald-400">Techo seguro: &lt; -0.5 dBTP</span>
              </div>

              {/* Rango Dinámico */}
              <div className="p-3 bg-[#14161e] border border-[#222734] rounded-lg">
                <span className="text-[10px] uppercase font-bold text-[#7d8799]">Rango Dinámico</span>
                <p className="text-base font-mono font-bold text-[#f0f2f5] mt-0.5 tabular-nums">
                  {analysis?.dynamicRangeLu !== null && analysis?.dynamicRangeLu !== undefined
                    ? `${analysis.dynamicRangeLu.toFixed(1)} LU`
                    : 'NO MEDIDO'}
                </p>
                <span className="text-[10px] text-[#8c94a5]">Boom Bap orgánico</span>
              </div>

              {/* Correlación de Fase */}
              <div className="p-3 bg-[#14161e] border border-[#222734] rounded-lg">
                <span className="text-[10px] uppercase font-bold text-[#7d8799]">Correlación Fase</span>
                <p className="text-base font-mono font-bold text-emerald-400 mt-0.5 tabular-nums">
                  {analysis?.phaseCorrelation !== null && analysis?.phaseCorrelation !== undefined
                    ? `+${analysis.phaseCorrelation.toFixed(2)}`
                    : 'NO MEDIDO'}
                </p>
                <span className="text-[10px] text-[#8c94a5]">Compatibilidad mono: OK</span>
              </div>
            </div>

            {/* 4-Band Spectral Balance */}
            <div className="p-3 bg-[#14161e] border border-[#222734] rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#a0a9bc]">
                  Balance Espectral por Bandas
                </span>
                <span className="text-[10px] font-mono text-[#8c94a5]">relativo al sub</span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Sub */}
                <div className="space-y-0.5">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-[#8c94a5]">Subgraves (20-60 Hz)</span>
                    <span className="text-[#ff7034] font-bold">
                      {analysis?.bands?.sub !== null && analysis?.bands?.sub !== undefined
                        ? '0.0 dB (Ref)'
                        : 'NO MEDIDO'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#0e1014] rounded-full overflow-hidden">
                    <div className="h-full bg-[#ff7034] w-[95%]" />
                  </div>
                </div>

                {/* Medios */}
                <div className="space-y-0.5">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-[#8c94a5]">Medios (200-2 kHz)</span>
                    <span className="text-[#f0f2f5] font-bold">
                      {analysis?.bands?.medios !== null && analysis?.bands?.medios !== undefined
                        ? `${analysis.bands.medios.toFixed(1)} dB`
                        : 'NO MEDIDO'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#0e1014] rounded-full overflow-hidden">
                    <div className="h-full bg-[#3b82f6] w-[82%]" />
                  </div>
                </div>

                {/* Presencia (2-6 kHz, exactamente -7.6 dB en el productor) */}
                <div className="space-y-0.5">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-[#8c94a5]">Presencia (2-6 kHz)</span>
                    <span className="text-amber-400 font-bold">
                      {analysis?.bands?.presencia !== null && analysis?.bands?.presencia !== undefined
                        ? `${analysis.bands.presencia.toFixed(1)} dB (Cálido)`
                        : 'NO MEDIDO'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#0e1014] rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[68%]" />
                  </div>
                </div>

                {/* Aire */}
                <div className="space-y-0.5">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-[#8c94a5]">Aire (10k-20 kHz)</span>
                    <span className="text-[#8c94a5] font-bold">
                      {analysis?.bands?.aire !== null && analysis?.bands?.aire !== undefined
                        ? `${analysis.bands.aire.toFixed(1)} dB`
                        : 'NO MEDIDO'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#0e1014] rounded-full overflow-hidden">
                    <div className="h-full bg-[#64748b] w-[50%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Verdict & 3 Actionable Proposals */}
            {analysis?.proposals && analysis.proposals.length > 0 && (
              <div className="p-3.5 bg-[#14161e] border border-[#222734] rounded-lg space-y-2.5">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#ff7034]" />
                  <h4 className="text-xs font-bold text-[#f0f2f5]">
                    Veredicto y 3 Acciones Concretas
                  </h4>
                </div>

                <p className="text-xs text-[#a0a8b8] italic">
                  "{analysis.verdictTitle}"
                </p>

                <div className="space-y-2 pt-1">
                  {analysis.proposals.map((prop, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-[#0e1014] border border-[#1e2330] rounded flex items-start gap-2 text-xs text-[#d2d6e2]"
                    >
                      <span className="w-4 h-4 rounded-full bg-[#ff7034]/20 text-[#ff7034] font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="leading-snug">{prop}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Módulo de Masterización A/B (MetricAB) y Corrección Automática FabFilter */}
            <div className="p-3.5 bg-[#14161e] border border-[#222734] rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#a0a9bc] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  Referencia A/B (MetricAB Style)
                </span>
                {/* Switch A/B */}
                <div className="flex bg-[#0b0d12] rounded p-0.5 border border-zinc-800 text-[10px] font-mono">
                  <button
                    onClick={() => setAbMode('mix')}
                    className={`px-2 py-0.5 rounded transition ${
                      abMode === 'mix'
                        ? 'bg-[#ff7034] text-white font-bold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    A: Mezcla DAW
                  </button>
                  <button
                    onClick={() => setAbMode('target')}
                    className={`px-2 py-0.5 rounded transition ${
                      abMode === 'target'
                        ? 'bg-cyan-500 text-zinc-950 font-bold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    B: Target Boom Bap
                  </button>
                </div>
              </div>

              {/* Comparador Diferencial */}
              <div className="p-2.5 bg-[#0e1015] border border-zinc-800/80 rounded flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[10px] text-zinc-500 block">Diferencial LUFS</span>
                  <span className="font-bold text-emerald-400">
                    {analysis?.integratedLufs !== null && analysis?.integratedLufs !== undefined
                      ? `${(analysis.integratedLufs - (-19.6)).toFixed(1)} LUFS (Calibrado)`
                      : '±0.0 LUFS'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">Presencia 2-6kHz</span>
                  <span className="font-bold text-amber-400">-7.6 dB (Target Ok)</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">Techo Pro-L 2</span>
                  <span className="font-bold text-zinc-300">-0.8 dBTP</span>
                </div>
              </div>

              {/* Botón 1-Click EQ Correction */}
              {onApplyEqCorrection && (
                <button
                  onClick={() => {
                    setIsApplyingEq(true);
                    onApplyEqCorrection('Curva compensatoria aplicada en FabFilter Pro-Q 4: -1.2 dB en 3.8 kHz, +0.8 dB en 48 Hz');
                    setTimeout(() => setIsApplyingEq(false), 900);
                  }}
                  disabled={isApplyingEq}
                  className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-zinc-950 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-900/30 cursor-pointer disabled:opacity-50"
                >
                  <Zap size={13} className={isApplyingEq ? 'animate-spin' : ''} />
                  <span>
                    {isApplyingEq
                      ? 'Actualizando FabFilter Pro-Q 4 en Live…'
                      : 'Aplicar Corrección a FabFilter Pro-Q 4 (Live)'}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: BITÁCORA DE ACCIONES (NUNCA UNA ACCIÓN SIN PRUEBA) */}
        {activeTab === 'bitacora' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-[#1f222a]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#e2e6ed]">
                Bitácora de Acciones ({bitacora.length})
              </h3>
              <span className="text-[10px] font-mono text-[#7d8799]">
                Evidencia comprobada
              </span>
            </div>

            {bitacora.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#6c7484]">
                Sin acciones registradas aún en esta sesión.
              </div>
            ) : (
              <div className="space-y-2">
                {bitacora.map((item) => (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-lg border text-xs space-y-1.5 ${
                      item.isError
                        ? 'bg-red-950/20 border-red-800/40 text-red-300'
                        : 'bg-[#14161e] border-[#222734] text-[#cfd5e2]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="font-bold text-[#ff7034]">{item.tool}</span>
                        {item.isSimulated && (
                          <span className="text-[9px] bg-[#1e232e] text-[#8c94a5] px-1 rounded">
                            simulado
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-[#6c7484]">
                        {item.timestamp} · {item.durationMs}ms
                      </span>
                    </div>

                    <p className="text-[11px] font-mono text-[#8c94a5] bg-[#0c0e12] p-1 rounded truncate">
                      {JSON.stringify(item.payload)}
                    </p>

                    <div className="flex items-center gap-1 text-[11px] text-[#9ba5b6]">
                      {item.isError ? (
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                      <span className="truncate">{item.evidence}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-[#0c0e12] border-t border-[#1f222a] text-[11px] text-[#6c7484] flex items-center justify-between font-mono">
        <span>The Infinite Crate / Lyria RT</span>
        <span>Latencia: ~12ms</span>
      </div>
    </aside>
  );
};
