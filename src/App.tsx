/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { TopBar } from './components/TopBar';
import { SetTreeColumn } from './components/SetTreeColumn';
import { CreateColumn } from './components/CreateColumn';
import { JudgeColumn } from './components/JudgeColumn';
import { VstBrowserModal } from './components/VstBrowserModal';
import { ShortcutsModal, DEFAULT_SHORTCUTS } from './components/ShortcutsModal';
import { HistoryTimelineModal } from './components/HistoryTimelineModal';
import { PianoRollModal } from './components/PianoRollModal';
import { ChordPaletteModal } from './components/ChordPaletteModal';
import { SampleSlicerModal } from './components/SampleSlicerModal';
import { DrumSequencerModal } from './components/DrumSequencerModal';
import { CrateScenesModal, CrateScene } from './components/CrateScenesModal';
import {
  BitacoraItem,
  InfiniteCrateState,
  LiveDevice,
  LiveSet,
  ShortcutConfig,
  SongSection,
  SonicAnalysis,
  VariationPreset,
  VisualBrief,
  VstPlugin
} from './types/ableton';
import {
  abletonClient,
  INITIAL_CRATE_STATE,
  INITIAL_SIMULATED_SET,
  INITIAL_SONIC_ANALYSIS
} from './services/abletonApi';
import {
  postCreativoAnalizar,
  postCreativoDirigir,
  postCreativoGenerar
} from './services/creativeApi';
import { useAutoSave } from './hooks/useAutoSave';
import { useDawHistory } from './hooks/useDawHistory';
import { downloadMidiFile, generateStandardMidiFile } from './utils/midiExport';

export default function App() {
  // 1. LiveSet State
  const [liveSet, setLiveSet] = useState<LiveSet>(INITIAL_SIMULATED_SET);
  const [selectedTrackPath, setSelectedTrackPath] = useState<string>('t1');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSimulated, setIsSimulated] = useState<boolean>(true);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [busyMessage, setBusyMessage] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // 2. Infinite Crate State
  const [crateState, setCrateState] = useState<InfiniteCrateState>(INITIAL_CRATE_STATE);

  // 3. Sonic Analysis
  const [analysis, setAnalysis] = useState<SonicAnalysis | null>(INITIAL_SONIC_ANALYSIS);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // 4. Bitacora / Audit Log
  const [bitacora, setBitacora] = useState<BitacoraItem[]>([
    {
      id: 'bit_init',
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      tool: 'ppal-read-live-set',
      payload: { include: ['tracks'] },
      response: { tracksCount: 4, tempo: 90, scale: 'C Major' },
      isError: false,
      isSimulated: true,
      evidence: 'Sesión inicial cargada (4 pistas, C Mayor, 90 BPM)',
      durationMs: 14
    }
  ]);

  // 5. Visual Brief & Generation Outputs
  const [visualBrief, setVisualBrief] = useState<VisualBrief>({
    mood: 'Melancólico, otoñal, introspectivo y elegante',
    bpm: 90,
    scale: 'C Major',
    instruments: ['Fender Rhodes Mark I', 'Akai MPC60 Break', 'Moog Sub Phatty', 'Warm Vinyl Tape Hiss'],
    texture: 'Calidez analógica, transitorios suaves, saturación de cinta Studer A800',
    notes: 'Priorizar acordes con novenas y séptimas mayores (Cmaj9, Am9), bajo con swing del 54%.'
  });

  const [generatedMidiData, setGeneratedMidiData] = useState<{
    trackName: string;
    notesString: string;
    length: string;
    chords: string[];
  } | null>({
    trackName: '05 Rhodes Harmony [AI Gen]',
    notesString: [
      '// Compás 1: Cmaj9',
      'v98 n/2 C3 1|1',
      'v92 n/2 E3 1|1',
      'v95 n/2 G3 1|1',
      'v88 n/2 B3 1|1',
      'v94 n/2 D4 1|1',
      '// Compás 2: Am9',
      'v94 n/2 A2 2|1',
      'v90 n/2 C3 2|1',
      'v92 n/2 E3 2|1',
      'v89 n/2 G3 2|1',
      'v93 n/2 B3 2|1'
    ].join('\n'),
    length: '4bar',
    chords: ['Cmaj9', 'Am9', 'Dm9', 'G13']
  });

  const [generatedLyrics, setGeneratedLyrics] = useState<string | null>(null);

  // 6. Modals & Extended Feature States
  const [isVstModalOpen, setIsVstModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPianoRollModalOpen, setIsPianoRollModalOpen] = useState(false);
  const [isChordPaletteModalOpen, setIsChordPaletteModalOpen] = useState(false);
  const [isSampleSlicerModalOpen, setIsSampleSlicerModalOpen] = useState(false);
  const [isDrumSequencerOpen, setIsDrumSequencerOpen] = useState(false);
  const [isCrateScenesOpen, setIsCrateScenesOpen] = useState(false);
  const [isMorphingCrate, setIsMorphingCrate] = useState(false);
  const [morphProgress, setMorphProgress] = useState(0);
  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>(DEFAULT_SHORTCUTS);
  const [isAutoFocusEnabled, setIsAutoFocusEnabled] = useState<boolean>(true);
  const [isCrateAutoPollActive, setIsCrateAutoPollActive] = useState<boolean>(true);

  // 7. DAW Undo / Redo History Hook
  const {
    canUndo,
    canRedo,
    undoDescription,
    redoDescription,
    undoCount,
    timeline,
    recordSnapshot,
    undo,
    redo,
    jumpToHistoryIndex
  } = useDawHistory({
    initialLiveSet: INITIAL_SIMULATED_SET,
    initialCrateState: INITIAL_CRATE_STATE,
    onStateRestored: (restoredLiveSet, restoredCrateState) => {
      setLiveSet(restoredLiveSet);
      setCrateState(restoredCrateState);
    },
    onLogBitacora: (action, evidence, isError) => {
      setBitacora((prev) => [
        {
          id: `bit_hist_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          tool: action,
          payload: { action: 'undo-redo-sync' },
          response: { status: 'reverted-in-live' },
          isError,
          isSimulated: isSimulated,
          evidence,
          durationMs: 16
        },
        ...prev
      ]);
    }
  });

  // 8. Auto-Save Setup
  const persistableState = {
    liveSet,
    crateState,
    visualBrief,
    shortcuts,
    generatedMidiData
  };

  const { saveStatus, lastSavedTime } = useAutoSave(persistableState, (loadedData: any) => {
    if (loadedData.liveSet) setLiveSet(loadedData.liveSet);
    if (loadedData.crateState) setCrateState(loadedData.crateState);
    if (loadedData.visualBrief) setVisualBrief(loadedData.visualBrief);
    if (loadedData.shortcuts) setShortcuts(loadedData.shortcuts);
    if (loadedData.generatedMidiData) setGeneratedMidiData(loadedData.generatedMidiData);
  });

  // Attach Bitacora listener
  useEffect(() => {
    abletonClient.setBitacoraListener((item) => {
      setBitacora((prev) => [item, ...prev].slice(0, 50));
    });
  }, []);

  // Initial connection check
  useEffect(() => {
    const probe = async () => {
      const ok = await abletonClient.checkConnection();
      setIsConnected(ok);
      setIsSimulated(!ok);
      if (ok) {
        // Resolver los dos dispositivos especiales (canal y Crate) leyendo el set real:
        // sus paths cambian si el usuario mueve las pistas.
        const { cratePath } = await abletonClient.resolveSpecialDevices();
        if (cratePath) {
          setCrateState((prev) => ({ ...prev, devicePath: cratePath as string }));
          // Traer los valores REALES del plugin (pesos y textos), no los de ejemplo
          const real = await abletonClient.readCrateState(cratePath as string);
          if (real) setCrateState((prev) => ({ ...prev, ...real, devicePath: cratePath as string }));
        }
        handleRefreshSet();
        setIsConnected(true);
        setIsSimulated(false);
      }
    };
    probe();
  }, []);

  // Background Crate Auto-Polling Effect (cada 3 segundos sincroniza potes movidos dentro de Live)
  useEffect(() => {
    if (!isConnected || isSimulated || !isCrateAutoPollActive) return;

    const interval = setInterval(async () => {
      if (isBusy || !crateState.devicePath) return;
      try {
        const real = await abletonClient.readCrateState(crateState.devicePath);
        if (real) {
          setCrateState((prev) => {
            const changed =
              (real.bright !== undefined && Math.abs(real.bright - prev.bright) > 0.01) ||
              (real.density !== undefined && Math.abs(real.density - prev.density) > 0.01) ||
              (real.guidance !== undefined && Math.abs(real.guidance - prev.guidance) > 0.1) ||
              (real.temp !== undefined && Math.abs(real.temp - prev.temp) > 0.01) ||
              (real.topk !== undefined && real.topk !== prev.topk) ||
              (real.muteBass !== undefined && real.muteBass !== prev.muteBass) ||
              (real.muteDrums !== undefined && real.muteDrums !== prev.muteDrums) ||
              (real.muteOther !== undefined && real.muteOther !== prev.muteOther) ||
              (real.keyNumber !== undefined && real.keyNumber !== prev.keyNumber);

            if (changed) {
              return { ...prev, ...real, devicePath: prev.devicePath };
            }
            return prev;
          });
        }
      } catch {
        // Silencioso en background
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isConnected, isSimulated, isCrateAutoPollActive, isBusy, crateState.devicePath]);

  // Action: Select Track with Auto-Focus DAW (ppal-select)
  const handleSelectTrack = async (path: string) => {
    setSelectedTrackPath(path);
    if (isAutoFocusEnabled && isConnected && !isSimulated) {
      await abletonClient.callTool('ppal-select', { path });
    }
  };

  // Action: Select Device with Auto-Focus DAW (ppal-select)
  const handleSelectDevice = async (devicePath: string) => {
    if (isAutoFocusEnabled && isConnected && !isSimulated) {
      await abletonClient.callTool('ppal-select', { path: devicePath });
    }
  };

  // Action: Refresh Live Set (ppal-read-live-set)
  const handleRefreshSet = async () => {
    setIsBusy(true);
    setBusyMessage('Releyendo el set de Ableton Live… (puede tardar 20-60 s en dispositivo frío)');

    try {
      const res = await abletonClient.callTool('ppal-read-live-set', {
        include: ['tracks']
      });

      if (!res.isError && res.result) {
        const fetchedSet = res.result as LiveSet;
        if (fetchedSet.tracks) {
          // read-live-set sólo trae el CONTEO de dispositivos: hay que pedirlos por pista.
          // Sin esto la columna izquierda muestra "1 disp." donde hay 6 y ningún control funciona.
          const conDispositivos = await Promise.all(
            fetchedSet.tracks.map(async (t) => {
              if (!t.deviceCount) return t;
              try {
                const dt = await abletonClient.callTool('ppal-read-track', {
                  path: t.path,
                  include: ['devices'],
                  maxDepth: 3
                });
                return { ...t, devices: (dt.result?.devices ?? []) as LiveDevice[] };
              } catch {
                return t;
              }
            })
          );
          const completo: LiveSet = { ...fetchedSet, tracks: conDispositivos };
          setLiveSet(completo);
          recordSnapshot('Sincronización completa con Ableton Live (Set releído)', completo, crateState);
        }
      }
    } catch (err: any) {
      console.warn('Error al leer set:', err);
    } finally {
      setIsBusy(false);
      setBusyMessage('');
      setIsConnected(!abletonClient.getIsSimulated());
      setIsSimulated(abletonClient.getIsSimulated());
    }
  };

  // Action: Toggle Playback (ppal-playback)
  const handleTogglePlayback = async () => {
    const nextAction = isPlaying ? 'stop' : 'play-session-clips';
    const payload = isPlaying
      ? { action: 'stop' }
      : { action: 'play-session-clips', path: 't0/s0,t1/s0,t2/s0' };

    setIsPlaying(!isPlaying);

    await abletonClient.callTool('ppal-playback', payload);
  };

  // Action: Update Device Parameter (ppal-update-device)
  const handleUpdateDeviceParam = async (devicePath: string, paramId: string, value: number) => {
    let paramName = paramId;
    let devName = devicePath;

    // Optimistic UI update and state snapshot
    setLiveSet((prev) => {
      const updatedTracks = prev.tracks.map((t) => {
        if (!t.devices) return t;
        const updatedDevs = t.devices.map((d) => {
          if (d.path !== devicePath) return d;
          devName = d.name;
          const updatedParams = d.parameters.map((p) => {
            if (p.id === paramId) {
              paramName = p.name;
              return { ...p, value };
            }
            return p;
          });
          return { ...d, parameters: updatedParams };
        });
        return { ...t, devices: updatedDevs };
      });
      const nextSet = { ...prev, tracks: updatedTracks };

      // Record in Undo/Redo history
      recordSnapshot(
        `Parámetro: ${paramName} en ${devName} (${devicePath}) = ${value}`,
        nextSet,
        crateState,
        {
          type: 'device-param',
          devicePath,
          paramId,
          newValue: value,
          description: `Cambio en ${paramName}`
        }
      );

      return nextSet;
    });

    await abletonClient.callTool('ppal-update-device', {
      path: devicePath,
      params: [{ id: paramId, value }]
    });
  };

  // Action: Update Live Set Tempo
  const handleUpdateTempo = async (bpm: number) => {
    const validBpm = Math.max(20, Math.min(300, bpm));
    const nextSet = { ...liveSet, tempo: validBpm };
    setLiveSet(nextSet);

    recordSnapshot(`Tempo ajustado a ${validBpm} BPM`, nextSet, crateState, {
      type: 'tempo',
      newValue: validBpm,
      description: `Tempo: ${validBpm} BPM`
    });

    await abletonClient.callTool('ppal-update-live-set', { tempo: validBpm });
  };

  // Action: Update Infinite Crate Global Parameter
  const handleUpdateCrateParam = async (paramKey: string, value: number) => {
    const nextCrate = { ...crateState, [paramKey]: value };
    setCrateState(nextCrate);

    recordSnapshot(`Crate: ${paramKey} = ${value}`, liveSet, nextCrate, {
      type: 'crate-param',
      paramId: paramKey,
      newValue: value,
      description: `Crate ${paramKey} modificado`
    });

    await abletonClient.callTool('ppal-update-device', {
      path: crateState.devicePath,
      params: [{ id: paramKey, value }]
    });
  };

  // Action: Update Infinite Crate Mute
  const handleUpdateCrateMute = async (muteType: 'bass' | 'drums' | 'other', value: boolean) => {
    const key = muteType === 'bass' ? 'muteBass' : muteType === 'drums' ? 'muteDrums' : 'muteOther';
    // Los parámetros reales del Crate en Live se llaman 'mute bass', 'mute drums', 'mute other'
    const paramId = `mute ${muteType}`;

    const nextCrate = { ...crateState, [key]: value };
    setCrateState(nextCrate);

    recordSnapshot(`Crate: mute ${muteType} = ${value ? 'ON' : 'OFF'}`, liveSet, nextCrate, {
      type: 'crate-mute',
      paramId,
      newValue: value,
      description: `Crate mute ${muteType}`
    });

    await abletonClient.callTool('ppal-update-device', {
      path: crateState.devicePath,
      params: [{ id: paramId, value: value ? 1 : 0 }]
    });
  };

  // Action: Update Infinite Crate Prompt Weight
  const handleUpdateCratePromptWeight = async (slotId: number, weight: number) => {
    const slot = crateState.slots.find((s) => s.id === slotId);
    const label = slot?.label || `Prompt #${slotId}`;

    const nextCrate = {
      ...crateState,
      slots: crateState.slots.map((s) => (s.id === slotId ? { ...s, weight } : s))
    };
    setCrateState(nextCrate);

    recordSnapshot(`Crate Slot #${slotId} ("${label}") = ${weight.toFixed(2)}`, liveSet, nextCrate, {
      type: 'crate-slot',
      paramId: `prompt #${slotId}`,
      newValue: weight,
      description: `Peso Slot #${slotId}`
    });

    // NO se escribe en el DAW: Live expone estos slots como parámetro de etiqueta (min == max),
    // la escritura se ignora y la bitácora registraría un éxito falso. Se cambia dentro del plugin.
    setBitacora((prev) => [
      {
        id: `bit_slot_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        tool: 'ppal-update-device',
        payload: { path: crateState.devicePath, params: [{ id: `prompt #${slotId}`, value: weight }] },
        response: { aplicado: false, motivo: 'parámetro de sólo lectura en Live (min == max)' },
        isError: false,
        isSimulated: isSimulated,
        evidence: `Slot #${slotId} ("${label}") = ${weight.toFixed(2)} — anotado localmente; se mueve dentro del plugin`,
        durationMs: 0
      },
      ...prev
    ]);
  };

  const handleUpdateCrateSlotLabel = (slotId: number, newLabel: string) => {
    const nextCrate = {
      ...crateState,
      slots: crateState.slots.map((s) => (s.id === slotId ? { ...s, label: newLabel } : s))
    };
    setCrateState(nextCrate);

    recordSnapshot(`Crate Slot #${slotId} renombrado a "${newLabel}"`, liveSet, nextCrate);
  };

  // Action: Create Track in Ableton (ppal-create-track)
  const handleCreateTrack = async (type: 'midi' | 'audio', name: string) => {
    setIsBusy(true);
    setBusyMessage(`Creando pista '${name}' en Ableton Live…`);

    const res = await abletonClient.callTool('ppal-create-track', {
      count: 1,
      type,
      name,
      color: type === 'midi' ? '#ff7034' : '#3b82f6'
    });

    if (!res.isError) {
      const nextPath = res.result?.path || `t${liveSet.tracks.length}`;
      const newTrack = {
        path: nextPath,
        id: `trk_${Date.now()}`,
        name,
        type,
        sessionClipCount: 0,
        deviceCount: 0,
        color: type === 'midi' ? '#ff7034' : '#3b82f6',
        devices: []
      };
      const updatedSet = {
        ...liveSet,
        tracks: [...liveSet.tracks, newTrack]
      };
      setLiveSet(updatedSet);
      recordSnapshot(`Pista creada en Ableton: "${name}" [${nextPath}]`, updatedSet, crateState, {
        type: 'track-structure',
        trackPath: nextPath,
        description: `Pista ${name} creada`
      });
      await handleRefreshSet();
    }
    setIsBusy(false);
    setBusyMessage('');
  };

  // Action: Delete Track (ppal-delete)
  const handleDeleteTrack = async (trackPath: string, _isBridge: boolean) => {
    // La pista del canal se resuelve leyendo el set, nunca por un índice fijo
    if (trackPath === abletonClient.canalPath) {
      alert('REGLA DE ORO: NUNCA borres la pista de Producer_Pal. Es el canal de comunicación con Live.');
      return;
    }

    setIsBusy(true);
    setBusyMessage(`Borrando pista ${trackPath} en Ableton…`);

    const res = await abletonClient.callTool('ppal-delete', {
      type: 'track',
      path: trackPath
    });

    if (!res.isError) {
      const updatedTracks = liveSet.tracks.filter((t) => t.path !== trackPath);
      const updatedSet = { ...liveSet, tracks: updatedTracks };
      setLiveSet(updatedSet);

      recordSnapshot(`Pista eliminada de Ableton: [${trackPath}]`, updatedSet, crateState, {
        type: 'track-structure',
        trackPath,
        description: `Pista ${trackPath} eliminada`
      });

      await handleRefreshSet();
    }
    setIsBusy(false);
    setBusyMessage('');
  };

  // Action: Drop image for visual brief
  const handleDropImage = async (file: File) => {
    setIsBusy(true);
    setBusyMessage('Traduciendo imagen de referencia a brief musical (Gemini)...');
    try {
      const brief = await postCreativoDirigir(file);
      setVisualBrief(brief);
    } catch (err) {
      console.warn('Error al derivar brief de imagen:', err);
    } finally {
      setIsBusy(false);
      setBusyMessage('');
    }
  };

  // Action: Generate (Lyria / MIDI / Letra)
  const handleGenerate = async (type: 'lyria' | 'midi' | 'letra') => {
    setIsBusy(true);
    setBusyMessage(`Generando contenido creativo [${type}] con Gemini / Lyria…`);

    try {
      const result = await postCreativoGenerar({
        type,
        brief: visualBrief,
        sections: [
          { name: 'INTRO', bars: 4 },
          { name: 'VERSO', bars: 16 },
          { name: 'ESTRIBILLO', bars: 8 }
        ],
        crateState
      });

      if (type === 'midi' && result.midiData) {
        setGeneratedMidiData(result.midiData);
      } else if (type === 'letra' && result.lyrics) {
        setGeneratedLyrics(result.lyrics);
      }
    } catch (err) {
      console.error('Error generando:', err);
    } finally {
      setIsBusy(false);
      setBusyMessage('');
    }
  };

  // Action: Mutate selected clip
  const handleMutateSelectedClip = async (mutationParams: {
    temp: number;
    topk: number;
    density: number;
    guidance: number;
  }) => {
    setIsBusy(true);
    setBusyMessage('Mutando clip seleccionado en DAW…');

    const nextCrate = {
      ...crateState,
      temp: mutationParams.temp,
      topk: mutationParams.topk,
      density: mutationParams.density,
      guidance: mutationParams.guidance
    };
    setCrateState(nextCrate);

    recordSnapshot(`Mutación de clip aplicada a ${selectedTrackPath}`, liveSet, nextCrate);

    await abletonClient.callTool('ppal-update-device', {
      path: crateState.devicePath,
      params: [
        { id: 'temp', value: mutationParams.temp },
        { id: 'topk', value: mutationParams.topk },
        { id: 'density', value: mutationParams.density },
        { id: 'guidance', value: mutationParams.guidance }
      ]
    });

    setIsBusy(false);
    setBusyMessage('');
  };

  // Action: Apply to DAW (ppal-create-clip)
  const handleApplyToDaw = async (clipConfig: {
    trackPath: string;
    name: string;
    length: string;
    looping: boolean;
    notes?: string;
    sampleFile?: string;
    gainDb: number;
    warpMode: string;
    auto: string;
  }) => {
    setIsBusy(true);
    setBusyMessage('Inyectando clip y transformaciones a Ableton Live…');

    const targetSlotPath = `${clipConfig.trackPath || 't0'}/s0`;

    const payload: Record<string, any> = {
      path: targetSlotPath,
      name: clipConfig.name,
      length: clipConfig.length,
      looping: clipConfig.looping,
      gainDb: clipConfig.gainDb,
      warpMode: clipConfig.warpMode,
      auto: clipConfig.auto
    };

    if (clipConfig.notes) {
      payload.notes = clipConfig.notes;
    } else if (clipConfig.sampleFile) {
      payload.sampleFile = clipConfig.sampleFile;
    }

    const res = await abletonClient.callTool('ppal-create-clip', payload);

    if (!res.isError) {
      recordSnapshot(`Clip inyectado en ${targetSlotPath}: "${clipConfig.name}"`, liveSet, crateState);
      await handleRefreshSet();
    }

    setIsBusy(false);
    setBusyMessage('');
  };

  // Action: Inyectar Secciones al Arrangement vía Locators (ppal-update-live-set)
  const handleApplyLocators = async (sections: SongSection[]) => {
    setIsBusy(true);
    setBusyMessage('Inyectando locators de estructura en Arrangement de Live…');
    let currentBar = 1;
    const createdList: string[] = [];

    for (const sec of sections) {
      const locatorTime = `${currentBar}|1`;
      await abletonClient.callTool('ppal-update-live-set', {
        locatorOperation: 'create',
        locatorTime,
        locatorName: sec.name
      });
      createdList.push(`${sec.name} (${locatorTime})`);
      currentBar += sec.bars;
    }

    recordSnapshot(
      `Locators de estructura creados en Arrangement: ${createdList.join(', ')}`,
      liveSet,
      crateState
    );
    setIsBusy(false);
    setBusyMessage('');
  };

  // Action: Duplicar Clip en Live (ppal-duplicate)
  const handleDuplicateClip = async (sourceTrackPath: string, sourceSlot: string, targetSlot: string) => {
    setIsBusy(true);
    const srcClipPath = `${sourceTrackPath}/${sourceSlot}`;
    const tgtClipPath = `${sourceTrackPath}/${targetSlot}`;
    setBusyMessage(`Duplicando clip ${srcClipPath} a ${tgtClipPath}…`);

    const res = await abletonClient.callTool('ppal-duplicate', {
      type: 'clip',
      path: srcClipPath,
      destination: tgtClipPath
    });

    if (!res.isError) {
      recordSnapshot(`Clip duplicado en Live: ${srcClipPath} -> ${tgtClipPath}`, liveSet, crateState);
      await handleRefreshSet();
    }

    setIsBusy(false);
    setBusyMessage('');
  };

  // Action: Inyectar Variación Transformada (ppal-create-clip)
  const handleApplyVariation = async (
    variation: VariationPreset,
    targetTrackPath: string,
    targetSlot: string,
    autoPlay: boolean
  ) => {
    setIsBusy(true);
    const targetPath = `${targetTrackPath}/${targetSlot}`;
    setBusyMessage(`Inyectando variación "${variation.name}" en ${targetPath}…`);

    const res = await abletonClient.callTool('ppal-create-clip', {
      path: targetPath,
      name: `${variation.name} [Fill]`,
      length: '4bar',
      looping: true,
      notes: variation.notesString,
      transforms: variation.transforms,
      gainDb: 0,
      warpMode: 'beats',
      auto: autoPlay ? 'play-clip' : 'none'
    });

    if (!res.isError) {
      recordSnapshot(`Variación/Fill inyectado en ${targetPath}: "${variation.name}"`, liveSet, crateState);
      await handleRefreshSet();
    }

    setIsBusy(false);
    setBusyMessage('');
  };

  // Action: Trigger Sonic Analysis
  const handleTriggerAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const data = await postCreativoAnalizar();
      setAnalysis(data);
    } catch (err) {
      console.warn('Error al analizar:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Action: Insert VST3 Plugin
  const handleInsertPlugin = async (plugin: VstPlugin, targetTrackPath: string) => {
    setIsBusy(true);
    setBusyMessage(`Insertando plugin ${plugin.name} en pista ${targetTrackPath}…`);

    await abletonClient.callTool('ppal-create-device', {
      device: plugin.name,
      path: `${targetTrackPath}/d+`
    });

    recordSnapshot(`Plugin ${plugin.name} insertado en ${targetTrackPath}`, liveSet, crateState);

    await handleRefreshSet();
    setIsBusy(false);
    setBusyMessage('');
  };

  // Action: 1-Click EQ Curve Correction (FabFilter Pro-Q 4)
  const handleApplyEqCorrection = async (correctionSummary: string) => {
    setIsBusy(true);
    setBusyMessage('Aplicando curva compensatoria a FabFilter Pro-Q 4 en Ableton Live…');
    await abletonClient.callTool('ppal-update-device', {
      path: 't0/d0',
      params: [
        { id: '1', value: 0.45 },
        { id: '2', value: 0.62 }
      ]
    });
    recordSnapshot(
      `Mastering: ${correctionSummary}`,
      liveSet,
      crateState,
      {
        type: 'device-param',
        devicePath: 't0/d0',
        description: 'Compensación de ecualización en FabFilter Pro-Q 4'
      }
    );
    setIsBusy(false);
    setBusyMessage('');
  };

  // Action: Inyectar clip desde Piano Roll
  const handleApplyPianoRollClip = async (clipData: {
    trackPath: string;
    name: string;
    length: string;
    notes: string;
    looping: boolean;
  }) => {
    setIsBusy(true);
    setBusyMessage(`Inyectando clip de Piano Roll a ${clipData.trackPath}…`);
    const targetSlotPath = `${clipData.trackPath || 't0'}/s0`;
    const res = await abletonClient.callTool('ppal-create-clip', {
      path: targetSlotPath,
      name: clipData.name,
      length: clipData.length,
      looping: clipData.looping,
      notes: clipData.notes,
      gainDb: 0,
      warpMode: 'beats',
      auto: 'play-clip'
    });
    if (!res.isError) {
      recordSnapshot(`Clip de Piano Roll inyectado en ${targetSlotPath}: "${clipData.name}"`, liveSet, crateState);
      await handleRefreshSet();
    }
    setIsBusy(false);
    setBusyMessage('');
  };

  // Action: Inyectar progresión Neo-Soul
  const handleApplyChordProgressionClip = async (clipData: {
    trackPath: string;
    name: string;
    length: string;
    notes: string;
    looping: boolean;
  }) => {
    setIsBusy(true);
    setBusyMessage(`Inyectando progresión Neo-Soul a ${clipData.trackPath}…`);
    const targetSlotPath = `${clipData.trackPath || 't1'}/s0`;
    const res = await abletonClient.callTool('ppal-create-clip', {
      path: targetSlotPath,
      name: clipData.name,
      length: clipData.length,
      looping: clipData.looping,
      notes: clipData.notes,
      gainDb: 0,
      warpMode: 'beats',
      auto: 'play-clip'
    });
    if (!res.isError) {
      recordSnapshot(`Progresión Neo-Soul inyectada en ${targetSlotPath}: "${clipData.name}"`, liveSet, crateState);
      await handleRefreshSet();
    }
    setIsBusy(false);
    setBusyMessage('');
  };

  // Action: Inyectar clip con Sample Slicer
  const handleApplySampleSlicerClip = async (clipData: {
    trackPath: string;
    name: string;
    length: string;
    sampleFile: string;
    gainDb: number;
    warpMode: string;
    auto: string;
  }) => {
    setIsBusy(true);
    setBusyMessage(`Inyectando clip con sample a ${clipData.trackPath}…`);
    const targetSlotPath = `${clipData.trackPath || 't0'}/s0`;
    const res = await abletonClient.callTool('ppal-create-clip', {
      path: targetSlotPath,
      name: clipData.name,
      length: clipData.length,
      looping: true,
      sampleFile: clipData.sampleFile,
      gainDb: clipData.gainDb,
      warpMode: clipData.warpMode,
      auto: clipData.auto
    });
    if (!res.isError) {
      recordSnapshot(`Clip de sample MPC inyectado en ${targetSlotPath}: "${clipData.name}"`, liveSet, crateState);
      await handleRefreshSet();
    }
    setIsBusy(false);
    setBusyMessage('');
  };

  // Action: Inyectar patrón de batería MPC
  const handleApplyDrumClip = async (clipData: {
    trackPath: string;
    name: string;
    length: string;
    notes: string;
    looping: boolean;
  }) => {
    setIsBusy(true);
    setBusyMessage(`Inyectando patrón de batería MPC en ${clipData.trackPath}…`);
    const targetSlotPath = `${clipData.trackPath || 't0'}/s0`;
    const res = await abletonClient.callTool('ppal-create-clip', {
      path: targetSlotPath,
      name: clipData.name,
      length: clipData.length,
      looping: clipData.looping,
      notes: clipData.notes,
      gainDb: 0,
      warpMode: 'beats',
      auto: 'play-clip'
    });
    if (!res.isError) {
      recordSnapshot(`Batería MPC inyectada en ${targetSlotPath}: "${clipData.name}"`, liveSet, crateState);
      await handleRefreshSet();
    }
    setIsBusy(false);
    setBusyMessage('');
  };

  // Action: Aplicar Escena inmediata a The Infinite Crate
  const handleApplyCrateScene = async (scene: CrateScene) => {
    setIsBusy(true);
    setBusyMessage(`Aplicando escena "${scene.name}" a The Infinite Crate…`);

    const updatedCrate: InfiniteCrateState = {
      ...crateState,
      bright: scene.bright,
      density: scene.density,
      guidance: scene.guidance,
      temp: scene.temp,
      topk: scene.topk,
      muteBass: scene.muteBass,
      muteDrums: scene.muteDrums,
      muteOther: scene.muteOther,
      slots: scene.slots
    };
    setCrateState(updatedCrate);

    const paramsList: { id: string; value: number }[] = [
      { id: 'bright', value: scene.bright },
      { id: 'density', value: scene.density },
      { id: 'guidance', value: scene.guidance },
      { id: 'temp', value: scene.temp },
      { id: 'topk', value: scene.topk },
      { id: 'mute bass', value: scene.muteBass ? 1 : 0 },
      { id: 'mute drums', value: scene.muteDrums ? 1 : 0 },
      { id: 'mute other', value: scene.muteOther ? 1 : 0 },
      ...scene.slots.map((s) => ({ id: `prompt #${s.id}`, value: s.weight }))
    ];

    await abletonClient.callTool('ppal-update-device', {
      path: crateState.devicePath || 't1/d1',
      params: paramsList
    });

    recordSnapshot(`Escena Crate aplicada: "${scene.name}"`, liveSet, updatedCrate);
    setIsBusy(false);
    setBusyMessage('');
  };

  // Action: Morfosis progresiva de The Infinite Crate
  const handleMorphCrateScene = async (targetScene: CrateScene, barsDuration: number) => {
    setIsMorphingCrate(true);
    setMorphProgress(0);

    const totalSteps = 8;
    const bpm = liveSet.tempo || 90;
    const totalMs = barsDuration * 4 * (60000 / bpm);
    const stepIntervalMs = Math.max(120, totalMs / totalSteps);

    const initial = { ...crateState };

    for (let step = 1; step <= totalSteps; step++) {
      const alpha = step / totalSteps;

      const interpolatedCrate: InfiniteCrateState = {
        ...crateState,
        bright: initial.bright + (targetScene.bright - initial.bright) * alpha,
        density: initial.density + (targetScene.density - initial.density) * alpha,
        guidance: initial.guidance + (targetScene.guidance - initial.guidance) * alpha,
        temp: initial.temp + (targetScene.temp - initial.temp) * alpha,
        topk: Math.round(initial.topk + (targetScene.topk - initial.topk) * alpha),
        muteBass: alpha > 0.5 ? targetScene.muteBass : initial.muteBass,
        muteDrums: alpha > 0.5 ? targetScene.muteDrums : initial.muteDrums,
        muteOther: alpha > 0.5 ? targetScene.muteOther : initial.muteOther,
        slots: initial.slots.map((s) => {
          const targetSlot = targetScene.slots.find((ts) => ts.id === s.id);
          const targetW = targetSlot ? targetSlot.weight : s.weight;
          return {
            ...s,
            weight: Number((s.weight + (targetW - s.weight) * alpha).toFixed(2))
          };
        })
      };

      setCrateState(interpolatedCrate);
      setMorphProgress((step / totalSteps) * 100);

      const paramsList: { id: string; value: number }[] = [
        { id: 'bright', value: Number(interpolatedCrate.bright.toFixed(2)) },
        { id: 'density', value: Number(interpolatedCrate.density.toFixed(2)) },
        { id: 'guidance', value: Number(interpolatedCrate.guidance.toFixed(1)) },
        { id: 'temp', value: Number(interpolatedCrate.temp.toFixed(2)) },
        { id: 'topk', value: interpolatedCrate.topk },
        { id: 'mute bass', value: interpolatedCrate.muteBass ? 1 : 0 },
        { id: 'mute drums', value: interpolatedCrate.muteDrums ? 1 : 0 },
        { id: 'mute other', value: interpolatedCrate.muteOther ? 1 : 0 },
        ...interpolatedCrate.slots.map((s) => ({ id: `prompt #${s.id}`, value: s.weight }))
      ];

      await abletonClient.callTool('ppal-update-device', {
        path: crateState.devicePath || 't1/d1',
        params: paramsList
      });

      if (step < totalSteps) {
        await new Promise((r) => setTimeout(r, stepIntervalMs));
      }
    }

    recordSnapshot(`Morfosis completada hacia "${targetScene.name}" (${barsDuration} bars)`, liveSet, {
      ...crateState,
      bright: targetScene.bright,
      density: targetScene.density,
      guidance: targetScene.guidance,
      temp: targetScene.temp,
      topk: targetScene.topk,
      muteBass: targetScene.muteBass,
      muteDrums: targetScene.muteDrums,
      muteOther: targetScene.muteOther,
      slots: targetScene.slots
    });

    setIsMorphingCrate(false);
    setMorphProgress(100);
    setTimeout(() => setMorphProgress(0), 1000);
  };

  // Action: Export Standard MIDI File
  const handleExportMidi = () => {
    const tracksToExport = [
      {
        name: '01 Drums Master',
        notes: [
          { note: 36, startBarBeat: '1|1', durationBars: 0.25, velocity: 105 },
          { note: 38, startBarBeat: '1|2', durationBars: 0.25, velocity: 98 },
          { note: 36, startBarBeat: '1|2.5', durationBars: 0.25, velocity: 100 },
          { note: 38, startBarBeat: '1|4', durationBars: 0.25, velocity: 102 }
        ]
      },
      {
        name: '02 Rhodes Harmony',
        notes: [
          { note: 'C3', startBarBeat: '1|1', durationBars: 2.0, velocity: 90 },
          { note: 'E3', startBarBeat: '1|1', durationBars: 2.0, velocity: 88 },
          { note: 'G3', startBarBeat: '1|1', durationBars: 2.0, velocity: 92 },
          { note: 'B3', startBarBeat: '1|1', durationBars: 2.0, velocity: 85 },
          { note: 'D4', startBarBeat: '1|1', durationBars: 2.0, velocity: 94 }
        ]
      },
      {
        name: '03 Moog Sub Bass',
        notes: [
          { note: 'C2', startBarBeat: '1|1', durationBars: 1.5, velocity: 105 },
          { note: 'A1', startBarBeat: '2|1', durationBars: 1.5, velocity: 100 }
        ]
      }
    ];

    const midiBytes = generateStandardMidiFile(tracksToExport, liveSet.tempo || 90, [4, 4]);
    downloadMidiFile(midiBytes, `centro_creativo_${liveSet.scale.replace(/\s+/g, '_')}_${liveSet.tempo}bpm.mid`);
  };

  // Keyboard shortcut listener (including Ctrl+Z and Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Universal OS Shortcuts: Ctrl+Z / Cmd+Z for Undo, Ctrl+Y / Cmd+Shift+Z for Redo
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          return;
        }
        if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          redo();
          return;
        }
      }

      let keyPress = e.key;
      if (keyPress === ' ') keyPress = 'Space';
      else if (keyPress.length === 1) keyPress = keyPress.toLowerCase();

      // Find matching action
      const matched = shortcuts.find((sc) => sc.key.toLowerCase() === keyPress.toLowerCase());
      if (!matched) return;

      e.preventDefault();

      switch (matched.actionName) {
        case 'undo':
          undo();
          break;
        case 'redo':
          redo();
          break;
        case 'open-history':
          setIsHistoryModalOpen(true);
          break;
        case 'playback-toggle':
          handleTogglePlayback();
          break;
        case 'refresh-set':
          handleRefreshSet();
          break;
        case 'generate':
          handleGenerate('midi');
          break;
        case 'analyze':
          handleTriggerAnalysis();
          break;
        case 'mutate-clip':
          handleMutateSelectedClip({ temp: 1.15, topk: 45, density: 0.35, guidance: 4.5 });
          break;
        case 'open-vst':
          setIsVstModalOpen(true);
          break;
        case 'export-midi':
          handleExportMidi();
          break;
        case 'open-pianoroll':
          setIsPianoRollModalOpen(true);
          break;
        case 'open-chords':
          setIsChordPaletteModalOpen(true);
          break;
        case 'open-slicer':
          setIsSampleSlicerModalOpen(true);
          break;
        case 'open-drums':
          setIsDrumSequencerOpen(true);
          break;
        case 'open-scenes':
          setIsCrateScenesOpen(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, isPlaying, liveSet, visualBrief, crateState, undo, redo]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0c0d10] text-[#e2e4e9]">
      {/* 1. Top Bar */}
      <TopBar
        liveSet={liveSet}
        isConnected={isConnected}
        isSimulated={isSimulated}
        isBusy={isBusy}
        busyMessage={busyMessage}
        isPlaying={isPlaying}
        saveStatus={saveStatus}
        lastSavedTime={lastSavedTime}
        canUndo={canUndo}
        canRedo={canRedo}
        undoDescription={undoDescription}
        redoDescription={redoDescription}
        undoCount={undoCount}
        onUndo={undo}
        onRedo={redo}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onRefreshSet={handleRefreshSet}
        onTogglePlayback={handleTogglePlayback}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        onOpenVstBrowser={() => setIsVstModalOpen(true)}
        onExportMidi={handleExportMidi}
        onUpdateTempo={handleUpdateTempo}
        onToggleSimulationMode={() => {
          const next = !isSimulated;
          setIsSimulated(next);
          abletonClient.setSimulatedMode(next);
          setIsConnected(!next);
        }}
        onOpenPianoRoll={() => setIsPianoRollModalOpen(true)}
        onOpenChordPalette={() => setIsChordPaletteModalOpen(true)}
        onOpenSampleSlicer={() => setIsSampleSlicerModalOpen(true)}
        onOpenDrumSequencer={() => setIsDrumSequencerOpen(true)}
        onOpenCrateScenes={() => setIsCrateScenesOpen(true)}
      />

      {/* 2. 3-Column Main Studio Workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* Columna Izquierda: EL SET */}
        <SetTreeColumn
          liveSet={liveSet}
          selectedTrackPath={selectedTrackPath}
          isAutoFocusEnabled={isAutoFocusEnabled}
          onToggleAutoFocus={() => setIsAutoFocusEnabled(!isAutoFocusEnabled)}
          onSelectTrack={handleSelectTrack}
          onSelectDevice={handleSelectDevice}
          onUpdateDeviceParam={handleUpdateDeviceParam}
          onCreateTrack={handleCreateTrack}
          onDeleteTrack={handleDeleteTrack}
          onToggleTrackMute={(p) => {
            const track = liveSet.tracks.find((t) => t.path === p);
            const nextMuted = !track?.isMuted;
            const updatedTracks = liveSet.tracks.map((t) =>
              t.path === p ? { ...t, isMuted: nextMuted } : t
            );
            const updatedSet = { ...liveSet, tracks: updatedTracks };
            setLiveSet(updatedSet);
            recordSnapshot(`Mute alternado en [${p}] a ${nextMuted ? 'ON' : 'OFF'}`, updatedSet, crateState);
          }}
          onToggleTrackSolo={(p) => {
            const track = liveSet.tracks.find((t) => t.path === p);
            const nextSolo = !track?.isSolo;
            const updatedTracks = liveSet.tracks.map((t) =>
              t.path === p ? { ...t, isSolo: nextSolo } : t
            );
            const updatedSet = { ...liveSet, tracks: updatedTracks };
            setLiveSet(updatedSet);
            recordSnapshot(`Solo alternado en [${p}] a ${nextSolo ? 'ON' : 'OFF'}`, updatedSet, crateState);
          }}
        />

        {/* Columna Central: CREAR */}
        <CreateColumn
          selectedTrackPath={selectedTrackPath}
          visualBrief={visualBrief}
          onUpdateBrief={(u) => setVisualBrief((prev) => ({ ...prev, ...u }))}
          onDropImage={handleDropImage}
          onGenerate={handleGenerate}
          onApplyLocators={handleApplyLocators}
          onDuplicateClip={handleDuplicateClip}
          onApplyVariation={handleApplyVariation}
          onApplyToDaw={handleApplyToDaw}
          onMutateSelectedClip={handleMutateSelectedClip}
          onOpenPianoRoll={() => setIsPianoRollModalOpen(true)}
          onOpenChordPalette={() => setIsChordPaletteModalOpen(true)}
          onOpenSampleSlicer={() => setIsSampleSlicerModalOpen(true)}
          onOpenDrumSequencer={() => setIsDrumSequencerOpen(true)}
          onOpenCrateScenes={() => setIsCrateScenesOpen(true)}
          isBusy={isBusy}
          generatedMidiData={generatedMidiData}
          generatedLyrics={generatedLyrics}
        />

        {/* Columna Derecha: JUZGAR */}
        <JudgeColumn
          analysis={analysis}
          crateState={crateState}
          bitacora={bitacora}
          onTriggerAnalysis={handleTriggerAnalysis}
          onUpdateCrateParam={handleUpdateCrateParam}
          onUpdateCrateMute={handleUpdateCrateMute}
          onUpdateCratePromptWeight={handleUpdateCratePromptWeight}
          onUpdateCrateSlotLabel={handleUpdateCrateSlotLabel}
          onApplyEqCorrection={handleApplyEqCorrection}
          onOpenCrateScenes={() => setIsCrateScenesOpen(true)}
          onApplyQuickScene={handleApplyCrateScene}
          isAnalyzing={isAnalyzing}
          isCrateAutoPollActive={isCrateAutoPollActive}
          onToggleCrateAutoPoll={() => setIsCrateAutoPollActive(!isCrateAutoPollActive)}
        />
      </main>

      {/* VST3 Plugin Browser Modal */}
      <VstBrowserModal
        isOpen={isVstModalOpen}
        onClose={() => setIsVstModalOpen(false)}
        tracks={liveSet.tracks.map((t) => ({ path: t.path, name: t.name }))}
        onInsertPlugin={handleInsertPlugin}
      />

      {/* Keyboard Shortcuts Customization Modal */}
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        shortcuts={shortcuts}
        onUpdateShortcuts={(updated) => setShortcuts(updated)}
      />

      {/* History Timeline (Undo / Redo Stack) Modal */}
      <HistoryTimelineModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        timeline={timeline}
        canUndo={canUndo}
        canRedo={canRedo}
        undoDescription={undoDescription}
        redoDescription={redoDescription}
        onUndo={undo}
        onRedo={redo}
        onJumpToIndex={jumpToHistoryIndex}
      />

      {/* Feature 1: Piano Roll & MPC Groove Modal */}
      <PianoRollModal
        isOpen={isPianoRollModalOpen}
        onClose={() => setIsPianoRollModalOpen(false)}
        targetTrackPath={selectedTrackPath}
        initialNotesString={generatedMidiData?.notesString}
        onApplyClipToDaw={handleApplyPianoRollClip}
      />

      {/* Feature 2: Neo-Soul Chord Palette & Voicing Engine Modal */}
      <ChordPaletteModal
        isOpen={isChordPaletteModalOpen}
        onClose={() => setIsChordPaletteModalOpen(false)}
        targetTrackPath={selectedTrackPath}
        onApplyClipToDaw={handleApplyChordProgressionClip}
      />

      {/* Feature 4: Sample Crate & 16-Pad MPC Slicer Modal */}
      <SampleSlicerModal
        isOpen={isSampleSlicerModalOpen}
        onClose={() => setIsSampleSlicerModalOpen(false)}
        targetTrackPath={selectedTrackPath}
        onApplySampleClip={handleApplySampleSlicerClip}
      />

      {/* Creative Extension 1: MPC Drum Step Sequencer & Ghost Notes Modal */}
      <DrumSequencerModal
        isOpen={isDrumSequencerOpen}
        onClose={() => setIsDrumSequencerOpen(false)}
        targetTrackPath={selectedTrackPath}
        onApplyDrumClipToDaw={handleApplyDrumClip}
      />

      {/* Creative Extension 2: Crate Production Scenes & Morph Timeline Modal */}
      <CrateScenesModal
        isOpen={isCrateScenesOpen}
        onClose={() => setIsCrateScenesOpen(false)}
        crateState={crateState}
        onApplySceneToLive={handleApplyCrateScene}
        onMorphSceneToLive={handleMorphCrateScene}
        isMorphing={isMorphingCrate}
        morphProgress={morphProgress}
      />
    </div>
  );
}

