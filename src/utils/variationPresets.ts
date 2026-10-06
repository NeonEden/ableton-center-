import { VariationPreset } from '../types/ableton';

export const VARIATION_PRESETS: VariationPreset[] = [
  {
    id: 'var_kick_drop',
    name: 'Corte de Bombo & Drop (Transición compás 4)',
    description: 'Mutea el bombo en los tiempos 3 y 4 del último compás para crear caída limpia antes del estribillo o verso.',
    category: 'drums',
    targetTrackType: 'audio',
    transforms: 'drop(kick, 4|3, 4|4)',
    notesString: [
      '// Compás 1-3: Groove base',
      'v100 n/4 C1 1|1', 'v100 n/4 D1 1|2', 'v100 n/4 C1 1|2.5', 'v100 n/4 D1 1|4',
      'v100 n/4 C1 2|1', 'v100 n/4 D1 2|2', 'v100 n/4 C1 2|2.5', 'v100 n/4 D1 2|4',
      'v100 n/4 C1 3|1', 'v100 n/4 D1 3|2', 'v100 n/4 C1 3|2.5', 'v100 n/4 D1 3|4',
      '// Compás 4: Drop de bombo, queda caja y hihat abierto',
      'v100 n/4 C1 4|1', 'v100 n/4 D1 4|2', 'v92 n/8 A#1 4|3.5', 'v105 n/4 D1 4|4'
    ].join('\n')
  },
  {
    id: 'var_ghost_snare',
    name: 'Redoble Ghost Snare (Caja fantasma 16ths)',
    description: 'Añade notas fantasma sincopadas en la caja (velocities 42-65) con swing y remate con rimshot.',
    category: 'drums',
    targetTrackType: 'midi',
    transforms: 'humanize(velocity, 8)\nswing(16th, 54%)',
    notesString: [
      '// Compás 4 con ghost notes',
      'v98 n/4 D1 4|1',
      'v45 n/16 D1 4|1.75',
      'v98 n/4 D1 4|2',
      'v52 n/16 D1 4|2.75',
      'v48 n/16 D1 4|3.25',
      'v62 n/16 D1 4|3.75',
      'v108 n/4 D1 4|4',
      'v70 n/8 D1 4|4.5'
    ].join('\n')
  },
  {
    id: 'var_hihat_ratchet',
    name: 'Hi-Hat Ratchet Roll (Subdivisión 1/32)',
    description: 'Subdivide los charles en tresillos y 1/32 en el tiempo 4|3 y 4|4 simulando repetición MPC.',
    category: 'drums',
    targetTrackType: 'midi',
    transforms: 'ratchet(32nd, 4|3.5)',
    notesString: [
      '// Ratchet 1/32 en hats para rematar',
      'v85 n/16 F#1 4|1', 'v82 n/16 F#1 4|1.5',
      'v85 n/16 F#1 4|2', 'v82 n/16 F#1 4|2.5',
      'v85 n/16 F#1 4|3',
      'v78 n/32 F#1 4|3.5',
      'v82 n/32 F#1 4|3.75',
      'v90 n/32 F#1 4|4',
      'v88 n/32 F#1 4|4.25',
      'v70 n/16 F#1 4|4.5'
    ].join('\n')
  },
  {
    id: 'var_breakbeat_mpc',
    name: 'Breakbeat MPC60 Fill Completo',
    description: 'Fill completo de remate estilo clásico New York / Dilla con toms acústicos y caja arrastrada.',
    category: 'drums',
    targetTrackType: 'audio',
    transforms: 'groove(mpc60, 54%)\nwarp(beats)',
    notesString: [
      '// Fill completo 4to compás',
      'v105 n/8 C1 4|1',
      'v95 n/8 G1 4|2',
      'v92 n/8 G1 4|2.5',
      'v98 n/8 A1 4|3',
      'v102 n/8 A1 4|3.5',
      'v115 n/4 D1 4|4'
    ].join('\n')
  },
  {
    id: 'var_rhodes_altered',
    name: 'Voicing Alterado Rhodes (Neo-Soul Turnaround)',
    description: 'Sustitución de paso en compás 4: Cmaj9 -> Bbm9 -> Eb13 -> Abmaj7 -> G7alt para resolver a C.',
    category: 'harmony',
    targetTrackType: 'midi',
    transforms: 'swing(16th, 12ms)',
    notesString: [
      '// Compás 4: G7(b9,#11) altered turnaround',
      'v90 n/2 G2 4|1',
      'v88 n/2 F3 4|1',
      'v85 n/2 B3 4|1',
      'v92 n/2 Eb4 4|1',
      'v89 n/2 Ab4 4|1'
    ].join('\n')
  }
];
