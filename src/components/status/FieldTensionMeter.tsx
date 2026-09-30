import { Activity, Moon, ShieldCheck } from 'lucide-react';
import { computeFieldTension } from '../../lib/atmosphere';
import { useSpectraStore } from '../../stores/useSpectraStore';

export function FieldTensionMeter() {
  const enabled = useSpectraStore((state) => state.nightExpedition);
  const snapshot = useSpectraStore((state) => state.snapshot);
  const events = useSpectraStore((state) => state.events);

  if (!enabled) return null;

  const tension = computeFieldTension(snapshot, events);
  const driverText = tension.drivers.join(' · ');

  return (
    <section className="relative z-30 mx-4 mb-2 overflow-hidden rounded-2xl border border-amber/20 bg-black/65 px-3 py-2 shadow-2xl shadow-amber/10 backdrop-blur-md">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_50%,rgba(245,158,11,0.16),transparent_35%),radial-gradient(circle_at_100%_50%,rgba(168,85,247,0.12),transparent_32%)]" />
      <div className="relative flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-amber/25 bg-amber/10 text-amber">
          <Moon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-[0.62rem] font-bold uppercase tracking-[0.25em] text-amber/85">Night Expedition</p>
              <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.18em] text-white/45 sm:inline">Atmosphere only</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-sm font-black tabular-nums" style={{ color: tension.color }}>
              <Activity className="size-4" /> {tension.value}
            </div>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-[width,background-color] duration-500"
              style={{ width: `${tension.value}%`, backgroundColor: tension.color, boxShadow: `0 0 18px ${tension.color}` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between gap-2 text-[0.65rem]">
            <span className="truncate text-white/55">{tension.band}: {driverText}</span>
            <span className="hidden items-center gap-1 text-phosphor/75 sm:flex"><ShieldCheck className="size-3" /> non-evidence layer</span>
          </div>
        </div>
      </div>
    </section>
  );
}
