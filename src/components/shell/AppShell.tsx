import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bluetooth, Moon, RefreshCw, ShieldCheck, Square, Waves } from 'lucide-react';
import { SensorFusionEngine } from '../../lib/sensors/fusionEngine';
import { useWakeLock } from '../../hooks/useWakeLock';
import { useSpectraFeedback } from '../../hooks/useSpectraFeedback';
import { usePrevious } from '../../hooks/usePrevious';
import { useSpectraStore } from '../../stores/useSpectraStore';
import type { SessionMode } from '../../lib/sensors/types';
import { ARReticleView } from '../ar/ARReticleView';
import { AudioLabView } from '../lab/AudioLabView';
import { BottomNav } from '../nav/BottomNav';
import { HeatView } from '../heat/HeatView';
import { RadarView } from '../radar/RadarView';
import { SessionReportView } from '../reports/SessionReportView';
import { TopTelemetryBar, TruthBar } from '../status/TopTelemetryBar';
import { FieldTensionMeter } from '../status/FieldTensionMeter';
import { CapabilityList } from '../common/CapabilityList';
import { AtmosphereLayer } from './AtmosphereLayer';
import { WelcomeScreen } from '../welcome/WelcomeScreen';

export function AppShell() {
  const engine = useMemo(() => new SensorFusionEngine(), []);
  const activeScan = useSpectraStore((state) => state.activeScan);
  const activeTab = useSpectraStore((state) => state.activeTab);
  const session = useSpectraStore((state) => state.session);
  const startSession = useSpectraStore((state) => state.startSession);
  const completeSession = useSpectraStore((state) => state.completeSession);
  const refreshCapabilities = useSpectraStore((state) => state.refreshCapabilities);
  const capabilities = useSpectraStore((state) => state.capabilities);
  const events = useSpectraStore((state) => state.events);
  const snapshot = useSpectraStore((state) => state.snapshot);
  const soundMuted = useSpectraStore((state) => state.soundMuted);
  const nightExpedition = useSpectraStore((state) => state.nightExpedition);
  const toggleNightExpedition = useSpectraStore((state) => state.toggleNightExpedition);
  const markInterrupted = useSpectraStore((state) => state.markInterrupted);

  const [starting, setStarting] = useState(false);
  const [capabilityOpen, setCapabilityOpen] = useState(false);
  const [bleStatus, setBleStatus] = useState<string | null>(null);

  const wakeState = useWakeLock(activeScan);
  const feedback = useSpectraFeedback(activeScan, soundMuted);
  const prevEventCount = usePrevious(events.length);
  const prevEdi = usePrevious(snapshot.edi);

  useEffect(() => {
    void refreshCapabilities();
  }, [refreshCapabilities]);

  useEffect(() => {
    return () => {
      void engine.stop();
      void markInterrupted();
    };
  }, [engine, markInterrupted]);

  useEffect(() => {
    if (prevEventCount !== undefined && events.length > prevEventCount) {
      feedback.pulse(events[0]?.magnitude > 0.72);
    }
  }, [events, feedback, prevEventCount]);

  useEffect(() => {
    if (prevEdi !== undefined && prevEdi < 75 && snapshot.edi >= 75) {
      feedback.pulse(true);
    }
  }, [feedback, prevEdi, snapshot.edi]);

  const handleStart = useCallback(async (mode: SessionMode = 'quick') => {
    if (starting || activeScan) return;
    setStarting(true);
    try {
      const sessionPromise = startSession(mode);
      const enginePromise = engine.start();
      await Promise.all([sessionPromise, enginePromise]);
      feedback.pulse(false);
    } finally {
      setStarting(false);
    }
  }, [activeScan, engine, feedback, startSession, starting]);

  const handleStop = useCallback(async () => {
    await engine.stop();
    await completeSession();
    feedback.pulse(false);
  }, [completeSession, engine, feedback]);

  const handleBluetooth = async () => {
    setBleStatus('Opening browser Bluetooth chooser…');
    const ok = await engine.requestBluetoothDevice();
    setBleStatus(ok ? 'Bluetooth beacon saved to live constellation.' : 'Bluetooth request unavailable or cancelled.');
  };

  return (
    <div className={`safe-shell relative isolate flex flex-col bg-space text-white ${nightExpedition ? 'night-expedition-shell' : ''}`}>
      {/* Background radial gradient layers */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_0%,rgba(0,240,255,0.14),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(168,85,247,0.15),transparent_38%),linear-gradient(180deg,#030206_0%,#060510_55%,#030206_100%)]" />

      {/* Atmospheric ambient layer */}
      <AtmosphereLayer />

      <AnimatePresence mode="wait">
        {!activeScan && !session ? (
          // WELCOME SCREEN (When scan is idle / before launch)
          <motion.div
            key="welcome-view"
            className="flex h-full w-full flex-1 flex-col overflow-hidden"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            <WelcomeScreen
              onStartScan={(mode) => void handleStart(mode)}
              onOpenCapabilities={() => setCapabilityOpen(true)}
              starting={starting}
            />
          </motion.div>
        ) : (
          // ACTIVE EXPEDITION DASHBOARD
          <motion.div
            key="expedition-view"
            className="flex h-full w-full flex-1 flex-col overflow-hidden"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {/* Top Telemetry & Spatial Honesty Bars */}
            <TopTelemetryBar wakeState={wakeState} />
            <TruthBar />
            <FieldTensionMeter />

            {/* Main Tab Canvas View */}
            <main className="relative min-h-0 flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  className="absolute inset-0"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                >
                  {activeTab === 'radar' && <RadarView />}
                  {activeTab === 'ar' && <ARReticleView />}
                  {activeTab === 'heat' && <HeatView />}
                  {activeTab === 'audio' && <AudioLabView />}
                  {activeTab === 'report' && <SessionReportView />}
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Tactical Scan Controls Strip */}
            <div className="relative z-30 flex shrink-0 items-center gap-2 px-3 pb-1.5 pt-1">
              <button
                onClick={handleStop}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber to-amber/90 px-4 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-black shadow-lg shadow-amber/25 transition active:scale-[0.98]"
              >
                <Square className="size-3.5 fill-black" />
                <span>End Expedition</span>
              </button>

              <button
                onClick={() => setCapabilityOpen(true)}
                className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/70 backdrop-blur-md transition hover:border-cyan/35 hover:text-cyan"
                aria-label="Open hardware capability matrix"
              >
                <RefreshCw className="size-4" />
              </button>
            </div>

            {/* Bottom Dock Navigation */}
            <BottomNav />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hardware Matrix & Truth Model Modal */}
      <AnimatePresence>
        {capabilityOpen && (
          <motion.div
            className="absolute inset-0 z-50 flex items-end bg-black/75 p-3 backdrop-blur-md sm:items-center sm:justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              className="glass-panel no-scrollbar max-h-[88dvh] w-full overflow-y-auto rounded-[2rem] p-5 sm:max-w-2xl"
              initial={{ y: 32, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 32, scale: 0.98 }}
            >
              <div className="mb-4 flex items-start gap-3">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-cyan/30 bg-cyan/15 text-cyan shadow-lg shadow-cyan/20">
                  <ShieldCheck className="size-7 text-cyan" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="telemetry-label text-cyan">Scientific Truth Model</p>
                  <h2 className="mt-0.5 text-xl font-black tracking-tight text-white">Hardware &amp; Spatial Honesty</h2>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">
                    SPECTRA fuses real browser hardware APIs onto a synchronized timeline. It never generates synthetic anomalies or claims supernatural certainty.
                  </p>
                </div>
              </div>

              <div className="mb-4 grid gap-2.5 sm:grid-cols-4">
                <PromiseCard title="Measured" body="Direct observation from hardware at the device's immediate location." />
                <PromiseCard title="Estimated" body="Position inferred from spatial motion and signal attenuation over time." />
                <PromiseCard title="Unknown Origin" body="Physical anomalies detected without directional certainty stay on perimeter." />
                <PromiseCard title="Atmosphere" body="Night Expedition adds immersive visual tension without altering data." />
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={() => void refreshCapabilities()}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-xs font-semibold text-white/80 hover:border-cyan/35 hover:text-cyan"
                >
                  <RefreshCw className="mr-1 inline size-3" /> Re-check Hardware
                </button>
                <button
                  onClick={toggleNightExpedition}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                    nightExpedition
                      ? 'border-amber/40 bg-amber/15 text-amber'
                      : 'border-white/10 bg-white/[0.05] text-white/70 hover:border-amber/30 hover:text-amber'
                  }`}
                >
                  <Moon className="mr-1 inline size-3" /> {nightExpedition ? 'Night Mode Active' : 'Enable Night Mode'}
                </button>
                <button
                  onClick={handleBluetooth}
                  className="rounded-full border border-purple/30 bg-purple/10 px-3.5 py-1.5 text-xs font-semibold text-purple hover:bg-purple/20"
                >
                  <Bluetooth className="mr-1 inline size-3" /> Pair BLE Beacon
                </button>
                {bleStatus && <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/50">{bleStatus}</span>}
              </div>

              <CapabilityList capabilities={capabilities} />

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setCapabilityOpen(false)}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-white/75 hover:bg-white/[0.08]"
                >
                  Close
                </button>
                {!activeScan && (
                  <button
                    onClick={async () => {
                      setCapabilityOpen(false);
                      await handleStart();
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-black shadow-lg shadow-cyan/25 hover:bg-cyan/90"
                  >
                    <Waves className="size-4" /> Start Scan
                  </button>
                )}
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PromiseCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs font-bold text-white/90">{title}</p>
      <p className="mt-1 text-[0.68rem] leading-relaxed text-white/50">{body}</p>
    </div>
  );
}
