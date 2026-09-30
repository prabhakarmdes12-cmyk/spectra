export const APP_NAME = 'CHITI SPECTRA';
export const OBSERVATION_RADIUS_METERS = 30;

export const COLORS = {
  space: '#050508',
  cyan: '#00f0ff',
  purple: '#a855f7',
  amber: '#f59e0b',
  phosphor: '#10b981',
  white: '#eefcff',
} as const;

export const EDI_WEIGHTS = {
  magnetic: 0.24,
  audio: 0.24,
  rf: 0.13,
  vibration: 0.18,
  light: 0.11,
  network: 0.1,
} as const;

export const EDI_BANDS = [
  { min: 0, max: 24, label: 'Quiet', color: COLORS.phosphor, summary: 'Near local baseline' },
  { min: 25, max: 49, label: 'Active', color: COLORS.cyan, summary: 'Modest deviations' },
  { min: 50, max: 74, label: 'Elevated', color: COLORS.amber, summary: 'Strong or repeated deviations' },
  { min: 75, max: 100, label: 'High', color: COLORS.purple, summary: 'Persistent multi-sensor disturbance' },
] as const;

export const SENSOR_FAMILY_LABELS = {
  magnetic: 'Magnetic',
  audio: 'Audio',
  rf: 'RF',
  motion: 'Motion',
  vibration: 'Vibration',
  light: 'Light',
  network: 'Network',
  correlation: 'Correlation',
} as const;
