import { useState } from 'react';
import { 
  Activity, 
  Bluetooth, 
  Camera, 
  Check, 
  Compass, 
  Infinity, 
  MapPin, 
  Mic, 
  Moon, 
  Radio, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles, 
  Sun, 
  Volume2, 
  VolumeX, 
  Wifi, 
  X 
} from 'lucide-react';
import { useSpectraStore } from '../../stores/useSpectraStore';
import { CapabilityList } from '../common/CapabilityList';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshCapabilities: () => void;
}

export function SettingsModal({ isOpen, onClose, onRefreshCapabilities }: SettingsModalProps) {
  const [tab, setTab] = useState<'permissions' | 'calibrate' | 'matrix'>('permissions');
  const [calibrating, setCalibrating] = useState(false);
  const [calStep, setCalStep] = useState(1);

  const capabilities = useSpectraStore((state) => state.capabilities);
  const soundMuted = useSpectraStore((state) => state.soundMuted);
  const setSoundMuted = useSpectraStore((state) => state.setSoundMuted);
  const nightExpedition = useSpectraStore((state) => state.nightExpedition);
  const toggleNightExpedition = useSpectraStore((state) => state.toggleNightExpedition);

  if (!isOpen) return null;

  const startCalibration = () => {
    setCalibrating(true);
    setCalStep(1);
    const t1 = setTimeout(() => setCalStep(2), 1200);
    const t2 = setTimeout(() => setCalStep(3), 2600);
    const t3 = setTimeout(() => setCalStep(4), 4000);
    const t4 = setTimeout(() => setCalibrating(false), 5500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-3 backdrop-blur-md sm:items-center">
      <div className="glass-panel no-scrollbar max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[2.5rem] border border-white/10 bg-[#0c0919]/95 p-5 shadow-2xl">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.25em] text-cyan">CHITI SPECTRA</span>
            <span className="text-white/30">•</span>
            <span className="text-xs font-semibold text-white/70">Control Deck</span>
          </div>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-white/60 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Sub-Tabs */}
        <div className="mt-3 flex items-center justify-between gap-1 rounded-full border border-white/10 bg-black/40 p-1">
          <button
            onClick={() => setTab('permissions')}
            className={`flex-1 rounded-full py-1.5 text-center text-xs font-bold transition ${
              tab === 'permissions' ? 'bg-gradient-to-r from-purple to-cyan text-white shadow-md' : 'text-white/40'
            }`}
          >
            Permissions
          </button>
          <button
            onClick={() => setTab('calibrate')}
            className={`flex-1 rounded-full py-1.5 text-center text-xs font-bold transition ${
              tab === 'calibrate' ? 'bg-gradient-to-r from-purple to-cyan text-white shadow-md' : 'text-white/40'
            }`}
          >
            Calibrate
          </button>
          <button
            onClick={() => setTab('matrix')}
            className={`flex-1 rounded-full py-1.5 text-center text-xs font-bold transition ${
              tab === 'matrix' ? 'bg-gradient-to-r from-purple to-cyan text-white shadow-md' : 'text-white/40'
            }`}
          >
            Diagnostics
          </button>
        </div>

        {/* TAB 1: PERMISSIONS (Matching Image 1 Left Screen) */}
        {tab === 'permissions' && (
          <div className="mt-4 space-y-3">
            <div>
              <h3 className="text-lg font-black text-white">Let's get you ready</h3>
              <p className="mt-0.5 text-xs text-white/55">Enable sensors to explore the invisible layers around you.</p>
            </div>

            <div className="space-y-2">
              <PermissionItem
                icon={<MapPin className="size-4 text-purple" />}
                title="Location"
                desc="Used for orientation, mapping and 30 m scan radius."
                badge="Required"
                badgeTone="purple"
              />
              <PermissionItem
                icon={<Activity className="size-4 text-purple" />}
                title="Motion & Orientation"
                desc="Tracks movement, rotation and device positioning."
                badge="Required"
                badgeTone="purple"
              />
              <PermissionItem
                icon={<Mic className="size-4 text-purple" />}
                title="Microphone"
                desc="Captures audio for analysis and disturbance detection."
                badge="Required"
                badgeTone="purple"
              />
              <PermissionItem
                icon={<Camera className="size-4 text-cyan" />}
                title="Camera"
                desc="Used for AR view, motion detection and visual mapping."
                badge="Recommended"
                badgeTone="cyan"
              />
              <PermissionItem
                icon={<Bluetooth className="size-4 text-blue-400" />}
                title="Nearby Devices (Bluetooth)"
                desc="Detects nearby wireless signals and device activity."
                badge="Optional"
                badgeTone="gray"
              />
              <PermissionItem
                icon={<Wifi className="size-4 text-cyan" />}
                title="Wi-Fi Scanning"
                desc="Maps nearby access points and signal strength."
                badge="Optional"
                badgeTone="gray"
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 pt-2">
              <button
                onClick={() => setSoundMuted(!soundMuted)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-semibold text-white/75"
              >
                {soundMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                <span>{soundMuted ? 'Sound Off' : 'Sound On'}</span>
              </button>
              <button
                onClick={toggleNightExpedition}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl border py-2.5 text-xs font-semibold ${
                  nightExpedition ? 'border-amber/40 bg-amber/15 text-amber' : 'border-white/10 bg-white/[0.04] text-white/75'
                }`}
              >
                {nightExpedition ? <Sun className="size-4" /> : <Moon className="size-4" />}
                <span>{nightExpedition ? 'Night Mode' : 'Standard'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: CALIBRATE (Matching Image 1 Center Screen) */}
        {tab === 'calibrate' && (
          <div className="mt-4 space-y-3">
            <div className="text-center">
              <h3 className="text-lg font-black text-white">Calibrating sensors</h3>
              <p className="mt-0.5 text-xs text-white/55">Move your phone slowly in a figure-8 to improve spatial accuracy.</p>
            </div>

            {/* Glowing Figure-8 Graphic */}
            <div className="relative mx-auto my-2 flex h-36 w-full items-center justify-center rounded-2xl border border-white/10 bg-black/40">
              <svg className="h-28 w-48 text-cyan/70 drop-shadow-[0_0_12px_rgba(0,240,255,0.6)]" viewBox="0 0 100 50">
                <path
                  d="M25,25 C10,10 10,40 25,40 C40,40 60,10 75,10 C90,10 90,40 75,40 C60,40 40,10 25,10 Z"
                  fill="none"
                  stroke="url(#figGrad)"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                  className={calibrating ? 'animate-pulse' : ''}
                />
                <defs>
                  <linearGradient id="figGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00f0ff" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#00f0ff" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute font-mono text-[0.62rem] text-white/40">
                {calibrating ? `STAGE ${calStep} OF 4` : 'STANDBY'}
              </div>
            </div>

            {/* Calibration Checklist */}
            <div className="space-y-1.5 rounded-2xl border border-white/10 bg-black/30 p-3 text-xs">
              <CheckStep label="Initializing sensors" done={calStep >= 1} />
              <CheckStep label="Calibrating motion & orientation" done={calStep >= 2} active={calStep === 1} />
              <CheckStep label="Measuring ambient environment" done={calStep >= 3} active={calStep === 2} />
              <CheckStep label="Building spatial 30m model" done={calStep >= 4} active={calStep === 3} />
            </div>

            {/* Tip Box */}
            <div className="flex items-center gap-2.5 rounded-2xl border border-cyan/20 bg-cyan/10 p-3 text-xs text-cyan">
              <Infinity className="size-5 shrink-0" />
              <p className="text-[0.68rem] leading-relaxed text-white/80">
                <strong>Tip: Move slowly.</strong> Cover all angles and axes for the cleanest 30 m magnetic baseline.
              </p>
            </div>

            <button
              onClick={startCalibration}
              disabled={calibrating}
              className="mt-2 w-full rounded-full bg-gradient-to-r from-purple to-cyan py-3 text-center text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-purple/20 disabled:opacity-50"
            >
              {calibrating ? `Calibrating... Step ${calStep}/4` : 'Start Figure-8 Calibration'}
            </button>
          </div>
        )}

        {/* TAB 3: DIAGNOSTICS & TRUTH MODEL */}
        {tab === 'matrix' && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">Hardware Diagnostics</h3>
                <p className="text-xs text-white/50">Runtime browser sensor matrix</p>
              </div>
              <button
                onClick={onRefreshCapabilities}
                className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/70 hover:border-cyan/40 hover:text-cyan"
              >
                <RefreshCw className="size-3" /> Rescan
              </button>
            </div>

            <CapabilityList capabilities={capabilities} />

            <div className="rounded-2xl border border-phosphor/20 bg-phosphor/10 p-3 text-xs text-white/70">
              <div className="flex items-center gap-1.5 font-bold text-phosphor">
                <ShieldCheck className="size-4" />
                <span>Spatial Honesty Active</span>
              </div>
              <p className="mt-1 text-[0.65rem] leading-relaxed text-white/55">
                Direct measurements from hardware are solid points. Estimated regions are soft clouds. Real anomalies without direction stay on the perimeter.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 border-t border-white/10 pt-3 text-center text-[0.62rem] text-white/40">
          🔒 Your data stays locally on your device. Zero cloud tracking.
        </div>
      </div>
    </div>
  );
}

function PermissionItem({
  icon,
  title,
  desc,
  badge,
  badgeTone,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  badge: string;
  badgeTone: 'purple' | 'cyan' | 'gray';
}) {
  const badgeClasses =
    badgeTone === 'purple'
      ? 'border-purple/40 bg-purple/15 text-purple'
      : badgeTone === 'cyan'
      ? 'border-cyan/40 bg-cyan/15 text-cyan'
      : 'border-white/10 bg-white/[0.04] text-white/40';

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">
      <div className="flex items-center gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/40">
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold text-white">{title}</p>
          <p className="text-[0.62rem] text-white/50">{desc}</p>
        </div>
      </div>
      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.58rem] font-bold ${badgeClasses}`}>
        {badge}
      </span>
    </div>
  );
}

function CheckStep({ label, done, active }: { label: string; done?: boolean; active?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`grid size-4 place-items-center rounded-full text-[0.6rem] font-bold ${
          done
            ? 'bg-phosphor text-black shadow-[0_0_6px_#10b981]'
            : active
            ? 'border border-cyan text-cyan animate-pulse'
            : 'border border-white/20 text-transparent'
        }`}
      >
        {done ? <Check className="size-2.5 stroke-[3]" /> : '•'}
      </div>
      <span className={done ? 'text-white/85' : active ? 'text-cyan font-semibold' : 'text-white/40'}>
        {label}
      </span>
    </div>
  );
}
