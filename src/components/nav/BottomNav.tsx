import { AudioWaveform, Box, FileText, Home, Radar } from 'lucide-react';
import type { AppTab } from '../../lib/sensors/types';
import { useSpectraStore } from '../../stores/useSpectraStore';

const tabs: Array<{ id: AppTab; label: string; icon: typeof Home }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'radar', label: 'Radar', icon: Radar },
  { id: 'ar', label: 'AR', icon: Box },
  { id: 'audio', label: 'Audio', icon: AudioWaveform },
  { id: 'report', label: 'Report', icon: FileText },
];

export function BottomNav() {
  const activeTab = useSpectraStore((state) => state.activeTab);
  const setActiveTab = useSpectraStore((state) => state.setActiveTab);

  return (
    <nav className="relative z-30 shrink-0 px-4 pb-2 pt-1">
      <div className="glass-panel grid grid-cols-5 gap-1 rounded-[1.8rem] border border-white/10 bg-[#090714]/85 p-1.5 backdrop-blur-xl shadow-2xl">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-[1.2rem] py-2 px-1 text-[0.62rem] font-bold tracking-wider transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-b from-[#7c3aed] to-[#5b21b6] text-white shadow-[0_0_18px_rgba(124,58,237,0.75)]'
                  : 'text-white/40 hover:bg-white/[0.04] hover:text-white/80'
              }`}
            >
              <Icon className="size-5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
