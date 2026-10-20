import { useMemo, useState } from 'react';
import { Sparkles, Swords, Table2, Trophy, Users } from 'lucide-react';
import type { AppState, BracketState, Group, TableState } from '../../types';
import { GROUP_LABEL, MODALITIES, MODALITY_BY_CODE } from '../../data/modalities';
import { suggestRankingFromBracket, type Overview } from '../../lib/scoring';
import { StatusBadge } from '../ui';
import { BracketView } from './BracketView';
import { ModalitySummary } from './ModalitySummary';
import { OrderTable } from './OrderTable';

interface Props {
  state: AppState;
  overview: Overview;
  selected: string;
  onSelect: (code: string) => void;
  setBracket: (code: string, b: BracketState) => void;
  setTable: (code: string, t: TableState) => void;
  notify: (text: string, kind?: 'ok' | 'err' | 'info') => void;
  readOnly?: boolean;
}

type Filter = 'all' | Group;

const GROUP_ACCENT: Record<Group, string> = {
  A: 'before:bg-orange-500',
  B: 'before:bg-sky-500',
  C: 'before:bg-emerald-500',
};

export function CompetitionsTab({ state, overview, selected, onSelect, setBracket, setTable, notify, readOnly = false }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const mod = MODALITY_BY_CODE[selected] ?? MODALITIES[0];
  const result = overview.results[mod.code];

  const filters: { key: Filter; label: string; icon: typeof Trophy }[] = [
    { key: 'all', label: 'Todas', icon: Trophy },
    { key: 'A', label: 'Mata-Mata 16', icon: Swords },
    { key: 'B', label: 'Mata-Mata 32 · Duplo Atleta', icon: Users },
    { key: 'C', label: 'Tabela de Ordem', icon: Table2 },
  ];
  const list = useMemo(() => MODALITIES.filter((m) => filter === 'all' || m.group === filter), [filter]);
  const count = (f: Filter) => MODALITIES.filter((m) => f === 'all' || m.group === f).length;
  const statusCount = (s: string) => list.filter((m) => overview.results[m.code].status === s).length;

  return (
    <div className="space-y-4">
      {/* Filtros + navegação */}
      <div className="card p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                filter === f.key
                  ? 'border-brand bg-brand/15 text-orange-200'
                  : 'border-line bg-ink-900/60 text-zinc-400 hover:border-bronze-hi hover:text-zinc-200'
              }`}
            >
              <f.icon size={13} />
              {f.label}
              <span className={`rounded-full px-1.5 text-[10px] ${filter === f.key ? 'bg-brand text-white' : 'bg-ink-950 text-zinc-500'}`}>
                {count(f.key)}
              </span>
            </button>
          ))}
          <div className="ml-auto hidden items-center gap-3 text-[11px] text-zinc-500 md:flex">
            <span className="flex items-center gap-1">
              <StatusBadge status="not-started" compact /> {statusCount('not-started')} não iniciadas
            </span>
            <span className="flex items-center gap-1">
              <StatusBadge status="in-progress" compact /> {statusCount('in-progress')} em andamento
            </span>
            <span className="flex items-center gap-1">
              <StatusBadge status="defined" compact /> {statusCount('defined')} definidas
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-7">
          {list.map((m) => {
            const st = overview.results[m.code].status;
            const active = m.code === mod.code;
            return (
              <button
                key={m.code}
                onClick={() => onSelect(m.code)}
                className={`relative flex items-center gap-2 overflow-hidden rounded-lg border py-1.5 pl-3 pr-2 text-left transition before:absolute before:inset-y-0 before:left-0 before:w-[3px] ${GROUP_ACCENT[m.group]} ${
                  active
                    ? 'border-brand bg-gradient-to-r from-brand/20 to-card text-white shadow-[0_0_20px_-10px_rgba(249,115,22,0.9)]'
                    : 'border-line bg-ink-900/50 text-zinc-300 hover:border-bronze-hi hover:bg-card-hi'
                }`}
              >
                <span className="text-base leading-none">{m.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[10px] font-bold text-zinc-500">{m.code}</span>
                  <span className="block truncate text-[12px] font-semibold leading-tight">{m.name}</span>
                </span>
                <StatusBadge status={st} compact />
              </button>
            );
          })}
        </div>
      </div>

      {/* Cabeçalho da modalidade */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        <span className="text-3xl">{mod.emoji}</span>
        <div>
          <h2 className="font-display text-xl font-extrabold text-white sm:text-2xl">
            {mod.name} <span className="font-mono text-base text-brand">({mod.code})</span>
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="chip border-bronze-hi bg-bronze/40 text-orange-200">
              Grupo {mod.group} · {GROUP_LABEL[mod.group]}
            </span>
            <span className="chip border-line bg-ink-900 text-zinc-300">
              {mod.enrolled.length} atléticas inscritas{mod.group === 'B' ? ` · até ${mod.enrolled.length * 2} atletas` : ''}
            </span>
            <StatusBadge status={result.status} />
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      {mod.group === 'C' ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <OrderTable
            mod={mod}
            table={state.tables[mod.code]}
            athletics={state.athletics}
            onChange={(t) => setTable(mod.code, t)}
            subtitle={
              mod.code === 'CD' || mod.code === 'TC'
                ? 'Defina a classificação final (1º ao 8º) das equipes de Cheerleading conforme as notas oficiais.'
                : 'Selecione a atlética de cada posição conforme o resultado oficial.'
            }
            readOnly={readOnly}
          />
          <ModalitySummary mod={mod} result={result} athletics={state.athletics} columns="sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2" />
        </div>
      ) : (
        <>
          <BracketView
            mod={mod}
            bracket={state.brackets[mod.code]}
            result={result}
            athletics={state.athletics}
            onChange={(b) => setBracket(mod.code, b)}
            notify={notify}
            readOnly={readOnly}
          />
          {mod.group === 'B' && state.brackets[mod.code].mode === 'ranking' ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
              <OrderTable
                mod={mod}
                table={state.brackets[mod.code].ranking}
                athletics={state.athletics}
                title="Classificação Final das Delegações"
                subtitle="Modo Ranking Derivado: esta tabela define os pontos da modalidade."
                onChange={(t) => setBracket(mod.code, { ...state.brackets[mod.code], ranking: t })}
                readOnly={readOnly}
                extraActions={
                  !readOnly ? (
                    <button
                      className="btn-brand"
                      onClick={() => {
                        const positions = suggestRankingFromBracket(result);
                        if (!positions.some(Boolean)) {
                          notify('Ainda não há posições cravadas na chave para sugerir.', 'info');
                          return;
                        }
                        setBracket(mod.code, { ...state.brackets[mod.code], ranking: { positions, finalized: false } });
                        notify('✨ Tabela sugerida a partir das posições cravadas na chave.', 'ok');
                      }}
                    >
                      <Sparkles size={14} /> Sugerir pela Chave
                    </button>
                  ) : undefined
                }
              />
              <ModalitySummary mod={mod} result={result} athletics={state.athletics} columns="sm:grid-cols-2 2xl:grid-cols-3" />
            </div>
          ) : (
            <ModalitySummary mod={mod} result={result} athletics={state.athletics} />
          )}
        </>
      )}
    </div>
  );
}
