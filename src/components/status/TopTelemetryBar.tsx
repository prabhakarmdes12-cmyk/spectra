import { Menu, Settings } from 'lucide-react';

interface TopTelemetryBarProps {
  onOpenMenu: () => void;
  onOpenSettings: () => void;
}

export function TopTelemetryBar({ onOpenMenu, onOpenSettings }: TopTelemetryBarProps) {
  return (
    <header className="relative z-30 flex shrink-0 items-center justify-between gap-2 px-4 py-2.5">
      {/* Left: Hamburger Menu */}
      <button
        onClick={onOpenMenu}
        className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/70 backdrop-blur-md transition hover:border-cyan/40 hover:text-cyan active:scale-95"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      {/* Center: Clean Brand Title */}
      <div className="text-center">
        <h1 className="text-lg font-black tracking-[0.2em] text-white">CHITI SPECTRA</h1>
        <p className="text-[0.55rem] font-bold uppercase tracking-[0.24em] text-white/45">
          ENVIRONMENTAL INTELLIGENCE EXPLORER
        </p>
      </div>

      {/* Right: Settings Gear */}
      <button
        onClick={onOpenSettings}
        className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/70 backdrop-blur-md transition hover:border-cyan/40 hover:text-cyan active:scale-95"
        aria-label="Open settings"
      >
        <Settings className="size-5" />
      </button>
    </header>
  );
}
