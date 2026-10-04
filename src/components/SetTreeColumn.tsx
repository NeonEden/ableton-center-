import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Layers,
  Volume2,
  Sliders,
  Trash2,
  Plus,
  ShieldCheck,
  Disc3,
  Cpu,
  Sparkles
} from 'lucide-react';
import { LiveDevice, LiveSet, LiveTrack } from '../types/ableton';

interface Props {
  liveSet: LiveSet;
  selectedTrackPath: string;
  onSelectTrack: (trackPath: string) => void;
  onUpdateDeviceParam: (devicePath: string, paramId: string, value: number) => void;
  onCreateTrack: (type: 'midi' | 'audio', name: string) => void;
  onDeleteTrack: (trackPath: string, isBridge: boolean) => void;
  onToggleTrackMute: (trackPath: string) => void;
  onToggleTrackSolo: (trackPath: string) => void;
}

export const SetTreeColumn: React.FC<Props> = ({
  liveSet,
  selectedTrackPath,
  onSelectTrack,
  onUpdateDeviceParam,
  onCreateTrack,
  onDeleteTrack,
  onToggleTrackMute,
  onToggleTrackSolo
}) => {
  const [expandedDevices, setExpandedDevices] = useState<Record<string, boolean>>({
    't1/d1': true, // Expandir The Infinite Crate por defecto
    't0/d0': true
  });
  const [showAddTrackDialog, setShowAddTrackDialog] = useState(false);
  const [newTrackName, setNewTrackName] = useState('');
  const [newTrackType, setNewTrackType] = useState<'midi' | 'audio'>('midi');

  const toggleDevice = (devPath: string) => {
    setExpandedDevices((prev) => ({
      ...prev,
      [devPath]: !prev[devPath]
    }));
  };

  const handleAddTrack = () => {
    if (!newTrackName.trim()) return;
    onCreateTrack(newTrackType, newTrackName.trim());
    setNewTrackName('');
    setShowAddTrackDialog(false);
  };

  return (
    <aside className="w-80 md:w-96 bg-[#0f1115] border-r border-[#22252e] flex flex-col h-full overflow-hidden select-none shrink-0">
      {/* Header */}
      <div className="p-3.5 border-b border-[#22252e] bg-[#12141a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#ff7034]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#e2e6ed]">
            El Set de Live ({liveSet.tracks.length} Pistas)
          </h2>
        </div>

        <button
          onClick={() => setShowAddTrackDialog(true)}
          className="p-1 text-xs text-[#8c93a0] hover:text-white bg-[#1a1d24] hover:bg-[#252934] border border-[#2b303c] rounded flex items-center gap-1 transition-colors"
          title="Crear pista en Ableton (ppal-create-track)"
        >
          <Plus className="w-3.5 h-3.5 text-[#ff7034]" />
          <span className="text-[11px]">Nueva</span>
        </button>
      </div>

      {/* Add Track Dialog */}
      {showAddTrackDialog && (
        <div className="p-3 bg-[#151821] border-b border-[#2d3240] text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#f0f2f5]">Añadir pista a Ableton</span>
            <button
              onClick={() => setShowAddTrackDialog(false)}
              className="text-[#8c93a0] hover:text-white"
            >
              ✕
            </button>
          </div>
          <input
            type="text"
            placeholder="Nombre (ej. 05 Vocal Chop)"
            value={newTrackName}
            onChange={(e) => setNewTrackName(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-[#0e1014] border border-[#2b303d] rounded text-xs text-[#f0f2f5] focus:outline-none focus:border-[#ff7034]"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 cursor-pointer text-[#a5adbb]">
                <input
                  type="radio"
                  name="trkType"
                  checked={newTrackType === 'midi'}
                  onChange={() => setNewTrackType('midi')}
                />
                MIDI
              </label>
              <label className="flex items-center gap-1 cursor-pointer text-[#a5adbb]">
                <input
                  type="radio"
                  name="trkType"
                  checked={newTrackType === 'audio'}
                  onChange={() => setNewTrackType('audio')}
                />
                Audio
              </label>
            </div>
            <button
              onClick={handleAddTrack}
              className="px-3 py-1 bg-[#ff7034] hover:bg-[#ff854f] text-white rounded font-medium"
            >
              Crear
            </button>
          </div>
        </div>
      )}

      {/* Tracks Tree Container */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {liveSet.tracks.map((track) => {
          const isSelected = selectedTrackPath === track.path;
          const isBridge = Boolean(track.isBridgeTrack || track.name.toLowerCase().includes('producer_pal'));

          return (
            <div
              key={track.path}
              className={`rounded-md border transition-all ${
                isSelected
                  ? 'bg-[#181b24] border-[#ff7034]/50 shadow-sm'
                  : 'bg-[#13151b] border-[#1f222a] hover:border-[#2b303d]'
              }`}
            >
              {/* Track Row */}
              <div
                onClick={() => onSelectTrack(track.path)}
                className="p-2 flex items-center justify-between gap-2 cursor-pointer group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* Color bar */}
                  <span
                    className="w-1.5 h-6 rounded-xs shrink-0"
                    style={{ backgroundColor: track.color || '#ff7034' }}
                  />

                  {/* Path Tag (Exacto de Ableton: t0, t1, t2...) */}
                  <span className="font-mono text-[11px] font-bold text-[#ff7034] bg-[#221812] px-1.5 py-0.5 rounded border border-[#ff7034]/30">
                    {track.path}
                  </span>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#f0f2f5] truncate">
                      {track.name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-[#7d8697]">
                      <span className="uppercase">{track.type}</span>
                      <span aria-hidden="true">·</span>
                      <span>{track.sessionClipCount} clips</span>
                      <span aria-hidden="true">·</span>
                      <span>{track.devices?.length || track.deviceCount || 0} disp.</span>
                    </div>
                  </div>
                </div>

                {/* Badges & Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {isBridge ? (
                    <span
                      title="REGLA DE ORO: Pista protegida. Contiene Producer_Pal, canal del bridge de comunicación."
                      className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/40 border border-amber-800/60 px-1.5 py-0.5 rounded"
                    >
                      <ShieldCheck className="w-3 h-3 text-amber-400" />
                      <span className="font-mono">BRIDGE</span>
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Borrar la pista [${track.path}] "${track.name}" del DAW?`)) {
                          onDeleteTrack(track.path, false);
                        }
                      }}
                      className="p-1 text-[#6c7484] hover:text-red-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title={`Borrar pista (${track.path})`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Mute toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTrackMute(track.path);
                    }}
                    className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded ${
                      track.isMuted
                        ? 'bg-amber-600 text-black'
                        : 'bg-[#1c202a] text-[#8c93a0] hover:text-white'
                    }`}
                    title="Mute pista"
                  >
                    M
                  </button>

                  {/* Solo toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTrackSolo(track.path);
                    }}
                    className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded ${
                      track.isSolo
                        ? 'bg-[#3b82f6] text-white'
                        : 'bg-[#1c202a] text-[#8c93a0] hover:text-white'
                    }`}
                    title="Solo pista"
                  >
                    S
                  </button>
                </div>
              </div>

              {/* Devices of this Track */}
              {track.devices && track.devices.length > 0 && (
                <div className="border-t border-[#1a1c24] bg-[#0c0e12]/60 px-2 py-1.5 space-y-1.5">
                  {track.devices.map((device) => {
                    const isDevExpanded = Boolean(expandedDevices[device.path]);
                    const isCrate = device.name.toLowerCase().includes('crate') || device.path === 't1/d1';

                    return (
                      <div
                        key={device.path}
                        className="bg-[#151820] border border-[#222631] rounded-sm overflow-hidden"
                      >
                        {/* Device Header */}
                        <div
                          onClick={() => toggleDevice(device.path)}
                          className="px-2 py-1 flex items-center justify-between text-xs cursor-pointer hover:bg-[#1c202a] transition-colors"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isDevExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-[#8c93a0]" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-[#8c93a0]" />
                            )}
                            <Cpu className="w-3 h-3 text-[#ff7034]" />
                            <span className="font-mono text-[10px] text-[#7d8798]">
                              {device.path}
                            </span>
                            <span className="font-medium text-[#dce1eb] truncate">
                              {device.name}
                            </span>
                          </div>

                          {isCrate && (
                            <span className="text-[9px] font-mono text-[#ff9e6a] bg-[#ff7034]/15 px-1 rounded">
                              Lyria RT
                            </span>
                          )}
                        </div>

                        {/* Device Parameters Sliders */}
                        {isDevExpanded && device.parameters && device.parameters.length > 0 && (
                          <div className="p-2 space-y-2 bg-[#0e1015] border-t border-[#1e222c]">
                            {device.parameters.map((param) => {
                              const numVal = typeof param.value === 'number' ? param.value : parseFloat(param.value) || 0;
                              const min = param.min ?? 0;
                              const max = param.max ?? (numVal > 1 ? 100 : 1);
                              const step = max <= 1 ? 0.01 : 1;

                              return (
                                <div key={param.id} className="space-y-0.5">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-[#8c94a5] font-mono">{param.name}</span>
                                    <span className="font-mono font-bold text-[#ff7034] tabular-nums">
                                      {typeof param.value === 'number'
                                        ? param.value.toFixed(max <= 1 ? 2 : 1)
                                        : param.value}{' '}
                                      <span className="text-[9px] text-[#6c7484]">{param.unit}</span>
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min={min}
                                    max={max}
                                    step={step}
                                    value={numVal}
                                    onChange={(e) =>
                                      onUpdateDeviceParam(device.path, param.id, parseFloat(e.target.value))
                                    }
                                    className="w-full h-1"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Master Track */}
        {liveSet.mainTrack && (
          <div className="mt-3 pt-2 border-t border-[#22252e]">
            <div className="p-2 bg-[#171a22] border border-[#2b303d] rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-6 rounded-xs bg-[#ff4a4a]" />
                  <span className="font-mono text-[11px] font-bold text-[#ff4a4a] bg-[#291313] px-1.5 py-0.5 rounded border border-[#ff4a4a]/30">
                    master
                  </span>
                  <span className="text-xs font-semibold text-[#f0f2f5]">
                    {liveSet.mainTrack.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#8c93a0]">
                  Ozone 12 + MetricAB
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-[#0c0e12] border-t border-[#1f222a] text-[11px] text-[#6c7484] flex items-center justify-between font-mono">
        <span>Windows 11 / x64</span>
        <span>VST3: 528 cargados</span>
      </div>
    </aside>
  );
};
