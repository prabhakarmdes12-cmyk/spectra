import { useEffect, useRef } from 'react';
import { COLORS, OBSERVATION_RADIUS_METERS } from '../../lib/constants';
import type { AnomalyEvent, SensorFamily, SensorLayer } from '../../lib/sensors/types';
import { clamp, metersToCanvas } from '../../lib/utils';
import { useSpectraStore } from '../../stores/useSpectraStore';

const FAMILY_COLORS: Record<SensorFamily, string> = {
  magnetic: COLORS.cyan,
  audio: COLORS.amber,
  rf: COLORS.purple,
  motion: COLORS.phosphor,
  vibration: COLORS.phosphor,
  light: '#fef08a',
  network: COLORS.purple,
  correlation: '#ffffff',
};

function layerAllows(layer: SensorLayer, event: AnomalyEvent) {
  if (layer === 'all') return true;
  if (layer === 'motion') return event.family === 'motion' || event.family === 'vibration';
  if (layer === 'spatial') return event.spatialClass !== 'UNKNOWN_ORIGIN';
  return event.family === layer;
}

export function RadarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return undefined;
    let raf = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== Math.floor(rect.width * Math.min(window.devicePixelRatio || 1, 2.5))) resize();
      const width = rect.width;
      const height = rect.height;
      const center = { x: width / 2, y: height / 2 };
      const radius = Math.min(width, height) * 0.43;
      const state = useSpectraStore.getState();
      const { snapshot, events, path, activeLayer, activeScan } = state;
      const now = performance.timeOrigin + performance.now();

      ctx.clearRect(0, 0, width, height);
      const bg = ctx.createRadialGradient(center.x, center.y, radius * 0.05, center.x, center.y, radius * 1.2);
      bg.addColorStop(0, 'rgba(0, 240, 255, 0.08)');
      bg.addColorStop(0.5, 'rgba(5, 5, 8, 0.6)');
      bg.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      drawRings(ctx, center, radius);
      drawCompass(ctx, center, radius, snapshot.orientation.heading ?? 0);
      drawCoverage(ctx, center, radius, path);
      drawPath(ctx, center, radius, path);
      drawSweep(ctx, center, radius, now, activeScan);
      drawEvents(ctx, center, radius, events, activeLayer, now);
      drawPhone(ctx, center, radius, path, snapshot.orientation.heading ?? 0, activeScan);
      drawTelemetry(ctx, width, height, snapshot.calibrationProgress, snapshot.artifactPenalty, snapshot.correlationBonus);

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

  return <canvas ref={canvasRef} className="h-full w-full rounded-[2rem]" aria-label="30 meter radar scan canvas" />;
}

function drawRings(ctx: CanvasRenderingContext2D, center: { x: number; y: number }, radius: number) {
  ctx.save();
  ctx.lineWidth = 1;
  for (const meters of [5, 10, 20, 30]) {
    const r = (meters / OBSERVATION_RADIUS_METERS) * radius;
    ctx.beginPath();
    ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = meters === 30 ? 'rgba(0,240,255,0.35)' : 'rgba(255,255,255,0.12)';
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText(`${meters}m`, center.x + 6, center.y - r + 12);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(center.x + Math.cos(angle) * radius * 0.08, center.y + Math.sin(angle) * radius * 0.08);
    ctx.lineTo(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCompass(ctx: CanvasRenderingContext2D, center: { x: number; y: number }, radius: number, heading: number) {
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate((-heading * Math.PI) / 180);
  ctx.font = '11px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const marks = [
    ['N', 0, -radius - 14],
    ['E', radius + 14, 0],
    ['S', 0, radius + 14],
    ['W', -radius - 14, 0],
  ] as const;
  for (const [label, x, y] of marks) {
    ctx.fillStyle = label === 'N' ? COLORS.amber : 'rgba(255,255,255,0.45)';
    ctx.fillText(label, x, y);
  }
  ctx.restore();
}

function drawCoverage(ctx: CanvasRenderingContext2D, center: { x: number; y: number }, radius: number, path: Array<{ x: number; y: number; uncertainty: number }>) {
  ctx.save();
  for (const point of path.slice(-350)) {
    const p = metersToCanvas(point, OBSERVATION_RADIUS_METERS, center, radius);
    const r = Math.max(4, (point.uncertainty / OBSERVATION_RADIUS_METERS) * radius * 1.8);
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    gradient.addColorStop(0, 'rgba(16,185,129,0.12)');
    gradient.addColorStop(1, 'rgba(16,185,129,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPath(ctx: CanvasRenderingContext2D, center: { x: number; y: number }, radius: number, path: Array<{ x: number; y: number; uncertainty: number }>) {
  if (path.length < 2) return;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  path.slice(-800).forEach((point, index) => {
    const p = metersToCanvas(point, OBSERVATION_RADIUS_METERS, center, radius);
    if (index === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.lineWidth = 7;
  ctx.strokeStyle = 'rgba(0,240,255,0.08)';
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,240,255,0.72)';
  ctx.stroke();
  ctx.restore();
}

function drawSweep(ctx: CanvasRenderingContext2D, center: { x: number; y: number }, radius: number, now: number, active: boolean) {
  const angle = ((now / 2600) % 1) * Math.PI * 2 - Math.PI / 2;
  ctx.save();
  ctx.globalAlpha = active ? 1 : 0.32;
  const gradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, radius);
  gradient.addColorStop(0, 'rgba(0,240,255,0.38)');
  gradient.addColorStop(0.55, 'rgba(0,240,255,0.13)');
  gradient.addColorStop(1, 'rgba(0,240,255,0)');
  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  ctx.arc(center.x, center.y, radius, angle - 0.18, angle + 0.018);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  ctx.lineTo(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius);
  ctx.strokeStyle = 'rgba(0,240,255,0.8)';
  ctx.lineWidth = 2;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.restore();
}

function drawEvents(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
  events: AnomalyEvent[],
  activeLayer: SensorLayer,
  now: number,
) {
  ctx.save();
  for (const event of events.slice(0, 80)) {
    if (!layerAllows(activeLayer, event)) continue;
    const age = now - event.timestamp;
    const decay = clamp(1 - age / 45_000, 0, 1);
    if (decay <= 0) continue;
    const color = FAMILY_COLORS[event.family] ?? COLORS.cyan;
    ctx.globalAlpha = decay;

    if (event.spatialClass === 'UNKNOWN_ORIGIN') {
      const r = radius * (0.92 + Math.sin(now / 350) * 0.015);
      ctx.beginPath();
      ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = color.replace(')', ',0.75)').replace('rgb', 'rgba');
      ctx.lineWidth = 2 + event.magnitude * 3;
      ctx.setLineDash([10, 12]);
      ctx.stroke();
      ctx.setLineDash([]);
      continue;
    }

    const point = event.position ?? { x: 0, y: 0, uncertainty: 2 };
    const p = metersToCanvas(point, OBSERVATION_RADIUS_METERS, center, radius);
    if (event.spatialClass === 'ESTIMATED') {
      const uncertainty = event.region?.radius ?? point.uncertainty * 2;
      const pr = Math.max(12, (uncertainty / OBSERVATION_RADIUS_METERS) * radius);
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pr);
      gradient.addColorStop(0, colorToRgba(color, 0.32));
      gradient.addColorStop(1, colorToRgba(color, 0));
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, pr, 0, Math.PI * 2);
      ctx.fill();
    }
    const blipRadius = 4 + event.magnitude * 10;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.fillStyle = colorToRgba(color, event.spatialClass === 'ESTIMATED' ? 0.58 : 0.95);
    ctx.beginPath();
    ctx.arc(p.x, p.y, blipRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

function drawPhone(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
  path: Array<{ x: number; y: number; uncertainty: number }>,
  heading: number,
  active: boolean,
) {
  const point = path[path.length - 1] ?? { x: 0, y: 0, uncertainty: 1 };
  const p = metersToCanvas(point, OBSERVATION_RADIUS_METERS, center, radius);
  ctx.save();
  const uncertaintyRadius = Math.max(8, (point.uncertainty / OBSERVATION_RADIUS_METERS) * radius);
  ctx.beginPath();
  ctx.arc(p.x, p.y, uncertaintyRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,240,255,0.07)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,240,255,0.18)';
  ctx.stroke();
  ctx.translate(p.x, p.y);
  ctx.rotate(((heading - 90) * Math.PI) / 180);
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(-10, -8);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-10, 8);
  ctx.closePath();
  ctx.fillStyle = active ? COLORS.cyan : 'rgba(255,255,255,0.4)';
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = active ? 12 : 0;
  ctx.fill();
  ctx.restore();
}

function drawTelemetry(ctx: CanvasRenderingContext2D, width: number, height: number, calibration: number, artifactPenalty: number, correlationBonus: number) {
  ctx.save();
  ctx.font = '10px JetBrains Mono, monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.48)';
  ctx.fillText('OBSERVATION RADIUS — NOT A RANGING CLAIM', 18, height - 18);
  ctx.textAlign = 'right';
  ctx.fillText(`CAL ${(calibration * 100).toFixed(0)}%  ART ${(artifactPenalty * 100).toFixed(0)}  COR +${(correlationBonus * 100).toFixed(0)}`, width - 18, height - 18);
  ctx.restore();
}

function colorToRgba(hex: string, alpha: number) {
  if (!hex.startsWith('#')) return hex;
  const value = Number.parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
