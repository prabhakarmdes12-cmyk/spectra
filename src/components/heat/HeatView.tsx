import { Layers, Map, Route, ShieldCheck } from 'lucide-react';
import { useSpectraStore } from '../../stores/useSpectraStore';
import { GlassCard } from '../common/GlassCard';
import { LayerSelector } from '../common/LayerSelector';
import { HeatFieldCanvas } from './HeatFieldCanvas';

export function HeatView() {
  const heat = useSpectraStore((state) => state.heat);
  const session = useSpectraStore((state) => state.session);
  const activeLayer = useSpectraStore((state) => state.activeLayer);
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 px-4 pb-2">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[2rem] border border-white/10 bg-black/45">
        <HeatFieldCanvas />
        <div className="absolute left-3 top-3 right-3 flex items-start justify-between gap-3">
          <GlassCard className="max-w-[18rem] p-3">
            <p className="telemetry-label">Heat Field</p>
            <p className="mt-1 text-xs leading-relaxed text-white/60">Persistent density from real measured samples. Poorly observed cells fade to near-black.</p>
          </GlassCard>
          <div className="hidden sm:block"><LayerSelector /></div>
        </div>
        <div className="absolute bottom-3 left-3 right-3 sm:hidden"><LayerSelector /></div>
      </div>
      <div className="grid shrink-0 grid-cols-3 gap-2">
        <HeatStat icon={<Layers />} label="Layer" value={activeLayer.toUpperCase()} />
        <HeatStat icon={<Map />} label="Samples" value={`${heat.length}`} />
        <HeatStat icon={<Route />} label="Coverage" value={`${Math.round((session?.coverageEstimate ?? 0) * 100)}%`} />
      </div>
      <GlassCard className="shrink-0 p-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 text-phosphor" />
          <p className="text-xs leading-relaxed text-white/58">Heat clouds are accumulated at the phone’s defensible path positions. They visualize repeated local observations, not hidden-object coordinates.</p>
        </div>
      </GlassCard>
    </div>
  );
}

function HeatStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-panel rounded-2xl p-3">
      <div className="flex items-center gap-2 text-white/45 [&>svg]:size-4"><span>{icon}</span><span className="telemetry-label">{label}</span></div>
      <p className="mt-1 truncate font-mono text-sm text-cyan">{value}</p>
    </div>
  );
}
