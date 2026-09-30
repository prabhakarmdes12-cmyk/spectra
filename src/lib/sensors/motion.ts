import type { MotionSample } from './types';
import { clamp, monotonicNow, safeNumber } from '../utils';

export class MotionAdapter {
  private sample: MotionSample | null = null;
  private lastMagnitude = 0;
  private lastTimestamp = 0;
  private lastStepTimestamp = 0;
  private stepCount = 0;
  private readonly onMotion = (event: DeviceMotionEvent) => {
    const timestamp = monotonicNow();
    const acc = event.acceleration ?? { x: 0, y: 0, z: 0 };
    const accG = event.accelerationIncludingGravity ?? acc;
    const rotation = event.rotationRate ?? { alpha: 0, beta: 0, gamma: 0 };
    const ax = safeNumber(acc.x);
    const ay = safeNumber(acc.y);
    const az = safeNumber(acc.z);
    const gx = safeNumber(accG.x);
    const gy = safeNumber(accG.y);
    const gz = safeNumber(accG.z);
    const magnitude = Math.sqrt(gx * gx + gy * gy + gz * gz);
    const dt = Math.max(16, timestamp - this.lastTimestamp);
    const jerk = Math.abs(magnitude - this.lastMagnitude) / (dt / 1000);
    const walkingBand = Math.abs(magnitude - 9.80665);
    const stepCandidate = walkingBand > 1.05 && jerk > 3.5 && timestamp - this.lastStepTimestamp > 360;
    if (stepCandidate) {
      this.stepCount += 1;
      this.lastStepTimestamp = timestamp;
    }
    const vibration = clamp((jerk / 45 + walkingBand / 8) / 2, 0, 1);
    const contamination = clamp(walkingBand / 5 + jerk / 80, 0, 1);
    this.sample = {
      timestamp,
      acceleration: { x: ax, y: ay, z: az },
      accelerationIncludingGravity: { x: gx, y: gy, z: gz },
      rotationRate: {
        alpha: safeNumber(rotation.alpha),
        beta: safeNumber(rotation.beta),
        gamma: safeNumber(rotation.gamma),
      },
      magnitude,
      jerk,
      vibration,
      isWalking: timestamp - this.lastStepTimestamp < 850,
      stepCount: this.stepCount,
      stepImpulse: stepCandidate,
      contamination,
    };
    this.lastMagnitude = magnitude;
    this.lastTimestamp = timestamp;
  };

  async start() {
    const MotionEvent = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<PermissionState> };
    if (typeof MotionEvent.requestPermission === 'function') {
      const result = await MotionEvent.requestPermission().catch(() => 'denied' as PermissionState);
      if (result !== 'granted') return;
    }
    window.addEventListener('devicemotion', this.onMotion, true);
  }

  stop() {
    window.removeEventListener('devicemotion', this.onMotion, true);
  }

  read(): MotionSample | null {
    return this.sample;
  }

  resetSteps() {
    this.stepCount = 0;
    this.lastStepTimestamp = 0;
  }
}
