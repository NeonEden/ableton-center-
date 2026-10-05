# Informe de Mejoras Esenciales — ableton-center

**Fecha:** 2026-10-04  
**App:** Vite 8 + React 19 + TypeScript 7 + Tailwind 4  
**Lint (tsc --noEmit):** ✅ Pasa sin errores

---

## 1. Diagnóstico breve

### Qué está bien
- **Arquitectura limpia**: Separación clara services/hooks/components/types/utils. Tipos TypeScript que reflejan el protocolo real de Producer_Pal (21 tools).
- **Modo simulado honesto**: Fallback transparente a datos realistas cuando el DAW no responde (timeout 3s conexión, 180s tools). Los valores simulados coinciden con mediciones reales del entorno del productor (LUFS -19.6, True Peak -0.8, presencia -7.6 dB).
- **Reglas de oro respetadas**: El path del canal (Producer_Pal) y del Crate se resuelven leyendo el set (`resolveSpecialDevices`), no hardcodeados. Los "Error:" del canal ya se marcan como error en bitácora.
- **Bitácora de acciones completa**: Cada llamada a herramienta registra tool, payload, response, isError, isSimulated, evidence, durationMs. Nada ocurre sin rastro.
- **Undo/Redo con snapshots profundos**: `useDawHistory` guarda LiveSet + CrateState completos y sincroniza diferencias al DAW al hacer undo/redo.
- **Web Audio para preescucha instantánea**: Genera boom bap / neo soul en C Mayor 90 BPM sin latencia de red.
- **Export MIDI estándar (.mid Format 1)**: Implementación pura TS, sin dependencias.
- **Atajos de teclado configurables**: Incluye Ctrl+Z/Ctrl+Y globales que no interfieren con inputs.

### Qué está mal (y hace que la app mienta, falle en silencio o no sirva para trabajar de verdad)

| # | Problema | Consecuencia real |
|---|----------|-------------------|
| 1 | **`handleRefreshSet` no lee devices** | Al hacer "Releer el set", las pistas pierden sus dispositivos en la UI (solo queda `deviceCount`). La app muestra estado stale. |
| 2 | **Crate prompt slots: UI dice solo-lectura, código intenta escribir** | `JudgeColumn` deshabilita sliders con tooltip "se lee, no se escribe", pero `handleUpdateCratePromptWeight` llama `ppal-update-device` con `prompt #N`. Live expone estos parámetros con `min == max` (solo etiqueta). La escritura falla/ignora en silencio → la app miente. |
| 3 | **VST Browser usa lista hardcodeada (11 plugins) pero dice "528 detectados"** | Nunca llama `ppal-library`. El usuario ve basura y no puede insertar sus plugins reales. |
| 4 | **`syncRestoredStateToDaw` (undo/redo) no sincroniza estructura de pistas ni clips** | Si deshacés "crear pista" o "inyectar clip", la pista/clip **queda en Live**. El estado de la app diverge del DAW sin avisar. |
| 5 | **No hay Error Boundary** | Cualquier error de React rompe toda la app en blanco, sin bitácora ni recovery. |
| 6 | **No se leen clips ni escenas** | `ppal-read-clip` y `ppal-read-scene` existen pero no se usan. La columna "El Set" muestra `sessionClipCount` pero no permite ver/editar clips individuales. |
| 7 | **`crateState.devicePath` se usa sin validar** | Si el usuario mueve/borra la pista del Crate en Live, `devicePath` queda stale y todas las escrituras al Crate fallan en silencio. |
| 8 | **`handleApplyToDaw` hardcodea `trackPath/s0`** | Asume que la escena 0 existe y es la destino. No deja elegir escena ni leer escenas disponibles. |
| 9 | **`useAutoSave` guarda TODO el estado en localStorage cada 700ms** | `liveSet` crece con devices/clips. Llegará a quota (5MB) y fallará en silencio (catch solo loggea). No persiste undo/redo stacks. |
| 10 | **Sliders de parámetros disparan llamada DAW en cada frame** | Sin debounce. Arrastrar un fader = docenas de `ppal-update-device` en segundos. |
| 11 | **`audioEngine.ts` usa estado global mutable** | `audioCtx`, `analyserNode`, `masterGain`, `isPlayingPreview`, `previewTimeoutId` a nivel módulo. Roto si React remounta o hay múltiples consumidores. |
| 12 | **Parámetro `key (CM/Am=1)` del Crate: mapeo inconsistente** | `JudgeColumn` pasa `'key (CM/Am=1)'` como paramKey, `handleUpdateCrateParam` lo reenvía tal cual a `ppal-update-device`, pero el tipo usa `keyNumber`. El nombre real en Live tiene espacios y paréntesis. |
| 13 | **Tipos `any` en `abletonApi.ts`** | `tracks: any[]`, `devs: any[]`, `porNombre: Map<string, any>`. Pierde type safety en la capa más crítica. |
| 14 | **Respuestas simuladas no coinciden con shapes reales** | `generateSimulatedToolResponse` devuelve estructuras inventadas. En modo simulado la app trabaja contra datos falsos. |

---

## 2. Lista ORDENADA de mejoras esenciales

Cada entrada: **Por qué es esencial** → **Archivo + función/líneas** → **Cambio concreto**.

---

### 1. [CRÍTICO] `handleRefreshSet` debe leer devices de cada pista
**Por qué:** Sin esto, "Releer el set" muestra pistas vacías de devices. La app miente sobre el estado real del DAW.  
**Archivo:** `src/App.tsx` — función `handleRefreshSet` (líneas 199–223)  
**Cambio:** Tras `ppal-read-live-set {include:['tracks']}`, iterar `fetchedSet.tracks` y para cada una con `deviceCount > 0` llamar `ppal-read-track {path: t.path, include:['devices'], maxDepth:3}`. Fusionar `devices` en el track antes de `setLiveSet`. Mostrar progreso/estado por pista (ya hay `isBusy`/`busyMessage`).

---

### 2. [CRÍTICO] Crate prompt slots: alinear UI y código a la realidad (solo lectura)
**Por qué:** Hoy la UI dice "solo lectura" pero el handler escribe. Live expone `prompt #1`..`prompt #9` como parámetros de etiqueta (`min == max`). Escribirlos no hace nada y la bitácora registra éxito falso.  
**Archivos:**  
- `src/App.tsx` — `handleUpdateCratePromptWeight` (líneas 341–362): **Eliminar** la llamada a `ppal-update-device`. Mantener solo actualización de estado local (label/weight) para que el usuario organice su mezcla en la app.  
- `src/components/JudgeColumn.tsx` — líneas 316–325: Cambiar tooltip a "Peso editado solo en la app; Live lo expone como etiqueta de solo lectura. Cambia el peso dentro del plugin." Quitar `disabled` del slider si se quiere permitir edición local, o mantenerlo disabled y solo permitir editar `label` (que ya se hace en líneas 283–307).

---

### 3. [CRÍTICO] VST Browser: llamar `ppal-library` real en lugar de lista hardcodeada
**Por qué:** El modal muestra 11 plugins quemados pero el título dice "528 detectados". El usuario no puede insertar sus plugins reales.  
**Archivo:** `src/components/VstBrowserModal.tsx` — líneas 5–126 (`USER_VST_PLUGINS`) y `handleInsert` (161–165)  
**Cambio:**  
- Eliminar `USER_VST_PLUGINS` constante.  
- En `useEffect` inicial (nuevo), llamar `abletonClient.callTool('ppal-library', {})` y setear estado `plugins: VstPlugin[]`.  
- Mostrar estado de carga. Si falla/está simulado, mostrar aviso "Modo simulado: lista de ejemplo" y fallback a lista mínima.  
- `handleInsert` ya usa `onInsertPlugin(plugin, selectedTrack)` → correcto.

---

### 4. [CRÍTICO] `syncRestoredStateToDaw` (undo/redo) debe sincronizar estructura de pistas y clips
**Por qué:** Hoy solo sincroniza tempo, parámetros de devices y Crate. Si el usuario deshace "crear pista" o "inyectar clip", el cambio **persiste en Live** y la app diverge sin avisar.  
**Archivo:** `src/hooks/useDawHistory.ts` — función `syncRestoredStateToDaw` (líneas 58–158)  
**Cambio:** Agregar lógica para detectar y sincronizar:  
- **Pistas añadidas/borradas**: Comparar `target.liveSet.tracks` vs `source.liveSet.tracks` por `path`. Para nuevas → `ppal-create-track`. Para borradas → `ppal-delete {type:'track', path}`.  
- **Clips**: Comparar clips por track/scene (requiere leer clips primero — ver mejora #6). Mínimo: si `target` tiene menos clips que `source` en una pista, no hay tool para borrar clip (no existe `ppal-delete clip`), pero al menos loggear en bitácora "Clip creado en Live no se puede deshacer automáticamente".  
- **Dispositivos añadidos/borrados en pista**: Comparar `devices` arrays por `path`. Nuevos → `ppal-create-device`. Borrados → `ppal-delete {type:'device', path}`.  
- Devolver `Promise<boolean>` indicando si la sincronización fue completa; si no, `onLogBitacora` con `isError=true` y evidence "Sincronización parcial: X cambios no reflejados en Live".

---

### 5. [CRÍTICO] Error Boundary global para que nada falle en silencio
**Por qué:** Un error en cualquier componente (ej. parseo de respuesta DAW, acceso a propiedad undefined) rompe toda la app en blanco. No hay bitácora ni recovery.  
**Archivo:** Nuevo `src/components/ErrorBoundary.tsx` + integración en `src/App.tsx` (root)  
**Cambio:**  
```tsx
// ErrorBoundary.tsx
class ErrorBoundary extends React.Component<{children:ReactNode, fallback?:ReactNode}, {hasError:boolean, error:Error|null}> {
  state = {hasError:false, error:null};
  static getDerivedStateFromError(error) { return {hasError:true, error}; }
  componentDidCatch(error, info) {
    abletonClient.setBitacoraListener?.(item => ...); // logear error react
    console.error('React Error Boundary:', error, info);
  }
  render() { if (this.state.hasError) return this.props.fallback || <div>Error crítico: {this.state.error?.message}</div>; return this.props.children; }
}
```
Envolver `<main>` en `App.tsx` y mostrar botón "Recargar app" + "Volver a conectar DAW".

---

### 6. [ALTO] Leer y mostrar clips por pista (`ppal-read-clip`) y escenas (`ppal-read-scene`)
**Por qué:** La columna "El Set" muestra `sessionClipCount` pero no permite ver nombres, longitud, looping, notas/sampleFile de cada clip. Sin esto no se puede trabajar el set de verdad.  
**Archivos:**  
- `src/types/ableton.ts` — agregar `LiveClip` y `LiveScene` interfaces.  
- `src/services/abletonApi.ts` — agregar `readClipsForTrack(trackPath)` y `readScenes()`.  
- `src/components/SetTreeColumn.tsx` — expandir pista para mostrar clips (lista colapsable bajo devices). Cada clip: nombre, length, looping, gain, warp, botón "Leer" (llama `ppal-read-clip`), botón "Disparar" (`ppal-playback {action:'play-clip', path}`).

---

### 7. [ALTO] Validar `crateState.devicePath` antes de cualquier escritura al Crate
**Por qué:** Si el usuario mueve/borra la pista del Crate en Live, `devicePath` queda obsoleto. Todas las escrituras (`handleUpdateCrateParam`, `handleUpdateCrateMute`, `handleMutateSelectedClip`, `handleUpdateCratePromptWeight`) fallan en silencio.  
**Archivo:** `src/App.tsx` — líneas 301–316, 319–338, 341–362, 493–525  
**Cambio:** En cada handler, al inicio:  
```ts
if (!crateState.devicePath) {
  const { cratePath } = await abletonClient.resolveSpecialDevices();
  if (!cratePath) { alert('No se encuentra The Infinite Crate en el set actual'); return; }
  setCrateState(prev => ({...prev, devicePath: cratePath}));
}
```
O mejor: extraer a helper `ensureCrateDevicePath(): Promise<string|null>` y reusar.

---

### 8. [ALTO] `handleApplyToDaw`: permitir elegir escena destino (leer escenas primero)
**Por qué:** Hardcodear `trackPath/s0` asume que la escena 0 existe y es la correcta. El usuario no puede inyectar en otra escena.  
**Archivo:** `src/App.tsx` — `handleApplyToDaw` (líneas 528–569)  
**Cambio:**  
- Antes de crear clip, llamar `ppal-read-scene {path: trackPath}` para obtener escenas disponibles.  
- Pasar `sceneIndex` o `scenePath` desde `CreateColumn` (nuevo campo en formulario "Aplicar al DAW").  
- Si no hay escenas, crear una con `ppal-create-scene` o avisar.

---

### 9. [ALTO] `useAutoSave`: evitar quota exceeded y persistir undo/redo
**Por qué:** Guardar `liveSet` completo (con devices, parámetros, clips) cada 700ms en localStorage (5MB límite) garantiza `QuotaExceededError` en sesiones reales. El catch solo loggea → pérdida silenciosa. No persiste stacks de undo/redo.  
**Archivo:** `src/hooks/useAutoSave.ts` — líneas 24–42 (efecto save) y tipo de retorno  
**Cambio:**  
- Serializar solo campos esenciales: `liveSet` sin `devices.parameters` completos (solo path/name), `crateState`, `visualBrief`, `shortcuts`. Excluir `generatedMidiData`/`generatedLyrics` (volátiles).  
- Usar `JSON.stringify` con `replacer` que omita arrays grandes.  
- Catch `QuotaExceededError` → limpiar localStorage, guardar versión mínima, avisar en UI (toast/bitácora).  
- Agregar `undoStack`, `redoStack`, `currentSnapshot` al estado persistido (en `useDawHistory` o pasar a `useAutoSave`).  
- Opcional: migrar a IndexedDB (`idb` package) para >50MB sin quota issues.

---

### 10. [ALTO] Debounce en sliders de parámetros de device
**Por qué:** Arrastrar un fader dispara docenas de `ppal-update-device` por segundo. Satura el canal y el DAW.  
**Archivo:** `src/components/SetTreeColumn.tsx` — línea 301–303 (`onChange` del `<input type="range">`)  
**Cambio:**  
- Usar `onMouseUp` / `onTouchEnd` / `onChangeEnd` (solo al soltar) en lugar de `onChange`.  
- O mantener `onChange` para UI optimista pero disparar `onUpdateDeviceParam` con debounce 300ms (usar `useRef` con timer).  
- Preferible: `<input type="range" onChange={...} onMouseUp={commit} />` donde `commit` llama a la API.

---

### 11. [MEDIO] `audioEngine.ts`: eliminar estado global mutable
**Por qué:** Variables globales (`audioCtx`, `analyserNode`, `masterGain`, `isPlayingPreview`, `previewTimeoutId`) rompen si React remounta, hay StrictMode, o múltiples componentes usan el engine.  
**Archivo:** `src/utils/audioEngine.ts` — líneas 7–11, 13–30, 45–197  
**Cambio:** Convertir a clase `AudioEngine` con instancia singleton o hook `useAudioEngine()` que maneje lifecycle:  
```ts
export function useAudioEngine() {
  const ctxRef = useRef<AudioContext|null>(null);
  const analyserRef = useRef<AnalyserNode|null>(null);
  // ... methods que usan refs
  useEffect(() => () => { ctxRef.current?.close(); }, []);
  return { playPreview, stopPreview, getAnalyser, isPlaying };
}
```
Componentes usan el hook en lugar de imports directos.

---

### 12. [MEDIO] Parámetro `key (CM/Am=1)` del Crate: unificar nombre y tipo
**Por qué:** Inconsistencia entre UI (`'key (CM/Am=1)'`), handler (lo pasa tal cual), tipo (`keyNumber: number`), y nombre real en Live (con espacios y paréntesis).  
**Archivos:**  
- `src/types/ableton.ts` — `InfiniteCrateState.keyNumber` (línea 84) ✅ correcto.  
- `src/components/JudgeColumn.tsx` — línea 214: cambiar `onUpdateCrateParam('key (CM/Am=1)', ...)` → `onUpdateCrateParam('keyNumber', ...)`.  
- `src/App.tsx` — `handleUpdateCrateParam` (líneas 301–316): mapear `'keyNumber'` → `'key (CM/Am=1)'` al llamar `ppal-update-device`.  
- `src/services/abletonApi.ts` — `readCrateState` (línea 335): ya mapea `num('key (CM/Am=1)')` a `keyNumber` ✅.

---

### 13. [MEDIO] Eliminar `any` en `abletonApi.ts` — tipado estricto
**Por qué:** La capa de comunicación con el DAW es la más crítica; `any` pierde garantías de TypeScript.  
**Archivo:** `src/services/abletonApi.ts` — líneas 294–295 (`tracks: any[]`), 299 (`devs: any[]`), 324 (`Map<string, any>`), 479–561 (`generateSimulatedToolResponse`)  
**Cambio:** Definir interfaces `RawLiveSet`, `RawTrack`, `RawDevice`, `RawParameter` que coincidan con lo que devuelve el canal (sin transformar). Usar `unknown` + type guards (`isLiveTrack`, `isLiveDevice`) en lugar de `any`.

---

### 14. [MEDIO] Respuestas simuladas (`generateSimulatedToolResponse`) que coincidan con shapes reales
**Por qué:** En modo simulado (DAW apagado) la app trabaja contra datos inventados. Deben tener la misma forma que las respuestas reales del canal.  
**Archivo:** `src/services/abletonApi.ts` — líneas 479–561  
**Cambio:** Para cada tool, shape de `result` idéntico al JSON real del canal. Usar `INITIAL_SIMULATED_SET` como base pero envolver en `{result: ..., isError: false}`. Para `ppal-read-track`, devolver track con `devices[]`. Para `ppal-read-device`, devolver `{path, name, parameters: [...]}`. Documentar en comentario el shape real esperado.

---

### 15. [MEDIO] Persistir undo/redo stacks en `useAutoSave` (ver #9)
**Por qué:** Al recargar la página, se pierde todo el historial. El usuario no puede deshacer acciones de sesiones previas.  
**Archivo:** `src/hooks/useDawHistory.ts` — exponer `undoStack`, `redoStack`, `currentSnapshot` para que `useAutoSave` los incluya.  
**Cambio:** En `useDawHistory` retorno, agregar `getStateForPersistence(): {undoStack, redoStack, currentSnapshot}`. En `useAutoSave`, serializar eso (con `replacer` para evitar circular refs). Al cargar, `useDawHistory` recibe `initialUndoStack`, `initialRedoStack`, `initialSnapshot` opcionales.

---

### 16. [BAJO] Agregar `ppal-duplicate` y `ppal-select` a la UI
**Por qué:** Tools existentes sin exposición. Duplicar pista/clip y seleccionar en Live son operaciones comunes.  
**Archivos:** `src/App.tsx` (handlers), `src/components/SetTreeColumn.tsx` (botones "Duplicar", "Seleccionar en Live").

---

### 17. [BAJO] `handleTogglePlayback`: leer escenas reales en lugar de hardcodear paths
**Por qué:** `path: 't0/s0,t1/s0,t2/s0'` asume tracks y escenas específicas.  
**Archivo:** `src/App.tsx` — línea 230  
**Cambio:** Llamar `ppal-read-live-set {include:['tracks','scenes']}` (si el canal lo soporta) o `ppal-read-scene` por track, y construir path dinámico.

---

## 3. Los 3 cambios que haría PRIMERO y por qué

| Orden | Cambio | Por qué es el primero |
|-------|--------|----------------------|
| **1** | **Fix `handleRefreshSet` para leer devices de cada pista** (#1) | Es la acción principal de sincronización. Si "Releer el set" no trae devices, **toda la columna izquierda miente** y ningún control de parámetros funciona. Bloquea el workflow real. |
| **2** | **Crate prompt slots: eliminar escritura falsa, alinear UI a solo-lectura real** (#2) | La app **miente activamente**: UI dice una cosa, código hace otra. La bitácora registra "éxito" en escrituras que Live ignora. Rompe la confianza en la herramienta. |
| **3** | **Error Boundary global** (#5) | Sin esto, cualquier bug en las mejoras 1–2 (o existente) **rompe la app en silencio** sin bitácora ni recovery. Es la red de seguridad para todo lo demás. |

---

## Nota sobre cambios ya corregidos (no repetir)
- ✅ Path del dispositivo Crate y pista del canal se resuelven con `resolveSpecialDevices()` (no hardcodeados).  
- ✅ Strings `"Error: ..."` del canal se marcan `isError: true` en bitácora (líneas 447–455 `abletonApi.ts`).  
- ✅ Modo simulado activado tras fallo de conexión (línea 464 `abletonApi.ts`).  
- ✅ Regla de oro: pista bridge protegida contra borrado (líneas 417–420 `App.tsx`).

---

## Próximos pasos sugeridos
1. Aplicar los 3 cambios prioritarios y verificar con `bun run lint` + prueba manual contra Live.  
2. Implementar #6 (leer clips) y #4 (undo/redo completo) en paralelo — son la base para que "Aplicar al DAW" y "Deshacer" sean confiables.  
3. Migrar `useAutoSave` a IndexedDB (#9) antes de que usuarios reales generen sets grandes.  
4. Añadir tests de integración contra `ppal-*` tools mockeados para evitar regresiones en el protocolo.