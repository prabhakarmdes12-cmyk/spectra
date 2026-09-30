import { AudioLines, CircleAlert, Mic, SlidersHorizontal, Zap } from 'lucide-react';
import { WaterfallCanvas } from '../canvas/WaterfallCanvas';
import { GlassCard } from '../common/GlassCard';
import { StatPill } from '../common/StatPill';
import { useSpectraStore } from '../../stores/useSpectraStore';

export function AudioLabView() {
  const audio = useSpectraStore((state) => state.snapshot.audio);
  const events = useSpectraStore((state) => state.events.filter((event) => event.family === 'audio'));
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 px-4 pb-2">
      <div className="glass-panel min-h-0 flex-1 overflow-hidden rounded-[2rem] p-2">
        <WaterfallCanvas />
      </div>
      <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
        <AudioStat icon={<Mic />} label="RMS" value={audio ? audio.rms.toFixed(3) : 'idle'} />
        <AudioStat icon={<Zap />} label="Transient" value={audio ? `${Math.round(audio.transient * 100)}%` : 'idle'} tone={audio && audio.transient > 0.6 ? 'amber' : 'cyan'} />
        <AudioStat icon={<SlidersHorizontal />} label="Centroid" value={audio ? `${Math.round(audio.spectralCentroid)} Hz` : 'idle'} />
        <AudioStat icon={<AudioLines />} label="Rumble" value={audio ? `${Math.round(audio.lowFrequencyRumble * 100)}%` : 'idle'} />
      </div>
      <GlassCard className="max-h-40 shrink-0 overflow-hidden p-3" eyebrow="Transient detector" title="Audio event queue">
        <div className="no-scrollbar max-h-24 space-y-2 overflow-y-auto pr-1">
          {events.length ? (
            events.slice(0, 8).map((event) => (
              <div key={event.id} className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.035] p-2">
                <CircleAlert className="mt-0.5 size-4 text-amber" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white/85">{event.title}</p>
                  <p className="text-[0.68rem] text-white/45">{event.wallTime} · {event.spatialClass} · confidence {(event.confidence * 100).toFixed(0)}%</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs leading-relaxed text-white/50">No acoustic threshold events yet. A clap or knock should appear here only if microphone permission is granted and the waveform exceeds the rolling baseline.</p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

function AudioStat({ icon, label, value, tone = 'cyan' }: { icon: React.ReactNode; label: string; value: string; tone?: 'cyan' | 'amber' }) {
  return (
    <div className="glass-panel rounded-2xl p-3">
      <div className="flex items-center gap-2 text-white/45 [&>svg]:size-4">{icon}<span className="telemetry-label">{label}</span></div>
      <p className={`mt-1 font-mono text-sm tabular-nums ${tone === 'amber' ? 'text-amber' : 'text-cyan'}`}>{value}</p>
    </div>
  );
}
