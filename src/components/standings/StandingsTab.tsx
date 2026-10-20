import { useState } from 'react';
import {
  ArrowUpDown,
  BarChart3,
  Camera,
  Grid3x3,
  Printer,
  SlidersHorizontal,
  SlidersVertical,
  TableProperties,
  X,
} from 'lucide-react';
import type { SortMetric, StandingRow, Overview } from '../../lib/scoring';
import { sortRows } from '../../lib/scoring';
import { StandingsCard } from './StandingsCard';
import { Matrix } from './Matrix';

interface Props {
  rows: StandingRow[];
  overview: Overview;
  onOpenAdjust: (athleticId?: string) => void;
  onOpenModality: (code: string) => void;
  readOnly?: boolean;
}

type StandingsSubView = 'card' | 'matrix' | 'both';

export function StandingsTab({ rows, overview, onOpenAdjust, onOpenModality, readOnly = false }: Props) {
  const [subView, setSubView] = useState<StandingsSubView>('card');
  const [metric, setMetric] = useState<SortMetric>('avg');
  const [showBars, setShowBars] = useState<boolean>(true);
  const [presentationMode, setPresentationMode] = useState<boolean>(false);

  // Linhas ordenadas conforme métrica de desempate
  const sortedRows = sortRows(rows, metric);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Barra de Ferramentas / Controles Superiores da Aba 2 (oculta no modo de apresentação) */}
      {!presentationMode && (
        <div className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 print:hidden">
          {/* Seletor de Sub-Visão */}
          <div className="inline-flex w-full rounded-xl border border-line bg-ink-950 p-1 sm:w-auto">
            <button
              onClick={() => setSubView('card')}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                subView === 'card'
                  ? 'border border-brand/50 bg-brand/20 text-orange-300 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <TableProperties size={14} />
              <span>Ranking</span>
            </button>
            <button
              onClick={() => setSubView('matrix')}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                subView === 'matrix'
                  ? 'border border-brand/50 bg-brand/20 text-orange-300 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Grid3x3 size={14} />
              <span>Matriz 25</span>
            </button>
            <button
              onClick={() => setSubView('both')}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                subView === 'both'
                  ? 'border border-brand/50 bg-brand/20 text-orange-300 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BarChart3 size={14} />
              <span>Ambos</span>
            </button>
          </div>

          {/* Opções de ordenação e filtros rápidos */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-line bg-ink-900 px-2 py-1 text-xs text-zinc-300">
              <ArrowUpDown size={12} className="text-brand shrink-0" />
              <span className="hidden text-[11px] font-semibold text-zinc-400 sm:inline">Ordenar:</span>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value as SortMetric)}
                className="bg-transparent font-semibold text-orange-400 outline-none text-xs"
              >
                <option value="avg">Média (Padrão)</option>
                <option value="max">Máximo</option>
                <option value="min">Mínimo</option>
              </select>
            </div>

            <button
              onClick={() => setShowBars(!showBars)}
              className={`btn-ghost ${showBars ? 'border-brand/40 bg-brand/10 text-orange-300' : ''}`}
              title="Exibir ou ocultar barras visuais de projeção (Mín a Máx)"
            >
              <SlidersVertical size={13} />
              <span className="hidden md:inline">{showBars ? 'Ocultar Barras' : 'Ver Barras'}</span>
            </button>

            {!readOnly && (
              <button
                onClick={() => onOpenAdjust()}
                className="btn-ghost"
                title="Gerenciar bônus do Cerimonial ou punições de W.O."
              >
                <SlidersHorizontal size={13} />
                <span className="hidden sm:inline">Ajustes</span>
              </button>
            )}

            <button
              onClick={() => setPresentationMode(true)}
              className="btn-solid"
              title="Modo limpo sem menus para tirar print / foto"
            >
              <Camera size={13} />
              <span>Modo Print</span>
            </button>
          </div>
        </div>
      )}

      {/* Modo Apresentação Flutuante / Banner de saída */}
      {presentationMode && (
        <div className="sticky top-2 z-40 mb-4 flex items-center justify-between gap-2 rounded-xl border border-brand/50 bg-ink-950/95 p-3 shadow-2xl backdrop-blur print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-300">
            <Camera size={16} className="text-brand shrink-0 animate-pulse" />
            <span className="hidden sm:inline">Modo Apresentação ativo · Tela limpa para fotos e prints.</span>
            <span className="sm:hidden">Modo Print ativo</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-brand">
              <Printer size={13} />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>
            <button onClick={() => setPresentationMode(false)} className="btn-solid">
              <X size={14} /> Sair
            </button>
          </div>
        </div>
      )}

      {/* Visão 2.1: Card Oficial de Classificação Geral Parcial */}
      {(subView === 'card' || subView === 'both') && (
        <div className="space-y-4">
          <StandingsCard
            rows={sortedRows}
            definedCount={overview.definedCount}
            metric={metric}
            showBars={showBars}
            presentation={presentationMode}
          />
        </div>
      )}

      {/* Visão 2.2: Matriz Geral de Auditoria */}
      {(subView === 'matrix' || subView === 'both') && !presentationMode && (
        <div className="space-y-4 pt-2">
          <Matrix
            rows={sortedRows}
            overview={overview}
            onOpenAdjust={onOpenAdjust}
            onOpenModality={onOpenModality}
            readOnly={readOnly}
          />
        </div>
      )}
    </div>
  );
}
