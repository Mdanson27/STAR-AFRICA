import type { ReactNode } from 'react';
import { formatUgx, statusTone } from '@/lib/presentation';

export function MoneyDisplay({ value, compact = false }: { value: number | bigint; compact?: boolean }) {
  return <span className="money-display">{formatUgx(value, compact)}</span>;
}

export function StatusBadge({ children }: { children: string }) {
  return <span className={`status-pill status-${statusTone(children)}`}>{children}</span>;
}

export function SectionHeader({ eyebrow, title, detail }: { eyebrow?: string; title: string; detail?: ReactNode }) {
  return <div className="brand-section-header">{eyebrow ? <p className="panel-kicker">{eyebrow}</p> : null}<h2>{title}</h2>{detail ? <span>{detail}</span> : null}</div>;
}
