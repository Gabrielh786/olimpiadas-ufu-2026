import { useState, type ReactNode } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, ListOrdered, Music, RotateCcw, X } from 'lucide-react';
import type { Athletic, Modality, TableState } from '../../types';
import { POINTS } from '../../data/modalities';
import { isCheerModality, getCheerName, getCheerPresentationOrder } from '../../data/cheers';
import { AthleticBadge, displayName } from '../ui';

interface Props {
  mod: Modality;
  table: TableState;
  athletics: Athletic[];
  onChange: (t: TableState) => void;
  title?: string;
  subtitle?: string;
  extraActions?: ReactNode;
  readOnly?: boolean;
}

const MEDAL = ['🥇', '🥈', '🥉'];

/** Tabela de ordem 1º ao 8º (Grupo C e Modo Ranking Derivado do Grupo B). */
export function OrderTable({ mod, table, athletics, onChange, title, subtitle, extraActions, readOnly = false }: Props) {
  const [showOrder, setShowOrder] = useState(true);
  const athMap = Object.fromEntries(athletics.map((a) => [a.id, a]));
  const used = new Set(table.positions.filter(Boolean) as string[]);
  const filled = used.size;
  const isCheer = isCheerModality(mod.code);
  const presentationOrder = getCheerPresentationOrder(mod.code);

  const setPos = (i: number, id: string | null) => {
    if (readOnly) return;
    const positions = [...table.positions];
    positions[i] = id;
    onChange({ ...table, positions });
  };

  const options = (i: number) =>
    mod.enrolled
      .filter((id) => !used.has(id) || table.positions[i] === id)
      .map((id) => athMap[id])
      .sort((a, b) => {
        if (isCheer) {
          const ca = getCheerName(a.id) ?? a.name;
          const cb = getCheerName(b.id) ?? b.name;
          return ca.localeCompare(cb, 'pt-BR');
        }
        return a.name.localeCompare(b.name, 'pt-BR');
      });

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-ink-900/60 px-4 py-3">
        <div className="mr-auto">
          <h3 className="flex items-center gap-2 font-display text-sm font-bold text-white">
            <ListOrdered size={16} className="text-brand" /> {title ?? 'Tabela de Ordem · 1º ao 8º'}
          </h3>
          {subtitle && <p className="mt-0.5 text-[11px] text-zinc-500">{subtitle}</p>}
        </div>
        <span className="text-xs text-zinc-400">
          <b className="text-zinc-200">{filled}</b>/8 posições
        </span>
      </div>

      {/* Painel Especial para Cheerleading: Ordem Oficial de Apresentação */}
      {isCheer && presentationOrder && (
        <div className="border-b border-line/70 bg-gradient-to-r from-amber-500/10 via-brand/5 to-transparent p-3 sm:px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Music size={14} className="text-amber-400" />
              <span>Ordem Oficial de Apresentação (Congresso Técnico UFU 2026)</span>
            </div>
            <button
              onClick={() => setShowOrder(!showOrder)}
              className="btn-ghost px-2 py-0.5 text-[11px] text-zinc-400 hover:text-zinc-200"
            >
              {showOrder ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span className="hidden sm:inline">{showOrder ? 'Recolher' : 'Exibir Ordem'}</span>
            </button>
          </div>

          {showOrder && (
            <div className="mt-2.5 grid grid-cols-1 gap-1.5 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              {presentationOrder.map((team) => {
                const ath = athMap[team.athleticId];
                if (!ath) return null;
                const isPlaced = used.has(team.athleticId);
                return (
                  <div
                    key={team.order}
                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition ${
                      isPlaced
                        ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                        : 'border-line/60 bg-ink-950/70 text-zinc-300'
                    }`}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-ink-900 font-mono text-[10px] font-bold text-amber-400">
                      #{team.order}
                    </span>
                    <AthleticBadge athletic={ath} size={18} />
                    <div className="min-w-0 flex-1 truncate">
                      <span className="font-extrabold text-amber-200">{team.cheerName}</span>
                      <span className="text-[10px] text-zinc-400 ml-1">({displayName(ath)})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="divide-y divide-line/70">
        {POINTS.map((pts, i) => {
          const id = table.positions[i];
          const a = id ? athMap[id] : undefined;
          const cheerName = a && isCheer ? getCheerName(a.id) : undefined;

          return (
            <div key={i} className={`flex items-center gap-3 px-4 py-2 ${i < 3 ? 'bg-amber-950/10' : ''}`}>
              <div className="flex w-[92px] shrink-0 items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-md font-display text-sm font-extrabold ${
                    i < 3 ? 'bg-brand/15 text-brand' : 'bg-ink-950 text-zinc-400'
                  }`}
                >
                  {i + 1}º
                </span>
                <span className="text-[11px] font-semibold text-zinc-500">{pts} pts</span>
              </div>
              {a ? (
                <div className="group flex min-w-0 flex-1 items-center gap-2 rounded-md border border-brand/40 bg-gradient-to-r from-brand/15 to-transparent px-2 py-1">
                  <AthleticBadge athletic={a} size={22} />
                  <div className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
                    {cheerName ? (
                      <>
                        <span className="truncate text-xs font-extrabold uppercase text-amber-300">
                          {cheerName}
                        </span>
                        <span className="hidden sm:inline text-[11px] font-semibold text-zinc-400">
                          — {displayName(a)}
                        </span>
                        <span className="sm:hidden text-[10px] font-semibold text-zinc-400">
                          ({displayName(a)})
                        </span>
                      </>
                    ) : (
                      <span className="truncate text-xs font-bold uppercase text-white">{a.name}</span>
                    )}
                  </div>
                  {i < 3 && <span className="text-sm shrink-0">{MEDAL[i]}</span>}
                  {!readOnly && (
                    <button
                      onClick={() => setPos(i, null)}
                      className="ml-auto rounded p-0.5 text-zinc-500 hover:bg-red-950/60 hover:text-red-300 shrink-0"
                      title="Remover desta posição"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              ) : readOnly ? (
                <div className="flex h-[32px] flex-1 items-center rounded-md border border-dashed border-line/70 px-3 text-xs italic text-zinc-600">
                  {table.finalized ? '— vaga não preenchida —' : 'A definir'}
                </div>
              ) : (
                <select className="select-dark flex-1" value="" onChange={(e) => setPos(i, e.target.value || null)} disabled={table.finalized}>
                  <option value="">
                    {table.finalized
                      ? '— vaga não preenchida —'
                      : isCheer
                        ? 'Selecionar Equipe de Cheerleading...'
                        : 'Selecionar Atlética...'}
                  </option>
                  {options(i).map((o) => {
                    const cheer = isCheer ? getCheerName(o.id) : null;
                    const label = cheer ? `${cheer} — ${o.name}` : o.name;
                    return (
                      <option key={o.id} value={o.id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          );
        })}
      </div>

      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line bg-ink-950/40 px-4 py-3">
          {table.finalized ? (
            <button className="btn-ghost" onClick={() => onChange({ ...table, finalized: false })}>
              <RotateCcw size={14} /> Reabrir Modalidade
            </button>
          ) : (
            <button
              className="btn-solid"
              onClick={() => onChange({ ...table, finalized: true })}
              title="Zera o potencial máximo das atléticas fora do Top 8"
            >
              <CheckCircle2 size={14} /> Marcar Modalidade como Concluída
            </button>
          )}
          {extraActions}
        </div>
      )}
    </div>
  );
}
