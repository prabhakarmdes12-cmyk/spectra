import { clamp } from '../utils';

interface SamplePoint {
  t: number;
  value: number;
}

export interface BaselineStats {
  mean: number;
  std: number;
  variance: number;
  count: number;
  ready: boolean;
  zScore: number;
  delta: number;
  normalized: number;
}

export class RollingBaseline {
  private samples: SamplePoint[] = [];
  constructor(
    private readonly windowMs = 60_000,
    private readonly stdFloor = 0.015,
    private readonly readyCount = 20,
  ) {}

  push(value: number, timestamp = performance.timeOrigin + performance.now()) {
    if (!Number.isFinite(value)) return this.stats(value, timestamp);
    this.samples.push({ value, t: timestamp });
    this.trim(timestamp);
    return this.stats(value, timestamp);
  }

  stats(currentValue?: number, now = performance.timeOrigin + performance.now()): BaselineStats {
    this.trim(now);
    const count = this.samples.length;
    if (!count) {
      return { mean: 0, std: this.stdFloor, variance: 0, count: 0, ready: false, zScore: 0, delta: 0, normalized: 0 };
    }
    const mean = this.samples.reduce((sum, sample) => sum + sample.value, 0) / count;
    const variance = this.samples.reduce((sum, sample) => sum + (sample.value - mean) ** 2, 0) / Math.max(1, count - 1);
    const std = Math.max(Math.sqrt(variance), this.stdFloor);
    const value = currentValue ?? this.samples[count - 1].value;
    const delta = value - mean;
    const zScore = Math.abs(delta) / std;
    return {
      mean,
      std,
      variance,
      count,
      ready: count >= this.readyCount,
      zScore,
      delta,
      normalized: clamp(zScore / 6, 0, 1),
    };
  }

  get progress() {
    return clamp(this.samples.length / this.readyCount, 0, 1);
  }

  reset() {
    this.samples = [];
  }

  private trim(now: number) {
    const minTime = now - this.windowMs;
    while (this.samples.length && this.samples[0].t < minTime) this.samples.shift();
  }
}

export class MultiBaselineCalibrator<Key extends string> {
  private readonly baselines = new Map<Key, RollingBaseline>();

  constructor(private readonly keys: readonly Key[], private readonly windowMs = 60_000) {
    for (const key of keys) this.baselines.set(key, new RollingBaseline(windowMs));
  }

  push(key: Key, value: number, timestamp?: number) {
    return this.require(key).push(value, timestamp);
  }

  stats(key: Key, value?: number, timestamp?: number) {
    return this.require(key).stats(value, timestamp);
  }

  progress() {
    if (!this.keys.length) return 0;
    return this.keys.reduce((sum, key) => sum + this.require(key).progress, 0) / this.keys.length;
  }

  reset() {
    for (const baseline of this.baselines.values()) baseline.reset();
  }

  private require(key: Key) {
    let baseline = this.baselines.get(key);
    if (!baseline) {
      baseline = new RollingBaseline(this.windowMs);
      this.baselines.set(key, baseline);
    }
    return baseline;
  }
}
