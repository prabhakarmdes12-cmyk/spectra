import { computeFieldTension } from '../../lib/atmosphere';
import { useSpectraStore } from '../../stores/useSpectraStore';

export function AtmosphereLayer() {
  const enabled = useSpectraStore((state) => state.nightExpedition);
  const activeScan = useSpectraStore((state) => state.activeScan);
  const snapshot = useSpectraStore((state) => state.snapshot);
  const events = useSpectraStore((state) => state.events);

  if (!enabled) return null;

  const tension = computeFieldTension(snapshot, events);
  const intensity = tension.normalized;
  const unknownPressure = events.slice(0, 8).some((event) => event.spatialClass === 'UNKNOWN_ORIGIN' && performance.timeOrigin + performance.now() - event.timestamp < 25_000);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0 atmosphere-vignette"
        style={{ opacity: activeScan ? 0.62 + intensity * 0.24 : 0.48 }}
      />
      <div className="absolute inset-0 atmosphere-scanlines" style={{ opacity: 0.08 + intensity * 0.12 }} />
      <div className="absolute inset-0 atmosphere-noise" style={{ opacity: 0.05 + intensity * 0.1 }} />
      <div
        className="absolute -left-24 top-[12%] h-72 w-72 rounded-full blur-3xl"
        style={{ background: `rgba(245,158,11,${0.04 + intensity * 0.1})` }}
      />
      <div
        className="absolute -right-24 bottom-[18%] h-80 w-80 rounded-full blur-3xl"
        style={{ background: `rgba(168,85,247,${0.05 + intensity * 0.13})` }}
      />
      {unknownPressure && <div className="absolute inset-6 rounded-[2.5rem] border border-amber/20 atmosphere-unknown-ring" />}
      <div className="absolute bottom-[5.4rem] right-4 hidden rounded-full border border-amber/20 bg-black/45 px-3 py-1.5 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-amber/65 backdrop-blur-md sm:block">
        Atmosphere layer · telemetry-driven visuals
      </div>
    </div>
  );
}
