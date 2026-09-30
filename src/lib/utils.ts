export function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function shortTimestamp(value: number | Date = Date.now()) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function downloadText(filename: string, contents: string, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([contents], { type });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export function monotonicNow() {
  return performance.timeOrigin + performance.now();
}

export function safeNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function polarToCartesian(meters: number, headingDegrees: number) {
  const radians = ((headingDegrees - 90) * Math.PI) / 180;
  return { x: meters * Math.cos(radians), y: meters * Math.sin(radians) };
}

export function metersToCanvas(point: { x: number; y: number }, radiusMeters: number, center: { x: number; y: number }, pixelRadius: number) {
  return {
    x: center.x + (point.x / radiusMeters) * pixelRadius,
    y: center.y + (point.y / radiusMeters) * pixelRadius,
  };
}

export function hashString(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
