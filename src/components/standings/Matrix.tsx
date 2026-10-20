import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Filter,
  Grid3x3,
  Layers,
  Search,
  SlidersHorizontal,
  TableProperties,
} from 'lucide-react';
import type { Group } from '../../types';
import { MODALITIES } from '../../data/modalities';
import { fmt, type Overview, type StandingRow } from '../../lib/scoring';
import { AthleticBadge, StatusBadge } from '../ui';

interface Props {
  rows: StandingRow[];
  overview: Overview;
  onOpenAdjust: (athleticId?: string) => void;
  onOpenModality: (code: string) => void;
  readOnly?: boolean;
}

type GroupFilter = 'all' | Group;
type MatrixLayout = 'table' | 'cards';

const GROUP_CONFIG: Record<Group, { badge: string; border: string; label: string }> = {
  A: {
    badge: 'border-orange-500/40 bg-orange-500/10 text-orange-400',
    border: 'border-orange-500/30',
    label: 'Grupo A · Mata-Mata 16',
  },
  B: {
    badge: 'border-sky-500/40 bg-sky-500/10 text-sky-400',
    border: 'border-sky-500/30',
    label: 'Grupo B · 32 Vagas (Duplo Atleta)',
  },
  C: {
    badge: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
    border: 'border-emerald-500/30',
    label: 'Grupo C · Tabelas Diretas',
  },
};

export function Matrix({ rows, overview, onOpenAdjust, onOpenModality, readOnly = false }: Props) {
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [layout, setLayout] = useState<MatrixLayout>('table');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Modalidades filtradas pelo grupo selecionado
  const displayedModalities = useMemo(() => {
    if (groupFilter === 'all') return MODALITIES;
    return MODALITIES.filter((m) => m.group === groupFilter);
  }, [groupFilter]);

  // Linhas filtradas pela busca de atlética
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase().trim();
    return rows.filter(
      (r) =>
        r.athletic.name.toLowerCase().includes(q) ||
        r.athletic.short.toLowerCase().includes(q) ||
        r.athletic.id.toLowerCase().includes(q),
    );
  }, [rows, searchQuery]);

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="card overflow-hidden">
      {/* Barra de Ferramentas Superior: Filtros, Busca e Layout */}
      <div className="flex flex-col gap-3 border-b border-line bg-ink-900/80 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-display text-sm font-bold text-white sm:text-base">
              <Grid3x3 size={18} className="text-brand" />
              Matriz Geral de Auditoria · Mínimo e Máximo por Esporte
            </h3>
            <p className="mt-0.5 text-xs text-zinc-400">
              Acompanhe a projeção exata de cada atlética em cada uma das {MODALITIES.length} modalidades pontuáveis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Alternador de Layout para Telas Menores */}
            <div className="inline-flex rounded-lg border border-line bg-ink-950 p-0.5">
              <button
                onClick={() => setLayout('table')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  layout === 'table' ? 'bg-brand text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Visualização em Planilha / Tabela Completa"
              >
                <TableProperties size={13} />
                <span className="hidden sm:inline">Tabela</span>
              </button>
              <button
                onClick={() => setLayout('cards')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  layout === 'cards' ? 'bg-brand text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Visualização em Cards por Atlética (Ideal para Celular)"
              >
                <Layers size={13} />
                <span className="hidden sm:inline">Cards (Mobile)</span>
              </button>
            </div>

            {!readOnly && (
              <button
                onClick={() => onOpenAdjust()}
                className="btn-ghost"
                title="Gerenciar ajustes, bônus de abertura e punições W.O."
              >
                <SlidersHorizontal size={13} />
                <span className="hidden sm:inline">Ajustes</span>
              </button>
            )}
          </div>
        </div>

        {/* Linha de Filtros Rápidos de Grupo e Campo de Busca */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 hidden items-center gap-1 text-[11px] font-semibold text-zinc-400 sm:inline-flex">
              <Filter size={12} /> Grupo:
            </span>
            <button
              onClick={() => setGroupFilter('all')}
              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                groupFilter === 'all'
                  ? 'border-brand/70 bg-brand/20 text-orange-200'
                  : 'border-line bg-ink-950 text-zinc-400 hover:border-bronze-hi hover:text-zinc-200'
              }`}
            >
              Todas ({MODALITIES.length})
            </button>
            {(['A', 'B', 'C'] as const)
              .filter((g) => MODALITIES.some((m) => m.group === g))
              .map((g) => (
                <button
                  key={g}
                  onClick={() => setGroupFilter(g)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                    groupFilter === g
                      ? 'border-brand/70 bg-brand/20 text-orange-200'
                      : 'border-line bg-ink-950 text-zinc-400 hover:border-bronze-hi hover:text-zinc-200'
                  }`}
                >
                  Grupo {g} ({MODALITIES.filter((m) => m.group === g).length})
                </button>
              ))}
          </div>

          {/* Campo de Busca Rápida de Atlética */}
          <div className="relative w-full sm:w-56">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar atlética..."
              className="w-full rounded-lg border border-line bg-ink-950 py-1 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition focus:border-brand"
            />
          </div>
        </div>

        {/* Legenda Visual de Status das Células */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-zinc-400">Legenda:</span>
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Cravado (Mín = Máx)
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.5 font-medium text-orange-400">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400" /> Em aberto (Máx &gt; Mín)
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-line bg-ink-950 px-1.5 py-0.5 font-medium text-zinc-500">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" /> Eliminada (0 / 0)
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-line bg-ink-950 px-1.5 py-0.5 font-medium text-zinc-600">
              N/I Não Inscrita
            </span>
          </div>

          <span className="text-[10px] text-zinc-500 sm:text-right">
            💡 Dica: Role lateralmente na tabela ou use a visão em Cards no celular.
          </span>
        </div>
      </div>

      {/* =========================================================================
          VISUALIZAÇÃO 1: TABELA COMPLETA COM SCROLL HORIZONTAL RESPONSIVO
          ========================================================================= */}
      {layout === 'table' ? (
        <div className="relative max-h-[72vh] overflow-auto">
          <table className="w-full border-separate border-spacing-0 text-[11px]">
            <thead className="sticky top-0 z-30">
              {/* Linha Superior dos Grupos */}
              <tr className="bg-ink-950 font-display font-bold uppercase tracking-wider text-zinc-400">
                <th
                  rowSpan={2}
                  className="sticky left-0 z-40 min-w-[190px] border-b border-r border-line bg-ink-950 px-3 py-2 text-left text-[11px] font-extrabold text-zinc-300 shadow-[4px_0_12px_rgba(0,0,0,0.25)]"
                >
                  Atlética
                </th>

                {groupFilter === 'all' ? (
                  (['A', 'B', 'C'] as const)
                    .filter((g) => MODALITIES.some((m) => m.group === g))
                    .map((g) => {
                      const count = MODALITIES.filter((m) => m.group === g).length;
                      return (
                        <th
                          key={g}
                          colSpan={count}
                          className={`border-b border-r border-line px-2 py-1.5 text-center text-[10px] ${GROUP_CONFIG[g].badge}`}
                        >
                          {GROUP_CONFIG[g].label}
                        </th>
                      );
                    })
                ) : (
                  <th
                    colSpan={displayedModalities.length}
                    className={`border-b border-r border-line px-2 py-1.5 text-center text-[10px] ${GROUP_CONFIG[groupFilter].badge}`}
                  >
                    {GROUP_CONFIG[groupFilter].label}
                  </th>
                )}

                {/* Colunas de Totais */}
                <th
                  colSpan={4}
                  className="border-b border-line bg-gradient-to-r from-orange-500/20 to-orange-500/10 px-2 py-1.5 text-center text-[10px] font-extrabold text-orange-300"
                >
                  Totais Parciais
                </th>
              </tr>

              {/* Linha Inferior com Ícones e Códigos dos Esportes */}
              <tr className="bg-ink-950">
                {displayedModalities.map((m) => (
                  <th
                    key={m.code}
                    onClick={() => onOpenModality(m.code)}
                    title={`${m.name} (${m.code}) — Clique para abrir chaveamento`}
                    className="min-w-[66px] cursor-pointer border-b border-r border-line bg-ink-950/95 px-1 py-1.5 text-center transition-colors hover:bg-card-hi group/th"
                  >
                    <div className="text-sm leading-none transition-transform group-hover/th:scale-110">
                      {m.emoji}
                    </div>
                    <div className="mt-0.5 flex items-center justify-center gap-1 font-mono text-[10px] font-bold text-zinc-300 group-hover/th:text-brand">
                      {m.code}
                      <StatusBadge status={overview.results[m.code].status} compact />
                    </div>
                  </th>
                ))}

                {/* Cabeçalho das Colunas de Totais */}
                <th className="min-w-[65px] border-b border-r border-line bg-ink-950 px-2 py-1 text-center font-mono text-[10px] font-bold uppercase text-zinc-400">
                  Ajustes
                </th>
                <th className="min-w-[55px] border-b border-r border-line bg-ink-950 px-2 py-1 text-center font-mono text-[10px] font-bold uppercase text-zinc-300">
                  Mín.
                </th>
                <th className="min-w-[55px] border-b border-r border-line bg-ink-950 px-2 py-1 text-center font-mono text-[10px] font-bold uppercase text-zinc-300">
                  Máx.
                </th>
                <th className="min-w-[70px] border-b border-line bg-ink-950 px-2 py-1 text-center font-display text-[11px] font-extrabold uppercase text-brand">
                  Média
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((r, i) => {
                const podium = i < 3;
                const top8 = i < 8;
                return (
                  <tr
                    key={r.athletic.id}
                    className={`group/tr transition-colors ${
                      i % 2 === 0 ? 'bg-ink-900/60' : 'bg-ink-850/40'
                    } hover:bg-card-hi`}
                  >
                    {/* Coluna Fixa da Atlética */}
                    <td
                      className={`sticky left-0 z-20 border-b border-r border-line px-3 py-2 transition-colors ${
                        i % 2 === 0 ? 'bg-ink-900' : 'bg-ink-850'
                      } group-hover/tr:bg-card-hi shadow-[4px_0_12px_rgba(0,0,0,0.2)]`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 text-right font-mono text-[10px] font-bold ${
                            podium ? 'text-brand' : top8 ? 'text-orange-400/80' : 'text-zinc-600'
                          }`}
                        >
                          {i + 1}º
                        </span>
                        <AthleticBadge athletic={r.athletic} size={22} />
                        <span className="truncate font-display text-[12px] font-bold uppercase tracking-wide text-zinc-100 group-hover/tr:text-white">
                          {r.athletic.name.replace('AAA ', '')}
                        </span>
                      </div>
                    </td>

                    {/* Células de Cada Modalidade Exibida */}
                    {displayedModalities.map((m) => {
                      const s = r.perModality[m.code];

                      // Renderização com alto contraste e design limpo
                      if (s.tone === 'ni') {
                        return (
                          <td
                            key={m.code}
                            title={`${r.athletic.name} · ${m.name}\nNão inscrita nesta modalidade (0 pts)`}
                            className="border-b border-r border-line/60 bg-ink-950/40 px-1 py-1.5 text-center"
                          >
                            <span className="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-zinc-600">
                              N/I
                            </span>
                          </td>
                        );
                      }

                      if (s.tone === 'locked') {
                        return (
                          <td
                            key={m.code}
                            title={`${r.athletic.name} · ${m.name}\n${s.label} (${s.min} pts cravados)`}
                            className="border-b border-r border-line/60 bg-emerald-950/25 px-1 py-1 text-center"
                          >
                            <div className="inline-flex items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[11px] font-extrabold text-emerald-300 shadow-xs">
                              {s.min}
                            </div>
                          </td>
                        );
                      }

                      if (s.tone === 'out') {
                        return (
                          <td
                            key={m.code}
                            title={`${r.athletic.name} · ${m.name}\n${s.label}`}
                            className="border-b border-r border-line/60 bg-ink-950/60 px-1 py-1.5 text-center font-mono text-[11px] text-zinc-500"
                          >
                            0
                          </td>
                        );
                      }

                      // s.tone === 'open' (Em Aberto: Mín a Máx)
                      return (
                        <td
                          key={m.code}
                          title={`${r.athletic.name} · ${m.name}\n${s.label}\nFaixa: Mín ${s.min} a Máx ${s.max}`}
                          className="border-b border-r border-line/60 bg-ink-900/40 px-1 py-1 text-center group-hover/tr:bg-card-hi/70"
                        >
                          <div className="inline-flex items-center justify-center gap-0.5 rounded-md border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-orange-200">
                            <span className="font-bold text-zinc-300">{s.min}</span>
                            <span className="opacity-40">|</span>
                            <span className="font-extrabold text-orange-400">{s.max}</span>
                          </div>
                        </td>
                      );
                    })}

                    {/* Coluna Ajustes */}
                    <td className="border-b border-r border-line bg-ink-900/80 px-1 py-1 text-center">
                      <button
                        onClick={() => !readOnly && onOpenAdjust(r.athletic.id)}
                        disabled={readOnly}
                        className={`w-full rounded px-1.5 py-0.5 font-mono text-[11px] font-bold transition ${
                          !readOnly ? 'hover:bg-card-hi' : 'cursor-default'
                        } ${
                          r.adj > 0
                            ? 'text-emerald-400 bg-emerald-950/40'
                            : r.adj < 0
                              ? 'text-red-400 bg-red-950/40'
                              : 'text-zinc-500'
                        }`}
                        title={readOnly ? 'Ajustes / W.O.' : 'Clique para adicionar ou editar bônus/punições'}
                      >
                        {r.adj > 0 ? `+${r.adj}` : r.adj}
                      </button>
                    </td>

                    {/* Coluna Mínimo Total */}
                    <td className="border-b border-r border-line bg-ink-900/80 px-2 py-1 text-center font-mono text-xs font-semibold tabular-nums text-zinc-300">
                      {fmt(r.min)}
                    </td>

                    {/* Coluna Máximo Total */}
                    <td className="border-b border-r border-line bg-ink-900/80 px-2 py-1 text-center font-mono text-xs font-semibold tabular-nums text-zinc-300">
                      {fmt(r.max)}
                    </td>

                    {/* Coluna Média Geral */}
                    <td className="border-b border-line bg-ink-950/90 px-2 py-1 text-center font-display text-sm font-extrabold tabular-nums text-brand shadow-xs">
                      {fmt(r.avg)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* =========================================================================
           VISUALIZAÇÃO 2: CARDS EXPANSÍVEIS (100% OTIMIZADOS PARA CELULAR)
           ========================================================================= */
        <div className="divide-y divide-line/70 p-2 sm:p-4">
          {filteredRows.map((r, i) => {
            const isExpanded = expandedCards.has(r.athletic.id);
            const podium = i < 3;
            return (
              <div key={r.athletic.id} className="py-2.5">
                {/* Cabeçalho do Card da Atlética */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleCard(r.athletic.id)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleCard(r.athletic.id)}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition ${
                    isExpanded
                      ? 'border-brand/50 bg-ink-900 shadow-sm'
                      : 'border-line bg-ink-900/60 hover:bg-card-hi'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-md font-display text-xs font-extrabold ${
                        podium ? 'bg-brand/20 text-brand' : 'bg-ink-950 text-zinc-400'
                      }`}
                    >
                      {i + 1}º
                    </span>
                    <AthleticBadge athletic={r.athletic} size={28} />
                    <div>
                      <div className="font-display text-xs font-bold uppercase text-white sm:text-sm">
                        {r.athletic.name}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                        <span>{r.enrolledCount} esportes inscritos</span>
                        {r.adj !== 0 && (
                          <span className={r.adj > 0 ? 'text-emerald-400' : 'text-red-400'}>
                            (Ajustes: {r.adj > 0 ? `+${r.adj}` : r.adj})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-display text-sm font-extrabold text-brand sm:text-base">
                        {fmt(r.avg)} <span className="text-[10px] font-normal text-zinc-400">média</span>
                      </div>
                      <div className="font-mono text-[10px] text-zinc-400">
                        {fmt(r.min)} mín / {fmt(r.max)} máx
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-brand" />
                    ) : (
                      <ChevronRight size={16} className="text-zinc-500" />
                    )}
                  </div>
                </div>

                {/* Conteúdo Expandido com os Esportes da Atlética */}
                {isExpanded && (
                  <div className="mt-2 rounded-xl border border-line bg-ink-950/70 p-3">
                    <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                      <span>Modalidades da {r.athletic.name}:</span>
                      {!readOnly && (
                        <button
                          onClick={() => onOpenAdjust(r.athletic.id)}
                          className="text-xs font-bold text-brand hover:underline"
                        >
                          + Adicionar Ajuste/W.O.
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {displayedModalities.map((m) => {
                        const s = r.perModality[m.code];
                        return (
                          <div
                            key={m.code}
                            onClick={() => onOpenModality(m.code)}
                            className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-line/60 bg-ink-900/60 p-2 text-xs transition hover:border-brand/40 hover:bg-card-hi"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span>{m.emoji}</span>
                              <span className="font-bold text-zinc-200">{m.code}</span>
                              <span className="truncate text-[11px] text-zinc-400">{m.name}</span>
                            </div>

                            <div className="shrink-0">
                              {s.tone === 'ni' ? (
                                <span className="rounded bg-ink-950 px-1.5 py-0.5 text-[9px] font-bold text-zinc-600">
                                  N/I
                                </span>
                              ) : s.tone === 'locked' ? (
                                <span className="rounded border border-emerald-500/40 bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                                  {s.min} pts
                                </span>
                              ) : s.tone === 'out' ? (
                                <span className="font-mono text-[10px] text-zinc-600">0 pts</span>
                              ) : (
                                <span className="rounded border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-orange-300">
                                  {s.min} a {s.max}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
