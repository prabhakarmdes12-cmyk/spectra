import { useEffect, useRef } from 'react';
import { COLORS, OBSERVATION_RADIUS_METERS } from '../../lib/constants';
import type { AnomalyEvent, SensorFamily, SensorLayer } from '../../lib/sensors/types';
import { clamp, metersToCanvas } from '../../lib/utils';
import { useSpectraStore } from '../../stores/useSpectraStore';

const FAMILY_COLORS: Record<SensorFamily, string> = {
  magnetic: '#f59e0b',
  audio: '#00f0ff',
  rf: '#a855f7',
  motion: '#10b981',
  vibration: '#10b981',
  light: '#fef08a',
  network: '#a855f7',
  correlation: '#ef4444',
};

// Static simulated architectural features for the 30m local spatial scan (like in the inspiration image)
const ISOMETRIC_STRUCTURES = [
  { x: -15, y: -13, w: 7, d: 5, h: 8, color: 'rgba(0, 240, 255, ' },
  { x: -17, y: 11, w: 6, d: 6, h: 6, color: 'rgba(0, 240, 255, ' },
  { x: 13, y: 15, w: 6, d: 7, h: 9, color: 'rgba(168, 85, 247, ' },
  { x: 15, y: -11, w: 6, d: 5, h: 7, color: 'rgba(0, 240, 255, ' },
  { x: -3, y: 19, w: 5, d: 5, h: 5, color: 'rgba(168, 85, 247, ' },
];

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
      const radius = Math.min(width, height) * 0.43;
      const state = useSpectraStore.getState();
      const { snapshot, events, path, activeLayer, activeScan } = state;
      const now = performance.timeOrigin + performance.now();
      const heading = snapshot.orientation.heading ?? 0;

      ctx.clearRect(0, 0, width, height);

      // Deep space radial background with subtle grid
      const bg = ctx.createRadialGradient(center.x, center.y, radius * 0.05, center.x, center.y, radius * 1.2);
      bg.addColorStop(0, 'rgba(10, 16, 35, 0.45)');
      bg.addColorStop(0.55, 'rgba(4, 3, 10, 0.7)');
      bg.addColorStop(1, 'rgba(2, 1, 5, 0.35)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Draw Radar Elements in order
      drawConcentricRings(ctx, center, radius);
      drawCompassFixed(ctx, center, radius);
      drawIsometricCity(ctx, center, radius, now);
      drawSweep(ctx, center, radius, now, activeScan);
      drawAnomalies(ctx, center, radius, events, activeLayer, now);
      drawCenterObserver(ctx, center, radius, heading);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="h-full w-full rounded-[2.5rem]" aria-label="Hero 30 meter radar scan canvas" />;
}

// 1. Concentric Range Rings (10m, 20m, 30m)
function drawConcentricRings(ctx: CanvasRenderingContext2D, center: { x: number; y: number }, radius: number) {
  ctx.save();

  // Spoke lines (Cardinal and Intercardinal)
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(center.x + Math.cos(angle) * 16, center.y + Math.sin(angle) * 16);
    ctx.lineTo(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius);
    ctx.stroke();
  }

  // Range rings: 10m, 20m, 30m
  const rings = [10, 20, 30];
  for (const meters of rings) {
    const r = (meters / OBSERVATION_RADIUS_METERS) * radius;
    ctx.beginPath();
    ctx.arc(center.x, center.y, r, 0, Math.PI * 2);

    if (meters === 30) {
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.shadowColor = 'rgba(0, 240, 255, 0.35)';
      ctx.shadowBlur = 8;
    } else {
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.16)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
    }
    ctx.stroke();

    // Range distance label along vertical North axis
    ctx.shadowBlur = 0;
    ctx.fillStyle = meters === 30 ? 'rgba(0, 240, 255, 0.85)' : 'rgba(255, 255, 255, 0.45)';
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${meters} m`, center.x + 8, center.y - r + 11);
  }

  // Outer ring degree tick marks
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
  ctx.lineWidth = 1;
  for (let deg = 0; deg < 360; deg += 10) {
    const isMajor = deg % 30 === 0;
    const tickLen = isMajor ? 6 : 3;
    const rad = (deg * Math.PI) / 180;
    const x1 = center.x + Math.cos(rad) * radius;
    const y1 = center.y + Math.sin(rad) * radius;
    const x2 = center.x + Math.cos(rad) * (radius - tickLen);
    const y2 = center.y + Math.sin(rad) * (radius - tickLen);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.restore();
}

// 2. FIXED Compass Cardinal Directions (N at Top, E on Right, S at Bottom, W on Left)
function drawCompassFixed(ctx: CanvasRenderingContext2D, center: { x: number; y: number }, radius: number) {
  ctx.save();
  ctx.font = 'bold 13px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // N (Top - 0°)
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 240, 255, 0.8)';
  ctx.shadowBlur = 10;
  ctx.fillText('N', center.x, center.y - radius - 15);

  // E (Right - 90°)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.shadowBlur = 0;
  ctx.fillText('E', center.x + radius + 15, center.y);

  // S (Bottom - 180°)
  ctx.fillText('S', center.x, center.y + radius + 15);

  // W (Left - 270°)
  ctx.fillText('W', center.x - radius - 15, center.y);

  ctx.restore();
}

// 3. 3D Isometric Holographic City & Wireframe Environment
function drawIsometricCity(ctx: CanvasRenderingContext2D, center: { x: number; y: number }, radius: number, now: number) {
  ctx.save();

  // Subtle ground particle points
  const sweepAngle = ((now / 2800) % 1) * Math.PI * 2;

  for (const b of ISOMETRIC_STRUCTURES) {
    const p = metersToCanvas({ x: b.x, y: b.y }, OBSERVATION_RADIUS_METERS, center, radius);
    const bAngle = Math.atan2(p.y - center.y, p.x - center.x);
    let diff = (sweepAngle - bAngle) % (Math.PI * 2);
    if (diff < 0) diff += Math.PI * 2;
    const isLit = diff < 0.6;
    const alpha = isLit ? 0.75 : 0.28;

    drawIsoBox(ctx, p.x, p.y, b.w * 2.2, b.d * 2.2, b.h * 2.4, b.color, alpha);
  }

  ctx.restore();
}

function drawIsoBox(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  d: number,
  h: number,
  colorPrefix: string,
  alpha: number,
) {
  // Isometric projection offsets
  const dx1 = w * 0.7;
  const dy1 = w * 0.35;
  const dx2 = -d * 0.7;
  const dy2 = d * 0.35;

  // Base corners
  const p0 = { x: cx, y: cy };
  const p1 = { x: cx + dx1, y: cy + dy1 };
  const p2 = { x: cx + dx1 + dx2, y: cy + dy1 + dy2 };
  const p3 = { x: cx + dx2, y: cy + dy2 };

  // Top corners (elevated by h)
  const t0 = { x: p0.x, y: p0.y - h };
  const t1 = { x: p1.x, y: p1.y - h };
  const t2 = { x: p2.x, y: p2.y - h };
  const t3 = { x: p3.x, y: p3.y - h };

  // Top Face
  ctx.beginPath();
  ctx.moveTo(t0.x, t0.y);
  ctx.lineTo(t1.x, t1.y);
  ctx.lineTo(t2.x, t2.y);
  ctx.lineTo(t3.x, t3.y);
  ctx.closePath();
  ctx.fillStyle = colorPrefix + (alpha * 0.25) + ')';
  ctx.fill();
  ctx.strokeStyle = colorPrefix + alpha + ')';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Left Face
  ctx.beginPath();
  ctx.moveTo(p3.x, p3.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(t2.x, t2.y);
  ctx.lineTo(t3.x, t3.y);
  ctx.closePath();
  ctx.fillStyle = colorPrefix + (alpha * 0.15) + ')';
  ctx.fill();
  ctx.strokeStyle = colorPrefix + (alpha * 0.8) + ')';
  ctx.stroke();

  // Right Face
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(t2.x, t2.y);
  ctx.lineTo(t1.x, t1.y);
  ctx.closePath();
  ctx.fillStyle = colorPrefix + (alpha * 0.2) + ')';
  ctx.fill();
  ctx.strokeStyle = colorPrefix + (alpha * 0.8) + ')';
  ctx.stroke();

  // Corner vertex dots
  ctx.fillStyle = '#ffffff';
  for (const pt of [t0, t1, t2, t3]) {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 4. Rotating Sweep Beam with Gradient Wedge
function drawSweep(ctx: CanvasRenderingContext2D, center: { x: number; y: number }, radius: number, now: number, active: boolean) {
  const angle = ((now / 2800) % 1) * Math.PI * 2;
  ctx.save();
  ctx.globalAlpha = active ? 1 : 0.45;

  // Sweeping wedge gradient
  const sweepAngleSpan = 0.35; // ~20 degrees
  const gradient = ctx.createRadialGradient(center.x, center.y, 10, center.x, center.y, radius);
  gradient.addColorStop(0, 'rgba(0, 240, 255, 0.45)');
  gradient.addColorStop(0.5, 'rgba(0, 240, 255, 0.18)');
  gradient.addColorStop(1, 'rgba(0, 240, 255, 0)');

  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  ctx.arc(center.x, center.y, radius, angle - sweepAngleSpan, angle);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Leading laser edge line
  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  ctx.lineTo(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius);
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 1.8;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 10;
  ctx.stroke();

  ctx.restore();
}

// 5. Anomaly Blips (Green, Orange, Purple, and Red Target Lock)
function drawAnomalies(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
  events: AnomalyEvent[],
  activeLayer: SensorLayer,
  now: number,
) {
  ctx.save();

  // Always show default representative anomalies if no custom events detected yet
  const defaultAnomalies = [
    { x: -11, y: -9, color: '#f59e0b', type: 'orange', pulse: true }, // Orange anomaly
    { x: -8, y: 7, color: '#10b981', type: 'green', pulse: false },   // Green anomaly
    { x: 12, y: 9, color: '#a855f7', type: 'purple', pulse: true },   // Purple cluster
    { x: 15, y: -8, color: '#ef4444', type: 'red', pulse: true },     // Red targeted anomaly
    { x: 7, y: -16, color: '#f59e0b', type: 'orange', pulse: false },  // Small amber
    { x: -16, y: 3, color: '#10b981', type: 'green', pulse: false },   // Small green
  ];

  // Draw real live events if any
  if (events.length > 0) {
    for (const event of events.slice(0, 16)) {
      const point = event.position ?? { x: 5, y: -8 };
      const p = metersToCanvas(point, OBSERVATION_RADIUS_METERS, center, radius);
      const color = FAMILY_COLORS[event.family] ?? '#00f0ff';
      drawAnomalyBlip(ctx, p.x, p.y, color, event.magnitude > 0.65, event.magnitude > 0.8, now);
    }
  } else {
    // Render the stunning reference anomalies from the inspiration image
    for (const a of defaultAnomalies) {
      const p = metersToCanvas({ x: a.x, y: a.y }, OBSERVATION_RADIUS_METERS, center, radius);
      drawAnomalyBlip(ctx, p.x, p.y, a.color, a.pulse, a.type === 'red', now);
    }
  }

  ctx.restore();
}

function drawAnomalyBlip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  pulse: boolean,
  isTargetLock: boolean,
  now: number,
) {
  ctx.save();

  // Pulsing outer halo ring
  if (pulse) {
    const pulseR = 8 + (Math.sin(now / 220) * 0.5 + 0.5) * 6;
    ctx.beginPath();
    ctx.arc(x, y, pulseR, 0, Math.PI * 2);
    ctx.strokeStyle = colorToRgba(color, 0.45);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Core blip
  ctx.beginPath();
  ctx.arc(x, y, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fill();

  // Inner bright pinpoint
  ctx.beginPath();
  ctx.arc(x, y, 1.8, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Red Target Reticle Brackets [ ⌖ ]
  if (isTargetLock) {
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.4;
    const b = 9;
    const s = 3.5;

    // Top-Left corner
    ctx.beginPath();
    ctx.moveTo(x - b, y - b + s);
    ctx.lineTo(x - b, y - b);
    ctx.lineTo(x - b + s, y - b);
    ctx.stroke();

    // Top-Right corner
    ctx.beginPath();
    ctx.moveTo(x + b - s, y - b);
    ctx.lineTo(x + b, y - b);
    ctx.lineTo(x + b, y - b + s);
    ctx.stroke();

    // Bottom-Left corner
    ctx.beginPath();
    ctx.moveTo(x - b, y + b - s);
    ctx.lineTo(x - b, y + b);
    ctx.lineTo(x - b + s, y + b);
    ctx.stroke();

    // Bottom-Right corner
    ctx.beginPath();
    ctx.moveTo(x + b - s, y + b);
    ctx.lineTo(x + b, y + b);
    ctx.lineTo(x + b, y + b - s);
    ctx.stroke();
  }

  ctx.restore();
}

// 6. Center Observer Person Avatar (👤) with Heading Beam
function drawCenterObserver(ctx: CanvasRenderingContext2D, center: { x: number; y: number }, radius: number, heading: number) {
  ctx.save();

  // Directional Flashlight / Orientation FOV Cone
  const headingRad = ((heading - 90) * Math.PI) / 180;
  const fovSpan = 0.45; // ~25 deg
  const beamDist = radius * 0.35;

  const fovGrad = ctx.createRadialGradient(center.x, center.y, 4, center.x, center.y, beamDist);
  fovGrad.addColorStop(0, 'rgba(0, 240, 255, 0.45)');
  fovGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');

  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  ctx.arc(center.x, center.y, beamDist, headingRad - fovSpan, headingRad + fovSpan);
  ctx.closePath();
  ctx.fillStyle = fovGrad;
  ctx.fill();

  // Center Glowing Circular Node
  ctx.beginPath();
  ctx.arc(center.x, center.y, 14, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(10, 20, 45, 0.9)';
  ctx.fill();
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 1.8;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 10;
  ctx.stroke();

  // Crisp White Person Icon (👤) in center
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';

  // Head
  ctx.beginPath();
  ctx.arc(center.x, center.y - 4, 3, 0, Math.PI * 2);
  ctx.fill();

  // Torso
  ctx.beginPath();
  ctx.arc(center.x, center.y + 6, 5.5, Math.PI * 1.15, Math.PI * 1.85);
  ctx.lineTo(center.x + 3.5, center.y + 6);
  ctx.lineTo(center.x - 3.5, center.y + 6);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function colorToRgba(color: string, alpha: number) {
  if (color.startsWith('#')) {
    const value = Number.parseInt(color.slice(1), 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}
