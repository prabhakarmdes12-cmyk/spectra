import type { AudioFeatureSample } from './types';
import { clamp, monotonicNow } from '../utils';

export class AudioAdapter {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private waveform = new Uint8Array(0);
  private spectrum = new Uint8Array(0);
  private previousRms = 0;

  async start() {
    if (!navigator.mediaDevices?.getUserMedia) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
      video: false,
    });
    const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    this.context = new AudioContextCtor({ latencyHint: 'interactive' });
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.72;
    this.source = this.context.createMediaStreamSource(this.stream);
    this.source.connect(this.analyser);
    this.waveform = new Uint8Array(this.analyser.fftSize);
    this.spectrum = new Uint8Array(this.analyser.frequencyBinCount);
  }

  async resume() {
    if (this.context?.state === 'suspended') await this.context.resume().catch(() => undefined);
  }

  stop() {
    this.source?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    void this.context?.close().catch(() => undefined);
    this.context = null;
    this.analyser = null;
    this.source = null;
    this.stream = null;
  }

  read(): AudioFeatureSample | null {
    if (!this.analyser || !this.context) return null;
    this.analyser.getByteTimeDomainData(this.waveform);
    this.analyser.getByteFrequencyData(this.spectrum);
    let sum = 0;
    let peak = 0;
    for (const byte of this.waveform) {
      const value = (byte - 128) / 128;
      sum += value * value;
      peak = Math.max(peak, Math.abs(value));
    }
    const rms = Math.sqrt(sum / Math.max(1, this.waveform.length));
    const transient = clamp((rms - this.previousRms) * 14, 0, 1);
    this.previousRms = this.previousRms * 0.84 + rms * 0.16;

    const hzPerBin = this.context.sampleRate / this.analyser.fftSize;
    const lowBins = Math.max(1, Math.ceil(60 / hzPerBin));
    let lowEnergy = 0;
    let weighted = 0;
    let total = 0;
    for (let i = 0; i < this.spectrum.length; i += 1) {
      const energy = this.spectrum[i] / 255;
      total += energy;
      weighted += energy * i * hzPerBin;
      if (i < lowBins) lowEnergy += energy;
    }
    const spectralCentroid = total > 0 ? weighted / total : 0;

    return {
      timestamp: monotonicNow(),
      rms,
      peak,
      lowFrequencyRumble: clamp(lowEnergy / lowBins, 0, 1),
      spectralCentroid,
      transient,
      clipping: peak > 0.98,
      sampleRate: this.context.sampleRate,
      fftSize: this.analyser.fftSize,
      waveform: new Uint8Array(this.waveform),
      spectrum: new Uint8Array(this.spectrum),
    };
  }
}
