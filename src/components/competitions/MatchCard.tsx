import { Check, Crown, Medal, Trophy, X, Zap } from 'lucide-react';
import { BYE, NONE, type Athletic } from '../../types';
import { isReal, type ResolvedMatch } from '../../lib/bracket';
import { isLoserSlot, getLoserTargetMatch } from '../../data/officialDraw2026';
import { AthleticBadge, displayName } from '../ui';

export interface SlotOption {
  value: string;
  label: string;
}

export interface MatchCardProps {
  match: ResolvedMatch;
  label?: string;
  variant?: 'normal' | 'final' | 'third' | 'consolation';
  /** índices dos slots da 1ª fase (somente na 1ª fase) */
  slotIndexes?: [number, number];
  slotOptions?: (slotIndex: number) => SlotOption[];
  onSlotChange?: (slotIndex: number, value: string | null) => void;
  onPick: (competitor: string) => void;
  athleticOf: (competitor: string) => Athletic | undefined;
  repOf: (competitor: string) => 1 | 2 | null;
  readOnly?: boolean;
  className?: string;
}

export function MatchCard({
  match,
  label,
  variant = 'normal',
  slotIndexes,
  slotOptions,
  onSlotChange,
  onPick,
  athleticOf,
  repOf,
  readOnly = false,
  className = '',
}: MatchCardProps) {
  const ready = isReal(match.a) && isReal(match.b);
  const decided = match.winner != null;

  const frame =
    variant === 'final'
      ? 'border-gold/60 bg-gradient-to-b from-amber-500/20 via-card to-card shadow-[0_0_35px_-10px_rgba(245,158,11,0.5)]'
      : variant === 'third'
        ? 'border-orange-500/50 bg-gradient-to-b from-orange-500/15 via-card to-card shadow-[0_0_25px_-10px_rgba(249,115,22,0.4)]'
        : variant === 'consolation'
          ? 'border-amber-600/40 bg-gradient-to-b from-amber-950/20 to-card shadow-xs'
          : decided
            ? 'border-line bg-card'
            : ready
              ? 'border-brand/50 bg-card shadow-[0_0_15px_-8px_rgba(249,115,22,0.5)]'
              : 'border-line/70 bg-ink-850';

  const row = (value: string | null, side: 0 | 1) => {
    const slotIndex = slotIndexes?.[side];
    const isFirst = slotIndex !== undefined && !readOnly;

    // Slot vazio da 1ª fase -> dropdown de montagem
    if (value == null && isFirst && slotOptions && onSlotChange) {
      const opts = slotOptions(slotIndex);
      return (
        <select
          className="select-dark"
          value=""
          onChange={(e) => onSlotChange(slotIndex, e.target.value || null)}
          aria-label="Selecionar Atlética"
        >
          <option value="">Selecionar Atlética...</option>
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }

    if (value == null)
      return (
        <div className="flex h-[30px] items-center rounded-md border border-dashed border-line/70 px-2 text-[11px] italic text-zinc-600">
          A definir
        </div>
      );

    const clearBtn =
      isFirst && onSlotChange ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSlotChange(slotIndex, null);
          }}
          className="ml-auto hidden shrink-0 rounded p-0.5 text-zinc-500 hover:bg-red-950/60 hover:text-red-300 group-hover:block"
          title="Remover do slot"
        >
          <X size={12} />
        </button>
      ) : null;

    if (isLoserSlot(value)) {
      const matchNum = getLoserTargetMatch(value);
      return (
        <div className="group flex h-[30px] items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 text-[10px] font-semibold text-amber-300">
          <Zap size={11} className="text-amber-400 shrink-0" />
          <span className="truncate">Perdedor Jogo {matchNum}</span>
          {clearBtn}
        </div>
      );
    }

    if (value === BYE || value === NONE)
      return (
        <div className="group flex h-[30px] items-center gap-1.5 rounded-md border border-line/60 bg-ink-950/50 px-2 text-[11px] italic text-zinc-500">
          {value === BYE ? <Zap size={12} className="text-amber-500/80" /> : <X size={12} className="text-red-500/70" />}
          {value === BYE ? 'BYE (Avança Direto)' : 'Sem representante'}
          {clearBtn}
        </div>
      );

    const ath = athleticOf(value);
    const rep = repOf(value);
    const isWinner = match.winner === value;
    const isLoser = decided && !isWinner;
    const clickable = ready && !readOnly;
    const champion = variant === 'final' && isWinner;

    return (
      <div
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={() => clickable && onPick(value)}
        onKeyDown={(e) => clickable && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onPick(value))}
        title={clickable ? (isWinner ? 'Clique para desfazer' : 'Clique para definir como vencedora') : ath?.name}
        className={`group relative flex h-[30px] items-center gap-1.5 rounded-md border px-1.5 text-[12px] transition-all ${
          isWinner
            ? champion
              ? 'border-gold/70 bg-gradient-to-r from-amber-500/30 to-amber-600/5 font-bold text-amber-100'
              : 'border-brand/70 bg-gradient-to-r from-brand/25 to-brand/5 font-bold text-white'
            : isLoser
              ? 'border-transparent bg-ink-950/40 text-zinc-500 opacity-60'
              : 'border-line/60 bg-ink-900/60 text-zinc-200'
        } ${clickable ? 'cursor-pointer hover:border-brand/60 hover:bg-brand/10' : ''}`}
      >
        {isWinner && (
          <span
            className={`absolute -left-px top-1 bottom-1 w-[3px] rounded-full ${champion ? 'bg-gold' : 'bg-brand'}`}
          />
        )}
        {ath && <AthleticBadge athletic={ath} size={20} />}
        <span className="truncate">{ath ? displayName(ath) : value}</span>
        {rep && (
          <span
            className={`shrink-0 rounded px-1 text-[9px] font-bold ${
              rep === 1 ? 'bg-sky-900/50 text-sky-300' : 'bg-fuchsia-900/50 text-fuchsia-300'
            }`}
          >
            A{rep}
          </span>
        )}
        {isWinner && !match.auto && (
          champion ? <Crown size={13} className="ml-auto shrink-0 text-gold" /> : <Check size={13} className="ml-auto shrink-0 text-brand" />
        )}
        {isWinner && match.auto && <Zap size={12} className="ml-auto shrink-0 text-amber-400" />}
        {!isWinner && clearBtn}
      </div>
    );
  };

  const displayLabel = label ?? match.label;

  return (
    <div className={`relative rounded-lg border p-1.5 ${frame} ${className}`}>
      {displayLabel && (
        <div className="mb-1 flex items-center justify-between px-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400">
          <div className="flex items-center gap-1">
            {variant === 'final' && <Trophy size={11} className="text-gold" />}
            {variant === 'third' && <Medal size={11} className="text-orange-400" />}
            <span
              className={
                variant === 'final'
                  ? 'text-amber-300'
                  : variant === 'third'
                    ? 'text-orange-300'
                    : variant === 'consolation'
                      ? 'text-amber-400'
                      : ''
              }
            >
              {displayLabel}
            </span>
          </div>
          {match.matchNumber && (
            <span className="rounded bg-ink-950/80 px-1 py-0.2 font-mono text-[8px] text-zinc-500">
              #{match.matchNumber}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-col gap-1">
        {row(match.a, 0)}
        {row(match.b, 1)}
      </div>
    </div>
  );
}
