import type { MagneticSample, OrientationSample } from './types';
import { monotonicNow, safeNumber } from '../utils';

type SensorWithLifecycle = EventTarget & {
  start: () => void;
  stop: () => void;
  x?: number;
  y?: number;
  z?: number;
};

export class OrientationAdapter {
  private orientation: OrientationSample = {
    timestamp: monotonicNow(),
    heading: null,
    alpha: null,
    beta: null,
    gamma: null,
    compassAccuracy: null,
    source: 'none',
  };

  private magnetic: MagneticSample | null = null;
  private magnetometer: SensorWithLifecycle | null = null;
  private readonly onOrientation = (event: DeviceOrientationEvent) => {
    const alpha = event.alpha ?? null;
    const beta = event.beta ?? null;
    const gamma = event.gamma ?? null;
    const webkitHeading = event.webkitCompassHeading;
    const derivedHeading = typeof webkitHeading === 'number' ? webkitHeading : alpha == null ? null : (360 - alpha + 360) % 360;
    this.orientation = {
      timestamp: monotonicNow(),
      heading: derivedHeading,
      alpha,
      beta,
      gamma,
      compassAccuracy: event.webkitCompassAccuracy ?? null,
      source: 'deviceorientation',
    };
  };

  async start() {
    await this.requestOrientationPermission();
    window.addEventListener('deviceorientation', this.onOrientation, true);
    await this.startMagnetometer();
  }

  stop() {
    window.removeEventListener('deviceorientation', this.onOrientation, true);
    try {
      this.magnetometer?.stop();
    } catch {
      // ignored: sensor may already be stopped by user agent
    }
    this.magnetometer = null;
  }

  readOrientation(): OrientationSample {
    return this.orientation;
  }

  readMagnetic(): MagneticSample | null {
    return this.magnetic;
  }

  private async requestOrientationPermission() {
    const OrientationEvent = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<PermissionState> };
    if (typeof OrientationEvent.requestPermission === 'function') {
      const result = await OrientationEvent.requestPermission().catch(() => 'denied' as PermissionState);
      if (result !== 'granted') return;
    }
  }

  private async startMagnetometer() {
    const MagnetometerCtor = (window as unknown as { Magnetometer?: new (options?: { frequency?: number }) => SensorWithLifecycle }).Magnetometer;
    if (!MagnetometerCtor) return;
    try {
      const sensor = new MagnetometerCtor({ frequency: 15 });
      sensor.addEventListener('reading', () => {
        const x = safeNumber(sensor.x);
        const y = safeNumber(sensor.y);
        const z = safeNumber(sensor.z);
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        this.magnetic = {
          timestamp: monotonicNow(),
          x,
          y,
          z,
          magnitude,
          unit: 'µT',
          source: 'magnetometer',
        };
      });
      sensor.addEventListener('error', () => {
        this.magnetic = null;
      });
      sensor.start();
      this.magnetometer = sensor;
    } catch {
      this.magnetometer = null;
    }
  }
}
