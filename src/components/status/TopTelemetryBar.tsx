import { BatteryMedium, Compass, Mic, Moon, Radio, Satellite, ShieldCheck, Volume2, VolumeX } from 'lucide-react';
import { EDI_BANDS } from '../../lib/constants';
import { formatDuration } from '../../lib/utils';
import { useSpectraStore } from '../../stores/useSpectraStore';
import type { ReactNode } from 'react';

function statusColor(edi: number) {
  return EDI_BANDS.find((band) => edi >= band.min && edi <= band.max)?.color ?? '#00f0ff';
}

export function TopTelemetryBar({ wakeState }: { wakeState: string }) {
  const snapshot = useSpectraStore((state) => state.snapshot);
  const session = useSpectraStore((state) => state.session);
  const activeScan = useSpectraStore((state) => state.activeScan);
  const soundMuted = useSpectraStore((state) => state.soundMuted);
  const setSoundMuted = useSpectraStore((state) => state.setSoundMuted);
  const elapsed = session ? formatDuration((session.endedAt ?? Date.now()) - session.startedAt) : '00:00';
  const ediColor = statusColor(snapshot.edi);

  return (
    <header className="relative z-30 flex shrink-0 items-center justify-between gap-2 px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Satellite className="size-5 text-cyan" />
          <div>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-white/45">CHITI</p>
            <h1 className="text-lg font-black leading-4 tracking-[0.18em] text-white">SPECTRA</h1>
          </div>
        </div>
      </div>
      <div className="flex flex-1 justify-center">
        <div className="glass-panel flex items-center gap-2 rounded-full px-2.5 py-1.5">
          <div className="grid size-12 place-items-center rounded-full border border-white/10 bg-white/[0.04]" style={{ color: ediColor }}>
            <span className="font-mono text-sm font-bold tabular-nums">{Math.round(snapshot.edi)}</span>
          </div>
          <div className="hidden sm:block">
            <p className="telemetry-label">EDI</p>
            <p className="font-mono text-xs text-white/80">{snapshot.ediBand} · {elapsed}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5">
        <IconBadge icon={<Compass />} label={`${Math.round(snapshot.orientation.heading ?? 0)}°`} active={snapshot.orientation.heading != null} />
        <IconBadge icon={<Mic />} label={snapshot.audio ? 'MIC' : 'OFF'} active={Boolean(snapshot.audio)} />
        <IconBadge icon={<Moon />} label={wakeState.toUpperCase().slice(0, 4)} active={wakeState === 'active'} />
        <button
          className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-cyan/40 hover:text-cyan"
          onClick={() => setSoundMuted(!soundMuted)}
          aria-label={soundMuted ? 'Unmute tactical sound FX' : 'Mute tactical sound FX'}
        >
          {soundMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
        <IconBadge icon={<BatteryMedium />} label={activeScan ? 'SCAN' : 'IDLE'} active={activeScan} />
      </div>
    </header>
  );
}

function IconBadge({ icon, label, active }: { icon: ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`hidden items-center gap-1 rounded-full border px-2 py-1 font-mono text-[0.62rem] tabular-nums sm:flex ${active ? 'border-cyan/25 bg-cyan/10 text-cyan' : 'border-white/10 bg-white/[0.035] text-white/45'}`}>
      <span className="[&>svg]:size-3.5">{icon}</span>
      {label}
    </div>
  );
}

export function TruthBar() {
  return (
    <div className="mx-4 mb-2 flex items-center gap-2 rounded-full border border-phosphor/20 bg-phosphor/10 px-3 py-2 text-xs text-white/65">
      <ShieldCheck className="size-4 shrink-0 text-phosphor" />
      <span className="truncate">Spatial honesty active: measured points, estimated regions, and unknown-origin alerts are never mixed.</span>
      <Radio className="ml-auto size-4 shrink-0 text-cyan/70" />
    </div>
  );
}
