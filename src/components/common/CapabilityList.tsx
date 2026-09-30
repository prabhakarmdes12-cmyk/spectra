import { CheckCircle2, Lock, RadioTower, TriangleAlert, XCircle } from 'lucide-react';
import type { CapabilityDescriptor } from '../../lib/sensors/types';

function iconFor(state: CapabilityDescriptor['state']) {
  if (state === 'available' || state === 'active') return <CheckCircle2 className="size-4 text-phosphor" />;
  if (state === 'permission-required') return <Lock className="size-4 text-amber" />;
  if (state === 'limited') return <TriangleAlert className="size-4 text-purple" />;
  return <XCircle className="size-4 text-white/30" />;
}

export function CapabilityList({ capabilities }: { capabilities: CapabilityDescriptor[] }) {
  return (
    <div className="grid gap-2">
      {capabilities.map((capability) => (
        <div key={capability.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{iconFor(capability.state)}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold text-white/90">{capability.label}</p>
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-white/45">{capability.state}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-white/55">{capability.detail}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan to-purple" style={{ width: `${Math.round(capability.quality * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      ))}
      {!capabilities.length && (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-white/10 p-4 text-sm text-white/50">
          <RadioTower className="size-4" /> Run capability handshake to see available sensors.
        </div>
      )}
    </div>
  );
}
