import type { AnomalyEvent, EvidenceExport, SessionRecord } from './sensors/types';
import { formatDuration, shortTimestamp } from './utils';

export function toJsonExport(payload: EvidenceExport) {
  return JSON.stringify(payload, null, 2);
}

export function toCsvExport(events: AnomalyEvent[]) {
  const headers = [
    'event_id',
    'timestamp',
    'family',
    'type',
    'magnitude',
    'raw_value',
    'raw_unit',
    'baseline_delta',
    'confidence',
    'measurement_confidence',
    'spatial_class',
    'spatial_confidence',
    'source_sensors',
    'artifact_flags',
  ];
  const rows = events.map((event) => [
    event.id,
    event.wallTime,
    event.family,
    event.type,
    event.magnitude.toFixed(3),
    event.rawValue.toFixed(4),
    event.rawUnit,
    event.baselineDelta.toFixed(4),
    event.confidence.toFixed(3),
    event.measurementConfidence.toFixed(3),
    event.spatialClass,
    event.spatialConfidence.toFixed(3),
    event.sourceSensors.join('|'),
    event.artifactFlags.join('|'),
  ]);
  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
    .join('\n');
}

export function buildHeuristicReport(session: SessionRecord, events: AnomalyEvent[]) {
  const sorted = [...events].sort((a, b) => b.confidence - a.confidence);
  const byFamily = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.family] = (acc[event.family] ?? 0) + 1;
    return acc;
  }, {});
  const unresolved = events.filter((event) => event.explanations.some((text) => text.toLowerCase().includes('unclassified'))).length;
  const strongest = sorted[0];

  return [
    `# CHITI SPECTRA Field Report`,
    '',
    `**Session:** ${session.id}`,
    `**Started:** ${shortTimestamp(session.startedAt)}`,
    `**Duration:** ${formatDuration((session.endedAt ?? Date.now()) - session.startedAt)}`,
    `**Observation radius:** ${session.radiusMeters} m`,
    `**Distance walked:** ${session.distanceMeters.toFixed(1)} m`,
    `**Coverage estimate:** ${(session.coverageEstimate * 100).toFixed(0)}%`,
    `**Maximum EDI:** ${session.maxEdi.toFixed(0)}/100`,
    '',
    `## Evidence Summary`,
    '',
    `SPECTRA recorded ${events.length} derived anomaly event${events.length === 1 ? '' : 's'} from real device telemetry. Counts by family: ${Object.entries(byFamily)
      .map(([family, count]) => `${family} ${count}`)
      .join(', ') || 'none'}.`,
    strongest
      ? `Strongest event: **${strongest.title}** at ${strongest.wallTime}, magnitude ${(strongest.magnitude * 100).toFixed(0)}%, spatial class **${strongest.spatialClass}**, confidence ${(strongest.confidence * 100).toFixed(0)}%.`
      : 'No threshold-breaching events were captured. Baseline conditions remained quiet.',
    '',
    `## Interpretation Guardrail`,
    '',
    `This report describes environmental signals only. It does not identify ghosts, entities, danger, health risk, or hidden persons. “Unexplained” means unclassified by available sensors, not supernatural.`,
    '',
    `## Unclassified Correlations`,
    '',
    unresolved
      ? `${unresolved} event${unresolved === 1 ? '' : 's'} remained unclassified. Recommended next test: repeat from three positions while minimizing phone motion and compare repeatability.`
      : 'All recorded threshold events have ordinary candidate explanations or were low confidence.',
    '',
    `## Top Events`,
    '',
    ...sorted.slice(0, 8).flatMap((event, index) => [
      `${index + 1}. **${event.title}** — ${event.summary}`,
      `   - Raw: ${event.rawValue.toFixed(3)} ${event.rawUnit}; baseline delta ${event.baselineDelta.toFixed(3)}`,
      `   - Spatial: ${event.spatialClass}, spatial confidence ${(event.spatialConfidence * 100).toFixed(0)}%`,
      `   - Candidate explanations: ${event.explanations.join('; ')}`,
    ]),
    '',
  ].join('\n');
}
