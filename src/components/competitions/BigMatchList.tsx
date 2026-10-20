import { useState, useMemo } from 'react';
import {
  Check,
  Crown,
  Medal,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { BYE, NONE, type Athletic, type BracketState, type Modality } from '../../types';
import { isReal, roundNames, type ResolvedBracket, type ResolvedMatch } from '../../lib/bracket';
import { athleticOfCompetitor, repOfCompetitor } from '../../lib/scoring';
import { AthleticBadge } from '../ui';
import type { SlotOption } from './MatchCard';

interface Props {
  mod: Modality;
  bracket: BracketState;
  res: ResolvedBracket;
  athletics: Athletic[];
  slotOptions: (i: number) => SlotOption[];
  onSetSlot: (i: number, v: string | null) => void;
  onPick: (m: ResolvedMatch, c: string) => void;
}

export function BigMatchList({
  mod,
  bracket,
  res,
  athletics,
  slotOptions,
  onSetSlot,
  onPick,
}: Props) {
  const size = bracket.slots.length;
  const names = roundNames(size);
  const isB = mod.group === 'B';

  const athMap = useMemo(() => Object.fromEntries(athletics.map((a) => [a.id, a])), [athletics]);
  const athleticOf = (c: string) => athMap[athleticOfCompetitor(c)];

  // Aba de rodada selecionada (-2 = todas, 0 = oitavas/16-avos, res.sf = semi, res.final = final + 3º)
  const [selectedRound, setSelectedRound] = useState<number>(0);

  // Rodadas disponíveis
  const roundTabs = useMemo(() => {
    const list: { id: number; label: string; count: number; icon?: typeof Trophy }[] = [];
    names.forEach((n, idx) => {
      if (idx === res.final) {
        // Junta Final e Disputa de 3º na mesma aba
        list.push({ id: idx, label: '🏆 Finais (Final & 3º Lugar)', count: 2, icon: Trophy });
      } else {
        const matchesCount = res.rounds[idx].length;
        list.push({ id: idx, label: `${n.name} (${matchesCount} Jogos)`, count: matchesCount });
      }
    });
    list.push({ id: -2, label: '👁️ Ver Todas as Fases', count: size - 1 });
    return list;
  }, [names, res, size]);

  const renderCompetitorRow = (
    c: string | null,
    side: 0 | 1,
    m: ResolvedMatch,
    slotIndex?: number,
    isFinal = false,
  ) => {
    const isFirstRound = slotIndex !== undefined;
    const ready = isReal(m.a) && isReal(m.b);
    const decided = m.winner != null;
    const isWinner = m.winner === c && c != null;
    const isLoser = decided && !isWinner && c != null && isReal(c);
    const ath = c ? athleticOf(c) : undefined;
    const rep = c ? repOfCompetitor(c) : null;
    const isChampion = isFinal && isWinner;

    // Slot vazio da 1ª rodada
    if (c == null && isFirstRound) {
      const opts = slotOptions(slotIndex);
      return (
        <div className="flex flex-col gap-1 rounded-xl border-2 border-dashed border-line bg-ink-950/40 p-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            {side === 0 ? 'Confronto A' : 'Confronto B'} · Vaga em aberto
          </span>
          <select
            className="select-dark h-11 text-sm font-semibold text-zinc-200"
            value=""
            onChange={(e) => onSetSlot(slotIndex, e.target.value || null)}
          >
            <option value="">➕ Selecionar Atlética para este jogo...</option>
            {opts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (c == null) {
      return (
        <div className="flex h-14 items-center justify-center rounded-xl border border-dashed border-line/70 bg-ink-950/30 px-4 text-xs italic text-zinc-500">
          Aguardando vencedor da fase anterior...
        </div>
      );
    }

    if (c === BYE || c === NONE) {
      return (
        <div className="flex h-14 items-center justify-between rounded-xl border border-line bg-ink-950/60 px-4">
          <div className="flex items-center gap-2 text-sm italic text-zinc-400">
            {c === BYE ? (
              <Zap size={16} className="text-amber-400" />
            ) : (
              <X size={16} className="text-red-400" />
            )}
            <span>{c === BYE ? '⚡ BYE (Avança Direto)' : '❌ Sem representante'}</span>
          </div>
          {isFirstRound && (
            <button
              onClick={() => onSetSlot(slotIndex, null)}
              className="btn-ghost px-2 py-1 text-xs"
              title="Limpar vaga"
            >
              <X size={13} /> Limpar
            </button>
          )}
        </div>
      );
    }

    const clickable = ready;

    return (
      <div
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={() => clickable && onPick(m, c)}
        onKeyDown={(e) => clickable && (e.key === 'Enter' || e.key === ' ') && onPick(m, c)}
        className={`group relative flex items-center justify-between rounded-xl border-2 p-3 transition-all ${
          isWinner
            ? isChampion
              ? 'border-gold bg-gradient-to-r from-amber-500/25 via-amber-600/10 to-transparent shadow-lg shadow-amber-500/10'
              : 'border-brand bg-gradient-to-r from-brand/25 via-brand/10 to-transparent shadow-md shadow-brand/10'
            : isLoser
              ? 'border-transparent bg-ink-950/50 opacity-55'
              : 'border-line bg-ink-900/80 hover:border-bronze-hi hover:bg-card-hi'
        } ${clickable ? 'cursor-pointer' : ''}`}
      >
        <div className="flex items-center gap-3">
          {ath && <AthleticBadge athletic={ath} size={36} />}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-extrabold uppercase tracking-wide text-white sm:text-base">
                {ath?.name}
              </span>
              {rep && (
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
                    rep === 1
                      ? 'bg-sky-900/60 text-sky-200 border border-sky-700/60'
                      : 'bg-fuchsia-900/60 text-fuchsia-200 border border-fuchsia-700/60'
                  }`}
                >
                  Atleta {rep}
                </span>
              )}
            </div>
            {isWinner && (
              <span className="flex items-center gap-1 font-sans text-xs font-bold text-orange-400">
                {isChampion ? '🏆 CAMPEÃ OFICIAL UFU 2026' : '✓ Vencedora · Avança de Fase'}
              </span>
            )}
            {isLoser && (
              <span className="text-[11px] text-zinc-500">
                {m.round === res.sf ? '➔ Enviada para a Disputa de 3º Lugar' : 'Eliminada da disputa'}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {clickable && !isWinner && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPick(m, c);
              }}
              className="btn-brand px-3 py-1.5 text-xs font-bold"
            >
              Definir Vencedor
            </button>
          )}

          {isWinner && (
            <div className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-extrabold text-white shadow">
              {isChampion ? <Crown size={15} /> : <Check size={15} />}
              <span>{isChampion ? 'CAMPEÃ' : 'VENCEU'}</span>
            </div>
          )}

          {isFirstRound && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetSlot(slotIndex, null);
              }}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-950/60 hover:text-red-300"
              title="Trocar/Remover atlética desta vaga"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderMatchCard = (m: ResolvedMatch, label: string, isFinal = false, isThird = false) => {
    const isFirstRound = m.round === 0;
    const ready = isReal(m.a) && isReal(m.b);
    const decided = m.winner != null;

    return (
      <div
        key={`${m.round}-${m.index}-${isThird ? 'third' : 'main'}`}
        className={`card overflow-hidden p-4 sm:p-5 transition-all ${
          isFinal
            ? 'border-2 border-gold/60 bg-gradient-to-b from-amber-950/30 via-card to-card shadow-xl shadow-amber-500/10'
            : isThird
              ? 'border-2 border-orange-700/60 bg-gradient-to-b from-orange-950/30 via-card to-card'
              : decided
                ? 'border-line/90 bg-card'
                : ready
                  ? 'border-bronze-hi bg-card shadow-md shadow-brand/10'
                  : 'border-line bg-ink-950/40'
        }`}
      >
        <div className="mb-3 flex items-center justify-between border-b border-line/60 pb-2.5">
          <div className="flex items-center gap-2">
            {isFinal && <Trophy size={18} className="text-gold" />}
            {isThird && <Medal size={18} className="text-orange-400" />}
            <span
              className={`font-display text-xs font-extrabold uppercase tracking-wider ${
                isFinal ? 'text-amber-300' : isThird ? 'text-orange-300' : 'text-zinc-400'
              }`}
            >
              {label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {decided ? (
              <span className="chip border-emerald-700/60 bg-emerald-950/60 text-emerald-300">
                <Check size={11} /> Concluído
              </span>
            ) : ready ? (
              <span className="chip border-brand/50 bg-brand/15 text-orange-300 animate-pulse">
                Pronto para Jogar
              </span>
            ) : (
              <span className="chip border-line bg-ink-900 text-zinc-500">
                Aguardando Definições
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {renderCompetitorRow(
            m.a,
            0,
            m,
            isFirstRound ? 2 * m.index : undefined,
            isFinal,
          )}
          <div className="relative flex items-center justify-center py-1">
            <span className="h-px w-full bg-line/60" />
            <span className="absolute rounded-full border border-line bg-ink-900 px-2 py-0.5 font-display text-[11px] font-extrabold text-zinc-500">
              VS
            </span>
          </div>
          {renderCompetitorRow(
            m.b,
            1,
            m,
            isFirstRound ? 2 * m.index + 1 : undefined,
            isFinal,
          )}
        </div>
      </div>
    );
  };

  const renderRoundContent = (r: number) => {
    if (r === res.final) {
      // Final + 3º
      return (
        <div className="grid gap-6 lg:grid-cols-2">
          {renderMatchCard(res.finalMatch, '🏆 GRANDE FINAL · DISPUTA DO 1º E 2º LUGAR', true)}
          {renderMatchCard(res.third, '🥉 DISPUTA DO 3º E 4º LUGAR', false, true)}
        </div>
      );
    }

    const matches = res.rounds[r];
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {matches.map((m, idx) => {
          let sideLabel = '';
          if (isB) {
            const sideHalf = matches.length / 2;
            sideLabel = idx < sideHalf ? ' · Chave A (Atleta 1)' : ' · Chave B (Atleta 2)';
          }
          return renderMatchCard(
            m,
            `Jogo ${idx + 1} de ${matches.length} · ${names[r].name}${sideLabel}`,
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Abas das Fases / Rodadas */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
        {roundTabs.map((tab) => {
          const isActive = selectedRound === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedRound(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition sm:text-sm ${
                isActive
                  ? 'border-brand bg-gradient-to-r from-brand/25 to-brand/10 text-white shadow-md shadow-brand/15'
                  : 'border-line bg-ink-900/60 text-zinc-400 hover:border-bronze-hi hover:bg-card-hi hover:text-zinc-200'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo da Rodada Selecionada */}
      {selectedRound === -2 ? (
        <div className="space-y-8">
          {names.map((n, r) => (
            <div key={r} className="space-y-3">
              <div className="flex items-center gap-2 border-l-4 border-brand pl-3">
                <h3 className="font-display text-base font-extrabold uppercase text-white">
                  {n.name}
                </h3>
              </div>
              {renderRoundContent(r)}
            </div>
          ))}
        </div>
      ) : (
        renderRoundContent(selectedRound)
      )}
    </div>
  );
}
