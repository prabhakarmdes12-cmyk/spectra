import { useState } from 'react';
import { 
  AudioWaveform, 
  Box, 
  BrainCircuit, 
  FileText, 
  Flame, 
  Menu, 
  Radar, 
  Radio, 
  Settings, 
  Waves 
} from 'lucide-react';
import { useSpectraStore } from '../../stores/useSpectraStore';
import type { AppTab } from '../../lib/sensors/types';

interface HomeScreenProps {
  onStartScan: () => void;
  onOpenSettings: () => void;
  onOpenMenu: () => void;
  starting: boolean;
}

export function HomeScreen({ onStartScan, onOpenSettings, onOpenMenu, starting }: HomeScreenProps) {
  const setActiveTab = useSpectraStore((state) => state.setActiveTab);

  const featureCards: Array<{
    id: AppTab;
    title: string;
    desc: string;
    icon: typeof Radar;
    color: string;
  }> = [
    { id: 'radar', title: 'LIVE RADAR', desc: 'Real-time 30 m map', icon: Radar, color: 'text-cyan border-cyan/30 bg-cyan/10' },
    { id: 'audio', title: 'MULTI-SENSOR', desc: 'Detect disturbances', icon: Waves, color: 'text-purple border-purple/30 bg-purple/10' },
    { id: 'report', title: 'AI INSIGHTS', desc: 'Understand your environment', icon: BrainCircuit, color: 'text-cyan border-cyan/30 bg-cyan/10' },
    { id: 'ar', title: 'AR VIEW', desc: 'See it in your world', icon: Box, color: 'text-purple border-purple/30 bg-purple/10' },
    { id: 'heat', title: 'HEAT MAP', desc: 'Visual field intensity', icon: Flame, color: 'text-amber border-amber/30 bg-amber/10' },
    { id: 'report', title: 'FIELD REPORT', desc: 'AI analysis & log', icon: FileText, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  ];

  return (
    <div className="relative flex h-full flex-col justify-between overflow-y-auto overflow-x-hidden px-4 py-3 no-scrollbar sm:px-6">
      {/* 1. Top Header Bar */}
      <header className="relative z-20 flex shrink-0 items-center justify-between gap-3">
        <button
          onClick={onOpenMenu}
          className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/70 backdrop-blur-md transition hover:border-cyan/40 hover:text-cyan"
          aria-label="Open navigation drawer"
        >
          <Menu className="size-5" />
        </button>

        <div className="text-center">
          <h1 className="text-lg font-black tracking-[0.2em] text-white">CHITI SPECTRA</h1>
          <p className="text-[0.55rem] font-bold uppercase tracking-[0.24em] text-white/45">
            ENVIRONMENTAL INTELLIGENCE EXPLORER
          </p>
        </div>

        <button
          onClick={onOpenSettings}
          className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/70 backdrop-blur-md transition hover:border-cyan/40 hover:text-cyan"
          aria-label="Open settings"
        >
          <Settings className="size-5" />
        </button>
      </header>

      {/* 2. Hero Holographic 3D City & Radar Preview Visual */}
      <div className="relative mx-auto my-1 flex aspect-[4/3] w-full max-w-[360px] items-center justify-center overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#06040d]/70 shadow-[0_0_40px_rgba(168,85,247,0.1)]">
        {/* Floating Top-Left: 30 m Scan Radius Badge */}
        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-2xl border border-white/10 bg-black/60 px-3 py-1.5 backdrop-blur-md">
          <p className="font-mono text-sm font-black leading-tight text-white">30 m</p>
          <p className="text-[0.5rem] font-bold uppercase tracking-[0.16em] text-white/45">SCAN RADIUS</p>
        </div>

        {/* Floating Top-Right: All Sensors Active Badge */}
        <div className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-2xl border border-white/10 bg-black/60 px-3 py-2 backdrop-blur-md">
          <span className="size-2 rounded-full bg-phosphor shadow-[0_0_8px_#10b981]" />
          <span className="text-[0.58rem] font-black uppercase tracking-[0.16em] text-white">LIVE SCAN</span>
        </div>

        {/* Fixed North Compass Indicator at Top */}
        <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 font-mono text-xs font-bold text-white/60">
          N
        </div>

        {/* Concentric Wireframe Rings */}
        <div className="pointer-events-none absolute size-56 rounded-full border border-cyan/25" />
        <div className="pointer-events-none absolute size-40 rounded-full border border-purple/20" />
        <div className="pointer-events-none absolute size-24 rounded-full border border-cyan/20" />

        {/* Distance labels */}
        <div className="pointer-events-none absolute top-6 right-8 font-mono text-[0.55rem] text-white/35">30 m</div>
        <div className="pointer-events-none absolute top-12 right-14 font-mono text-[0.55rem] text-white/35">20 m</div>
        <div className="pointer-events-none absolute top-18 right-20 font-mono text-[0.55rem] text-white/35">10 m</div>

        {/* Center Observer Avatar (👤) */}
        <div className="relative z-10 grid size-12 place-items-center rounded-full border-2 border-cyan bg-cyan/15 text-white shadow-[0_0_20px_rgba(0,240,255,0.5)]">
          <div className="flex flex-col items-center">
            <span className="size-2 rounded-full bg-white" />
            <span className="mt-0.5 h-2.5 w-3.5 rounded-t-full bg-white" />
          </div>
        </div>

        {/* 3D Isometric Holographic Structures Graphic */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-60" viewBox="0 0 360 270">
          {/* Wireframe isometric buildings in perspective */}
          <polygon points="60,110 90,95 120,110 90,125" fill="rgba(0,240,255,0.15)" stroke="rgba(0,240,255,0.5)" strokeWidth="1" />
          <polygon points="60,110 90,125 90,165 60,150" fill="rgba(0,240,255,0.08)" stroke="rgba(0,240,255,0.4)" strokeWidth="1" />
          <polygon points="90,125 120,110 120,150 90,165" fill="rgba(0,240,255,0.12)" stroke="rgba(0,240,255,0.4)" strokeWidth="1" />

          <polygon points="240,100 270,85 300,100 270,115" fill="rgba(168,85,247,0.18)" stroke="rgba(168,85,247,0.5)" strokeWidth="1" />
          <polygon points="240,100 270,115 270,160 240,145" fill="rgba(168,85,247,0.1)" stroke="rgba(168,85,247,0.4)" strokeWidth="1" />
          <polygon points="270,115 300,100 300,145 270,160" fill="rgba(168,85,247,0.14)" stroke="rgba(168,85,247,0.4)" strokeWidth="1" />

          {/* Glowing Anomaly Points */}
          <circle cx="105" cy="80" r="3.5" fill="#f59e0b" filter="drop-shadow(0 0 8px #f59e0b)" />
          <circle cx="260" cy="180" r="3" fill="#10b981" filter="drop-shadow(0 0 6px #10b981)" />
          <circle cx="210" cy="70" r="3.5" fill="#a855f7" filter="drop-shadow(0 0 8px #a855f7)" />
          <circle cx="80" cy="190" r="4" fill="#00f0ff" filter="drop-shadow(0 0 8px #00f0ff)" />
        </svg>
      </div>

      {/* 3. Hero Callout: Explore The Invisible */}
      <div className="shrink-0 text-center my-1">
        <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
          EXPLORE THE INVISIBLE
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-white/55">
          Turn your phone into a powerful environmental scanner. Visualize magnetic, acoustic, RF, motion, thermal and network activity around you — up to 30 meters.
        </p>

        {/* Primary CTA Button: START SCAN */}
        <button
          onClick={onStartScan}
          disabled={starting}
          className="mt-3 inline-flex w-full max-w-xs items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#6d28d9] via-[#7c3aed] to-[#8b5cf6] py-3.5 px-6 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-all duration-200 active:scale-95 hover:shadow-[0_0_40px_rgba(139,92,246,0.8)] disabled:opacity-50"
        >
          <div className="grid size-5 place-items-center rounded-full border border-white/40 bg-white/20">
            <Radio className="size-3" />
          </div>
          <span>{starting ? 'CALIBRATING…' : 'START SCAN →'}</span>
        </button>
      </div>

      {/* 4. 2x3 Grid of Feature Cards (Directly functional) */}
      <div className="grid shrink-0 grid-cols-2 gap-2 pb-1">
        {featureCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.title}
              onClick={() => {
                setActiveTab(card.id);
                onStartScan();
              }}
              className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-[#0d0a1c]/80 p-2.5 text-left backdrop-blur-md transition-all duration-200 hover:border-cyan/35 hover:bg-[#120e26]"
            >
              <div className={`grid size-9 shrink-0 place-items-center rounded-xl border ${card.color}`}>
                <Icon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight tracking-tight text-white">{card.title}</p>
                <p className="truncate text-[0.62rem] text-white/45">{card.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
