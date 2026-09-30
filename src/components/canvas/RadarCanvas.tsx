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
      const state = useSpectraStore.getState();
      const { snapshot, events, path, activeLayer, activeScan } = state;
      const now = performance.timeOrigin + performance.now();

      ctx.clearRect(0, 0, width, height);

      // Deep space radial background
      const bg = ctx.createRadialGradient(center.x, center.y, radius * 0.05, center.x, center.y, radius * 1.15);
      bg.addColorStop(0, 'rgba(0, 240, 255, 0.07)');
      bg.addColorStop(0.45, 'rgba(7, 6, 14, 0.65)');
      bg.addColorStop(1, 'rgba(3, 2, 6, 0.3)');
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

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
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
    if (meters === 30) {
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
      ctx.shadowColor = 'rgba(0, 240, 255, 0.3)';
      ctx.shadowBlur = 8;
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.shadowBlur = 0;
    }
    ctx.stroke();

    // Range readout badge
    ctx.shadowBlur = 0;
    ctx.fillStyle = meters === 30 ? 'rgba(0, 240, 255, 0.75)' : 'rgba(255, 255, 255, 0.4)';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillText(`${meters}M`, center.x + 6, center.y - r + 11);
  }

  // Crosshair spoke reticles
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(center.x + Math.cos(angle) * radius * 0.1, center.y + Math.sin(angle) * radius * 0.1);
    ctx.lineTo(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius);
    ctx.stroke();
  }

  // Center crosshair
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(center.x - 7, center.y);
  ctx.lineTo(center.x + 7, center.y);
  ctx.moveTo(center.x, center.y - 7);
  ctx.lineTo(center.x, center.y + 7);
  ctx.stroke();

  ctx.restore();
}

function drawCompass(ctx: CanvasRenderingContext2D, center: { x: number; y: number }, radius: number, heading: number) {
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate((-heading * Math.PI) / 180);
  ctx.font = 'bold 11px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const marks = [
    ['N', 0, -radius - 14],
    ['E', radius + 14, 0],
    ['S', 0, radius + 14],
    ['W', -radius - 14, 0],
  ] as const;

  for (const [label, x, y] of marks) {
    if (label === 'N') {
      ctx.fillStyle = COLORS.amber;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
      ctx.shadowBlur = 6;
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.shadowBlur = 0;
    }
    ctx.fillText(label, x, y);
  }
  ctx.restore();
}

function drawCoverage(ctx: CanvasRenderingContext2D, center: { x: number; y: number }, radius: number, path: Array<{ x: number; y: number; uncertainty: number }>) {
  if (!path.length) return;
  ctx.save();
  for (const point of path.slice(-350)) {
    const p = metersToCanvas(point, OBSERVATION_RADIUS_METERS, center, radius);
    const r = Math.max(4, (point.uncertainty / OBSERVATION_RADIUS_METERS) * radius * 1.6);
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.12)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
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
  path.slice(-600).forEach((point, index) => {
    const p = metersToCanvas(point, OBSERVATION_RADIUS_METERS, center, radius);
    if (index === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.75)';
  ctx.stroke();
  ctx.restore();
}

function drawSweep(ctx: CanvasRenderingContext2D, center: { x: number; y: number }, radius: number, now: number, active: boolean) {
  const angle = ((now / 2600) % 1) * Math.PI * 2 - Math.PI / 2;
  ctx.save();
  ctx.globalAlpha = active ? 1 : 0.35;

  // Sweeping gradient wedge
  const gradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, radius);
  gradient.addColorStop(0, 'rgba(0, 240, 255, 0.35)');
  gradient.addColorStop(0.55, 'rgba(0, 240, 255, 0.12)');
  gradient.addColorStop(1, 'rgba(0, 240, 255, 0)');

  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  ctx.arc(center.x, center.y, radius, angle - 0.22, angle + 0.015);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Sharp leading laser line
  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  ctx.lineTo(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius);
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.9)';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 10;
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
      const r = radius * 0.95;
      ctx.beginPath();
      ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = colorToRgba(color, 0.65);
      ctx.lineWidth = 2 + event.magnitude * 2;
      ctx.setLineDash([8, 10]);
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
      gradient.addColorStop(0, colorToRgba(color, 0.3));
      gradient.addColorStop(1, colorToRgba(color, 0));
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    const blipRadius = 4 + event.magnitude * 8;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = colorToRgba(color, event.spatialClass === 'ESTIMATED' ? 0.65 : 0.95);
    ctx.beginPath();
    ctx.arc(p.x, p.y, blipRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
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
  ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
  ctx.stroke();

  ctx.translate(p.x, p.y);
  ctx.rotate(((heading - 90) * Math.PI) / 180);

  // High-tech observer arrow reticle
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-9, -7);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-9, 7);
  ctx.closePath();

  ctx.fillStyle = active ? COLORS.cyan : 'rgba(255, 255, 255, 0.5)';
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = active ? 10 : 0;
  ctx.fill();

  ctx.restore();
}

function drawTelemetry(ctx: CanvasRenderingContext2D, width: number, height: number, calibration: number, artifactPenalty: number, correlationBonus: number) {
  ctx.save();
  ctx.font = '9px JetBrains Mono, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillText('30M OBSERVATION CANVAS · SCIENTIFIC TRUTH MODEL', 16, height - 16);
  ctx.textAlign = 'right';
  ctx.fillText(`CAL ${(calibration * 100).toFixed(0)}%  ART ${(artifactPenalty * 100).toFixed(0)}  COR +${(correlationBonus * 100).toFixed(0)}`, width - 16, height - 16);
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
