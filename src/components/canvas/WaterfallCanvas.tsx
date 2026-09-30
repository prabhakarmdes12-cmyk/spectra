import { useEffect, useRef } from 'react';
import { COLORS } from '../../lib/constants';
import { useSpectraStore } from '../../stores/useSpectraStore';

export function WaterfallCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waterfallRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    const waterfall = document.createElement('canvas');
    waterfallRef.current = waterfall;
    const wctx = waterfall.getContext('2d');
    let raf = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      waterfall.width = canvas.width;
      waterfall.height = Math.max(1, Math.floor(canvas.height * 0.6));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      if (canvas.width !== Math.floor(rect.width * dpr)) resize();
      const width = rect.width;
      const height = rect.height;
      const waveformHeight = height * 0.36;
      const waterfallTop = waveformHeight + 18;
      const waterfallHeight = height - waterfallTop - 22;
      const { snapshot } = useSpectraStore.getState();
      const audio = snapshot.audio;

      ctx.clearRect(0, 0, width, height);
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(0, 240, 255, 0.08)');
      gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.05)');
      gradient.addColorStop(1, 'rgba(5, 5, 8, 0.2)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      drawGrid(ctx, width, height, waveformHeight, waterfallTop);

      if (!audio?.waveform || !audio.spectrum) {
        drawEmpty(ctx, width, height);
        raf = requestAnimationFrame(draw);
        return;
      }

      drawWaveform(ctx, audio.waveform, width, waveformHeight, audio.transient, audio.clipping);
      if (wctx) {
        drawWaterfall(waterfall, wctx, audio.spectrum);
        ctx.drawImage(waterfall, 0, 0, waterfall.width, waterfall.height, 0, waterfallTop, width, waterfallHeight);
      }
      drawFrequencyScale(ctx, width, waterfallTop, waterfallHeight, audio.sampleRate, audio.spectralCentroid);
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(`RMS ${audio.rms.toFixed(3)}   PEAK ${audio.peak.toFixed(2)}   LF ${Math.round(audio.lowFrequencyRumble * 100)}%`, 14, waveformHeight + 12);
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(audio.spectralCentroid)} Hz centroid`, width - 14, waveformHeight + 12);
      ctx.textAlign = 'left';

      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="h-full min-h-[360px] w-full rounded-[1.6rem]" aria-label="Live oscilloscope and FFT waterfall" />;
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, waveformHeight: number, waterfallTop: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(0,240,255,0.18)';
  ctx.beginPath();
  ctx.moveTo(0, waveformHeight / 2);
  ctx.lineTo(width, waveformHeight / 2);
  ctx.moveTo(0, waterfallTop);
  ctx.lineTo(width, waterfallTop);
  ctx.stroke();
  ctx.restore();
}

function drawEmpty(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '13px Inter, sans-serif';
  ctx.fillText('Microphone stream idle — start scan and grant mic permission for waveform + spectrogram.', width / 2, height / 2);
  ctx.restore();
}

function drawWaveform(ctx: CanvasRenderingContext2D, waveform: Uint8Array, width: number, height: number, transient: number, clipping: boolean) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < waveform.length; i += 1) {
    const x = (i / (waveform.length - 1)) * width;
    const y = (waveform[i] / 255) * height;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineWidth = clipping ? 2.5 : 1.8;
  ctx.strokeStyle = clipping ? COLORS.amber : transient > 0.5 ? COLORS.purple : COLORS.cyan;
  ctx.shadowColor = ctx.strokeStyle;
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.restore();
}

function drawWaterfall(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, spectrum: Uint8Array) {
  const width = canvas.width;
  const height = canvas.height;
  ctx.drawImage(canvas, 0, 0, width, height - 2, 0, 2, width, height - 2);
  const image = ctx.createImageData(width, 2);
  for (let x = 0; x < width; x += 1) {
    const bin = Math.min(spectrum.length - 1, Math.floor((x / width) * spectrum.length));
    const value = spectrum[bin] / 255;
    const [r, g, b] = spectralColor(value);
    for (let row = 0; row < 2; row += 1) {
      const index = (row * width + x) * 4;
      image.data[index] = r;
      image.data[index + 1] = g;
      image.data[index + 2] = b;
      image.data[index + 3] = Math.round(42 + value * 213);
    }
  }
  ctx.putImageData(image, 0, 0);
}

function spectralColor(value: number): [number, number, number] {
  if (value < 0.2) return [0, Math.round(40 + value * 120), Math.round(70 + value * 160)];
  if (value < 0.55) return [0, Math.round(120 + value * 160), Math.round(210 + value * 45)];
  if (value < 0.8) return [Math.round(220 * value), 240, Math.round(80 * (1 - value))];
  return [245, Math.round(158 + (value - 0.8) * 200), 11];
}

function drawFrequencyScale(ctx: CanvasRenderingContext2D, width: number, top: number, height: number, sampleRate: number, centroid: number) {
  ctx.save();
  ctx.font = '10px JetBrains Mono, monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  for (const hz of [60, 250, 1000, 4000, 8000, 16000]) {
    if (hz > sampleRate / 2) continue;
    const x = (hz / (sampleRate / 2)) * width;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + height);
    ctx.stroke();
    ctx.fillText(hz >= 1000 ? `${hz / 1000}k` : String(hz), x + 4, top + 13);
  }
  const cx = (centroid / (sampleRate / 2)) * width;
  ctx.strokeStyle = 'rgba(245,158,11,0.75)';
  ctx.beginPath();
  ctx.moveTo(cx, top);
  ctx.lineTo(cx, top + height);
  ctx.stroke();
  ctx.restore();
}
