import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bluetooth, Moon, Play, Radar, RefreshCw, Square, Sun, Waves } from 'lucide-react';
import { SensorFusionEngine } from '../../lib/sensors/fusionEngine';
import { useWakeLock } from '../../hooks/useWakeLock';
import { useSpectraFeedback } from '../../hooks/useSpectraFeedback';
import { usePrevious } from '../../hooks/usePrevious';
import { useSpectraStore } from '../../stores/useSpectraStore';
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

export function AppShell() {
  const engine = useMemo(() => new SensorFusionEngine(), []);
  const activeScan = useSpectraStore((state) => state.activeScan);
  const activeTab = useSpectraStore((state) => state.activeTab);
  const startSession = useSpectraStore((state) => state.startSession);
  const completeSession = useSpectraStore((state) => state.completeSession);
  const refreshCapabilities = useSpectraStore((state) => state.refreshCapabilities);
  const capabilities = useSpectraStore((state) => state.capabilities);
  const events = useSpectraStore((state) => state.events);
  const snapshot = useSpectraStore((state) => state.snapshot);
  const soundMuted = useSpectraStore((state) => state.soundMuted);
  const nightExpedition = useSpectraStore((state) => state.nightExpedition);
  const toggleNightExpedition = useSpectraStore((state) => state.toggleNightExpedition);
  const onboardingDismissed = useSpectraStore((state) => state.onboardingDismissed);
  const dismissOnboarding = useSpectraStore((state) => state.dismissOnboarding);
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
    if (prevEventCount !== undefined && events.length > prevEventCount) feedback.pulse(events[0]?.magnitude > 0.72);
  }, [events, feedback, prevEventCount]);

  useEffect(() => {
    if (prevEdi !== undefined && prevEdi < 75 && snapshot.edi >= 75) feedback.pulse(true);
  }, [feedback, prevEdi, snapshot.edi]);

  const handleStart = useCallback(async () => {
    if (starting || activeScan) return;
    setStarting(true);
    try {
      // Fire sensor permission requests immediately from the user gesture. The session
      // record is created in parallel so iOS motion/audio prompts are not delayed by IndexedDB.
      const sessionPromise = startSession('quick');
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
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_0%,rgba(0,240,255,0.16),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.18),transparent_34%),linear-gradient(180deg,#050508_0%,#070711_54%,#050508_100%)]" />
      <AtmosphereLayer />
      <TopTelemetryBar wakeState={wakeState} />
      <TruthBar />
      <FieldTensionMeter />
      <main className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            className="absolute inset-0"
            initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {activeTab === 'radar' && <RadarView />}
            {activeTab === 'ar' && <ARReticleView />}
            {activeTab === 'heat' && <HeatView />}
            {activeTab === 'audio' && <AudioLabView />}
            {activeTab === 'report' && <SessionReportView />}
          </motion.div>
        </AnimatePresence>
      </main>
      <div className="relative z-30 flex shrink-0 items-center gap-2 px-4 pb-2 pt-1">
        <button
          onClick={activeScan ? handleStop : handleStart}
          disabled={starting}
          className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-[0.18em] shadow-lg transition ${
            activeScan ? 'bg-amber text-black shadow-amber/20' : 'bg-cyan text-black shadow-cyan/25'
          } disabled:opacity-60`}
        >
          {activeScan ? <Square className="size-4" /> : <Play className="size-4" />}
          {starting ? 'Starting' : activeScan ? 'End scan' : 'Start scan'}
        </button>
        <button
          onClick={toggleNightExpedition}
          className={`grid size-12 place-items-center rounded-2xl border backdrop-blur-md transition ${
            nightExpedition ? 'border-amber/35 bg-amber/15 text-amber shadow-lg shadow-amber/10' : 'border-white/10 bg-white/[0.05] text-white/65 hover:border-amber/30 hover:text-amber'
          }`}
          aria-label={nightExpedition ? 'Disable Night Expedition atmosphere layer' : 'Enable Night Expedition atmosphere layer'}
        >
          {nightExpedition ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
        <button onClick={() => setCapabilityOpen(true)} className="grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/65 backdrop-blur-md transition hover:border-cyan/30 hover:text-cyan" aria-label="Open capability matrix">
          <RefreshCw className="size-5" />
        </button>
      </div>
      <BottomNav />
      <AnimatePresence>
        {(!onboardingDismissed || capabilityOpen) && (
          <motion.div className="absolute inset-0 z-50 flex items-end bg-black/55 p-3 backdrop-blur-sm sm:items-center sm:justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.section className="glass-panel no-scrollbar max-h-[88dvh] w-full overflow-y-auto rounded-[2rem] p-5 sm:max-w-2xl" initial={{ y: 32, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 32, scale: 0.98 }}>
              <div className="mb-4 flex items-start gap-3">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-cyan/15 text-cyan"><Radar className="size-7" /></div>
                <div className="min-w-0 flex-1">
                  <p className="telemetry-label">Environmental Intelligence Explorer</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-white">Make uncertainty beautiful.</h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">SPECTRA fuses real phone telemetry into radar, AR, heat, audio, and reports. It never invents blips or claims supernatural detection.</p>
                </div>
              </div>
              <div className="mb-4 grid gap-3 sm:grid-cols-4">
                <PromiseCard title="Measured" body="Solid markers are phone-local readings from exposed hardware APIs." />
                <PromiseCard title="Estimated" body="Soft regions require repeated observations and carry visible uncertainty." />
                <PromiseCard title="Unknown origin" body="Audio/RF events without direction stay as perimeter alerts or timeline ticks." />
                <PromiseCard title="Atmosphere" body="Night Expedition adds dread visuals and Field Tension, but never changes evidence." />
              </div>
              <div className="mb-4 flex flex-wrap gap-2">
                <button onClick={() => void refreshCapabilities()} className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-white/70 hover:border-cyan/30 hover:text-cyan">Run capability handshake</button>
                <button onClick={toggleNightExpedition} className={`rounded-full border px-4 py-2 text-xs font-semibold ${nightExpedition ? 'border-amber/35 bg-amber/15 text-amber' : 'border-amber/20 bg-amber/10 text-amber/80 hover:bg-amber/15'}`}><Moon className="mr-1 inline size-3.5" /> {nightExpedition ? 'Night mode on' : 'Enable Night Expedition'}</button>
                <button onClick={handleBluetooth} className="rounded-full border border-purple/25 bg-purple/10 px-4 py-2 text-xs font-semibold text-purple hover:bg-purple/20"><Bluetooth className="mr-1 inline size-3.5" /> Add BLE beacon</button>
                {bleStatus && <span className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/50">{bleStatus}</span>}
              </div>
              <CapabilityList capabilities={capabilities} />
              <div className="mt-5 flex gap-2">
                <button onClick={() => { dismissOnboarding(); setCapabilityOpen(false); }} className="flex-1 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-white/70">Close</button>
                <button onClick={async () => { dismissOnboarding(); setCapabilityOpen(false); await handleStart(); }} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-black shadow-lg shadow-cyan/25"><Waves className="size-4" /> Start scan</button>
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <p className="text-sm font-semibold text-white/90">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-white/52">{body}</p>
    </div>
  );
}
