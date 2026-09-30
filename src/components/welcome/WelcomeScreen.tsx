import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Compass, 
  FlaskConical, 
  Mic, 
  Moon, 
  Radio, 
  RadioTower, 
  ShieldCheck, 
  Sparkles, 
  Sun, 
  Volume2, 
  VolumeX, 
  Waves, 
  Zap 
} from 'lucide-react';
import type { SessionMode } from '../../lib/sensors/types';
import { useSpectraStore } from '../../stores/useSpectraStore';

interface WelcomeScreenProps {
  onStartScan: (mode: SessionMode) => void;
  onOpenCapabilities: () => void;
  starting: boolean;
}

export function WelcomeScreen({ onStartScan, onOpenCapabilities, starting }: WelcomeScreenProps) {
  const [selectedMode, setSelectedMode] = useState<SessionMode>('quick');
  const soundMuted = useSpectraStore((state) => state.soundMuted);
  const setSoundMuted = useSpectraStore((state) => state.setSoundMuted);
  const nightExpedition = useSpectraStore((state) => state.nightExpedition);
  const toggleNightExpedition = useSpectraStore((state) => state.toggleNightExpedition);
  const snapshot = useSpectraStore((state) => state.snapshot);
  const capabilities = useSpectraStore((state) => state.capabilities);

  const heading = Math.round(snapshot.orientation.heading ?? 0);
  const activeCapsCount = capabilities.filter((c) => c.state !== 'unavailable').length;

  return (
    <div className="relative flex h-full flex-col justify-between overflow-y-auto overflow-x-hidden px-4 py-3 no-scrollbar sm:px-6">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_35%,rgba(0,240,255,0.12),transparent_48%),radial-gradient(circle_at_50%_75%,rgba(168,85,247,0.14),transparent_55%)]" />

      {/* Top Header & Telemetry Badges */}
      <header className="relative z-10 flex shrink-0 items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid size-10 place-items-center rounded-2xl border border-cyan/30 bg-cyan/10 text-cyan shadow-lg shadow-cyan/15">
            <Radio className="size-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[0.62rem] font-bold uppercase tracking-[0.3em] text-cyan">CHITI TECHNOLOGIES</span>
              <span className="inline-block size-1.5 rounded-full bg-phosphor shadow-[0_0_8px_#10b981]" />
            </div>
            <h1 className="text-xl font-black tracking-[0.16em] text-white">SPECTRA</h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSoundMuted(!soundMuted)}
            className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/70 transition hover:border-cyan/40 hover:text-cyan"
            aria-label={soundMuted ? 'Unmute tactical audio' : 'Mute tactical audio'}
          >
            {soundMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
          <button
            onClick={toggleNightExpedition}
            className={`grid size-10 place-items-center rounded-2xl border transition ${
              nightExpedition 
                ? 'border-amber/40 bg-amber/15 text-amber shadow-lg shadow-amber/15' 
                : 'border-white/10 bg-white/[0.05] text-white/70 hover:border-amber/30 hover:text-amber'
            }`}
            aria-label="Toggle Night Expedition atmosphere"
          >
            {nightExpedition ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </header>

      {/* CENTERPIECE: Grand Circular Radar Scan Trigger */}
      <div className="relative my-auto flex flex-col items-center justify-center py-4">
        {/* Concentric Decorative Rings */}
        <div className="relative flex items-center justify-center">
          {/* Animated Wave 1 */}
          <div className="pointer-events-none absolute size-64 rounded-full border border-cyan/25 radar-ring-wave sm:size-72" />
          {/* Animated Wave 2 */}
          <div className="pointer-events-none absolute size-64 rounded-full border border-purple/20 radar-ring-wave-delayed sm:size-72" />

          {/* Outer Rotating Compass/Reticle Ring */}
          <div className="pointer-events-none absolute size-60 rounded-full border border-white/10 radar-spin-slow sm:size-68">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[0.55rem] font-mono text-cyan/60">30M</div>
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 text-[0.55rem] font-mono text-white/30">20M</div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[0.55rem] font-mono text-white/30">10M</div>
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 text-[0.55rem] font-mono text-white/30">05M</div>
          </div>

          {/* Inner Counter-Rotating Reticle Ring */}
          <div className="pointer-events-none absolute size-52 rounded-full border border-dashed border-cyan/20 radar-spin-reverse sm:size-60" />

          {/* Glowing Circular Scan Button */}
          <motion.button
            onClick={() => onStartScan(selectedMode)}
            disabled={starting}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            className="group relative z-20 flex size-44 flex-col items-center justify-center rounded-full border-2 border-cyan/60 bg-gradient-to-b from-[#0a0f1d] via-[#05060e] to-[#0d091a] p-4 text-center shadow-2xl circular-scan-trigger transition-all duration-300 disabled:opacity-50 sm:size-52"
          >
            {/* Pulsing inner radar radial sweep */}
            <div className="pointer-events-none absolute inset-2 rounded-full bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.22),transparent_70%)]" />

            {/* Sweep radar hand */}
            <div className="pointer-events-none absolute inset-3 rounded-full overflow-hidden">
              <div className="h-full w-full radar-spin-slow bg-[conic-gradient(from_0deg,transparent_0deg,transparent_310deg,rgba(0,240,255,0.45)_360deg)] opacity-70" />
            </div>

            {/* Icon */}
            <div className="relative mb-2 grid size-12 place-items-center rounded-full border border-cyan/40 bg-cyan/15 text-cyan shadow-[0_0_20px_rgba(0,240,255,0.35)] transition-transform duration-300 group-hover:scale-110 sm:size-14">
              <Waves className="size-6 sm:size-7" />
            </div>

            {/* Label */}
            <div className="relative">
              <span className="block text-sm font-black uppercase tracking-[0.24em] text-white drop-shadow-[0_0_12px_rgba(0,240,255,0.8)] sm:text-base">
                {starting ? 'CALIBRATING…' : 'INITIALIZE SCAN'}
              </span>
              <span className="mt-0.5 block font-mono text-[0.62rem] font-bold tracking-[0.2em] text-cyan/80">
                30M OBSERVATION
              </span>
            </div>
          </motion.button>
        </div>

        {/* Status Callout below circular button */}
        <p className="mt-5 text-center text-xs font-medium tracking-wide text-white/55">
          Tap center to calibrate sensors &amp; initiate 30-meter environmental scan
        </p>

        {/* Live Sensor Readiness Chips */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <SensorChip icon={<Compass className="size-3" />} label={`${heading}° HDG`} ready={snapshot.orientation.heading != null} />
          <SensorChip icon={<Mic className="size-3" />} label="FFT AUDIO" ready={Boolean(snapshot.audio)} />
          <SensorChip icon={<Activity className="size-3" />} label="KINEMATICS" ready={Boolean(snapshot.motion)} />
          <SensorChip icon={<RadioTower className="size-3" />} label="RF DENSITY" ready={Boolean(snapshot.radio?.supported)} />
        </div>
      </div>

      {/* Bottom Area: Mission Mode Selector & Capability Trigger */}
      <footer className="relative z-10 shrink-0 space-y-3 pb-2">
        {/* Mission Mode Selector */}
        <div>
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="telemetry-label">Select Expedition Mode</span>
            <span className="text-[0.62rem] font-mono text-cyan/70">{selectedMode.toUpperCase()} READY</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <ModeCard
              title="Quick Recon"
              desc="Fast 30m sweep"
              active={selectedMode === 'quick'}
              onClick={() => setSelectedMode('quick')}
              icon={<Zap className="size-4" />}
              accent="cyan"
            />
            <ModeCard
              title="Expedition"
              desc="Extended room survey"
              active={selectedMode === 'expedition'}
              onClick={() => setSelectedMode('expedition')}
              icon={<Sparkles className="size-4" />}
              accent="amber"
            />
            <ModeCard
              title="Audio Lab"
              desc="Spectrum analyzer"
              active={selectedMode === 'lab'}
              onClick={() => setSelectedMode('lab')}
              icon={<FlaskConical className="size-4" />}
              accent="purple"
            />
          </div>
        </div>

        {/* Hardware Matrix & Honesty Drawer Trigger */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={onOpenCapabilities}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-white/75 backdrop-blur-md transition hover:border-cyan/35 hover:text-cyan"
          >
            <ShieldCheck className="size-4 text-phosphor" />
            <span>Hardware Matrix &amp; Truth Model ({activeCapsCount}/{capabilities.length || 7} active)</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

function SensorChip({ icon, label, ready }: { icon: React.ReactNode; label: string; ready: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.62rem] backdrop-blur-md transition ${
      ready 
        ? 'border-cyan/30 bg-cyan/10 text-cyan' 
        : 'border-white/10 bg-white/[0.03] text-white/40'
    }`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function ModeCard({
  title,
  desc,
  active,
  onClick,
  icon,
  accent,
}: {
  title: string;
  desc: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  accent: 'cyan' | 'purple' | 'amber';
}) {
  const borderClass = active 
    ? accent === 'cyan' 
      ? 'border-cyan bg-cyan/10 text-white shadow-lg shadow-cyan/15'
      : accent === 'purple'
      ? 'border-purple bg-purple/10 text-white shadow-lg shadow-purple/15'
      : 'border-amber bg-amber/10 text-white shadow-lg shadow-amber/15'
    : 'border-white/10 bg-white/[0.035] text-white/60 hover:border-white/25 hover:text-white';

  const iconClass = active
    ? accent === 'cyan' ? 'text-cyan' : accent === 'purple' ? 'text-purple' : 'text-amber'
    : 'text-white/40';

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start rounded-2xl border p-2.5 text-left transition-all duration-200 ${borderClass}`}
    >
      <div className={`mb-1.5 ${iconClass}`}>{icon}</div>
      <p className="text-xs font-bold leading-tight tracking-tight text-white">{title}</p>
      <p className="mt-0.5 text-[0.62rem] text-white/45 truncate w-full">{desc}</p>
    </button>
  );
}
