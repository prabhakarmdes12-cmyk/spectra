import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, Database, Download, FileJson, FileText, Flag, RadioTower, ShieldAlert } from 'lucide-react';
import { buildHeuristicReport, toCsvExport, toJsonExport } from '../../lib/exporters';
import { spectraDB } from '../../lib/storage/db';
import type { SessionRecord } from '../../lib/sensors/types';
import { downloadText, formatDuration } from '../../lib/utils';
import { useSpectraStore } from '../../stores/useSpectraStore';
import { CapabilityList } from '../common/CapabilityList';
import { GlassCard } from '../common/GlassCard';

export function SessionReportView() {
  const session = useSpectraStore((state) => state.session);
  const events = useSpectraStore((state) => state.events);
  const path = useSpectraStore((state) => state.path);
  const heat = useSpectraStore((state) => state.heat);
  const capabilities = useSpectraStore((state) => state.capabilities);
  const snapshot = useSpectraStore((state) => state.snapshot);
  const [history, setHistory] = useState<SessionRecord[]>([]);

  useEffect(() => {
    let mounted = true;
    spectraDB.sessions.orderBy('startedAt').reverse().limit(8).toArray().then((records) => {
      if (mounted) setHistory(records);
    });
    return () => {
      mounted = false;
    };
  }, [session?.status, events.length]);

  const report = useMemo(() => (session ? buildHeuristicReport(session, events) : ''), [session, events]);

  const exportPayload = () => {
    if (!session) return null;
    return { session, events, path, heat, generatedAt: new Date().toISOString() };
  };

  const handleExport = (kind: 'json' | 'csv' | 'md') => {
    const payload = exportPayload();
    if (!payload) return;
    const base = payload.session.id.toLowerCase();
    if (kind === 'json') downloadText(`${base}-spectra-evidence.json`, toJsonExport(payload), 'application/json;charset=utf-8');
    if (kind === 'csv') downloadText(`${base}-events.csv`, toCsvExport(events), 'text/csv;charset=utf-8');
    if (kind === 'md') downloadText(`${base}-field-report.md`, report, 'text/markdown;charset=utf-8');
  };

  return (
    <div className="no-scrollbar h-full overflow-y-auto px-4 pb-4">
      <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <GlassCard className="p-4" eyebrow="Expedition" title="Mission control" action={<ClipboardList className="size-5 text-cyan" />}>
          <div className="grid gap-2 sm:grid-cols-3">
            <MissionCard title="Map the Room" detail="Reach 90% observed coverage" value={`${Math.round((session?.coverageEstimate ?? 0) * 100)}%`} complete={(session?.coverageEstimate ?? 0) > 0.9} />
            <MissionCard title="Silent Observer" detail="Stable quiet baseline" value={`${Math.round(snapshot.calibrationProgress * 100)}%`} complete={snapshot.calibrationProgress > 0.95 && (snapshot.motion?.contamination ?? 0) < 0.2} />
            <MissionCard title="Magnetic Sweep" detail="Slow 360° orientation pass" value={snapshot.magnetic ? `${snapshot.magnetic.magnitude.toFixed(1)} µT` : 'limited'} complete={Boolean(snapshot.magnetic)} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <SummaryTile label="Status" value={session?.status ?? 'idle'} />
            <SummaryTile label="Duration" value={session ? formatDuration((session.endedAt ?? Date.now()) - session.startedAt) : '00:00'} />
            <SummaryTile label="Events" value={String(events.length)} />
            <SummaryTile label="Max EDI" value={`${Math.round(session?.maxEdi ?? snapshot.edi)}`} />
          </div>
        </GlassCard>

        <GlassCard className="p-4" eyebrow="Local-first storage" title="Evidence export" action={<Database className="size-5 text-purple" />}>
          <div className="grid grid-cols-3 gap-2">
            <ExportButton icon={<FileJson />} label="JSON" onClick={() => handleExport('json')} disabled={!session} />
            <ExportButton icon={<Download />} label="CSV" onClick={() => handleExport('csv')} disabled={!session} />
            <ExportButton icon={<FileText />} label="Markdown" onClick={() => handleExport('md')} disabled={!session} />
          </div>
          <div className="mt-3 rounded-2xl border border-amber/20 bg-amber/10 p-3 text-xs leading-relaxed text-white/62">
            <div className="mb-1 flex items-center gap-2 font-semibold text-amber"><ShieldAlert className="size-4" /> Trust contract</div>
            Reports quote raw measurements and confidence. They never claim supernatural causation, danger, or hidden persons.
          </div>
        </GlassCard>

        <GlassCard className="p-4 lg:col-span-2" eyebrow="Heuristic investigator" title="Evidence-grounded field report">
          <pre className="no-scrollbar max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-[0.72rem] leading-relaxed text-white/68">
            {session ? report : 'Start and end a scan to generate a local field report. The rules-based investigator will summarize top events, likely ordinary explanations, unresolved correlations, and next tests.'}
          </pre>
        </GlassCard>

        <GlassCard className="p-4" eyebrow="Timeline" title="Anomaly evidence">
          <div className="no-scrollbar max-h-[24rem] space-y-2 overflow-y-auto pr-1">
            {events.length ? (
              events.map((event) => (
                <article key={event.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white/90">{event.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/55">{event.summary}</p>
                    </div>
                    <span className="rounded-full border border-cyan/20 bg-cyan/10 px-2 py-1 font-mono text-[0.65rem] text-cyan">{event.wallTime}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[0.68rem]">
                    <Mini label="raw" value={`${event.rawValue.toFixed(2)} ${event.rawUnit}`} />
                    <Mini label="spatial" value={event.spatialClass} />
                    <Mini label="conf" value={`${Math.round(event.confidence * 100)}%`} />
                  </div>
                  <p className="mt-2 text-[0.68rem] text-white/45">{event.explanations[0]}</p>
                </article>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-white/45">No anomalies have crossed threshold. Quiet sessions are valid evidence.</p>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-4" eyebrow="Capability handshake" title="Runtime sensor matrix" action={<RadioTower className="size-5 text-cyan" />}>
          <CapabilityList capabilities={capabilities} />
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-xs leading-relaxed text-white/48">
            RF fallback note: unsupported radios stay disabled in live evidence. Any future simulation layer must be explicitly watermarked and excluded from reports.
          </div>
        </GlassCard>

        <GlassCard className="p-4 lg:col-span-2" eyebrow="Journal" title="Recent local sessions">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {history.length ? history.map((record) => (
              <div key={record.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/80"><Flag className="size-4 text-purple" /> {record.id.slice(0, 18)}</div>
                <p className="mt-2 font-mono text-[0.68rem] text-white/45">{record.status} · {record.eventCount} events · max EDI {Math.round(record.maxEdi)}</p>
              </div>
            )) : <p className="text-sm text-white/45">No stored sessions yet.</p>}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function MissionCard({ title, detail, value, complete }: { title: string; detail: string; value: string; complete: boolean }) {
  return (
    <div className={`rounded-2xl border p-3 ${complete ? 'border-phosphor/25 bg-phosphor/10' : 'border-white/10 bg-white/[0.035]'}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-white/85">{title}</p>
        <CheckCircle2 className={`size-4 ${complete ? 'text-phosphor' : 'text-white/20'}`} />
      </div>
      <p className="mt-1 text-xs text-white/45">{detail}</p>
      <p className="mt-2 font-mono text-xs text-cyan">{value}</p>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
      <p className="telemetry-label">{label}</p>
      <p className="mt-1 truncate font-mono text-sm text-cyan">{value}</p>
    </div>
  );
}

function ExportButton({ icon, label, onClick, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button disabled={disabled} onClick={onClick} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center text-xs font-semibold text-white/70 transition hover:border-cyan/30 hover:text-cyan disabled:cursor-not-allowed disabled:opacity-35">
      <span className="mx-auto mb-2 block w-fit [&>svg]:size-5">{icon}</span>
      {label}
    </button>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/35 p-2">
      <p className="uppercase tracking-[0.18em] text-white/30">{label}</p>
      <p className="mt-1 truncate font-mono text-white/70">{value}</p>
    </div>
  );
}
