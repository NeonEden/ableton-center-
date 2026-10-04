/**
 * Tipos exactos del protocolo Producer_Pal y DAW Ableton Live 12.4.6 Suite
 */

export type ToolName =
  | 'ppal-read-live-set'
  | 'ppal-create-track'
  | 'ppal-create-clip'
  | 'ppal-create-device'
  | 'ppal-read-device'
  | 'ppal-update-device'
  | 'ppal-playback'
  | 'ppal-update-live-set'
  | 'ppal-library'
  | 'ppal-delete';

export interface DeviceParameter {
  id: string;
  name: string;
  value: number | string;
  min?: number;
  max?: number;
  unit?: string;
  displayValue?: string;
}

export interface LiveDevice {
  path: string; // ej: 't1/d1', 't0/d0'
  id: string;
  name: string;
  type: string;
  isRack?: boolean;
  parameters: DeviceParameter[];
}

export interface LiveTrack {
  path: string; // 't0', 't1', ...
  id: string;
  type: 'midi' | 'audio' | 'return' | 'master';
  name: string;
  sessionClipCount: number;
  deviceCount: number;
  color?: string;
  isMuted?: boolean;
  isSolo?: boolean;
  isArm?: boolean;
  devices?: LiveDevice[];
  isBridgeTrack?: boolean; // Pista que contiene Producer_Pal - NUNCA borrar
}

export interface LiveSet {
  tempo: number;
  timeSignature: string; // ej: "4/4"
  scale: string; // ej: "C Major"
  scalePitches?: string[];
  sceneCount: number;
  tracks: LiveTrack[];
  returnTracks?: LiveTrack[];
  mainTrack?: LiveTrack;
}

export interface InfiniteCrateState {
  devicePath: string; // ej 't1/d1'
  bright: number; // 0.5
  density: number; // 0.25
  guidance: number; // 4
  temp: number; // 1.1
  topk: number; // 40
  muteBass: boolean; // 0 o 1
  muteDrums: boolean; // 0 o 1
  muteOther: boolean; // 0 o 1
  keyNumber: number; // CM/Am=1
  slots: {
    id: number; // 1 a 9
    weight: number; // 0.0 a 1.0
    label: string; // ej "boom bap drums"
  }[];
}

export interface SonicAnalysis {
  isMeasured: boolean;
  timestamp: string;
  integratedLufs: number | null; // -19.6 LUFS
  truePeakDb: number | null; // -0.8 dBTP
  rmsDb: number | null;
  dynamicRangeLu: number | null;
  bands: {
    sub: number | null; // 20-60 Hz (ref 0 dB)
    medios: number | null; // 200-2kHz
    presencia: number | null; // 2-6 kHz (-7.6 dB rel al sub)
    aire: number | null; // 10k-20kHz
  };
  phaseCorrelation: number | null; // ej +0.88
  verdictTitle: string;
  proposals: string[]; // 3 propuestas concretas y accionables
}

export interface BitacoraItem {
  id: string;
  timestamp: string;
  tool: string;
  payload: Record<string, any>;
  response: any;
  isError: boolean;
  isSimulated: boolean;
  evidence: string;
  durationMs: number;
}

export interface VisualBrief {
  imageUrl?: string;
  imageName?: string;
  mood: string;
  bpm: number;
  scale: string;
  instruments: string[];
  texture: string;
  notes: string;
}

export interface SongSection {
  id: string;
  name: 'INTRO' | 'VERSO' | 'ESTRIBILLO' | 'PUENTE' | 'OUTRO';
  bars: number;
  energy: number; // 1 a 5
  description: string;
}

export interface VstPlugin {
  name: string;
  vendor: string;
  format: 'VST3';
  deviceKind: 'audiofx' | 'synth' | 'analyzer';
  category: string;
  defaultPreset?: string;
  installedVersion: string;
  tags: string[];
}

export interface ShortcutConfig {
  id: string;
  label: string;
  key: string;
  modifiers?: ('ctrl' | 'shift' | 'alt')[];
  actionName: string;
}

export type DawActionType =
  | 'device-param'
  | 'crate-param'
  | 'crate-slot'
  | 'crate-mute'
  | 'tempo'
  | 'track-structure'
  | 'track-mute-solo'
  | 'generic';

export interface SyncDawAction {
  type: DawActionType;
  devicePath?: string;
  paramId?: string;
  previousValue?: any;
  newValue?: any;
  trackPath?: string;
  description: string;
}

export interface DawHistorySnapshot {
  id: string;
  timestamp: string;
  description: string;
  liveSet: LiveSet;
  crateState: InfiniteCrateState;
  syncAction?: SyncDawAction;
}
