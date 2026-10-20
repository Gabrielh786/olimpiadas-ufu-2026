import { Fragment, useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { MODALITIES } from '../../data/modalities';
import { fmt, type SortMetric, type StandingRow } from '../../lib/scoring';
import { AthleticBadge } from '../ui';

interface Props {
  rows: StandingRow[];
  definedCount: number;
  metric: SortMetric;
  showBars: boolean;
  presentation?: boolean;
}

/** Card oficial de Classificação Geral Parcial (Mín / Máx / Média). */
export function StandingsCard({ rows, definedCount, metric, showBars, presentation = false }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const scaleMax = Math.max(1, ...rows.map((r) => r.max));

  const toggle = (id: string) =>
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const th = (label: string, key: SortMetric, extra = '') => (
    <th className={`px-2 py-3 text-right text-[10px] font-bold uppercase tracking-wider sm:px-4 sm:text-[11px] sm:tracking-widest ${extra}`}>
      <span className="inline-flex items-center gap-0.5">
        {label}
        {metric === key && <ChevronDown size={12} className="text-brand" />}
      </span>
    </th>
  );

  return (
    <div className={`mx-auto w-full ${presentation ? 'max-w-3xl' : 'max-w-4xl'}`} id="standings-card">
      <div className="mb-4 text-center sm:mb-6">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
          Classificação geral <span className="text-brand">parcial</span>
        </h2>
        <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
          <b className="font-semibold text-zinc-200">{definedCount}</b> de {MODALITIES.length} modalidades pontuáveis definidas
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-bronze bg-card/95 shadow-[0_20px_60px_-25px_rgba(249,115,22,0.25)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-line bg-ink-950/70 text-zinc-400">
                <th className="w-10 px-1.5 py-3 text-center text-[10px] font-bold uppercase tracking-wider sm:w-16 sm:px-2 sm:text-[11px]">
                  #
                </th>
                <th className="px-2 py-3 text-left text-[10px] font-bold uppercase tracking-wider sm:text-[11px] sm:tracking-widest">
                  Atlética
                </th>
                {th('Mín.', 'min')}
                {th('Máx.', 'max')}
                {th('Média', 'avg', 'text-brand')}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const pos = i + 1;
                const podium = pos <= 3;
                const top8 = pos <= 8;
                const open = showBars || expanded.has(r.athletic.id);
                return (
                  <Fragment key={r.athletic.id}>
                    {pos === 9 && (
                      <tr>
                        <td colSpan={5} className="px-2 py-1 sm:px-4">
                          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.15em] text-orange-400/80">
                            <span className="h-px flex-1 border-t border-dashed border-orange-500/40" />
                            Linha de corte · Top 8 Série A 2027
                            <span className="h-px flex-1 border-t border-dashed border-orange-500/40" />
                          </div>
                        </td>
                      </tr>
                    )}
                    <tr
                      onClick={() => toggle(r.athletic.id)}
                      className={`cursor-pointer border-b border-line/60 transition-colors last:border-0 ${
                        podium
                          ? 'bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent hover:from-amber-500/25'
                          : 'hover:bg-card-hi/60'
                      }`}
                    >
                      <td className="relative px-1.5 py-2.5 text-center sm:px-2">
                        {top8 && (
                          <span
                            className={`absolute inset-y-1 left-0 w-[3px] rounded-r-full ${
                              podium ? 'bg-brand' : 'bg-gradient-to-b from-amber-400/80 to-orange-500/60'
                            }`}
                          />
                        )}
                        <span
                          className={`font-display text-sm font-extrabold tabular-nums sm:text-base ${
                            podium ? 'text-brand' : 'text-zinc-400'
                          }`}
                        >
                          {pos}º
                        </span>
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <AthleticBadge athletic={r.athletic} size={presentation ? 34 : 30} />
                          <div className="min-w-0">
                            <div className="truncate font-display text-[12px] font-extrabold uppercase tracking-wide text-zinc-100 sm:text-sm">
                              {r.athletic.name}
                            </div>
                            {open && (
                              <div className="mt-1.5 w-full min-w-[120px] max-w-[280px] sm:min-w-[160px] sm:max-w-[340px]">
                                <RangeBar min={r.min} max={r.max} avg={r.avg} scale={scaleMax} />
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono text-xs tabular-nums text-zinc-300 sm:px-4 sm:text-sm">
                        {fmt(r.min)}
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono text-xs tabular-nums text-zinc-300 sm:px-4 sm:text-sm">
                        {fmt(r.max)}
                      </td>
                      <td className="px-2 py-2.5 text-right sm:px-4">
                        <span className="font-display text-base font-extrabold tabular-nums text-brand sm:text-xl">
                          {fmt(r.avg)}
                        </span>
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-1.5 border-t border-line bg-ink-950/60 px-3 py-2.5 text-[11px] text-zinc-400 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3">
          <span className="flex items-center gap-1.5">
            <Info size={13} className="text-brand shrink-0" /> Mín. e Máx. indicam a faixa de pontuação ainda possível.
          </span>
          <span>
            <span className="font-bold text-brand">Média</span> = ponto central da projeção
          </span>
        </div>
      </div>
    </div>
  );
}

function RangeBar({ min, max, avg, scale }: { min: number; max: number; avg: number; scale: number }) {
  const pct = (v: number) => `${Math.max(0, Math.min(100, (v / scale) * 100))}%`;
  return (
    <div className="relative h-2 w-full rounded-full bg-ink-950 ring-1 ring-line">
      <div
        className="absolute inset-y-0 rounded-full bg-gradient-to-r from-amber-500 to-brand"
        style={{ left: pct(min), width: `calc(${pct(max)} - ${pct(min)})`, minWidth: 3 }}
      />
      <div
        className="absolute -top-0.5 h-3 w-0.5 rounded bg-white shadow-xs"
        style={{ left: pct(avg) }}
        title={`Média ${fmt(avg)}`}
      />
    </div>
  );
}
