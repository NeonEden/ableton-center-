import React from 'react';
import { Undo2, Redo2, Clock, CheckCircle2, History, X, ArrowDown } from 'lucide-react';
import { DawHistorySnapshot } from '../types/ableton';

interface HistoryItem {
  index: number;
  snapshot: DawHistorySnapshot;
  status: 'past' | 'current' | 'future';
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  timeline: HistoryItem[];
  canUndo: boolean;
  canRedo: boolean;
  undoDescription: string;
  redoDescription: string;
  onUndo: () => void;
  onRedo: () => void;
  onJumpToIndex: (index: number) => void;
}

export const HistoryTimelineModal: React.FC<Props> = ({
  isOpen,
  onClose,
  timeline,
  canUndo,
  canRedo,
  undoDescription,
  redoDescription,
  onUndo,
  onRedo,
  onJumpToIndex
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-[#14161c] border border-[#252830] rounded-xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#252830] bg-[#101217]">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-[#ff7034]" />
            <div>
              <h2 className="text-base font-semibold text-[#f0f2f5] tracking-tight">
                Historial de Acciones y Estados DAW (Undo / Redo)
              </h2>
              <p className="text-xs text-[#8c93a0]">
                Stack de estados previos de Ableton Live. Hacé clic en cualquier estado para restaurarlo.
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

        {/* Toolbar: Undo & Redo quick action buttons */}
        <div className="p-3 bg-[#111319] border-b border-[#232731] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors bg-[#1c202a] hover:bg-[#252a36] text-[#e0e4ed] border border-[#2d3340] disabled:opacity-40 disabled:hover:bg-[#1c202a] cursor-pointer"
              title="Atajo: Ctrl + Z"
            >
              <Undo2 className="w-4 h-4 text-[#ff7034]" />
              <span>Deshacer</span>
              <kbd className="text-[10px] font-mono text-[#7d8799] bg-[#0f1116] px-1.5 py-0.5 rounded border border-[#252934]">Ctrl+Z</kbd>
            </button>

            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors bg-[#1c202a] hover:bg-[#252a36] text-[#e0e4ed] border border-[#2d3340] disabled:opacity-40 disabled:hover:bg-[#1c202a] cursor-pointer"
              title="Atajo: Ctrl + Y o Ctrl + Shift + Z"
            >
              <Redo2 className="w-4 h-4 text-[#7ea5e8]" />
              <span>Rehacer</span>
              <kbd className="text-[10px] font-mono text-[#7d8799] bg-[#0f1116] px-1.5 py-0.5 rounded border border-[#252934]">Ctrl+Y</kbd>
            </button>
          </div>

          <div className="text-[11px] font-mono text-[#8c93a0] hidden sm:block">
            {timeline.length} estados guardados en memoria
          </div>
        </div>

        {/* Timeline Stack List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {timeline.map((item) => {
            const isCurrent = item.status === 'current';
            const isPast = item.status === 'past';
            const isFuture = item.status === 'future';

            return (
              <div
                key={item.snapshot.id}
                onClick={() => onJumpToIndex(item.index)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isCurrent
                    ? 'bg-[#1e2330] border-[#ff7034] shadow-md ring-1 ring-[#ff7034]/30'
                    : isPast
                    ? 'bg-[#13151c] border-[#222631] hover:border-[#333a4c]'
                    : 'bg-[#101217]/60 border-[#1a1d26] opacity-60 hover:opacity-100 hover:border-[#2b303d]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Status Indicator Icon */}
                  <div className="shrink-0">
                    {isCurrent ? (
                      <span className="w-6 h-6 rounded-full bg-[#ff7034] text-black flex items-center justify-center font-bold text-xs">
                        ●
                      </span>
                    ) : isPast ? (
                      <span className="w-6 h-6 rounded-full bg-[#1e222c] text-[#7d8799] flex items-center justify-center font-mono text-xs">
                        {item.index + 1}
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-[#181a22] text-[#555d6e] flex items-center justify-center font-mono text-xs border border-dashed border-[#2f3545]">
                        {item.index + 1}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-xs font-semibold truncate ${isCurrent ? 'text-[#ff7034]' : 'text-[#f0f2f5]'}`}>
                        {item.snapshot.description}
                      </p>
                      {isCurrent && (
                        <span className="text-[10px] font-mono text-white bg-[#ff7034] px-1.5 py-0.2 rounded font-bold uppercase">
                          Actual
                        </span>
                      )}
                      {isFuture && (
                        <span className="text-[10px] font-mono text-[#7ea5e8] bg-[#1a2030] px-1.5 py-0.2 rounded">
                          rehacer disponible
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#7d8799] mt-0.5">
                      <Clock className="w-3 h-3 text-[#646e80]" />
                      <span className="font-mono">{item.snapshot.timestamp}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.snapshot.liveSet.tracks.length} pistas</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{item.snapshot.liveSet.tempo} BPM</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  {isCurrent ? (
                    <span className="text-[11px] font-mono text-[#ff7034] font-semibold">Estado activo</span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onJumpToIndex(item.index);
                      }}
                      className="text-xs px-2.5 py-1 rounded bg-[#1e2330] hover:bg-[#ff7034] hover:text-white text-[#d6dae3] transition-colors"
                    >
                      Restaurar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#252830] bg-[#101217] flex items-center justify-between text-xs text-[#8c93a0]">
          <span>
            {canUndo
              ? `Próximo Undo: ${undoDescription}`
              : 'Inicio de la sesión alcanzado'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-[#d2d6e0] bg-[#1f222a] hover:bg-[#2b303c] rounded-md transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
