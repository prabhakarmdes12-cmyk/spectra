import type { EDI_WEIGHTS } from '../constants';

export type SensorFamily = 'magnetic' | 'audio' | 'rf' | 'motion' | 'vibration' | 'light' | 'network' | 'correlation';
export type SpatialClass = 'MEASURED' | 'ESTIMATED' | 'UNKNOWN_ORIGIN';
export type CapabilityState = 'available' | 'limited' | 'unavailable' | 'permission-required' | 'active';
export type SessionMode = 'quick' | 'expedition' | 'lab' | 'group';
export type SensorLayer = 'all' | 'magnetic' | 'audio' | 'rf' | 'motion' | 'light' | 'spatial';
export type AppTab = 'home' | 'radar' | 'ar' | 'heat' | 'audio' | 'report';

export interface CapabilityDescriptor {
  id: string;
  label: string;
  state: CapabilityState;
  detail: string;
  permission?: PermissionState | 'prompt' | 'unknown' | 'granted' | 'denied';
  quality: number;
}

export interface OrientationSample {
  timestamp: number;
  heading: number | null;
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  compassAccuracy?: number | null;
  source: 'deviceorientation' | 'magnetometer' | 'none';
}

export interface MagneticSample {
  timestamp: number;
  x: number;
  y: number;
  z: number;
  magnitude: number;
  unit: 'µT';
  source: 'magnetometer' | 'orientation-derived' | 'unavailable';
}

export interface MotionSample {
  timestamp: number;
  acceleration: { x: number; y: number; z: number };
  accelerationIncludingGravity: { x: number; y: number; z: number };
  rotationRate: { alpha: number; beta: number; gamma: number };
  magnitude: number;
  jerk: number;
  vibration: number;
  isWalking: boolean;
  stepCount: number;
  stepImpulse: boolean;
  contamination: number;
}

export interface AudioFeatureSample {
  timestamp: number;
  rms: number;
  peak: number;
  lowFrequencyRumble: number;
  spectralCentroid: number;
  transient: number;
  clipping: boolean;
  sampleRate: number;
  fftSize: number;
  waveform?: Uint8Array;
  spectrum?: Uint8Array;
}

export interface LightSample {
  timestamp: number;
  lux: number | null;
  source: 'ambient-light' | 'camera-luminance' | 'unavailable';
}

export interface RadioBeacon {
  id: string;
  label: string;
  rssi?: number;
  lastSeen: number;
  source: 'bluetooth' | 'wifi' | 'simulation';
  simulated?: boolean;
}

export interface RadioSample {
  timestamp: number;
  supported: boolean;
  scanning: boolean;
  density: number;
  churn: number;
  beacons: RadioBeacon[];
  mode: 'live' | 'unsupported' | 'simulation-disabled';
}

export interface EDIContributors {
  magnetic: number;
  audio: number;
  rf: number;
  vibration: number;
  light: number;
  network: number;
}

export type EDIWeights = typeof EDI_WEIGHTS;

export interface SensorSnapshot {
  timestamp: number;
  active: boolean;
  calibrationProgress: number;
  edi: number;
  ediBand: string;
  contributors: EDIContributors;
  orientation: OrientationSample;
  magnetic: MagneticSample | null;
  motion: MotionSample | null;
  audio: AudioFeatureSample | null;
  light: LightSample | null;
  radio: RadioSample | null;
  capabilities: CapabilityDescriptor[];
  artifactPenalty: number;
  correlationBonus: number;
}

export interface LocalPoint {
  x: number;
  y: number;
  uncertainty: number;
  timestamp: number;
}

export interface AnomalyEvent {
  id: string;
  sessionId?: string;
  timestamp: number;
  wallTime: string;
  type: `${Uppercase<string>}`;
  family: SensorFamily;
  title: string;
  summary: string;
  magnitude: number;
  rawValue: number;
  rawUnit: string;
  baselineDelta: number;
  confidence: number;
  measurementConfidence: number;
  spatialClass: SpatialClass;
  spatialConfidence: number;
  position?: LocalPoint;
  region?: { x: number; y: number; radius: number; uncertainty: number };
  sourceSensors: SensorFamily[];
  correlatedEventIds: string[];
  explanations: string[];
  artifactFlags: string[];
}

export interface HeatSample {
  id: string;
  timestamp: number;
  family: SensorFamily;
  x: number;
  y: number;
  intensity: number;
  confidence: number;
  uncertainty: number;
}

export interface SessionRecord {
  id: string;
  startedAt: number;
  endedAt?: number;
  mode: SessionMode;
  radiusMeters: number;
  privacy: 'local-only';
  recording: 'derived-only' | 'audio-enabled' | 'video-enabled';
  status: 'active' | 'complete' | 'interrupted';
  capabilities: CapabilityDescriptor[];
  eventCount: number;
  maxEdi: number;
  distanceMeters: number;
  coverageEstimate: number;
}

export interface EvidenceExport {
  session: SessionRecord;
  events: AnomalyEvent[];
  path: LocalPoint[];
  heat: HeatSample[];
  generatedAt: string;
}
