import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SensorFusionEngine } from '../../lib/sensors/fusionEngine';
import { useWakeLock } from '../../hooks/useWakeLock';
import { useSpectraFeedback } from '../../hooks/useSpectraFeedback';
import { usePrevious } from '../../hooks/usePrevious';
import { useSpectraStore } from '../../stores/useSpectraStore';
import type { SessionMode } from '../../lib/sensors/types';
import { HomeScreen } from '../home/HomeScreen';
import { RadarView } from '../radar/RadarView';
import { ARReticleView } from '../ar/ARReticleView';
import { HeatView } from '../heat/HeatView';
import { AudioLabView } from '../lab/AudioLabView';
import { SessionReportView } from '../reports/SessionReportView';
import { TopTelemetryBar } from '../status/TopTelemetryBar';
import { BottomNav } from '../nav/BottomNav';
import { SettingsModal } from '../modals/SettingsModal';
import { AtmosphereLayer } from './AtmosphereLayer';

export function AppShell() {
  const engine = useMemo(() => new SensorFusionEngine(), []);
  const activeTab = useSpectraStore((state) => state.activeTab);
  const setActiveTab = useSpectraStore((state) => state.setActiveTab);
  const activeScan = useSpectraStore((state) => state.activeScan);
  const startSession = useSpectraStore((state) => state.startSession);
  const completeSession = useSpectraStore((state) => state.completeSession);
  const refreshCapabilities = useSpectraStore((state) => state.refreshCapabilities);
  const events = useSpectraStore((state) => state.events);
  const snapshot = useSpectraStore((state) => state.snapshot);
  const soundMuted = useSpectraStore((state) => state.soundMuted);
  const nightExpedition = useSpectraStore((state) => state.nightExpedition);
  const markInterrupted = useSpectraStore((state) => state.markInterrupted);

  const [starting, setStarting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useWakeLock(activeScan);
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

  const handleStartScan = useCallback(async (mode: SessionMode = 'quick') => {
    if (starting) return;
    setStarting(true);
    try {
      const sessionPromise = startSession(mode);
      const enginePromise = engine.start();
      await Promise.all([sessionPromise, enginePromise]);
      feedback.pulse(false);
      setActiveTab('radar');
    } finally {
      setStarting(false);
    }
  }, [engine, feedback, setActiveTab, startSession, starting]);

  return (
    <div className={`safe-shell relative isolate flex flex-col bg-[#030206] text-white ${nightExpedition ? 'night-expedition-shell' : ''}`}>
      {/* Background radial gradient layers */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_0%,rgba(0,240,255,0.12),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(168,85,247,0.14),transparent_38%),linear-gradient(180deg,#030206_0%,#060510_55%,#030206_100%)]" />

      {/* Atmospheric ambient layer */}
      <AtmosphereLayer />

      {/* Top Header Bar (when not on home tab, home has its own inline header) */}
      {activeTab !== 'home' && (
        <TopTelemetryBar
          onOpenMenu={() => setSettingsOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}

      {/* Main View Area */}
      <main className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {activeTab === 'home' && (
              <HomeScreen
                onStartScan={() => void handleStartScan()}
                onOpenSettings={() => setSettingsOpen(true)}
                onOpenMenu={() => setSettingsOpen(true)}
                starting={starting}
              />
            )}
            {activeTab === 'radar' && <RadarView />}
            {activeTab === 'ar' && <ARReticleView />}
            {activeTab === 'heat' && <HeatView />}
            {activeTab === 'audio' && <AudioLabView />}
            {activeTab === 'report' && <SessionReportView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Dock Navigation */}
      <BottomNav />

      {/* Settings / Permissions / Diagnostics Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onRefreshCapabilities={() => void refreshCapabilities()}
      />
    </div>
  );
}
