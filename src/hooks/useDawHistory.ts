import { useState, useRef, useCallback } from 'react';
import {
  DawHistorySnapshot,
  InfiniteCrateState,
  LiveSet,
  SyncDawAction
} from '../types/ableton';
import { abletonClient } from '../services/abletonApi';

const MAX_HISTORY_STEPS = 50;

function deepClone<T>(obj: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

interface UseDawHistoryProps {
  initialLiveSet: LiveSet;
  initialCrateState: InfiniteCrateState;
  onStateRestored: (liveSet: LiveSet, crateState: InfiniteCrateState) => void;
  onLogBitacora?: (action: string, evidence: string, isError: boolean) => void;
}

export function useDawHistory({
  initialLiveSet,
  initialCrateState,
  onStateRestored,
  onLogBitacora
}: UseDawHistoryProps) {
  // Current active snapshot
  const [currentSnapshot, setCurrentSnapshot] = useState<DawHistorySnapshot>({
    id: 'snap_init',
    timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    description: 'Estado inicial del proyecto (C Mayor, 90 BPM)',
    liveSet: deepClone(initialLiveSet),
    crateState: deepClone(initialCrateState)
  });

  const [undoStack, setUndoStack] = useState<DawHistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<DawHistorySnapshot[]>([]);

  // Ref to hold latest state to avoid stale closure during rapid fader changes
  const currentSnapshotRef = useRef<DawHistorySnapshot>(currentSnapshot);
  currentSnapshotRef.current = currentSnapshot;

  const undoStackRef = useRef<DawHistorySnapshot[]>(undoStack);
  undoStackRef.current = undoStack;

  const redoStackRef = useRef<DawHistorySnapshot[]>(redoStack);
  redoStackRef.current = redoStack;

  /**
   * Envia las diferencias al DAW para asegurar que Ableton Live refleje exactamente
   * el estado al que volvimos con undo/redo.
   */
  const syncRestoredStateToDaw = async (
    target: DawHistorySnapshot,
    source: DawHistorySnapshot,
    actionType: 'undo' | 'redo'
  ) => {
    try {
      // 1. Tempo change sync
      if (target.liveSet.tempo !== source.liveSet.tempo) {
        await abletonClient.callTool('ppal-update-live-set', {
          tempo: target.liveSet.tempo
        });
      }

      // 2. Sync Device Parameters
      for (const track of target.liveSet.tracks) {
        const sourceTrack = source.liveSet.tracks.find((t) => t.path === track.path);
        if (!track.devices || !sourceTrack?.devices) continue;

        for (const dev of track.devices) {
          const sourceDev = sourceTrack.devices.find((d) => d.path === dev.path);
          if (!sourceDev) continue;

          const changedParams: { id: string; value: number }[] = [];
          for (const param of dev.parameters) {
            const sourceParam = sourceDev.parameters.find((p) => p.id === param.id);
            if (sourceParam && sourceParam.value !== param.value) {
              const numVal = typeof param.value === 'number' ? param.value : parseFloat(param.value as string);
              if (!isNaN(numVal)) {
                changedParams.push({ id: param.id, value: numVal });
              }
            }
          }

          if (changedParams.length > 0) {
            await abletonClient.callTool('ppal-update-device', {
              path: dev.path,
              params: changedParams
            });
          }
        }
      }

      // 3. Sync The Infinite Crate parameters if changed
      const crateTarget = target.crateState;
      const crateSource = source.crateState;
      const crateChangedParams: { id: string; value: number }[] = [];

      if (crateTarget.bright !== crateSource.bright) {
        crateChangedParams.push({ id: 'bright', value: crateTarget.bright });
      }
      if (crateTarget.density !== crateSource.density) {
        crateChangedParams.push({ id: 'density', value: crateTarget.density });
      }
      if (crateTarget.guidance !== crateSource.guidance) {
        crateChangedParams.push({ id: 'guidance', value: crateTarget.guidance });
      }
      if (crateTarget.temp !== crateSource.temp) {
        crateChangedParams.push({ id: 'temp', value: crateTarget.temp });
      }
      if (crateTarget.topk !== crateSource.topk) {
        crateChangedParams.push({ id: 'topk', value: crateTarget.topk });
      }
      if (crateTarget.muteBass !== crateSource.muteBass) {
        crateChangedParams.push({ id: 'mute_bass', value: crateTarget.muteBass ? 1 : 0 });
      }
      if (crateTarget.muteDrums !== crateSource.muteDrums) {
        crateChangedParams.push({ id: 'mute_drums', value: crateTarget.muteDrums ? 1 : 0 });
      }
      if (crateTarget.muteOther !== crateSource.muteOther) {
        crateChangedParams.push({ id: 'mute_other', value: crateTarget.muteOther ? 1 : 0 });
      }
      if (crateTarget.keyNumber !== crateSource.keyNumber) {
        crateChangedParams.push({ id: 'key_num', value: crateTarget.keyNumber });
      }

      for (const slot of crateTarget.slots) {
        const sourceSlot = crateSource.slots.find((s) => s.id === slot.id);
        if (sourceSlot && sourceSlot.weight !== slot.weight) {
          crateChangedParams.push({ id: `prompt #${slot.id}`, value: slot.weight });
        }
      }

      if (crateChangedParams.length > 0) {
        await abletonClient.callTool('ppal-update-device', {
          path: crateTarget.devicePath,
          params: crateChangedParams
        });
      }

      if (onLogBitacora) {
        const label = actionType === 'undo' ? 'Deshacer (Undo)' : 'Rehacer (Redo)';
        onLogBitacora(
          `ppal-undo-sync [${actionType}]`,
          `${label}: "${target.description}" sincronizado en Ableton Live`,
          false
        );
      }
    } catch (err: any) {
      console.warn('Error sincronizando undo/redo con DAW:', err);
    }
  };

  /**
   * Registra una nueva acción en el historial.
   * Guarda el estado previo en el undoStack y limpia el redoStack.
   */
  const recordSnapshot = useCallback(
    (
      description: string,
      nextLiveSet: LiveSet,
      nextCrateState: InfiniteCrateState,
      syncAction?: SyncDawAction
    ) => {
      const prev = currentSnapshotRef.current;
      const newSnapshot: DawHistorySnapshot = {
        id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        description,
        liveSet: deepClone(nextLiveSet),
        crateState: deepClone(nextCrateState),
        syncAction
      };

      // Push current to undoStack, limiting length
      setUndoStack((stack) => {
        const updated = [...stack, prev];
        if (updated.length > MAX_HISTORY_STEPS) {
          return updated.slice(updated.length - MAX_HISTORY_STEPS);
        }
        return updated;
      });

      // Clear redoStack on any new divergent action
      setRedoStack([]);

      // Set new current
      setCurrentSnapshot(newSnapshot);
    },
    []
  );

  /**
   * Operación UNDO: Revertir al estado anterior
   */
  const undo = useCallback(async () => {
    const stack = undoStackRef.current;
    if (stack.length === 0) return;

    const previousSnapshot = stack[stack.length - 1];
    const current = currentSnapshotRef.current;
    const remainingUndo = stack.slice(0, stack.length - 1);

    // Update state
    setUndoStack(remainingUndo);
    setRedoStack((rStack) => [...rStack, current]);
    setCurrentSnapshot(previousSnapshot);

    // Notify caller to update main state
    onStateRestored(previousSnapshot.liveSet, previousSnapshot.crateState);

    // Synchronize differences to DAW
    await syncRestoredStateToDaw(previousSnapshot, current, 'undo');
  }, [onStateRestored]);

  /**
   * Operación REDO: Reaplicar la acción deshecha
   */
  const redo = useCallback(async () => {
    const rStack = redoStackRef.current;
    if (rStack.length === 0) return;

    const nextSnapshot = rStack[rStack.length - 1];
    const current = currentSnapshotRef.current;
    const remainingRedo = rStack.slice(0, rStack.length - 1);

    // Update state
    setRedoStack(remainingRedo);
    setUndoStack((uStack) => [...uStack, current]);
    setCurrentSnapshot(nextSnapshot);

    // Notify caller to update main state
    onStateRestored(nextSnapshot.liveSet, nextSnapshot.crateState);

    // Synchronize differences to DAW
    await syncRestoredStateToDaw(nextSnapshot, current, 'redo');
  }, [onStateRestored]);

  /**
   * Salto directo a un paso del historial
   */
  const jumpToHistoryIndex = useCallback(
    async (targetIndex: number) => {
      // Timeline consists of: undoStack elements (0 .. undoStack.length - 1),
      // currentSnapshot (undoStack.length),
      // redoStack elements reversed (undoStack.length + 1 .. total - 1)
      const current = currentSnapshotRef.current;
      const undoList = undoStackRef.current;
      const redoList = redoStackRef.current;

      const fullTimeline = [
        ...undoList,
        current,
        ...[...redoList].reverse()
      ];

      if (targetIndex < 0 || targetIndex >= fullTimeline.length) return;
      if (targetIndex === undoList.length) return; // already at current

      const targetSnapshot = fullTimeline[targetIndex];
      const newUndo = fullTimeline.slice(0, targetIndex);
      const newRedo = fullTimeline.slice(targetIndex + 1).reverse();

      setUndoStack(newUndo);
      setRedoStack(newRedo);
      setCurrentSnapshot(targetSnapshot);

      onStateRestored(targetSnapshot.liveSet, targetSnapshot.crateState);
      await syncRestoredStateToDaw(targetSnapshot, current, targetIndex < undoList.length ? 'undo' : 'redo');
    },
    [onStateRestored]
  );

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  const undoDescription = canUndo ? undoStack[undoStack.length - 1].description : '';
  const redoDescription = canRedo ? redoStack[redoStack.length - 1].description : '';

  // Consolidated timeline for visual drawer/modal
  const timeline = [
    ...undoStack.map((s, idx) => ({
      index: idx,
      snapshot: s,
      status: 'past' as const
    })),
    {
      index: undoStack.length,
      snapshot: currentSnapshot,
      status: 'current' as const
    },
    ...[...redoStack].reverse().map((s, idx) => ({
      index: undoStack.length + 1 + idx,
      snapshot: s,
      status: 'future' as const
    }))
  ];

  return {
    canUndo,
    canRedo,
    undoDescription,
    redoDescription,
    currentSnapshot,
    undoCount: undoStack.length,
    redoCount: redoStack.length,
    timeline,
    recordSnapshot,
    undo,
    redo,
    jumpToHistoryIndex
  };
}
