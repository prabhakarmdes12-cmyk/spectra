import { useEffect, useRef } from 'react';
import { COLORS, OBSERVATION_RADIUS_METERS } from '../../lib/constants';
import type { HeatSample, SensorFamily } from '../../lib/sensors/types';
import { clamp, metersToCanvas } from '../../lib/utils';
import { useSpectraStore } from '../../stores/useSpectraStore';

const HEAT_COLORS: Partial<Record<SensorFamily, string>> = {
  magnetic: COLORS.cyan,
  audio: COLORS.amber,
  rf: COLORS.purple,
  vibration: COLORS.phosphor,
  motion: COLORS.phosphor,
  light: '#fef08a',
};

export function HeatFieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return undefined;
    let raf = 0;

    let width = 300;
    let height = 300;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const targetW = Math.max(1, Math.floor(width * dpr));
      const targetH = Math.max(1, Math.floor(height * dpr));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ro = new ResizeObserver(() => {
      handleResize();
    });
    ro.observe(canvas);
    handleResize();

    const draw = () => {
      if (width <= 0 || height <= 0) {
        raf = requestAnimationFrame(draw);
        return;
      }
      const center = { x: width / 2, y: height / 2 };
      const radius = Math.min(width, height) * 0.44;
      const { heat, path, activeLayer } = useSpectraStore.getState();

      ctx.clearRect(0, 0, width, height);
      drawBase(ctx, width, height, center, radius);
      drawSamples(ctx, heat, center, radius, activeLayer);
      drawObservationMask(ctx, path, center, radius);
      drawPath(ctx, path, center, radius);
      drawLegend(ctx, width, height, activeLayer, heat.length);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="h-full w-full rounded-[2rem]" aria-label="Cumulative heat field canvas" />;
}

function drawBase(ctx: CanvasRenderingContext2D, width: number, height: number, center: { x: number; y: number }, radius: number) {
  const bg = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, radius * 1.2);
  bg.addColorStop(0, 'rgba(168,85,247,0.08)');
  bg.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let x = center.x - radius; x <= center.x + radius; x += radius / 6) {
    ctx.beginPath();
    ctx.moveTo(x, center.y - radius);
    ctx.lineTo(x, center.y + radius);
    ctx.stroke();
  }
  for (let y = center.y - radius; y <= center.y + radius; y += radius / 6) {
    ctx.beginPath();
    ctx.moveTo(center.x - radius, y);
    ctx.lineTo(center.x + radius, y);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,240,255,0.25)';
  ctx.stroke();
  ctx.restore();
}

function drawSamples(
  ctx: CanvasRenderingContext2D,
  samples: HeatSample[],
  center: { x: number; y: number },
  radius: number,
  layer: string,
) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const sample of samples.slice(-1800)) {
    if (layer !== 'all' && layer !== 'spatial' && !(layer === 'motion' ? sample.family === 'motion' || sample.family === 'vibration' : sample.family === layer)) continue;
    const p = metersToCanvas(sample, OBSERVATION_RADIUS_METERS, center, radius);
    const color = HEAT_COLORS[sample.family] ?? COLORS.cyan;
    const r = Math.max(10, (sample.uncertainty / OBSERVATION_RADIUS_METERS) * radius * 2.2 + sample.intensity * 18);
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    gradient.addColorStop(0, colorToRgba(color, clamp(sample.intensity * sample.confidence * 0.38, 0.04, 0.45)));
    gradient.addColorStop(0.5, colorToRgba(color, clamp(sample.intensity * 0.15, 0.02, 0.22)));
    gradient.addColorStop(1, colorToRgba(color, 0));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawObservationMask(ctx: CanvasRenderingContext2D, path: Array<{ x: number; y: number; uncertainty: number }>, center: { x: number; y: number }, radius: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-over';
  for (const point of path.slice(-500)) {
    const p = metersToCanvas(point, OBSERVATION_RADIUS_METERS, center, radius);
    ctx.fillStyle = 'rgba(16,185,129,0.05)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(5, (point.uncertainty / OBSERVATION_RADIUS_METERS) * radius), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPath(ctx: CanvasRenderingContext2D, path: Array<{ x: number; y: number }>, center: { x: number; y: number }, radius: number) {
  if (path.length < 2) return;
  ctx.save();
  ctx.beginPath();
  path.slice(-900).forEach((point, index) => {
    const p = metersToCanvas(point, OBSERVATION_RADIUS_METERS, center, radius);
    if (index === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawLegend(ctx: CanvasRenderingContext2D, width: number, height: number, layer: string, count: number) {
  ctx.save();
  ctx.font = '10px JetBrains Mono, monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText(`FIELD ${layer.toUpperCase()} · ${count} samples · interpolation fades outside observed path`, 16, height - 16);
  ctx.textAlign = 'right';
  ctx.fillText('Confidence mask: darkness = poorly observed', width - 16, height - 16);
  ctx.restore();
}

function colorToRgba(hex: string, alpha: number) {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255},${(value >> 8) & 255},${value & 255},${alpha})`;
}
