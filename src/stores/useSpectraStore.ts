import { create } from 'zustand';
import { OBSERVATION_RADIUS_METERS, EDI_BANDS } from '../lib/constants';
import type {
  AnomalyEvent,
  AppTab,
  CapabilityDescriptor,
  HeatSample,
  LocalPoint,
  SensorLayer,
  SensorSnapshot,
  SessionMode,
  SessionRecord,
} from '../lib/sensors/types';
import { detectCapabilities } from '../lib/sensors/capabilities';
import { spectraDB } from '../lib/storage/db';
import { clamp, monotonicNow, polarToCartesian } from '../lib/utils';

function initialSnapshot(): SensorSnapshot {
  return {
    timestamp: monotonicNow(),
    active: false,
    calibrationProgress: 0,
    edi: 0,
    ediBand: 'Quiet',
    contributors: { magnetic: 0, audio: 0, rf: 0, vibration: 0, light: 0, network: 0 },
    orientation: { timestamp: monotonicNow(), heading: null, alpha: null, beta: null, gamma: null, source: 'none' },
    magnetic: null,
    motion: null,
    audio: null,
    light: null,
    radio: null,
    capabilities: [],
    artifactPenalty: 0,
    correlationBonus: 0,
  };
}

function distance(path: LocalPoint[]) {
  return path.slice(1).reduce((sum, point, index) => {
    const prev = path[index];
    return sum + Math.hypot(point.x - prev.x, point.y - prev.y);
  }, 0);
}

function coverage(path: LocalPoint[], radius = OBSERVATION_RADIUS_METERS) {
  const cells = new Set(path.map((point) => `${Math.round(point.x / 2)}:${Math.round(point.y / 2)}`));
  return clamp((cells.size * 3.5) / (Math.PI * radius * radius), 0, 0.95);
}

function newSessionId() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  return `SES-${stamp}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

function initialNightExpedition() {
  try {
    return localStorage.getItem('spectra-night-expedition') === 'true';
  } catch {
    return false;
  }
}

interface SpectraState {
  activeTab: AppTab;
  activeLayer: SensorLayer;
  activeScan: boolean;
  soundMuted: boolean;
  nightExpedition: boolean;
  snapshot: SensorSnapshot;
  capabilities: CapabilityDescriptor[];
  session: SessionRecord | null;
  events: AnomalyEvent[];
  path: LocalPoint[];
  heat: HeatSample[];
  lastError: string | null;
  onboardingDismissed: boolean;
  setActiveTab: (tab: AppTab) => void;
  setActiveLayer: (layer: SensorLayer) => void;
  setSoundMuted: (muted: boolean) => void;
  setNightExpedition: (enabled: boolean) => void;
  toggleNightExpedition: () => void;
  dismissOnboarding: () => void;
  refreshCapabilities: () => Promise<void>;
  startSession: (mode?: SessionMode) => Promise<SessionRecord>;
  completeSession: () => Promise<void>;
  markInterrupted: () => Promise<void>;
  ingestSnapshot: (snapshot: SensorSnapshot) => void;
  recordEvent: (event: AnomalyEvent) => Promise<void>;
  appendPathPoint: (point: LocalPoint) => Promise<void>;
  stepPath: (heading: number | null, stepMeters?: number) => Promise<LocalPoint>;
  addHeatSample: (sample: HeatSample) => Promise<void>;
  clearSessionData: () => void;
}

export const useSpectraStore = create<SpectraState>((set, get) => ({
  activeTab: 'home',
  activeLayer: 'all',
  activeScan: false,
  soundMuted: false,
  nightExpedition: initialNightExpedition(),
  snapshot: initialSnapshot(),
  capabilities: [],
  session: null,
  events: [],
  path: [{ x: 0, y: 0, uncertainty: 0.8, timestamp: monotonicNow() }],
  heat: [],
  lastError: null,
  onboardingDismissed: false,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveLayer: (layer) => set({ activeLayer: layer }),
  setSoundMuted: (muted) => set({ soundMuted: muted }),
  setNightExpedition: (enabled) => {
    try {
      localStorage.setItem('spectra-night-expedition', String(enabled));
    } catch {
      // localStorage may be unavailable in hardened browsing modes.
    }
    set({ nightExpedition: enabled });
  },
  toggleNightExpedition: () => {
    const enabled = !get().nightExpedition;
    try {
      localStorage.setItem('spectra-night-expedition', String(enabled));
    } catch {
      // localStorage may be unavailable in hardened browsing modes.
    }
    set({ nightExpedition: enabled });
  },
  dismissOnboarding: () => set({ onboardingDismissed: true }),
  refreshCapabilities: async () => {
    try {
      const capabilities = await detectCapabilities();
      set((state) => ({ capabilities, snapshot: { ...state.snapshot, capabilities }, lastError: null }));
    } catch (error) {
      set({ lastError: error instanceof Error ? error.message : 'Capability scan failed.' });
    }
  },
  startSession: async (mode = 'quick') => {
    const state = get();
    const capabilities = state.capabilities.length ? state.capabilities : await detectCapabilities();
    const id = newSessionId();
    const startPoint: LocalPoint = { x: 0, y: 0, uncertainty: 0.8, timestamp: monotonicNow() };
    const session: SessionRecord = {
      id,
      startedAt: Date.now(),
      mode,
      radiusMeters: OBSERVATION_RADIUS_METERS,
      privacy: 'local-only',
      recording: 'derived-only',
      status: 'active',
      capabilities,
      eventCount: 0,
      maxEdi: 0,
      distanceMeters: 0,
      coverageEstimate: 0,
    };
    await spectraDB.sessions.put(session);
    set({
      session,
      activeScan: true,
      capabilities,
      events: [],
      heat: [],
      path: [startPoint],
      snapshot: { ...initialSnapshot(), active: true, capabilities },
      lastError: null,
      onboardingDismissed: true,
    });
    await spectraDB.path.add({ ...startPoint, sessionId: id });
    return session;
  },
  completeSession: async () => {
    const { session, events, path } = get();
    if (!session) {
      set({ activeScan: false, snapshot: { ...get().snapshot, active: false } });
      return;
    }
    const updated: SessionRecord = {
      ...session,
      endedAt: Date.now(),
      status: 'complete',
      eventCount: events.length,
      distanceMeters: distance(path),
      coverageEstimate: coverage(path, session.radiusMeters),
      maxEdi: Math.max(session.maxEdi, get().snapshot.edi),
    };
    await spectraDB.sessions.put(updated);
    set({ session: updated, activeScan: false, snapshot: { ...get().snapshot, active: false } });
  },
  markInterrupted: async () => {
    const { session } = get();
    if (session?.status === 'active') await spectraDB.sessions.put({ ...session, status: 'interrupted', endedAt: Date.now() });
    set({ activeScan: false, snapshot: { ...get().snapshot, active: false } });
  },
  ingestSnapshot: (snapshot) => {
    const band = EDI_BANDS.find((item) => snapshot.edi >= item.min && snapshot.edi <= item.max)?.label ?? 'Quiet';
    set((state) => ({
      snapshot: { ...snapshot, ediBand: band, active: state.activeScan, capabilities: state.capabilities },
      session: state.session
        ? { ...state.session, maxEdi: Math.max(state.session.maxEdi, snapshot.edi), coverageEstimate: coverage(state.path, state.session.radiusMeters) }
        : state.session,
    }));
  },
  recordEvent: async (event) => {
    const session = get().session;
    const eventWithSession = { ...event, sessionId: session?.id };
    if (session) await spectraDB.events.put(eventWithSession);
    set((state) => ({
      events: [eventWithSession, ...state.events].slice(0, 300),
      session: state.session ? { ...state.session, eventCount: state.events.length + 1, maxEdi: Math.max(state.session.maxEdi, state.snapshot.edi) } : state.session,
    }));
  },
  appendPathPoint: async (point) => {
    const session = get().session;
    if (session) await spectraDB.path.add({ ...point, sessionId: session.id });
    set((state) => ({
      path: [...state.path, point].slice(-1600),
      session: state.session
        ? { ...state.session, distanceMeters: distance([...state.path, point]), coverageEstimate: coverage([...state.path, point], state.session.radiusMeters) }
        : state.session,
    }));
  },
  stepPath: async (heading, stepMeters = 0.72) => {
    const { path } = get();
    const last = path[path.length - 1] ?? { x: 0, y: 0, uncertainty: 1, timestamp: monotonicNow() };
    const delta = polarToCartesian(stepMeters, heading ?? 0);
    const next: LocalPoint = {
      x: clamp(last.x + delta.x, -OBSERVATION_RADIUS_METERS, OBSERVATION_RADIUS_METERS),
      y: clamp(last.y + delta.y, -OBSERVATION_RADIUS_METERS, OBSERVATION_RADIUS_METERS),
      uncertainty: clamp(last.uncertainty + 0.045, 0.8, 6),
      timestamp: monotonicNow(),
    };
    await get().appendPathPoint(next);
    return next;
  },
  addHeatSample: async (sample) => {
    const session = get().session;
    const saved = { ...sample, sessionId: session?.id ?? 'unsaved' };
    if (session) await spectraDB.heat.put(saved);
    set((state) => ({ heat: [...state.heat, sample].slice(-2400) }));
  },
  clearSessionData: () => set({ events: [], heat: [], path: [{ x: 0, y: 0, uncertainty: 0.8, timestamp: monotonicNow() }], session: null }),
}));
