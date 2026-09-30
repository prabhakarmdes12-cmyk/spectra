import type { AnomalyEvent, SensorSnapshot } from './sensors/types';
import { clamp } from './utils';

export interface FieldTensionReading {
  value: number;
  normalized: number;
  band: 'Calm' | 'Charged' | 'Uneasy' | 'Critical';
  color: string;
  drivers: string[];
  evidenceNote: string;
}

export function computeFieldTension(snapshot: SensorSnapshot, events: AnomalyEvent[], now = performance.timeOrigin + performance.now()): FieldTensionReading {
  const edi = clamp(snapshot.edi / 100, 0, 1);
  const audio = clamp(Math.max(snapshot.contributors.audio, snapshot.audio?.transient ?? 0), 0, 1);
  const magnetic = clamp(snapshot.contributors.magnetic, 0, 1);
  const vibration = clamp(snapshot.contributors.vibration, 0, 1);
  const rf = clamp(Math.max(snapshot.contributors.rf, snapshot.contributors.network), 0, 1);
  const correlation = clamp(snapshot.correlationBonus * 5, 0, 1);
  const artifactRelief = clamp(snapshot.artifactPenalty * 1.8, 0, 0.45);
  const recentEventPressure = clamp(
    events.slice(0, 16).reduce((sum, event) => {
      const age = Math.max(0, now - event.timestamp);
      const decay = clamp(1 - age / 90_000, 0, 1);
      const unknownBoost = event.spatialClass === 'UNKNOWN_ORIGIN' ? 1.22 : 1;
      return sum + event.magnitude * event.confidence * decay * unknownBoost;
    }, 0) / 2.2,
    0,
    1,
  );
  const quietStationaryPressure = snapshot.active && snapshot.calibrationProgress > 0.45 && (snapshot.motion?.contamination ?? 0) < 0.12 ? 0.14 : 0;
  const calibratedDarkness = snapshot.active && snapshot.calibrationProgress > 0.72 && (snapshot.light?.lux ?? 20) < 6 ? 0.08 : 0;

  const normalized = clamp(
    edi * 0.43 +
      audio * 0.14 +
      magnetic * 0.11 +
      vibration * 0.08 +
      rf * 0.06 +
      recentEventPressure * 0.14 +
      correlation * 0.08 +
      quietStationaryPressure +
      calibratedDarkness -
      artifactRelief,
    0,
    1,
  );
  const value = Math.round(normalized * 100);
  const band = value >= 78 ? 'Critical' : value >= 55 ? 'Uneasy' : value >= 28 ? 'Charged' : 'Calm';
  const color = value >= 78 ? '#f59e0b' : value >= 55 ? '#a855f7' : value >= 28 ? '#00f0ff' : '#10b981';

  const candidateDrivers = [
    { label: 'EDI', value: edi },
    { label: 'audio transient', value: audio },
    { label: 'magnetic deviation', value: magnetic },
    { label: 'vibration', value: vibration },
    { label: 'RF churn', value: rf },
    { label: 'recent anomalies', value: recentEventPressure },
    { label: 'multi-sensor correlation', value: correlation },
    { label: 'quiet calibrated stillness', value: quietStationaryPressure },
    { label: 'low-light baseline', value: calibratedDarkness },
  ]
    .filter((driver) => driver.value > 0.055)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((driver) => driver.label);

  return {
    value,
    normalized,
    band,
    color,
    drivers: candidateDrivers.length ? candidateDrivers : ['near baseline'],
    evidenceNote: 'Atmosphere only — derived from sensor telemetry, not a detection or claim.',
  };
}
