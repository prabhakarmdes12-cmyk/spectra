import Dexie, { type Table } from 'dexie';
import type { AnomalyEvent, HeatSample, LocalPoint, SensorSnapshot, SessionRecord } from '../sensors/types';

export interface StoredSample {
  id?: number;
  sessionId: string;
  timestamp: number;
  edi: number;
  contributors: SensorSnapshot['contributors'];
  heading: number | null;
  magneticMagnitude?: number;
  audioRms?: number;
  vibration?: number;
  lightLux?: number | null;
  rfDensity?: number;
}

export class SpectraDatabase extends Dexie {
  sessions!: Table<SessionRecord, string>;
  events!: Table<AnomalyEvent, string>;
  samples!: Table<StoredSample, number>;
  path!: Table<LocalPoint & { sessionId: string; id?: number }, number>;
  heat!: Table<HeatSample & { sessionId: string }, string>;

  constructor() {
    super('chiti-spectra-db');
    this.version(1).stores({
      sessions: 'id, startedAt, status',
      events: 'id, sessionId, timestamp, family, spatialClass',
      samples: '++id, sessionId, timestamp, edi',
      path: '++id, sessionId, timestamp',
      heat: 'id, sessionId, timestamp, family',
    });
  }
}

export const spectraDB = new SpectraDatabase();

export async function checkpointSample(sessionId: string, snapshot: SensorSnapshot) {
  await spectraDB.samples.add({
    sessionId,
    timestamp: snapshot.timestamp,
    edi: snapshot.edi,
    contributors: snapshot.contributors,
    heading: snapshot.orientation.heading,
    magneticMagnitude: snapshot.magnetic?.magnitude,
    audioRms: snapshot.audio?.rms,
    vibration: snapshot.motion?.vibration,
    lightLux: snapshot.light?.lux,
    rfDensity: snapshot.radio?.density,
  });
}
