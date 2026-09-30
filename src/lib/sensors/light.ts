import type { LightSample } from './types';
import { monotonicNow } from '../utils';

type AmbientLightSensorLike = EventTarget & { illuminance?: number; start: () => void; stop: () => void };

export class LightAdapter {
  private sample: LightSample | null = null;
  private sensor: AmbientLightSensorLike | null = null;

  private readonly onDeviceLight = (event: DeviceLightEvent) => {
    this.sample = { timestamp: monotonicNow(), lux: event.value, source: 'ambient-light' };
  };

  async start() {
    const AmbientLightSensorCtor = (window as unknown as { AmbientLightSensor?: new () => AmbientLightSensorLike }).AmbientLightSensor;
    if (AmbientLightSensorCtor) {
      try {
        this.sensor = new AmbientLightSensorCtor();
        this.sensor.addEventListener('reading', () => {
          this.sample = { timestamp: monotonicNow(), lux: this.sensor?.illuminance ?? null, source: 'ambient-light' };
        });
        this.sensor.start();
        return;
      } catch {
        this.sensor = null;
      }
    }
    window.addEventListener('devicelight', this.onDeviceLight);
  }

  stop() {
    window.removeEventListener('devicelight', this.onDeviceLight);
    try {
      this.sensor?.stop();
    } catch {
      // no-op
    }
    this.sensor = null;
  }

  read(): LightSample | null {
    return this.sample;
  }
}
