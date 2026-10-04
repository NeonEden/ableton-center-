import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'centro_creativo_session_v1';

export function useAutoSave<T>(data: T, onLoaded?: (data: T) => void) {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('Al inicio');
  const isFirstMount = useRef(true);

  // Load from local storage on first mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && onLoaded) {
        const parsed = JSON.parse(saved);
        onLoaded(parsed);
      }
    } catch (err) {
      console.warn('No se pudo cargar la sesión previa:', err);
    }
    isFirstMount.current = false;
  }, []);

  // Save on state change with debounce
  useEffect(() => {
    if (isFirstMount.current) return;

    setSaveStatus('saving');
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setSaveStatus('saved');
        const now = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSavedTime(now);
      } catch (err) {
        console.error('Error al guardar en almacenamiento local:', err);
        setSaveStatus('idle');
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [data]);

  const forceSave = (overrideData?: T) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(overrideData || data));
      setSaveStatus('saved');
      const now = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTime(now);
    } catch (err) {
      console.error('Error en guardado manual:', err);
    }
  };

  const clearSave = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setLastSavedTime('Reinicio de fábrica');
    } catch (err) {
      console.error('Error al limpiar almacenamiento:', err);
    }
  };

  return { saveStatus, lastSavedTime, forceSave, clearSave };
}
