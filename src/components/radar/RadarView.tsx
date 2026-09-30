import { Activity, AlertTriangle, Compass, Footprints, Gauge, RadioTower } from 'lucide-react';
import { RadarCanvas } from '../canvas/RadarCanvas';
import { LayerSelector } from '../common/LayerSelector';
import { StatPill } from '../common/StatPill';
import { useSpectraStore } from '../../stores/useSpectraStore';

export function RadarView() {
  const snapshot = useSpectraStore((state) => state.snapshot);
  const session = useSpectraStore((state) => state.session);
  const path = useSpectraStore((state) => state.path);
  const events = useSpectraStore((state) => state.events);
  const lastPoint = path[path.length - 1];
  const latest = events[0];
  return (
    <div className="relative flex h-full min-h-0 flex-col gap-3 px-4 pb-2">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 shadow-2xl shadow-cyan/5">
        <RadarCanvas />
        <div className="pointer-events-none absolute left-3 top-3 right-3 flex items-start justify-between gap-3">
          <div className="glass-panel rounded-2xl p-3">
            <p className="telemetry-label">Live 30m Scan</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <StatPill label="HDG" value={`${Math.round(snapshot.orientation.heading ?? 0)}°`} />
              <StatPill label="CAL" value={`${Math.round(snapshot.calibrationProgress * 100)}%`} tone="green" />
              <StatPill label="X/Y" value={`${lastPoint?.x.toFixed(1) ?? '0.0'},${lastPoint?.y.toFixed(1) ?? '0.0'}`} tone="white" />
              <StatPill label="UNC" value={`${lastPoint?.uncertainty.toFixed(1) ?? '0.8'}m`} tone="purple" />
            </div>
          </div>
          <div className="glass-panel hidden max-w-[15rem] rounded-2xl p-3 sm:block">
            <p className="telemetry-label">Spatial honesty</p>
            <p className="mt-1 text-xs leading-relaxed text-white/60">Solid points are measured at phone path. Soft clouds are estimates. Rings are valid unknown-origin events.</p>
          </div>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <LayerSelector />
        </div>
      </div>
      <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric icon={<Gauge />} label="EDI" value={`${Math.round(snapshot.edi)}/100`} accent={snapshot.edi > 50 ? 'text-amber' : 'text-cyan'} />
        <Metric icon={<Footprints />} label="Distance" value={`${session?.distanceMeters.toFixed(1) ?? '0.0'} m`} />
        <Metric icon={<Activity />} label="Events" value={`${events.length}`} accent={events.length ? 'text-amber' : 'text-white/80'} />
        <Metric icon={<RadioTower />} label="RF" value={snapshot.radio?.supported ? `${snapshot.radio.density} seen` : 'offline'} accent={snapshot.radio?.supported ? 'text-purple' : 'text-white/45'} />
      </div>
      {latest && (
        <div className="glass-panel shrink-0 rounded-2xl p-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 text-amber" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold text-white">{latest.title}</p>
                <span className="font-mono text-xs text-amber">{Math.round(latest.magnitude * 100)}%</span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/55">{latest.summary}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ icon, label, value, accent = 'text-cyan' }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <div className="glass-panel rounded-2xl p-3">
      <div className="flex items-center gap-2 text-white/45 [&>svg]:size-4">{icon}<span className="telemetry-label">{label}</span></div>
      <p className={`mt-1 font-mono text-sm tabular-nums ${accent}`}>{value}</p>
    </div>
  );
}
