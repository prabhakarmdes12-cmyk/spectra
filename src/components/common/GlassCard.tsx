import type { PropsWithChildren, ReactNode } from 'react';

interface GlassCardProps extends PropsWithChildren {
  title?: ReactNode;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
}

export function GlassCard({ title, eyebrow, action, className = '', children }: GlassCardProps) {
  return (
    <section className={`glass-panel ${className}`}>
      {(title || eyebrow || action) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            {eyebrow && <p className="telemetry-label mb-1">{eyebrow}</p>}
            {title && <h2 className="text-base font-semibold tracking-wide text-white">{title}</h2>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
