import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import type { Athletic, ModalityStatus, Score } from '../types';
import { fmt } from '../lib/scoring';

// ---------------------------------------------------------------------------
// Escudo / Badge circular da atlética
// ---------------------------------------------------------------------------
export function AthleticBadge({ athletic, size = 28, ring = true }: { athletic: Athletic; size?: number; ring?: boolean }) {
  const style = { width: size, height: size, minWidth: size };
  if (athletic.logo)
    return (
      <img
        src={athletic.logo}
        alt={athletic.name}
        style={style}
        className="object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]"
      />
    );
  return (
    <span
      style={{
        ...style,
        background: `radial-gradient(circle at 30% 25%, ${athletic.color}ee, ${athletic.color}88 60%, ${athletic.color}44)`,
        fontSize: Math.max(8, size * 0.3),
      }}
      className={`inline-flex items-center justify-center rounded-full font-display font-extrabold tracking-tight text-white shadow-inner ${ring ? 'ring-1 ring-white/15' : ''}`}
    >
      {athletic.short}
    </span>
  );
}

export const displayName = (a: Athletic) => a.name.replace(/^AAA\s+/, '');

// ---------------------------------------------------------------------------
// Status de modalidade
// ---------------------------------------------------------------------------
const STATUS_META: Record<ModalityStatus, { label: string; cls: string; dot: string }> = {
  'not-started': { label: 'Não Iniciada', cls: 'border-zinc-700 bg-zinc-800/40 text-zinc-400', dot: 'bg-zinc-500' },
  'in-progress': { label: 'Em Andamento', cls: 'border-amber-700/60 bg-amber-900/25 text-amber-300', dot: 'bg-amber-400 animate-pulse' },
  defined: { label: 'Definida', cls: 'border-emerald-700/60 bg-emerald-900/25 text-emerald-300', dot: 'bg-emerald-400' },
};

export function StatusBadge({ status, compact = false }: { status: ModalityStatus; compact?: boolean }) {
  const m = STATUS_META[status];
  if (compact) return <span title={m.label} className={`inline-block h-2 w-2 rounded-full ${m.dot}`} />;
  return (
    <span className={`chip ${m.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Par Mín / Máx
// ---------------------------------------------------------------------------
export const TONE_CLS: Record<Score['tone'], string> = {
  locked: 'border-emerald-700/50 bg-emerald-900/30 text-emerald-300',
  open: 'border-amber-700/50 bg-amber-900/20 text-amber-300',
  out: 'border-zinc-800 bg-zinc-900/60 text-zinc-500',
  ni: 'border-zinc-800/80 bg-ink-950 text-zinc-600',
};

export function MinMax({ min, max, tone }: { min: number; max: number; tone: Score['tone'] }) {
  if (tone === 'ni') return <span className={`chip ${TONE_CLS.ni}`}>N/I</span>;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums ${TONE_CLS[tone]}`}>
      <span className="text-[9px] font-sans opacity-60">MÍN</span>
      {fmt(min)}
      <span className="opacity-40">/</span>
      <span className="text-[9px] font-sans opacity-60">MÁX</span>
      {fmt(max)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
export function Modal({
  open,
  onClose,
  title,
  icon,
  children,
  width = 'max-w-2xl',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center" onMouseDown={onClose}>
      <div
        className={`card animate-pop w-full ${width} border-bronze bg-ink-900 shadow-2xl shadow-black/60`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="flex items-center gap-2 font-display text-base font-bold text-white">
            {icon}
            {title}
          </h3>
          <button onClick={onClose} className="rounded-md p-1 text-zinc-400 hover:bg-card-hi hover:text-white" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
export interface ToastMsg {
  id: number;
  text: string;
  kind: 'ok' | 'err' | 'info';
}

export function Toasts({ items }: { items: ToastMsg[] }) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2 print:hidden">
      {items.map((t) => (
        <div
          key={t.id}
          className={`animate-pop rounded-xl border px-4 py-2.5 text-sm font-medium shadow-xl backdrop-blur ${
            t.kind === 'ok'
              ? 'border-emerald-700/60 bg-emerald-950/90 text-emerald-200'
              : t.kind === 'err'
                ? 'border-red-700/60 bg-red-950/90 text-red-200'
                : 'border-bronze-hi bg-ink-900/95 text-orange-200'
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
