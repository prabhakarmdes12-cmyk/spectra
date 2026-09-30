import { EDI_WEIGHTS } from '../constants';
import { checkpointSample } from '../storage/db';
import { useSpectraStore } from '../../stores/useSpectraStore';
import { clamp, monotonicNow, shortTimestamp } from '../utils';
import { AudioAdapter } from './audio';
import { MultiBaselineCalibrator } from './baseline';
import { LightAdapter } from './light';
import { MotionAdapter } from './motion';
import { OrientationAdapter } from './orientation';
import { RadioAdapter } from './radio';
import type { AnomalyEvent, EDIContributors, HeatSample, SensorFamily, SensorSnapshot } from './types';

type BaselineKey = 'magnetic' | 'audio' | 'rf' | 'vibration' | 'light' | 'network';

const BASELINE_KEYS: BaselineKey[] = ['magnetic', 'audio', 'rf', 'vibration', 'light', 'network'];

interface EventCandidate {
  family: SensorFamily;
  type: AnomalyEvent['type'];
  title: string;
  summary: string;
  magnitude: number;
  rawValue: number;
  rawUnit: string;
  baselineDelta: number;
  spatial: AnomalyEvent['spatialClass'];
  measurementConfidence: number;
  explanations: string[];
  artifactFlags?: string[];
}

export class SensorFusionEngine {
  private readonly orientation = new OrientationAdapter();
  private readonly motion = new MotionAdapter();
  private readonly audio = new AudioAdapter();
  private readonly light = new LightAdapter();
  private readonly radio = new RadioAdapter();
  private readonly baseline = new MultiBaselineCalibrator<BaselineKey>(BASELINE_KEYS, 60_000);
  private running = false;
  private frame = 0;
  private intervalId: number | null = null;
  private lastStepCount = 0;
  private lastEventAt = new Map<SensorFamily, number>();
  private lastCheckpoint = 0;
  private eventCounter = 0;

  async start() {
    if (this.running) return;
    this.running = true;
    this.baseline.reset();
    this.lastStepCount = 0;
    const startPromises = [
      this.orientation.start(),
      this.motion.start(),
      this.light.start(),
      this.radio.startPassiveScan(),
      this.audio.start(),
    ];
    await Promise.allSettled(startPromises);
    await this.audio.resume();
    this.intervalId = window.setInterval(() => this.tick(), 100);
    this.tick();
  }

  async stop() {
    this.running = false;
    if (this.intervalId) window.clearInterval(this.intervalId);
    this.intervalId = null;
    this.orientation.stop();
    this.motion.stop();
    this.audio.stop();
    this.light.stop();
    this.radio.stop();
  }

  async requestBluetoothDevice() {
    return this.radio.requestOneDevice();
  }

  private tick() {
    if (!this.running) return;
    const state = useSpectraStore.getState();
    const timestamp = monotonicNow();
    const orientation = this.orientation.readOrientation();
    const magnetic = this.orientation.readMagnetic();
    const motion = this.motion.read();
    const audio = this.audio.read();
    const light = this.light.read();
    const radio = this.radio.read();

    if (motion?.stepImpulse && motion.stepCount !== this.lastStepCount) {
      this.lastStepCount = motion.stepCount;
      void state.stepPath(orientation.heading).then((point) => {
        const sample: HeatSample = {
          id: crypto.randomUUID(),
          timestamp,
          family: 'motion',
          x: point.x,
          y: point.y,
          intensity: clamp(motion.vibration, 0.05, 1),
          confidence: 0.65,
          uncertainty: point.uncertainty,
        };
        void useSpectraStore.getState().addHeatSample(sample);
      });
    }

    const magneticValue = magnetic?.magnitude ?? 0;
    const audioValue = audio?.rms ?? 0;
    const vibrationValue = motion?.vibration ?? 0;
    const lightValue = light?.lux ?? 0;
    const rfValue = radio.density;
    const networkValue = radio.churn;

    const magneticStats = this.baseline.push('magnetic', magneticValue, timestamp);
    const audioStats = this.baseline.push('audio', audioValue, timestamp);
    const vibrationStats = this.baseline.push('vibration', vibrationValue, timestamp);
    const lightStats = this.baseline.push('light', lightValue, timestamp);
    const rfStats = this.baseline.push('rf', rfValue, timestamp);
    const networkStats = this.baseline.push('network', networkValue, timestamp);

    const contributors: EDIContributors = {
      magnetic: magnetic ? magneticStats.normalized : 0,
      audio: audio ? Math.max(audioStats.normalized, audio.transient * 0.85, audio.lowFrequencyRumble * 0.25) : 0,
      vibration: motion ? Math.max(vibrationStats.normalized, vibrationValue) : 0,
      light: light?.lux != null ? lightStats.normalized : 0,
      rf: radio.supported ? rfStats.normalized : 0,
      network: radio.supported ? networkStats.normalized : 0,
    };

    const artifactPenalty = clamp((motion?.contamination ?? 0) * 0.22 + (audio?.clipping ? 0.12 : 0), 0, 0.35);
    const activeContributors = Object.values(contributors).filter((value) => value > 0.42).length;
    const correlationBonus = activeContributors >= 2 ? clamp((activeContributors - 1) * 0.055, 0, 0.14) : 0;
    const weighted =
      contributors.magnetic * EDI_WEIGHTS.magnetic +
      contributors.audio * EDI_WEIGHTS.audio +
      contributors.rf * EDI_WEIGHTS.rf +
      contributors.vibration * EDI_WEIGHTS.vibration +
      contributors.light * EDI_WEIGHTS.light +
      contributors.network * EDI_WEIGHTS.network;
    const edi = clamp(weighted + correlationBonus - artifactPenalty, 0, 1) * 100;

    const snapshot: SensorSnapshot = {
      timestamp,
      active: state.activeScan,
      calibrationProgress: this.baseline.progress(),
      edi,
      ediBand: 'Quiet',
      contributors,
      orientation,
      magnetic,
      motion,
      audio,
      light,
      radio,
      capabilities: state.capabilities,
      artifactPenalty,
      correlationBonus,
    };

    state.ingestSnapshot(snapshot);
    this.captureHeatSamples(snapshot);
    this.detectEvents(snapshot, {
      magneticDelta: magneticStats.delta,
      audioDelta: audioStats.delta,
      vibrationDelta: vibrationStats.delta,
      lightDelta: lightStats.delta,
      rfDelta: rfStats.delta,
      networkDelta: networkStats.delta,
    });

    const sessionId = useSpectraStore.getState().session?.id;
    if (sessionId && timestamp - this.lastCheckpoint > 1000) {
      this.lastCheckpoint = timestamp;
      void checkpointSample(sessionId, snapshot);
    }
    this.frame += 1;
  }

  private captureHeatSamples(snapshot: SensorSnapshot) {
    if (this.frame % 5 !== 0) return;
    const { path } = useSpectraStore.getState();
    const point = path[path.length - 1];
    if (!point || point.uncertainty > 6) return;
    const entries: Array<[SensorFamily, number]> = [
      ['magnetic', snapshot.contributors.magnetic],
      ['audio', snapshot.contributors.audio],
      ['vibration', snapshot.contributors.vibration],
      ['light', snapshot.contributors.light],
      ['rf', snapshot.contributors.rf],
    ];
    for (const [family, intensity] of entries) {
      if (intensity < 0.08) continue;
      void useSpectraStore.getState().addHeatSample({
        id: crypto.randomUUID(),
        timestamp: snapshot.timestamp,
        family,
        x: point.x,
        y: point.y,
        intensity,
        confidence: clamp(1 - point.uncertainty / 8, 0.15, 0.9),
        uncertainty: point.uncertainty,
      });
    }
  }

  private detectEvents(
    snapshot: SensorSnapshot,
    deltas: { magneticDelta: number; audioDelta: number; vibrationDelta: number; lightDelta: number; rfDelta: number; networkDelta: number },
  ) {
    const candidates: EventCandidate[] = [];
    if (snapshot.magnetic && snapshot.contributors.magnetic > 0.62) {
      candidates.push({
        family: 'magnetic',
        type: 'MAGNETIC_SPIKE',
        title: 'Magnetic field deviation',
        summary: 'Phone-local magnetic magnitude rose above its rolling baseline.',
        magnitude: snapshot.contributors.magnetic,
        rawValue: snapshot.magnetic.magnitude,
        rawUnit: snapshot.magnetic.unit,
        baselineDelta: deltas.magneticDelta,
        spatial: 'MEASURED',
        measurementConfidence: 0.86,
        explanations: ['Nearby magnetized metal, speaker/motor, wiring, or moved ferrous object.', 'Repeat from three positions before inferring a region.'],
        artifactFlags: snapshot.motion && snapshot.motion.contamination > 0.55 ? ['phone-motion-contamination'] : [],
      });
    }
    if (snapshot.audio && (snapshot.contributors.audio > 0.68 || snapshot.audio.transient > 0.72)) {
      candidates.push({
        family: 'audio',
        type: snapshot.audio.transient > 0.72 ? 'AUDIO_TRANSIENT' : 'ACOUSTIC_ELEVATION',
        title: snapshot.audio.transient > 0.72 ? 'Audio transient / knock' : 'Acoustic energy deviation',
        summary: 'Microphone waveform exceeded local acoustic baseline; origin is not localized by one phone.',
        magnitude: Math.max(snapshot.contributors.audio, snapshot.audio.transient),
        rawValue: snapshot.audio.rms,
        rawUnit: 'RMS',
        baselineDelta: deltas.audioDelta,
        spatial: 'UNKNOWN_ORIGIN',
        measurementConfidence: snapshot.audio.clipping ? 0.52 : 0.78,
        explanations: snapshot.audio.clipping
          ? ['Possible clipping or handling artifact. Reduce gain/distance and repeat.']
          : ['Clap/knock, speech, mechanical impulse, HVAC, wind, or handling noise.', 'A single handset cannot assign this to a distant point.'],
        artifactFlags: [snapshot.audio.clipping ? 'audio-clipping' : '', snapshot.motion && snapshot.motion.contamination > 0.5 ? 'handling-motion' : ''].filter(Boolean),
      });
    }
    if (snapshot.motion && snapshot.contributors.vibration > 0.7) {
      candidates.push({
        family: 'vibration',
        type: 'MOTION_VIBRATION_EVENT',
        title: 'Motion / vibration transient',
        summary: 'Acceleration and jerk suggest phone-local vibration or handling motion.',
        magnitude: snapshot.contributors.vibration,
        rawValue: snapshot.motion.jerk,
        rawUnit: 'm/s³',
        baselineDelta: deltas.vibrationDelta,
        spatial: 'MEASURED',
        measurementConfidence: 0.72,
        explanations: ['Footstep, phone movement, table vibration, or impact near the device.', 'Down-weighted when walking or rotating rapidly.'],
        artifactFlags: snapshot.motion.isWalking ? ['walking'] : [],
      });
    }
    if (snapshot.light?.lux != null && snapshot.contributors.light > 0.72) {
      candidates.push({
        family: 'light',
        type: 'LIGHT_LEVEL_CHANGE',
        title: 'Ambient light deviation',
        summary: 'Lux changed relative to the recent baseline.',
        magnitude: snapshot.contributors.light,
        rawValue: snapshot.light.lux,
        rawUnit: 'lux',
        baselineDelta: deltas.lightDelta,
        spatial: 'MEASURED',
        measurementConfidence: 0.72,
        explanations: ['Light switch, moving shadow, screen reflection, camera exposure/lux sensor shift.'],
      });
    }
    if (snapshot.radio?.supported && (snapshot.contributors.rf > 0.72 || snapshot.contributors.network > 0.72)) {
      candidates.push({
        family: 'rf',
        type: 'RF_CONSTELLATION_CHANGE',
        title: 'RF beacon constellation change',
        summary: 'Bluetooth/Wi-Fi visible-beacon set changed; signal trend is not a distance measurement.',
        magnitude: Math.max(snapshot.contributors.rf, snapshot.contributors.network),
        rawValue: snapshot.radio.density,
        rawUnit: 'beacons',
        baselineDelta: Math.max(deltas.rfDelta, deltas.networkDelta),
        spatial: 'ESTIMATED',
        measurementConfidence: 0.58,
        explanations: ['Nearby device appeared/disappeared, RSSI multipath, randomized identifiers, or OS scan throttling.'],
      });
    }

    for (const candidate of candidates) {
      this.emitCandidate(candidate, snapshot);
    }
  }

  private emitCandidate(candidate: EventCandidate, snapshot: SensorSnapshot) {
    const now = snapshot.timestamp;
    const last = this.lastEventAt.get(candidate.family) ?? 0;
    if (now - last < 2200) return;
    this.lastEventAt.set(candidate.family, now);
    const { path, events, session } = useSpectraStore.getState();
    const point = path[path.length - 1];
    const related = events
      .filter((event) => Math.abs(now - event.timestamp) < 1200 && event.family !== candidate.family)
      .slice(0, 4)
      .map((event) => event.id);
    const confidence = clamp(candidate.measurementConfidence * candidate.magnitude + related.length * 0.08 - snapshot.artifactPenalty, 0.08, 0.98);
    const event: AnomalyEvent = {
      id: `EVT-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}-${String(++this.eventCounter).padStart(4, '0')}`,
      sessionId: session?.id,
      timestamp: now,
      wallTime: shortTimestamp(Date.now()),
      type: candidate.type,
      family: candidate.family,
      title: candidate.title,
      summary: candidate.summary,
      magnitude: clamp(candidate.magnitude),
      rawValue: candidate.rawValue,
      rawUnit: candidate.rawUnit,
      baselineDelta: candidate.baselineDelta,
      confidence,
      measurementConfidence: candidate.measurementConfidence,
      spatialClass: candidate.spatial,
      spatialConfidence: candidate.spatial === 'UNKNOWN_ORIGIN' ? 0.05 : candidate.spatial === 'ESTIMATED' ? 0.32 : clamp(1 - (point?.uncertainty ?? 5) / 8, 0.18, 0.86),
      position: candidate.spatial === 'UNKNOWN_ORIGIN' ? undefined : point,
      region:
        candidate.spatial === 'ESTIMATED' && point
          ? { x: point.x, y: point.y, radius: Math.max(4, point.uncertainty * 1.8), uncertainty: point.uncertainty }
          : undefined,
      sourceSensors: [candidate.family],
      correlatedEventIds: related,
      explanations: candidate.explanations,
      artifactFlags: candidate.artifactFlags ?? [],
    };
    void useSpectraStore.getState().recordEvent(event);
  }
}
