import React, { useState } from 'react';
import { Keyboard, X, RotateCcw, Check } from 'lucide-react';
import { ShortcutConfig } from '../types/ableton';

export const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
  { id: 'sc_play', label: 'Reproducir / Detener sesión', key: 'Space', actionName: 'playback-toggle' },
  { id: 'sc_undo', label: 'Deshacer acción en DAW (Undo)', key: 'z', actionName: 'undo' },
  { id: 'sc_redo', label: 'Rehacer acción en DAW (Redo)', key: 'y', actionName: 'redo' },
  { id: 'sc_history', label: 'Abrir historial de estados (Timeline)', key: 'h', actionName: 'open-history' },
  { id: 'sc_refresh', label: 'Releer el set de Ableton', key: 'r', actionName: 'refresh-set' },
  { id: 'sc_generate', label: 'Disparar generación (Lyria / MIDI)', key: 'g', actionName: 'generate' },
  { id: 'sc_analyze', label: 'Escuchar y medir mezcla (LUFS)', key: 'a', actionName: 'analyze' },
  { id: 'sc_mutate', label: 'Mutar clip seleccionado', key: 'm', actionName: 'mutate-clip' },
  { id: 'sc_vst', label: 'Abrir biblioteca VST3 (528 plugins)', key: 'v', actionName: 'open-vst' },
  { id: 'sc_export_midi', label: 'Exportar proyecto a MIDI estándar', key: 'e', actionName: 'export-midi' }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ShortcutConfig[];
  onUpdateShortcuts: (updated: ShortcutConfig[]) => void;
}

export const ShortcutsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  shortcuts,
  onUpdateShortcuts
}) => {
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    let keyName = e.key;
    if (keyName === ' ') keyName = 'Space';
    else if (keyName.length === 1) keyName = keyName.toLowerCase();

    const updated = shortcuts.map((sc) =>
      sc.id === id ? { ...sc, key: keyName } : sc
    );
    onUpdateShortcuts(updated);
    setActiveRecordingId(null);
  };

  const handleResetDefaults = () => {
    onUpdateShortcuts(DEFAULT_SHORTCUTS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl bg-[#14161c] border border-[#252830] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#252830] bg-[#101217]">
          <div className="flex items-center gap-3">
            <Keyboard className="w-5 h-5 text-[#ff7034]" />
            <div>
              <h2 className="text-base font-semibold text-[#f0f2f5] tracking-tight">
                Atajos de Teclado del Estudio
              </h2>
              <p className="text-xs text-[#8c93a0]">
                Optimizá tu flujo de trabajo en vivo. Hacé clic en una tecla para reasignarla.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8c93a0] hover:text-white rounded-lg hover:bg-[#1f222a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of shortcuts */}
        <div className="p-5 space-y-2.5 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((sc) => (
            <div
              key={sc.id}
              className="flex items-center justify-between p-2.5 bg-[#181b22] border border-[#262a34] rounded-lg"
            >
              <span className="text-xs text-[#d2d6e0] font-medium">{sc.label}</span>

              {activeRecordingId === sc.id ? (
                <div
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, sc.id)}
                  autoFocus
                  className="px-3 py-1 bg-[#ff7034]/20 border border-[#ff7034] text-[#ff7034] text-xs font-mono rounded cursor-pointer animate-pulse"
                >
                  Presioná una tecla...
                </div>
              ) : (
                <button
                  onClick={() => setActiveRecordingId(sc.id)}
                  className="px-3 py-1 bg-[#1f222a] hover:bg-[#282d38] border border-[#303644] text-[#f0f2f5] text-xs font-mono rounded transition-colors"
                  title="Hacé clic para cambiar esta tecla"
                >
                  {sc.key.toUpperCase()}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#252830] bg-[#101217] flex items-center justify-between text-xs">
          <button
            onClick={handleResetDefaults}
            className="text-[#8c93a0] hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer predeterminados</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-medium text-white bg-[#ff7034] hover:bg-[#ff854f] rounded-md transition-colors flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Listo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
