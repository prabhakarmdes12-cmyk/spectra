interface StatPillProps {
  label: string;
  value: string;
  tone?: 'cyan' | 'purple' | 'amber' | 'green' | 'white';
}

const tones = {
  cyan: 'border-cyan/30 bg-cyan/10 text-cyan',
  purple: 'border-purple/30 bg-purple/10 text-purple',
  amber: 'border-amber/30 bg-amber/10 text-amber',
  green: 'border-phosphor/30 bg-phosphor/10 text-phosphor',
  white: 'border-white/15 bg-white/5 text-white/80',
};

export function StatPill({ label, value, tone = 'cyan' }: StatPillProps) {
  return (
    <div className={`rounded-full border px-3 py-1.5 ${tones[tone]}`}>
      <span className="mr-2 text-[0.58rem] uppercase tracking-[0.2em] opacity-70">{label}</span>
      <span className="font-mono text-xs tabular-nums">{value}</span>
    </div>
  );
}
