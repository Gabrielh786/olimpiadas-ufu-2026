import { useMemo } from 'react';
import { Activity, Ban } from 'lucide-react';
import type { Athletic, Modality } from '../../types';
import type { ModalityResult } from '../../lib/scoring';
import { isCheerModality, getCheerName } from '../../data/cheers';
import { AthleticBadge, displayName, MinMax, TONE_CLS } from '../ui';

interface Props {
  mod: Modality;
  result: ModalityResult;
  athletics: Athletic[];
  columns?: string;
}

/** Painel de pontuação em tempo real de uma modalidade (Mín/Máx de cada atlética). */
export function ModalitySummary({ mod, result, athletics, columns = 'sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' }: Props) {
  const isCheer = isCheerModality(mod.code);
  const enrolled = useMemo(
    () =>
      athletics
        .filter((a) => mod.enrolled.includes(a.id))
        .sort((x, y) => {
          const sx = result.scores[x.id];
          const sy = result.scores[y.id];
          return sy.max - sx.max || sy.min - sx.min || x.name.localeCompare(y.name, 'pt-BR');
        }),
    [athletics, mod, result],
  );
  const notEnrolled = athletics.filter((a) => !mod.enrolled.includes(a.id));

  return (
    <div className="card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-sm font-bold text-white">
          <Activity size={16} className="text-brand" /> Pontuação em tempo real · {mod.code}
        </h3>
        <div className="flex gap-1.5 text-[10px]">
          <span className={`chip ${TONE_CLS.locked}`}>Cravado</span>
          <span className={`chip ${TONE_CLS.open}`}>Em aberto</span>
          <span className={`chip ${TONE_CLS.out}`}>Eliminada</span>
        </div>
      </div>

      <div className={`grid gap-2 ${columns}`}>
        {enrolled.map((a) => {
          const s = result.scores[a.id];
          const reps = result.reps?.[a.id];
          const cheer = isCheer ? getCheerName(a.id) : null;

          return (
            <div
              key={a.id}
              className={`rounded-lg border px-3 py-2 ${
                s.tone === 'locked'
                  ? 'border-emerald-900/50 bg-emerald-950/20'
                  : s.tone === 'open'
                    ? 'border-line bg-ink-900/60'
                    : 'border-line/50 bg-ink-950/60 opacity-70'
              }`}
            >
              <div className="flex items-center gap-2">
                <AthleticBadge athletic={a} size={24} />
                <div className="min-w-0 flex-1 truncate">
                  {cheer ? (
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="truncate text-[12px] font-extrabold uppercase text-amber-300">
                        {cheer}
                      </span>
                      <span className="truncate text-[10px] font-semibold text-zinc-400">
                        ({displayName(a)})
                      </span>
                    </div>
                  ) : (
                    <span className="truncate text-[12px] font-bold uppercase text-zinc-100">{a.name}</span>
                  )}
                </div>
                <span className="ml-auto shrink-0">
                  <MinMax min={s.min} max={s.max} tone={s.tone} />
                </span>
              </div>
              <div className="mt-1 truncate pl-8 text-[11px] text-zinc-400" title={s.label}>
                {s.label}
              </div>
              {reps && (
                <div className="mt-1 space-y-0.5 pl-8">
                  {reps.map((r) => (
                    <div key={r.rep} className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                      <span
                        className={`rounded px-1 font-bold ${r.rep === 1 ? 'bg-sky-900/50 text-sky-300' : 'bg-fuchsia-900/50 text-fuchsia-300'}`}
                      >
                        A{r.rep}
                      </span>
                      <span className="truncate" title={r.label}>
                        {r.label}
                      </span>
                      <span className="ml-auto shrink-0 font-mono tabular-nums text-zinc-400">
                        {r.min}/{r.max}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {notEnrolled.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
          <span className="mr-1 flex items-center gap-1 text-[11px] font-semibold text-zinc-500">
            <Ban size={12} /> Não inscritas (N/I · 0 pts):
          </span>
          {notEnrolled.map((a) => (
            <span key={a.id} className="inline-flex items-center gap-1 rounded-full border border-line bg-ink-950 py-0.5 pl-0.5 pr-2 text-[10px] text-zinc-500">
              <AthleticBadge athletic={a} size={16} ring={false} />
              {a.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
