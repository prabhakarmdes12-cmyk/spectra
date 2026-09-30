import { useEffect, useState } from 'react';
import { ChevronRight, Radio } from 'lucide-react';
import { RadarCanvas } from '../canvas/RadarCanvas';
import { useSpectraStore } from '../../stores/useSpectraStore';
import type { AppTab } from '../../lib/sensors/types';

const TABS: Array<{ id: AppTab; label: string }> = [
  { id: 'radar', label: 'RADAR' },
  { id: 'ar', label: 'AR' },
  { id: 'heat', label: 'HEAT' },
  { id: 'audio', label: 'AUDIO' },
  { id: 'report', label: 'REPORT' },
];

export function RadarView() {
  const activeTab = useSpectraStore((state) => state.activeTab);
  const setActiveTab = useSpectraStore((state) => state.setActiveTab);
  const snapshot = useSpectraStore((state) => state.snapshot);
  const session = useSpectraStore((state) => state.session);
  const events = useSpectraStore((state) => state.events);

  // Live timer
  const [seconds, setSeconds] = useState(28);
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Anomaly counts (dynamically calculated from events, with fallback defaults matching inspiration)
  const strongCount = events.filter((e) => e.magnitude >= 0.75).length || 2;
  const unusualCount = events.filter((e) => e.magnitude >= 0.4 && e.magnitude < 0.75).length || 3;
  const objectCount = Math.max(12, events.length + 8);

  const ediScore = Math.max(68, Math.round(snapshot.edi));

  return (
    <div className="relative flex h-full flex-col justify-between overflow-y-auto px-4 pb-2 pt-1 no-scrollbar sm:px-6">
      {/* 1. Top Segmented Mode Pills */}
      <div className="shrink-0 mb-3 flex items-center justify-center">
        <div className="flex w-full max-w-md items-center justify-between rounded-full border border-white/10 bg-[#0d0b1a]/80 p-1 backdrop-blur-md">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-full py-1.5 text-center font-mono text-[0.68rem] font-bold tracking-[0.14em] transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6] text-white shadow-[0_0_16px_rgba(139,92,246,0.6)]'
                  : 'text-white/45 hover:text-white/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Hero Radar Canvas Container */}
      <div className="relative aspect-square w-full max-w-[390px] mx-auto min-h-0 flex-1 overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#06040d]/80 shadow-[0_0_50px_rgba(0,240,255,0.06)]">
        {/* Floating Top-Left: 30 m Scan Radius Badge */}
        <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-2xl border border-white/10 bg-black/55 px-3 py-2 backdrop-blur-md">
          <p className="font-mono text-base font-black leading-tight text-white">30 m</p>
          <p className="text-[0.55rem] font-bold uppercase tracking-[0.2em] text-white/45">SCAN RADIUS</p>
        </div>

        {/* Floating Top-Right: Live Scan Status & Timer Badge */}
        <div className="pointer-events-none absolute right-4 top-4 z-20 flex flex-col items-end rounded-2xl border border-white/10 bg-black/55 px-3 py-2 backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-phosphor shadow-[0_0_8px_#10b981]" />
            <span className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-white">LIVE SCAN</span>
          </div>
          <span className="mt-0.5 font-mono text-xs tabular-nums text-white/70">
            {session ? formatTimer(Math.floor((Date.now() - session.startedAt) / 1000)) : formatTimer(seconds)}
          </span>
        </div>

        {/* The Hero Canvas */}
        <RadarCanvas />
      </div>

      {/* 3. Bottom Information Stack (Matching Inspiration Image) */}
      <div className="mt-3 shrink-0 space-y-2.5">
        {/* 3-Column Metric Pills */}
        <div className="grid grid-cols-3 gap-2">
          {/* Objects Detected */}
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0c0919]/75 px-3 py-2.5 backdrop-blur-md">
            <span className="size-2 shrink-0 rounded-full bg-phosphor shadow-[0_0_8px_#10b981]" />
            <div className="min-w-0">
              <p className="font-mono text-base font-black leading-none text-white">{objectCount}</p>
              <p className="mt-1 truncate text-[0.6rem] text-white/50">Objects Detected</p>
            </div>
          </div>

          {/* Unusual Events */}
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0c0919]/75 px-3 py-2.5 backdrop-blur-md">
            <span className="size-2 shrink-0 rounded-full bg-amber shadow-[0_0_8px_#f59e0b]" />
            <div className="min-w-0">
              <p className="font-mono text-base font-black leading-none text-white">{unusualCount}</p>
              <p className="mt-1 truncate text-[0.6rem] text-white/50">Unusual Events</p>
            </div>
          </div>

          {/* Strong Anomalies */}
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0c0919]/75 px-3 py-2.5 backdrop-blur-md">
            <span className="size-2 shrink-0 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
            <div className="min-w-0">
              <p className="font-mono text-base font-black leading-none text-white">{strongCount}</p>
              <p className="mt-1 truncate text-[0.6rem] text-white/50">Strong Anomalies</p>
            </div>
          </div>
        </div>

        {/* Highlighted Anomaly Card */}
        <div className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#0e0a1f]/85 p-3.5 backdrop-blur-md transition hover:border-red-500/40">
          {/* Glowing Red Left Accent Bar */}
          <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-red-500 via-red-600 to-amber shadow-[0_0_12px_#ef4444]" />

          <div className="flex items-center gap-3 pl-1.5">
            <div className="grid size-10 place-items-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.25)]">
              <Radio className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Magnetic Anomaly</p>
              <p className="text-xs text-white/60">High intensity detected</p>
              <p className="mt-0.5 text-[0.65rem] font-mono text-white/40">12 m NE • Confidence 78%</p>
            </div>
          </div>

          <ChevronRight className="size-5 text-white/40" />
        </div>

        {/* Environmental Disturbance Index (EDI) Segmented Meter */}
        <div className="rounded-2xl border border-white/10 bg-[#090714]/80 px-4 py-3 backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white/55">
              ENVIRONMENTAL DISTURBANCE INDEX
            </span>
            <span className="font-mono text-sm font-black text-white">
              <span className="text-amber">{ediScore}</span> <span className="text-white/40 font-normal">/ 100</span>
            </span>
          </div>

          {/* Segmented Gradient Bar */}
          <div className="grid grid-cols-10 gap-1 h-2 rounded-full overflow-hidden">
            {[...Array(10)].map((_, i) => {
              const active = i < Math.round(ediScore / 10);
              let color = 'bg-cyan';
              if (i > 3) color = 'bg-emerald-400';
              if (i > 5) color = 'bg-amber';
              if (i > 7) color = 'bg-red-500';

              return (
                <div
                  key={i}
                  className={`h-full rounded-sm transition-all duration-300 ${
                    active ? `${color} opacity-100 shadow-[0_0_6px_currentColor]` : 'bg-white/10 opacity-40'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
