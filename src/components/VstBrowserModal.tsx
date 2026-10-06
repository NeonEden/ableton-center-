import React, { useState, useEffect } from 'react';
import { VstPlugin } from '../types/ableton';
import { Search, Sliders, CheckCircle2, Plus, Sparkles, X } from 'lucide-react';

export const USER_VST_PLUGINS: VstPlugin[] = [
  {
    name: 'FabFilter Pro-Q 4',
    vendor: 'FabFilter',
    format: 'VST3',
    deviceKind: 'audiofx',
    category: 'Ecualización Dinámica',
    defaultPreset: 'Vocal De-Box & Warm Mid',
    installedVersion: 'v4.02',
    tags: ['EQ', 'Linear Phase', 'Dynamic EQ', 'Mid/Side']
  },
  {
    name: 'FabFilter Pro-DS',
    vendor: 'FabFilter',
    format: 'VST3',
    deviceKind: 'audiofx',
    category: 'De-Esser & Dinámica',
    defaultPreset: 'Single Vocal Warm De-Ess',
    installedVersion: 'v1.18',
    tags: ['De-Esser', 'Vocal', 'High Frequencies']
  },
  {
    name: 'FabFilter Pro-L 2',
    vendor: 'FabFilter',
    format: 'VST3',
    deviceKind: 'audiofx',
    category: 'Limitador de Pico Verdadero',
    defaultPreset: 'Hip-Hop Transparent Ceiling',
    installedVersion: 'v2.24',
    tags: ['Limiter', 'True Peak', 'LUFS', 'Mastering']
  },
  {
    name: 'oeksound soothe2',
    vendor: 'oeksound',
    format: 'VST3',
    deviceKind: 'audiofx',
    category: 'Supresor de Resonancias Dinámico',
    defaultPreset: 'Harshness Tamer 3.4kHz',
    installedVersion: 'v1.3.1',
    tags: ['Resonance', 'Suppression', 'Sibilance', 'Harshness']
  },
  {
    name: 'Auto-Tune Pro 11',
    vendor: 'Antares',
    format: 'VST3',
    deviceKind: 'audiofx',
    category: 'Corrección de Tono',
    defaultPreset: 'Natural Warm Pitch Correction',
    installedVersion: 'v11.0.1',
    tags: ['Pitch', 'Vocal', 'Tuning', 'Formant']
  },
  {
    name: 'Valhalla VintageVerb',
    vendor: 'Valhalla DSP',
    format: 'VST3',
    deviceKind: 'audiofx',
    category: 'Reverberación Algorítmica',
    defaultPreset: '1970s Dark Plate (Warmth)',
    installedVersion: 'v4.0.0',
    tags: ['Reverb', 'Vintage', 'Plate', 'Space']
  },
  {
    name: 'Valhalla Delay',
    vendor: 'Valhalla DSP',
    format: 'VST3',
    deviceKind: 'audiofx',
    category: 'Eco y Modulación de Cinta',
    defaultPreset: 'Tape Echo Dub Slap',
    installedVersion: 'v2.5.0',
    tags: ['Delay', 'Tape', 'Bucket Brigade', 'Modulation']
  },
  {
    name: 'Arturia Stage-73 V',
    vendor: 'Arturia',
    format: 'VST3',
    deviceKind: 'synth',
    category: 'Piano Eléctrico Vintage',
    defaultPreset: 'Warm Soul Rhodes Suitcase',
    installedVersion: 'v2.6.1',
    tags: ['Keys', 'Rhodes', 'Vintage', 'Soul']
  },
  {
    name: 'Arturia Mini V',
    vendor: 'Arturia',
    format: 'VST3',
    deviceKind: 'synth',
    category: 'Sintetizador Analógico Monofónico',
    defaultPreset: 'D-Funk Fat Sub Bass',
    installedVersion: 'v4.1.0',
    tags: ['Bass', 'Moog', 'Sub', 'Analog']
  },
  {
    name: 'Arturia Analog Lab Pro',
    vendor: 'Arturia',
    format: 'VST3',
    deviceKind: 'synth',
    category: 'Colección de Teclados Legendarios',
    defaultPreset: 'Boom Bap Dusty Wurli',
    installedVersion: 'v5.9.0',
    tags: ['Sound Bank', 'Vintage', 'Multi-Engine']
  },
  {
    name: 'iZotope Ozone 12 Advanced',
    vendor: 'iZotope',
    format: 'VST3',
    deviceKind: 'audiofx',
    category: 'Suite de Masterización',
    defaultPreset: 'Vintage Limiter -19.6 LUFS Target',
    installedVersion: 'v12.1.0',
    tags: ['Mastering', 'Maximizer', 'Imager', 'Clarity']
  },
  {
    name: 'ADPTR Audio MetricAB',
    vendor: 'Plugin Alliance',
    format: 'VST3',
    deviceKind: 'analyzer',
    category: 'Análisis de Referencia A/B',
    defaultPreset: 'Hip-Hop Soul Reference Spectrum',
    installedVersion: 'v1.4.2',
    tags: ['LUFS', 'Spectrum', 'Phase', 'A/B Reference']
  }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tracks: { path: string; name: string }[];
  onInsertPlugin: (plugin: VstPlugin, targetTrackPath: string) => void;
}

export const VstBrowserModal: React.FC<Props> = ({
  isOpen,
  onClose,
  tracks,
  onInsertPlugin
}) => {
  const [query, setQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTrack, setSelectedTrack] = useState<string>(tracks[0]?.path || 't0');
  const [insertedPluginName, setInsertedPluginName] = useState<string | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const vendors = Array.from(new Set(USER_VST_PLUGINS.map((p) => p.vendor)));

  const filtered = USER_VST_PLUGINS.filter((p) => {
    const matchesQuery =
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
    const matchesVendor = selectedVendor === 'all' || p.vendor === selectedVendor;
    const matchesKind = selectedCategory === 'all' || p.deviceKind === selectedCategory;
    return matchesQuery && matchesVendor && matchesKind;
  });

  const handleInsert = (plugin: VstPlugin) => {
    onInsertPlugin(plugin, selectedTrack);
    setInsertedPluginName(plugin.name);
    setTimeout(() => setInsertedPluginName(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-4xl bg-[#14161c] border border-[#252830] rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#252830] bg-[#101217]">
          <div className="flex items-center gap-3">
            <Sliders className="w-5 h-5 text-[#ff7034]" />
            <div>
              <h2 className="text-base font-semibold text-[#f0f2f5] tracking-tight">
                Biblioteca de Plugins VST3 (528 detectados)
              </h2>
              <p className="text-xs text-[#8c93a0]">
                Ecosistema de producción Windows 11 · Ableton Live 12.4.6 Suite
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

        {/* Toolbar: Search, Filters, Target Track */}
        <div className="p-4 border-b border-[#252830] bg-[#12141a] flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8c93a0]" />
            <input
              type="text"
              placeholder="Buscar por nombre, preset, tag (FabFilter, soothe2, Valhalla, Moog...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#181b22] border border-[#2d323e] rounded-lg text-sm text-[#f0f2f5] placeholder-[#606775] focus:outline-none focus:border-[#ff7034]"
            />
          </div>

          {/* Vendor Filter */}
          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className="bg-[#181b22] border border-[#2d323e] text-xs text-[#d2d6e0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#ff7034]"
          >
            <option value="all">Todos los fabricantes</option>
            {vendors.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#181b22] border border-[#2d323e] text-xs text-[#d2d6e0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#ff7034]"
          >
            <option value="all">Todo tipo de procesador</option>
            <option value="audiofx">Efectos de Audio (EQ, Dinámica, Reverb)</option>
            <option value="synth">Sintetizadores e Instrumentos</option>
            <option value="analyzer">Analizadores y Medición</option>
          </select>

          {/* Destination Track */}
          <div className="flex items-center gap-2 bg-[#181b22] px-3 py-1.5 rounded-lg border border-[#2d323e]">
            <span className="text-xs text-[#8c93a0] whitespace-nowrap">Pista destino:</span>
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="bg-transparent text-xs text-[#ff7034] font-medium focus:outline-none cursor-pointer"
            >
              {tracks.map((t) => (
                <option key={t.path} value={t.path} className="bg-[#181b22] text-[#f0f2f5]">
                  [{t.path}] {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Plugin Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((plugin) => (
            <div
              key={plugin.name}
              className="p-3.5 bg-[#171a21] hover:bg-[#1c202a] border border-[#262a34] rounded-lg flex flex-col justify-between transition-colors group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-[#f0f2f5] group-hover:text-[#ff7034] transition-colors">
                      {plugin.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[#8c93a0] mt-0.5">
                      <span>{plugin.vendor}</span>
                      <span aria-hidden="true">·</span>
                      <span>{plugin.format}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#a0a8b8]">{plugin.category}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#6c7484] px-1.5 py-0.5 bg-[#101217] rounded">
                    {plugin.installedVersion}
                  </span>
                </div>

                {plugin.defaultPreset && (
                  <div className="mt-2 text-xs text-[#9da5b4] flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#ff9e6a]" />
                    <span>Preset recomendado: <strong className="text-[#d8dde6] font-medium">{plugin.defaultPreset}</strong></span>
                  </div>
                )}

                <div className="mt-2 flex flex-wrap gap-1">
                  {plugin.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] text-[#788294] bg-[#12141a] px-1.5 py-0.5 rounded border border-[#232731]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#232731] flex items-center justify-between">
                <span className="text-[11px] text-[#6c7484]">
                  Inyecta en cadena vía <code className="text-[#8c93a0]">ppal-create-device</code>
                </span>
                <button
                  onClick={() => handleInsert(plugin)}
                  className="px-2.5 py-1 text-xs font-medium text-white bg-[#252a36] hover:bg-[#ff7034] rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insertar</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer status notice */}
        <div className="px-6 py-3 border-t border-[#252830] bg-[#101217] flex items-center justify-between text-xs text-[#8c93a0]">
          <span>
            {insertedPluginName ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Se insertó <strong>{insertedPluginName}</strong> en la pista destino {selectedTrack}.
              </span>
            ) : (
              'Live 12 Suite gestiona automáticamente el mapeo de parámetros VST3 en rack o canal.'
            )}
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
