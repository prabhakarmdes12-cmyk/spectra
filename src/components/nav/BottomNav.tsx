import { AudioWaveform, FileText, Flame, Radar, ScanEye } from 'lucide-react';
import type { AppTab } from '../../lib/sensors/types';
import { useSpectraStore } from '../../stores/useSpectraStore';

const tabs: Array<{ id: AppTab; label: string; icon: typeof Radar }> = [
  { id: 'radar', label: 'Radar', icon: Radar },
  { id: 'ar', label: 'AR', icon: ScanEye },
  { id: 'heat', label: 'Heat', icon: Flame },
  { id: 'audio', label: 'Audio', icon: AudioWaveform },
  { id: 'report', label: 'Report', icon: FileText },
];

export function BottomNav() {
  const activeTab = useSpectraStore((state) => state.activeTab);
  const setActiveTab = useSpectraStore((state) => state.setActiveTab);
  return (
    <nav className="relative z-30 shrink-0 px-3 pb-2">
      <div className="glass-panel grid grid-cols-5 gap-1 rounded-[1.6rem] p-1.5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex min-w-0 flex-col items-center gap-1 rounded-[1.15rem] px-1 py-2 text-[0.65rem] font-semibold transition ${
              activeTab === id ? 'bg-cyan text-black shadow-lg shadow-cyan/25' : 'text-white/45 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon className="size-5" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
