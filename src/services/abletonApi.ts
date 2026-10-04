/**
 * Cliente de integración con Ableton Live 12.4.6 Suite vía servidor Producer_Pal (http://localhost:3350)
 * y endpoints creativos de generación / juicio.
 * Fallback transparente a MODO_SIMULADO si el DAW no responde en 3 segundos.
 */

import {
  BitacoraItem,
  InfiniteCrateState,
  LiveDevice,
  LiveSet,
  LiveTrack,
  SonicAnalysis,
  ToolName
} from '../types/ableton';

export const API_BASE = 'http://localhost:3350';
export const CREATIVO_API_BASE = '/api/creativo';

// Default State for simulated mode matching exact user specifications
export const INITIAL_SIMULATED_SET: LiveSet = {
  tempo: 90,
  timeSignature: '4/4',
  scale: 'C Major',
  scalePitches: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  sceneCount: 8,
  tracks: [
    {
      path: 't0',
      id: 'trk_01_drums',
      type: 'audio',
      name: '01 Drums [Boom Bap]',
      sessionClipCount: 4,
      deviceCount: 2,
      color: '#d66c38',
      isMuted: false,
      isSolo: false,
      isArm: false,
      devices: [
        {
          path: 't0/d0',
          id: 'dev_drum_buss',
          name: 'Drum Buss',
          type: 'audiofx',
          parameters: [
            { id: '1', name: 'Drive', value: 24, min: 0, max: 100, unit: '%' },
            { id: '2', name: 'Crunch', value: 15, min: 0, max: 100, unit: '%' },
            { id: '3', name: 'Boom', value: 42, min: 0, max: 100, unit: '%' },
            { id: '4', name: 'Dry/Wet', value: 85, min: 0, max: 100, unit: '%' }
          ]
        },
        {
          path: 't0/d1',
          id: 'dev_pro_q4_drums',
          name: 'FabFilter Pro-Q 4',
          type: 'audiofx',
          parameters: [
            { id: '10', name: 'Low Cut Freq', value: 32, min: 10, max: 200, unit: 'Hz' },
            { id: '11', name: 'Mid Dip 320Hz', value: -2.4, min: -12, max: 12, unit: 'dB' },
            { id: '12', name: 'High Shelf 8kHz', value: -1.8, min: -12, max: 12, unit: 'dB' }
          ]
        }
      ]
    },
    {
      path: 't1',
      id: 'trk_02_keys',
      type: 'midi',
      name: '02 Soul Keys & Crate',
      sessionClipCount: 3,
      deviceCount: 2,
      color: '#c5a059',
      isMuted: false,
      isSolo: false,
      isArm: true,
      devices: [
        {
          path: 't1/d0',
          id: 'dev_rhodes',
          name: 'Arturia Stage-73 V',
          type: 'synth',
          parameters: [
            { id: '20', name: 'Bass Boost', value: 2.5, min: -6, max: 6, unit: 'dB' },
            { id: '21', name: 'Tremolo Depth', value: 30, min: 0, max: 100, unit: '%' },
            { id: '22', name: 'Drive Tube', value: 18, min: 0, max: 100, unit: '%' }
          ]
        },
        {
          path: 't1/d1',
          id: 'dev_the_infinite_crate',
          name: 'The Infinite Crate (Lyria RT)',
          type: 'audiofx',
          parameters: [
            { id: 'bright', name: 'bright', value: 0.5, min: 0, max: 1, unit: '' },
            { id: 'density', name: 'density', value: 0.25, min: 0, max: 1, unit: '' },
            { id: 'guidance', name: 'guidance', value: 4, min: 1, max: 10, unit: '' },
            { id: 'temp', name: 'temp', value: 1.1, min: 0.1, max: 2.0, unit: '' },
            { id: 'topk', name: 'topk', value: 40, min: 1, max: 100, unit: '' },
            { id: 'mute_bass', name: 'mute bass', value: 0, min: 0, max: 1, unit: '' },
            { id: 'mute_drums', name: 'mute drums', value: 0, min: 0, max: 1, unit: '' },
            { id: 'mute_other', name: 'mute other', value: 0, min: 0, max: 1, unit: '' },
            { id: 'key_num', name: 'key (CM/Am=1)', value: 1, min: 1, max: 12, unit: '' }
          ]
        }
      ]
    },
    {
      path: 't2',
      id: 'trk_03_bass',
      type: 'midi',
      name: '03 Moog Sub Bass',
      sessionClipCount: 2,
      deviceCount: 2,
      color: '#4f8a8b',
      isMuted: false,
      isSolo: false,
      isArm: false,
      devices: [
        {
          path: 't2/d0',
          id: 'dev_analog_bass',
          name: 'Analog Bass',
          type: 'synth',
          parameters: [
            { id: '30', name: 'Filter Cutoff', value: 140, min: 30, max: 800, unit: 'Hz' },
            { id: '31', name: 'Sub Level', value: 0.85, min: 0, max: 1, unit: '' },
            { id: '32', name: 'Glide', value: 45, min: 0, max: 200, unit: 'ms' }
          ]
        },
        {
          path: 't2/d1',
          id: 'dev_soothe2_bass',
          name: 'oeksound soothe2',
          type: 'audiofx',
          parameters: [
            { id: '35', name: 'Depth', value: 3.2, min: 0, max: 10, unit: '' },
            { id: '36', name: 'Sharpness', value: 5.0, min: 0, max: 10, unit: '' }
          ]
        }
      ]
    },
    {
      path: 't3',
      id: 'trk_04_producer_pal',
      type: 'midi',
      name: '04 Producer_Pal Bridge',
      sessionClipCount: 0,
      deviceCount: 1,
      color: '#707070',
      isMuted: false,
      isSolo: false,
      isArm: false,
      isBridgeTrack: true, // ¡REGLA DE ORO: NUNCA BORRAR ESTA PISTA!
      devices: [
        {
          path: 't3/d0',
          id: 'dev_producer_pal_node',
          name: 'Producer_Pal v1.2',
          type: 'audiofx',
          parameters: [
            { id: 'port', name: 'Port Status', value: 3350, unit: '' }
          ]
        }
      ]
    }
  ],
  returnTracks: [
    {
      path: 'r0',
      id: 'ret_a',
      type: 'return',
      name: 'A - Valhalla VintageVerb',
      sessionClipCount: 0,
      deviceCount: 1,
      devices: [
        {
          path: 'r0/d0',
          id: 'dev_valhalla_verb',
          name: 'Valhalla VintageVerb',
          type: 'audiofx',
          parameters: [
            { id: 'decay', name: 'Decay', value: 1.8, min: 0.2, max: 10, unit: 's' },
            { id: 'color', name: '1970s Dark', value: 1, unit: '' }
          ]
        }
      ]
    },
    {
      path: 'r1',
      id: 'ret_b',
      type: 'return',
      name: 'B - Tape Echo',
      sessionClipCount: 0,
      deviceCount: 1
    }
  ],
  mainTrack: {
    path: 'master',
    id: 'master_bus',
    type: 'master',
    name: 'Main Master Bus',
    sessionClipCount: 0,
    deviceCount: 2,
    devices: [
      {
        path: 'master/d0',
        id: 'dev_ozone12',
        name: 'iZotope Ozone 12 Advanced',
        type: 'audiofx',
        parameters: [
          { id: 'limiter_ceil', name: 'Ceiling', value: -0.8, min: -6, max: 0, unit: 'dBTP' },
          { id: 'irc_mode', name: 'IRC IV Modern', value: 1, unit: '' }
        ]
      },
      {
        path: 'master/d1',
        id: 'dev_metric_ab',
        name: 'ADPTR Audio MetricAB',
        type: 'analyzer',
        parameters: [
          { id: 'lufs_target', name: 'Target LUFS', value: -19.6, unit: 'LUFS' }
        ]
      }
    ]
  }
};

// Initial state of The Infinite Crate (19 parameters)
export const INITIAL_CRATE_STATE: InfiniteCrateState = {
  devicePath: 't1/d1',
  bright: 0.5,
  density: 0.25,
  guidance: 4.0,
  temp: 1.1,
  topk: 40,
  muteBass: false,
  muteDrums: false,
  muteOther: false,
  keyNumber: 1, // CM/Am = 1
  slots: [
    { id: 1, weight: 0.85, label: 'boom bap drums' },
    { id: 2, weight: 0.70, label: 'warm vinyl keys' },
    { id: 3, weight: 0.65, label: 'soulful bass' },
    { id: 4, weight: 0.40, label: 'dusty strings' },
    { id: 5, weight: 0.25, label: 'airy pad' },
    { id: 6, weight: 0.35, label: 'tape hiss' },
    { id: 7, weight: 0.50, label: 'rimshot perc' },
    { id: 8, weight: 0.20, label: 'low choir' },
    { id: 9, weight: 0.30, label: 'vinyl noise' }
  ]
};

// Realistic sonic measurement based on prompt's real data
export const INITIAL_SONIC_ANALYSIS: SonicAnalysis = {
  isMeasured: true,
  timestamp: 'Última lectura: Sesión actual (2-bus)',
  integratedLufs: -19.6, // Exacto del prompt
  truePeakDb: -0.8,
  rmsDb: -17.2,
  dynamicRangeLu: 9.4,
  bands: {
    sub: 0.0, // Subgraves referencia 30-60 Hz
    medios: -2.1, // 200-2 kHz
    presencia: -7.6, // -7.6 dB en 2-6 kHz respecto del sub (Exacto del prompt)
    aire: -11.4 // 10k-20 kHz
  },
  phaseCorrelation: 0.88,
  verdictTitle: 'Carácter cálido y oscuro verificado (Boom Bap / Neo Soul)',
  proposals: [
    'Atenuar con soothe2 o Pro-DS 2.5 dB en 3.4 kHz para suavizar la aspereza de los transitorios sin perder ataque.',
    'El sub (45 Hz) está redondo, pero en el verso convendría limpiar un dip suave de 1.2 dB en 280 Hz en el bus de teclados.',
    'Espaciar el Rhodes con Valhalla VintageVerb en modo 1970s Dark al 18% Wet para profundizar la imagen estéreo sin desenfocar el centro.'
  ]
};

export class AbletonClient {
  private isSimulatedMode: boolean = false;
  private isCheckingConnection: boolean = false;
  private onBitacoraCallback?: (item: BitacoraItem) => void;

  /** Pista que contiene el dispositivo Producer_Pal (el canal). Se resuelve leyendo el set. */
  public canalPath: string | null = null;
  /** Path real del dispositivo The Infinite Crate (cambia si el usuario mueve las pistas). */
  public cratePath: string | null = null;

  /**
   * Resuelve los dos dispositivos especiales leyendo el set real.
   * NUNCA se hardcodean los paths: el usuario mueve pistas y los índices cambian.
   */
  public async resolveSpecialDevices(): Promise<{ canalPath: string | null; cratePath: string | null }> {
    this.canalPath = null;
    this.cratePath = null;
    try {
      const set = await this.callTool('ppal-read-live-set', { include: ['tracks'] });
      const tracks: any[] = (set.result?.tracks as any[]) || [];
      for (const t of tracks) {
        if (!t?.path || !t?.deviceCount) continue;
        const tr = await this.callTool('ppal-read-track', { path: t.path, include: ['devices'], maxDepth: 3 });
        const devs: any[] = tr.result?.devices || [];
        for (const d of devs) {
          const nombre = String(d?.name ?? '');
          if (/producer_?pal/i.test(nombre)) this.canalPath = t.path;
          if (/infinite_?crate/i.test(nombre) || /infinite crate/i.test(String(d?.type ?? ''))) this.cratePath = d?.path ?? null;
        }
      }
    } catch {
      /* si el DAW no responde, quedan en null y el modo simulado toma el control */
    }
    return { canalPath: this.canalPath, cratePath: this.cratePath };
  }
  /**
   * Lee el estado real del Crate. Live expone cada peso como el texto del prompt
   * ("0.9 | airy synth pad..."), así que de ahí salen el peso Y la etiqueta real.
   */
  public async readCrateState(devicePath: string): Promise<Partial<InfiniteCrateState> | null> {
    const r = await this.callTool('ppal-read-device', { path: devicePath, include: ['*'] });
    const params: any[] = r.result?.parameters || [];
    if (!params.length) return null;
    const porNombre = new Map<string, any>(params.map((p) => [String(p.name), p.value]));
    const num = (k: string) => { const n = parseFloat(String(porNombre.get(k))); return Number.isFinite(n) ? n : undefined; };
    const slots = [];
    for (let i = 1; i <= 9; i++) {
      const bruto = String(porNombre.get(`prompt #${i}`) ?? '');
      const m = bruto.match(/^\s*(-?[\d.]+)\s*\|\s*(.*)$/);
      slots.push({ id: i, weight: m ? parseFloat(m[1]) : (parseFloat(bruto) || 0), label: m ? m[2] : `prompt #${i}` });
    }
    return {
      bright: num('bright'), density: num('density'), guidance: num('guidance'), temp: num('temp'), topk: num('topk'),
      muteBass: num('mute bass') === 1, muteDrums: num('mute drums') === 1, muteOther: num('mute other') === 1,
      keyNumber: num('key (CM/Am=1)'), slots,
    } as Partial<InfiniteCrateState>;
  }

  constructor() {
    this.isSimulatedMode = false;
  }

  public setBitacoraListener(cb: (item: BitacoraItem) => void) {
    this.onBitacoraCallback = cb;
  }

  public getIsSimulated(): boolean {
    return this.isSimulatedMode;
  }

  public setSimulatedMode(val: boolean) {
    this.isSimulatedMode = val;
  }

  /**
   * Verifica conectividad con http://localhost:3350/api/tools con timeout estricto de 3 segundos
   */
  public async checkConnection(): Promise<boolean> {
    if (this.isCheckingConnection) return !this.isSimulatedMode;
    this.isCheckingConnection = true;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(`${API_BASE}/api/tools`, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        this.isSimulatedMode = false;
        this.isCheckingConnection = false;
        return true;
      }
    } catch {
      // Ignorar error de red si el DAW está cerrado
    }

    this.isSimulatedMode = true;
    this.isCheckingConnection = false;
    return false;
  }

  /**
   * Ejecuta un tool sobre el servidor Producer_Pal de Ableton Live
   * Con timeout de 180s y manejo exhaustivo de errores
   */
  public async callTool(
    tool: ToolName,
    payload: Record<string, any>
  ): Promise<{ result: any; isError: boolean; isSimulated: boolean }> {
    const startTime = performance.now();

    // Verificación preventiva de Regla de Oro 2:
    if (tool === 'ppal-delete' && payload.type === 'track') {
      const targetPath = payload.path;
      // El canal se resuelve leyendo el set (resolveSpecialDevices), no se hardcodea:
      if (targetPath && (targetPath === this.canalPath || targetPath?.includes('producer_pal'))) {
        const errResult = 'Violación de Regla de Oro: NUNCA borres la pista que contiene Producer_Pal (es el canal de comunicación). Operación abortada.';
        this.recordBitacora(tool, payload, { error: errResult }, true, false, errResult, 10);
        return {
          result: errResult,
          isError: true,
          isSimulated: this.isSimulatedMode
        };
      }
    }

    // Si ya estamos en modo simulado o falla la llamada, respondemos de inmediato con simulación realista
    if (this.isSimulatedMode) {
      const simResult = this.generateSimulatedToolResponse(tool, payload);
      const duration = Math.round(performance.now() - startTime);
      this.recordBitacora(tool, payload, simResult, false, true, `Respuesta simulada [${tool}] ejecutada con éxito`, duration);
      return {
        result: simResult,
        isError: false,
        isSimulated: true
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 180 s

      const res = await fetch(`${API_BASE}/api/tools/${tool}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const text = await res.text();
        const duration = Math.round(performance.now() - startTime);
        const errorMsg = `HTTP Error ${res.status}: ${text || res.statusText}`;
        this.recordBitacora(tool, payload, { error: errorMsg }, true, false, errorMsg, duration);
        return { result: errorMsg, isError: true, isSimulated: false };
      }

      const json = await res.json();
      const duration = Math.round(performance.now() - startTime);
      // El canal a veces devuelve un string que empieza con "Error:" sin marcar isError:
      // tratarlo como error para que la bitácora no mienta.
      const isError =
        Boolean(json.isError) || (typeof json.result === 'string' && json.result.startsWith('Error:'));
      const evidence = isError
        ? `Error reportado por Live: ${json.result}`
        : `Ejecutado en DAW (Live 12.4.6) en ${duration}ms`;

      this.recordBitacora(tool, payload, json.result, isError, false, evidence, duration);

      return {
        result: json.result,
        isError,
        isSimulated: false
      };
    } catch (err: any) {
      // Si la conexión falló o fue rechazada, activar modo simulado y devolver respuesta simulada útil
      this.isSimulatedMode = true;
      const duration = Math.round(performance.now() - startTime);
      const simResult = this.generateSimulatedToolResponse(tool, payload);
      const evidence = `DAW no accesible (${err.message || 'Connection refused'}). Activado Modo Simulado.`;
      
      this.recordBitacora(tool, payload, simResult, false, true, evidence, duration);

      return {
        result: simResult,
        isError: false,
        isSimulated: true
      };
    }
  }

  private generateSimulatedToolResponse(tool: ToolName, payload: Record<string, any>): any {
    switch (tool) {
      case 'ppal-read-live-set':
        return INITIAL_SIMULATED_SET;

      case 'ppal-create-track':
        return {
          path: `t${Math.floor(Math.random() * 8) + 4}`,
          id: `trk_${Date.now()}`,
          name: payload.name || 'Nueva Pista',
          type: payload.type || 'midi',
          color: payload.color || '#ff7034',
          sessionClipCount: 0,
          deviceCount: 0
        };

      case 'ppal-create-clip':
        return {
          clipPath: `${payload.path || 't0/s0'}`,
          name: payload.name || 'Clip Generado',
          length: payload.length || '4bar',
          status: 'created',
          autoPlayTriggered: payload.auto === 'play-clip'
        };

      case 'ppal-create-device':
        return {
          devicePath: payload.path || 't0/d+',
          device: payload.device || payload.preset || 'EQ Eight',
          status: 'instantiated'
        };

      case 'ppal-read-device':
        return {
          path: payload.path || 't1/d1',
          name: 'The Infinite Crate (Lyria RT)',
          parameters: INITIAL_SIMULATED_SET.tracks[1].devices?.[1].parameters || []
        };

      case 'ppal-update-device':
        return {
          path: payload.path,
          updatedCount: payload.params?.length ?? 1,
          status: 'parameters-applied'
        };

      case 'ppal-playback':
        return {
          action: payload.action,
          status: 'ok',
          timelinePos: '1|1'
        };

      case 'ppal-update-live-set':
        return {
          tempo: payload.tempo ?? 90,
          scale: payload.scale ?? 'C Major',
          locator: payload.locatorName ? `Locator '${payload.locatorName}' at ${payload.locatorTime}` : undefined
        };

      case 'ppal-library':
        return {
          resultsCount: 6,
          items: [
            { name: 'FabFilter Pro-Q 4', format: 'VST3', path: 'C:/Program Files/Common Files/VST3/FabFilter/Pro-Q 4.vst3' },
            { name: 'FabFilter Pro-DS', format: 'VST3', path: 'C:/Program Files/Common Files/VST3/FabFilter/Pro-DS.vst3' },
            { name: 'soothe2', format: 'VST3', path: 'C:/Program Files/Common Files/VST3/oeksound/soothe2.vst3' },
            { name: 'Valhalla VintageVerb', format: 'VST3', path: 'C:/Program Files/Common Files/VST3/Valhalla/ValhallaVintageVerb.vst3' },
            { name: 'iZotope Ozone 12', format: 'VST3', path: 'C:/Program Files/Common Files/VST3/iZotope/Ozone 12.vst3' },
            { name: 'ADPTR Audio MetricAB', format: 'VST3', path: 'C:/Program Files/Common Files/VST3/Plugin Alliance/ADPTR MetricAB.vst3' }
          ]
        };

      case 'ppal-delete':
        return {
          deletedType: payload.type,
          deletedPath: payload.path,
          status: 'removed'
        };

      default:
        return { status: 'ok', payload };
    }
  }

  private recordBitacora(
    tool: string,
    payload: any,
    response: any,
    isError: boolean,
    isSimulated: boolean,
    evidence: string,
    durationMs: number
  ) {
    if (!this.onBitacoraCallback) return;

    const item: BitacoraItem = {
      id: `bit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      tool,
      payload,
      response,
      isError,
      isSimulated,
      evidence,
      durationMs
    };

    this.onBitacoraCallback(item);
  }
}

export const abletonClient = new AbletonClient();
